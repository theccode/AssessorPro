import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Building, Edit, Download, Check, ArrowLeft, Loader2, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import type { Assessment, AssessmentSection } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from 'xlsx';
import { assessmentSections, sectionVariables } from "@/lib/assessment-data";
import AdminNotes from "@/components/AdminNotes";

export default function AssessmentPreview({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const publicId = params.id; // Now using UUID instead of integer
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [hasLoggedView, setHasLoggedView] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["/api/assessments", publicId],
  });

  // Log assessment view if user didn't create it
  useEffect(() => {
    if (assessment && user && assessment.userId !== user.id && !hasLoggedView) {
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email || user.id;
      
      apiRequest("/api/audit/log", "POST", {
        action: `viewed assessment preview "${assessment.buildingName || 'Untitled'}"`,
        details: {
          assessmentId: assessment.id,
          buildingName: assessment.buildingName,
          originalCreator: assessment.userId,
          viewerName: userName,
          viewerRole: user.role
        }
      }).catch(error => console.error("Failed to log assessment preview view:", error));
      
      setHasLoggedView(true);
    }
  }, [assessment, user, hasLoggedView]);

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
        `Client: ${assessmentData.clientName || 'Not specified'}`,
        `Phone: ${assessmentData.phoneNumber || 'Not specified'}`,
        `Digital Address: ${assessmentData.digitalAddress || 'Not specified'}`,
        `Status: ${assessmentData.status}`,
        `Conducted Date: ${assessmentData.conductedAt ? new Date(assessmentData.conductedAt).toLocaleDateString() : 'Not specified'}`,
        `Conducted By: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Assessment Team'}`,
        '',
        'Building Specifications:',
        `Building Footprint: ${assessmentData.buildingFootprint ? assessmentData.buildingFootprint + ' m²' : 'Not specified'}`,
        `Room Height: ${assessmentData.roomHeight ? assessmentData.roomHeight + ' m' : 'Not specified'}`,
        `Number of Bedrooms: ${assessmentData.numberOfBedrooms || 'Not specified'}`,
        `Site Area: ${assessmentData.siteArea ? assessmentData.siteArea + ' m²' : 'Not specified'}`,
        `Number of Windows: ${assessmentData.numberOfWindows || 'Not specified'}`,
        `Number of Doors: ${assessmentData.numberOfDoors || 'Not specified'}`,
        `Average Window Size: ${assessmentData.averageWindowSize ? assessmentData.averageWindowSize + ' m²' : 'Not specified'}`,
        `Number of Floors: ${assessmentData.numberOfFloors || 'Not specified'}`,
        `Total Green Area: ${assessmentData.totalGreenArea ? assessmentData.totalGreenArea + ' m²' : 'Not specified'}`
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

  // Excel Download functionality
  const handleDownloadExcel = async () => {
    if (!assessment) {
      alert('Assessment data not loaded yet. Please wait and try again.');
      return;
    }

    setIsGeneratingExcel(true);
    try {
      // Get assessment data safely
      const assessmentData = Array.isArray(assessment) ? assessment[0] : assessment;
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Assessment Summary
      const summaryData = [
        ['GREDA Green Building Assessment Report'],
        [''],
        ['Assessment Information'],
        ['Building Name', assessmentData.buildingName || 'N/A'],
        ['Client Name', assessmentData.clientName || 'N/A'],
        ['Building Location', assessmentData.buildingLocation || 'N/A'],
        ['Digital Address', assessmentData.digitalAddress || 'N/A'],
        ['Detailed Address', assessmentData.detailedAddress || 'N/A'],
        ['Phone Number', assessmentData.phoneNumber || 'N/A'],
        ['Additional Notes', assessmentData.additionalNotes || 'N/A'],
        [''],
        ['Building Specifications'],
        ['Building Footprint (m²)', assessmentData.buildingFootprint || 'N/A'],
        ['Room Height (m)', assessmentData.roomHeight || 'N/A'],
        ['Number of Bedrooms', assessmentData.numberOfBedrooms || 'N/A'],
        ['Site Area (m²)', assessmentData.siteArea || 'N/A'],
        ['Number of Windows', assessmentData.numberOfWindows || 'N/A'],
        ['Number of Doors', assessmentData.numberOfDoors || 'N/A'],
        ['Average Window Size (m²)', assessmentData.averageWindowSize || 'N/A'],
        ['Number of Floors', assessmentData.numberOfFloors || 'N/A'],
        ['Total Green Area (m²)', assessmentData.totalGreenArea || 'N/A'],
        [''],
        ['Assessment Results'],
        ['Total Score', `${assessmentData.overallScore || 0} / ${assessmentData.maxPossibleScore || 130} points`],
        ['Percentage', `${assessmentData.maxPossibleScore > 0 ? Math.round((assessmentData.overallScore / assessmentData.maxPossibleScore) * 100) : 0}%`],
        ['Status', assessmentData.status || 'draft'],
        ['Completed Sections', `${assessmentData.completedSections || 0} / ${assessmentData.totalSections || 8}`],
        [''],
        ['Assessment Details'],
        ['Assessor Name', assessmentData.assessorName || 'N/A'],
        ['Assessor Role', assessmentData.assessorRole || 'N/A'],
        ['Conducted At', assessmentData.conductedAt ? new Date(assessmentData.conductedAt).toLocaleDateString() : 'N/A'],
        ['Created At', assessmentData.createdAt ? new Date(assessmentData.createdAt).toLocaleDateString() : 'N/A'],
        ['Last Updated', assessmentData.updatedAt ? new Date(assessmentData.updatedAt).toLocaleDateString() : 'N/A'],
      ];

      // Calculate certification level
      const totalScore = assessmentData.overallScore || 0;
      let certification = '';
      if (totalScore >= 106) certification = 'Diamond/5★ (106-130 points)';
      else if (totalScore >= 85) certification = 'Platinum/4★ (85-105 points)';
      else if (totalScore >= 64) certification = 'Gold/3★ (64-84 points)';
      else if (totalScore >= 43) certification = 'Silver/2★ (43-63 points)';
      else if (totalScore >= 22) certification = 'Bronze/1★ (22-42 points)';
      else certification = 'Not Certified (Below 22 points)';

      summaryData.push(['Certification Level', certification]);

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [{ width: 25 }, { width: 40 }];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Assessment Summary');

      // Sheet 2: Section Details
      const sectionsData = [
        ['Section Details'],
        [''],
        ['Section Name', 'Score', 'Max Score', 'Percentage', 'Status']
      ];

      // Get sections data from API call
      try {
        const sectionsResponse = await fetch(`/api/assessments/${publicId}`);
        const fullAssessmentData = await sectionsResponse.json();
        
        if (fullAssessmentData.sections && fullAssessmentData.sections.length > 0) {
          fullAssessmentData.sections.forEach((section: any) => {
            const sectionConfig = assessmentSections.find(s => s.id === section.sectionType);
            const sectionName = sectionConfig?.name || formatVariableName(section.sectionType || 'Unknown');
            const score = section.score || 0;
            const maxScore = section.maxScore || 0;
            const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
            const status = score === maxScore ? 'Complete' : score > 0 ? 'Partial' : 'Not Started';

            sectionsData.push([
              sectionName,
              score,
              maxScore,
              `${percentage}%`,
              status
            ]);
          });
        } else {
          sectionsData.push(['No section data available', '', '', '', '']);
        }
      } catch (error) {
        console.warn('Could not load sections for Excel export:', error);
        sectionsData.push(['Error loading sections', '', '', '', '']);
      }

      const sectionsSheet = XLSX.utils.aoa_to_sheet(sectionsData);
      sectionsSheet['!cols'] = [{ width: 30 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 15 }];
      XLSX.utils.book_append_sheet(workbook, sectionsSheet, 'Section Details');

      // Sheet 3: Variable Scores
      const variablesData = [
        ['Variable Scores'],
        [''],
        ['Section', 'Variable Name', 'Score', 'Max Score', 'Percentage']
      ];

      // Use the same full assessment data from the previous API call
      try {
        const sectionsResponse = await fetch(`/api/assessments/${publicId}`);
        const fullAssessmentData = await sectionsResponse.json();
        
        if (fullAssessmentData.sections && fullAssessmentData.sections.length > 0) {
          fullAssessmentData.sections.forEach((section: any) => {
            const sectionConfig = assessmentSections.find(s => s.id === section.sectionType);
            const sectionName = sectionConfig?.name || formatVariableName(section.sectionType || 'Unknown');
            
            if (section.variables) {
              try {
                // Handle both string and object formats
                let variables;
                if (typeof section.variables === 'string') {
                  variables = JSON.parse(section.variables);
                } else {
                  variables = section.variables;
                }
                
                const sectionVars = sectionVariables[section.sectionType] || [];
                
                if (sectionVars.length > 0) {
                  sectionVars.forEach(variable => {
                    const score = variables[variable.id] || 0;
                    const maxScore = variable.maxScore;
                    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

                    variablesData.push([
                      sectionName,
                      formatVariableName(variable.name),
                      score,
                      maxScore,
                      `${percentage}%`
                    ]);
                  });
                } else {
                  // If no predefined variables, try to extract from the variables object itself
                  Object.keys(variables).forEach(variableKey => {
                    const score = variables[variableKey] || 0;
                    variablesData.push([
                      sectionName,
                      formatVariableName(variableKey),
                      score,
                      'N/A', // Max score not available in this case
                      'N/A'
                    ]);
                  });
                }
              } catch (parseError) {
                console.warn('Could not parse variables for section:', section.sectionType, parseError);
                // Still add the section but with no variable breakdown
                variablesData.push([
                  sectionName,
                  'Data parsing error',
                  section.score || 0,
                  section.maxScore || 0,
                  section.maxScore > 0 ? `${Math.round((section.score / section.maxScore) * 100)}%` : '0%'
                ]);
              }
            } else {
              // No variables data, just show section totals
              variablesData.push([
                sectionName,
                'Section Total Only',
                section.score || 0,
                section.maxScore || 0,
                section.maxScore > 0 ? `${Math.round((section.score / section.maxScore) * 100)}%` : '0%'
              ]);
            }
          });
        } else {
          variablesData.push(['No variable data available', '', '', '', '']);
        }
      } catch (error) {
        console.warn('Could not load variables for Excel export:', error);
        variablesData.push(['Error loading variables', '', '', '', '']);
      }

      const variablesSheet = XLSX.utils.aoa_to_sheet(variablesData);
      variablesSheet['!cols'] = [{ width: 25 }, { width: 30 }, { width: 10 }, { width: 12 }, { width: 12 }];
      XLSX.utils.book_append_sheet(workbook, variablesSheet, 'Variable Scores');

      // Sheet 4: Media Files
      try {
        const mediaResponse = await fetch(`/api/assessments/${publicId}/media`);
        const mediaData = await mediaResponse.json();

        const mediaFilesData = [
          ['Media Files'],
          [''],
          ['Section', 'Variable', 'File Name', 'File Type', 'File Size', 'Upload Date', 'File Access URL']
        ];

        if (mediaData && mediaData.length > 0) {
          // Process each media file
          for (const media of mediaData) {
            const sectionName = assessmentSections.find(s => s.id === media.sectionType)?.name || formatVariableName(media.sectionType || 'General');
            const variableName = formatVariableName(media.fieldName || 'File');
            const uploadDate = media.createdAt ? new Date(media.createdAt).toLocaleDateString() : 'N/A';
            const fileSize = media.fileSize ? `${Math.round(media.fileSize / 1024)} KB` : 'N/A';
            
            // Just add the variable name for now, we'll add hyperlinks after sheet creation
            const linkText = media.filePath ? variableName : 'File not available';

            mediaFilesData.push([
              sectionName,
              variableName,
              media.fileName || 'Unknown',
              media.fileType || 'Unknown',
              fileSize,
              uploadDate,
              linkText
            ]);
          }
        } else {
          mediaFilesData.push(['No media files found', '', '', '', '', '', '']);
        }

        const mediaSheet = XLSX.utils.aoa_to_sheet(mediaFilesData);
        
        // Add hyperlinks to the File Access URL column (column G)
        if (mediaData && mediaData.length > 0) {
          mediaData.forEach((media: any, index: number) => {
            if (media.filePath && media.id) {
              const rowIndex = index + 3; // Account for headers (starts at row 3)
              const cellAddress = `G${rowIndex}`;
              const authenticatedFileUrl = `${window.location.origin}/api/media/serve/${media.id}`;
              const linkDisplayText = `🔗 Open ${media.fileName}`;
              
              // Set the cell as a hyperlink with proper styling
              mediaSheet[cellAddress] = {
                t: 's',
                v: linkDisplayText,
                l: { Target: authenticatedFileUrl, Tooltip: `Click to download ${media.fileName}` },
                s: {
                  font: { color: { rgb: "0000FF" }, underline: true },
                  alignment: { horizontal: "left" }
                }
              };
            }
          });
        }
        
        mediaSheet['!cols'] = [{ width: 25 }, { width: 25 }, { width: 40 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 30 }];
        XLSX.utils.book_append_sheet(workbook, mediaSheet, 'Media Files');
      } catch (error) {
        console.warn('Could not load media for Excel export:', error);
        // Add empty media sheet
        const emptyMediaData = [
          ['Media Files'],
          [''],
          ['No media data available']
        ];
        const emptyMediaSheet = XLSX.utils.aoa_to_sheet(emptyMediaData);
        XLSX.utils.book_append_sheet(workbook, emptyMediaSheet, 'Media Files');
      }

      // Generate and download the Excel file
      const fileName = `GREDA_Assessment_${assessmentData.buildingName || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please try again.');
    } finally {
      setIsGeneratingExcel(false);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="bg-card rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4">
              <div className="flex items-center min-w-0 flex-1">
                <img src={gredaLogo} alt="GREDA Green Building" className="h-6 sm:h-8 w-auto flex-shrink-0" />
                <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-medium text-foreground truncate">GREDA-GBC Assessment Preview</span>
              </div>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Assessment Preview</h1>
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
              assessmentData.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {assessmentData.status === 'completed' ? '✓ Submitted' : 'Draft'}
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            {assessmentData.status === 'completed' 
              ? 'This assessment has been successfully submitted' 
              : 'Review your building assessment before final submission'}
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-6 sm:mb-8 shadow-lg">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 lg:items-center">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {assessmentData.buildingName || "Building Assessment"}
                </h2>
                <p className="text-white/80 mb-4 text-sm sm:text-base">{assessmentData.buildingLocation || assessmentData.detailedAddress || "Location not specified"}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <div className="text-xs sm:text-sm text-white/70">Conducted Date</div>
                    <div className="font-medium text-white text-sm sm:text-base">
                      {assessmentData?.conductedAt ? new Date(assessmentData.conductedAt).toLocaleDateString() : "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-white/70">Conducted By</div>
                    <div className="font-medium text-white text-sm sm:text-base">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email || "Assessment Team"}
                    </div>
                    <div className="text-xs text-white/60">Professional Assessor</div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <div className="text-xs sm:text-sm text-white/70">Status</div>
                    <div className="font-medium text-white capitalize text-sm sm:text-base">{assessmentData.status || "Completed"}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-center order-1 lg:order-2">
                <ProgressRing
                  value={calculatedPercentage}
                  max={100}
                  size={120}
                  strokeWidth={8}
                  className="mb-3 sm:mb-4 mx-auto sm:hidden"
                />
                <ProgressRing
                  value={calculatedPercentage}
                  max={100}
                  size={160}
                  strokeWidth={10}
                  className="mb-3 sm:mb-4 mx-auto hidden sm:block"
                />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {totalScore}/{maxScore} Points
                </div>
                <div className="text-base sm:text-lg font-medium text-white mb-2">
                  {getPerformanceLevel(totalScore)}
                </div>
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-base sm:text-lg ${
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {assessment.sections?.map((section: AssessmentSection) => {
            const sectionPercentage = section.maxScore > 0 ? (section.score / section.maxScore) * 100 : 0;
            const stars = getStarRating(sectionPercentage);

            return (
              <Card key={section.id}>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm sm:text-base font-medium leading-tight">{section.sectionName}</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-xs sm:text-sm ${i < stars ? "text-accent" : "text-gray-300"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {Math.round(section.score || 0)}
                    </span>
                    <span className="text-gray-500 text-sm sm:text-base">/ {Math.round(section.maxScore || 0)} max</span>
                  </div>
                  <Progress value={sectionPercentage} className="h-2 sm:h-3 mb-3" />
                  <div className="text-xs sm:text-sm text-gray-600">
                    {section.isCompleted ? "Completed" : "In Progress"}
                  </div>
                  
                  {/* Variables breakdown */}
                  {section.variables && typeof section.variables === 'object' && (
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                      {Object.entries(section.variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs sm:text-sm">
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          {(user?.role === "admin" || user?.role === "assessor") && assessmentData.status !== 'completed' && (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={`/assessments/${publicId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Assessment
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="w-full sm:w-auto">
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
          <Button variant="outline" onClick={handleDownloadExcel} disabled={isGeneratingExcel} className="w-full sm:w-auto">
            {isGeneratingExcel ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Excel
              </>
            )}
          </Button>
          {assessmentData.status !== 'completed' && (user?.role === "admin" || user?.role === "assessor") && (
            <Button 
              size="lg" 
              onClick={handleSubmitAssessment}
              disabled={submitAssessmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
            </Button>
          )}
        </div>

        {/* Admin Notes Section - Only for completed assessments */}
        {assessmentData.status === 'completed' && (
          <div className="mt-8">
            <AdminNotes 
              assessmentId={assessmentData.id} 
              assessmentStatus={assessmentData.status} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
