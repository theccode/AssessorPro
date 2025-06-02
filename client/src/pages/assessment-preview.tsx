import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Building, Edit, Download, Check, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Assessment, AssessmentSection } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { assessmentSections, sectionVariables } from "@/lib/assessment-data";

export default function AssessmentPreview({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const publicId = params.id; // Now using UUID instead of integer
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["/api/assessments", publicId],
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/assessments/${publicId}`, "PATCH", { 
        status: "completed"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${publicId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      // Stay on preview page after successful submission
    },
  });

  const handleSubmitAssessment = () => {
    submitAssessmentMutation.mutate();
  };

  // Helper function to format camelCase to readable text
  const formatVariableName = (camelCase: string) => {
    return camelCase
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // PDF Download functionality
  const handleDownloadPDF = async () => {
    if (!assessment) {
      alert('Assessment data not loaded yet. Please wait and try again.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Get assessment data safely
      const assessmentData = Array.isArray(assessment) ? assessment[0] : assessment;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add GREDA logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = gredaLogo;
      
      await new Promise((resolve) => {
        logoImg.onload = () => {
          pdf.addImage(logoImg, 'PNG', 20, yPosition, 40, 20);
          resolve(true);
        };
        logoImg.onerror = () => {
          console.warn('Could not load logo');
          resolve(true);
        };
      });

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 102, 51); // Green color
      pdf.text('GREDA Green Building Assessment Report', 70, yPosition + 15);
      
      yPosition += 40;

      // Building Information
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Building Information', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      const buildingInfo = [
        `Building Name: ${assessmentData.buildingName || 'Not specified'}`,
        `Location: ${assessmentData.buildingLocation || assessmentData.detailedAddress || 'Not specified'}`,
        `Publisher: ${assessmentData.publisherName || 'Not specified'}`,
        `Phone: ${assessmentData.phoneNumber || 'Not specified'}`,
        `Status: ${assessmentData.status}`,
        `Conducted Date: ${assessmentData.conductedAt ? new Date(assessmentData.conductedAt).toLocaleDateString() : 'Not specified'}`,
        `Conducted By: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Assessment Team'}`
      ];

      buildingInfo.forEach(info => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(info, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Overall Score
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 51);
      pdf.text('Overall Assessment Score', 20, yPosition);
      yPosition += 10;

      const totalScore = assessmentData?.overallScore || 0;
      const maxScore = assessmentData?.maxPossibleScore || 130;
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Score: ${totalScore} / ${maxScore} points`, 20, yPosition);
      yPosition += 7;
      
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      pdf.text(`Percentage: ${percentage}%`, 20, yPosition);
      yPosition += 7;

      // Calculate certification level
      let certification = '';
      if (totalScore >= 106) certification = 'Diamond/5★ (106-130 points)';
      else if (totalScore >= 80) certification = '4★ (80-105 points)';
      else if (totalScore >= 60) certification = '3★ (60-79 points)';
      else if (totalScore >= 45) certification = '2★ (45-59 points)';
      else certification = '1★ (Below 45 points)';

      pdf.text(`GREDA-GBC Certification Level: ${certification}`, 20, yPosition);
      yPosition += 15;

      // Section Details
      if (assessmentData.sections && assessmentData.sections.length > 0) {
        for (const section of assessmentData.sections) {
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 20;
          }

          // Section Header
          pdf.setFontSize(14);
          pdf.setTextColor(0, 102, 51);
          pdf.text(`${section.sectionName} Section`, 20, yPosition);
          yPosition += 10;

          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Score: ${section.score || 0} / ${section.maxScore || 0} points`, 20, yPosition);
          yPosition += 7;
          pdf.text(`Status: ${section.isCompleted ? 'Completed' : 'Incomplete'}`, 20, yPosition);
          yPosition += 10;

          // Variables data
          if (section.variables) {
            const variables = typeof section.variables === 'string' ? JSON.parse(section.variables) : section.variables;
            const sectionConfig = sectionVariables[section.sectionType];
            
            if (sectionConfig) {
              pdf.setFontSize(11);
              pdf.text('Variable Scores:', 25, yPosition);
              yPosition += 7;

              sectionConfig.forEach(variable => {
                const score = variables[variable.id] || 0;
                const formattedName = formatVariableName(variable.name);
                pdf.text(`• ${formattedName}: ${score} / ${variable.maxScore} points`, 30, yPosition);
                yPosition += 5;
              });
            }
          }

          yPosition += 10;
        }
      }

      // Media section - organized by section
      try {
        const mediaResponse = await fetch(`/api/assessments/${publicId}/media`);
        const mediaData = await mediaResponse.json();

        if (mediaData && mediaData.length > 0) {
          pdf.addPage();
          yPosition = 20;
          
          pdf.setFontSize(16);
          pdf.setTextColor(0, 102, 51);
          pdf.text('Assessment Images', 20, yPosition);
          yPosition += 15;

          // Display all images in a simple organized format
          for (const media of mediaData) {
            if (media.fileType === 'image') {
              try {
                // Check if we need a new page (leave space for image + text)
                if (yPosition > pageHeight - 120) {
                  pdf.addPage();
                  yPosition = 20;
                }

                // Load and add image
                const imgResponse = await fetch(`/api/media/serve/${media.id}`);
                const imgBlob = await imgResponse.blob();
                const imgUrl = URL.createObjectURL(imgBlob);
                
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve) => {
                  img.onload = () => {
                    // Calculate image dimensions - maintain aspect ratio
                    const maxWidth = 120;
                    const maxHeight = 80;
                    let imgWidth = maxWidth;
                    let imgHeight = (img.height / img.width) * imgWidth;
                    
                    // If image is too tall, scale by height instead
                    if (imgHeight > maxHeight) {
                      imgHeight = maxHeight;
                      imgWidth = (img.width / img.height) * imgHeight;
                    }

                    // Ensure we have enough space for this image
                    if (yPosition + imgHeight + 20 > pageHeight - 20) {
                      pdf.addPage();
                      yPosition = 20;
                    }
                    
                    // Add section and variable information
                    const sectionName = assessmentSections.find(s => s.id === media.sectionType)?.name || formatVariableName(media.sectionType || 'General');
                    const variableName = formatVariableName(media.fieldName || 'Image');
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 102, 51);
                    pdf.text(`${sectionName} > ${variableName}`, 30, yPosition);
                    yPosition += 8;
                    
                    // Add shortened filename
                    pdf.setFontSize(8);
                    pdf.setTextColor(100, 100, 100);
                    const shortName = media.fileName.length > 50 ? 
                      media.fileName.substring(0, 47) + '...' : media.fileName;
                    pdf.text(shortName, 30, yPosition);
                    yPosition += 8;
                    
                    // Add image with subtle border
                    pdf.setDrawColor(220, 220, 220);
                    pdf.setLineWidth(0.5);
                    pdf.rect(29, yPosition - 1, imgWidth + 2, imgHeight + 2);
                    pdf.addImage(img, 'JPEG', 30, yPosition, imgWidth, imgHeight);
                    
                    // Move to next position with proper spacing
                    yPosition += imgHeight + 15;
                    
                    URL.revokeObjectURL(imgUrl);
                    resolve(true);
                  };
                  img.onerror = () => {
                    console.warn('Could not load image:', media.fileName);
                    // Add placeholder text for failed image
                    pdf.setFontSize(9);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(`[Image failed to load: ${media.fileName}]`, 30, yPosition);
                    yPosition += 15;
                    resolve(true);
                  };
                  img.src = imgUrl;
                });
              } catch (error) {
                console.error('Error adding image to PDF:', error);
                // Add error note and continue
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`[Error loading image: ${media.fileName}]`, 30, yPosition);
                yPosition += 15;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not load media for PDF:', error);
      }

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text('Generated by GREDA-GBC Assessment Platform', 20, pageHeight - 10);
      }

      // Save the PDF
      const fileName = `GREDA_Assessment_${assessmentData.buildingName || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!assessment) {
    return <div className="min-h-screen flex items-center justify-center">Assessment not found</div>;
  }

  // Get assessment data (it comes as an array, so get the first element)
  const assessmentData = Array.isArray(assessment) ? assessment[0] : assessment;
  console.log("Assessment data:", assessmentData);
  
  // Use the assessment's overall score and max possible score
  const totalScore = assessmentData?.overallScore || 0;
  const maxScore = assessmentData?.maxPossibleScore || 130; // GREDA-GBC total is 130
  const calculatedPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  console.log("Calculated scores:", { totalScore, maxScore, calculatedPercentage });

  const getStarRating = (totalPoints: number) => {
    if (totalPoints >= 106) return 5; // Diamond
    if (totalPoints >= 80) return 4;  // 4 Star
    if (totalPoints >= 60) return 3;  // 3 Star
    if (totalPoints >= 45) return 2;  // 2 Star
    return 1; // Below certification threshold
  };

  const getPerformanceLevel = (totalPoints: number) => {
    if (totalPoints >= 106) return "Diamond Certification";
    if (totalPoints >= 80) return "4 Star Certification";
    if (totalPoints >= 60) return "3 Star Certification";
    if (totalPoints >= 45) return "2 Star Certification";
    return "Below Certification Threshold";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-card rounded-lg shadow-sm border">
            <div className="flex justify-between items-center px-6 py-4">
              <div className="flex items-center">
                <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto" />
                <span className="ml-3 text-xl font-medium text-foreground">GREDA-GBC Assessment Preview</span>
              </div>
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Assessment Preview</h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              assessmentData.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {assessmentData.status === 'completed' ? '✓ Submitted' : 'Draft'}
            </div>
          </div>
          <p className="text-gray-600">
            {assessmentData.status === 'completed' 
              ? 'This assessment has been successfully submitted' 
              : 'Review your building assessment before final submission'}
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {assessmentData.buildingName || "Building Assessment"}
                </h2>
                <p className="text-white/80 mb-4">{assessmentData.buildingLocation || assessmentData.detailedAddress || "Location not specified"}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-white/70">Conducted Date</div>
                    <div className="font-medium text-white">
                      {assessmentData?.conductedAt ? new Date(assessmentData.conductedAt).toLocaleDateString() : "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-white/70">Conducted By</div>
                    <div className="font-medium text-white">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email || "Assessment Team"}
                    </div>
                    <div className="text-xs text-white/60">Professional Assessor</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/70">Status</div>
                    <div className="font-medium text-white capitalize">{assessmentData.status || "Completed"}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <ProgressRing
                  value={calculatedPercentage}
                  max={100}
                  size={160}
                  strokeWidth={10}
                  className="mb-4 mx-auto"
                />
                <div className="text-3xl font-bold text-white mb-2">
                  {totalScore}/{maxScore} Points
                </div>
                <div className="text-lg font-medium text-white">
                  {getPerformanceLevel(totalScore)}
                </div>
                <div className="flex justify-center mt-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < getStarRating(totalScore) ? "text-accent" : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {assessment.sections?.map((section: AssessmentSection) => {
            const sectionPercentage = section.maxScore > 0 ? (section.score / section.maxScore) * 100 : 0;
            const stars = getStarRating(sectionPercentage);

            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{section.sectionName}</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < stars ? "text-accent" : "text-gray-300"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(section.score || 0)}
                    </span>
                    <span className="text-gray-500">/ {Math.round(section.maxScore || 0)} max</span>
                  </div>
                  <Progress value={sectionPercentage} className="h-3 mb-3" />
                  <div className="text-sm text-gray-600">
                    {section.isCompleted ? "Completed" : "In Progress"}
                  </div>
                  
                  {/* Variables breakdown */}
                  {section.variables && typeof section.variables === 'object' && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(section.variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium">{value as number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href={`/assessments/${publicId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Assessment
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          {assessmentData.status !== 'completed' && (
            <Button 
              size="lg" 
              onClick={handleSubmitAssessment}
              disabled={submitAssessmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
