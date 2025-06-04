import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building, 
  Plus, 
  Eye, 
  Edit,
  Calendar,
  MapPin,
  TrendingUp,
  FileText,
  Table,
  Loader2,
  Lock,
  Unlock
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Assessment } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from 'xlsx';
import { assessmentSections, sectionVariables } from "@/lib/assessment-data";

export default function Assessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<{ [key: number]: boolean }>({});
  const [isGeneratingExcel, setIsGeneratingExcel] = useState<{ [key: number]: boolean }>({});
  
  const { data: allAssessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  // Lock/unlock mutations for admins
  const lockMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      return await apiRequest(`/api/assessments/${assessmentId}/lock`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      return await apiRequest(`/api/assessments/${assessmentId}/unlock`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  // Filter to show only completed assessments (exclude drafts)
  const assessments = allAssessments.filter((assessment: Assessment) => 
    assessment.status === "completed"
  );

  // Helper function to format camelCase to readable text
  const formatVariableName = (camelCase: string) => {
    return camelCase
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // PDF Download functionality
  const handleDownloadPDF = async (assessment: Assessment) => {
    setIsGeneratingPDF(prev => ({ ...prev, [assessment.id]: true }));
    try {
      // Fetch full assessment data with sections using the integer ID
      const fullAssessmentResponse = await apiRequest(`/api/assessments/${assessment.id}`);
      const assessmentData = await fullAssessmentResponse.json();
      
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

      // Media Files section - with clickable links
      try {
        const mediaResponse = await fetch(`/api/assessments/${assessment.id}/media`);
        const mediaData = await mediaResponse.json();

        if (mediaData && mediaData.length > 0) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(16);
          pdf.setTextColor(0, 102, 51);
          pdf.text('Assessment Media Files', 20, yPosition);
          yPosition += 15;

          // Display media files as clickable links organized by section
          const mediaBySection = {};
          mediaData.forEach((media: any) => {
            const sectionName = assessmentSections.find(s => s.id === media.sectionType)?.name || formatVariableName(media.sectionType || 'General');
            if (!mediaBySection[sectionName]) {
              mediaBySection[sectionName] = [];
            }
            mediaBySection[sectionName].push(media);
          });

          Object.entries(mediaBySection).forEach(([sectionName, files]: [string, any[]]) => {
            // Check if we need a new page
            if (yPosition > pageHeight - 60) {
              pdf.addPage();
              yPosition = 20;
            }

            // Section header
            pdf.setFontSize(12);
            pdf.setTextColor(0, 102, 51);
            pdf.text(`${sectionName}:`, 25, yPosition);
            yPosition += 10;

            files.forEach((media: any) => {
              if (yPosition > pageHeight - 25) {
                pdf.addPage();
                yPosition = 20;
              }

              const variableName = formatVariableName(media.fieldName || 'File');
              const fileName = media.fileName || 'Unknown file';
              const fileType = media.fileType || 'Unknown';
              const fileSize = media.fileSize ? `${Math.round(media.fileSize / 1024)} KB` : 'Unknown size';
              
              // Create clickable link
              const authenticatedFileUrl = `${window.location.origin}/api/media/serve/${media.id}`;
              
              pdf.setFontSize(10);
              pdf.setTextColor(0, 0, 255); // Blue color for links
              pdf.textWithLink(`📎 ${variableName} - ${fileName}`, 30, yPosition, { url: authenticatedFileUrl });
              
              pdf.setFontSize(8);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`   Type: ${fileType} | Size: ${fileSize}`, 30, yPosition + 5);
              
              yPosition += 12;
            });

            yPosition += 5;
          });
        } else {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(16);
          pdf.setTextColor(0, 102, 51);
          pdf.text('Assessment Media Files', 20, yPosition);
          yPosition += 15;
          
          pdf.setFontSize(12);
          pdf.setTextColor(100, 100, 100);
          pdf.text('No media files uploaded for this assessment.', 20, yPosition);
        }
      } catch (error) {
        console.warn('Could not load media for PDF:', error);
        
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 102, 51);
        pdf.text('Assessment Media Files', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Error loading media files.', 20, yPosition);
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
      setIsGeneratingPDF(prev => ({ ...prev, [assessment.id]: false }));
    }
  };

  // Excel Download functionality
  const handleDownloadExcel = async (assessment: Assessment) => {
    setIsGeneratingExcel(prev => ({ ...prev, [assessment.id]: true }));
    try {
      // Fetch full assessment data with sections using the integer ID
      const fullAssessmentResponse = await apiRequest(`/api/assessments/${assessment.id}`);
      const assessmentData = await fullAssessmentResponse.json();
      
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
        const sectionsResponse = await fetch(`/api/assessments/${assessment.id}`);
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
        const sectionsResponse = await fetch(`/api/assessments/${assessment.id}`);
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
        const mediaResponse = await fetch(`/api/assessments/${assessment.id}/media`);
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
      setIsGeneratingExcel(prev => ({ ...prev, [assessment.id]: false }));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading assessments...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-8 sm:h-10 w-auto" />
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/assessments">Assessments</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/drafts">Drafts</Link>
              </Button>
              {(user?.role === "admin" || user?.role === "assessor") && (
                <Button variant="ghost" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
              )}
              {user?.role === "admin" && (
                <Button variant="ghost" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/api/logout">Logout</Link>
              </Button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Completed Assessments</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              View and manage all completed building assessments
            </p>
          </div>
          {(user?.role === "admin" || user?.role === "assessor") && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/assessments/select-client">
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Link>
            </Button>
          )}
        </div>

        {/* Assessments Grid */}
        {assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(assessments as Assessment[]).map((assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        <Building className="h-5 w-5 mr-2 text-primary" />
                        {assessment.buildingName || "Unnamed Building"}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {assessment.buildingLocation || "Location not specified"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assessment.isLocked && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                      <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
                        {assessment.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score and Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-bold text-primary">
                        {Math.round(assessment.overallScore || 0)}/130
                      </span>
                    </div>
                    <Progress 
                      value={((assessment.overallScore || 0) / 130) * 100} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Performance: {Math.round(((assessment.overallScore || 0) / 130) * 100)}%</span>
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Assessment Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(assessment.createdAt || "").toLocaleDateString()}
                      </span>
                    </div>
                    {assessment.assessorName && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Assessor</span>
                        <span>{assessment.assessorName}</span>
                      </div>
                    )}
                    {assessment.clientName && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Client</span>
                        <span>{assessment.clientName}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/assessments/${assessment.publicId}/preview`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                      {(user?.role === "admin" || user?.role === "assessor") && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1" 
                          asChild
                          disabled={assessment.isLocked && user?.role !== "admin"}
                        >
                          <Link href={`/assessments/${assessment.publicId}/edit`}>
                            <Edit className="h-3 w-3 mr-1" />
                            {assessment.isLocked && user?.role !== "admin" ? "Locked" : "Edit"}
                          </Link>
                        </Button>
                      )}
                    </div>
                    
                    {/* Admin Lock Controls */}
                    {user?.role === "admin" && (
                      <div className="flex space-x-2">
                        {assessment.isLocked ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1" 
                            onClick={() => unlockMutation.mutate(assessment.id)}
                            disabled={unlockMutation.isPending}
                          >
                            {unlockMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Unlocking...
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3 mr-1" />
                                Unlock
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1" 
                            onClick={() => lockMutation.mutate(assessment.id)}
                            disabled={lockMutation.isPending}
                          >
                            {lockMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Locking...
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Lock
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Download Buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleDownloadExcel(assessment)}
                        disabled={isGeneratingExcel[assessment.id]}
                      >
                        {isGeneratingExcel[assessment.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Table className="h-3 w-3 mr-1" />
                            Excel
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleDownloadPDF(assessment)}
                        disabled={isGeneratingPDF[assessment.id]}
                      >
                        {isGeneratingPDF[assessment.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No completed assessments</h3>
            <p className="text-muted-foreground mb-6">
              {user?.role === "client" 
                ? "No completed assessments are available for your account yet."
                : "Complete assessments from your drafts to see them here, or create new assessments."
              }
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/drafts">
                  <FileText className="h-4 w-4 mr-2" />
                  View Drafts
                </Link>
              </Button>
              {(user?.role === "admin" || user?.role === "assessor") && (
                <Button asChild>
                  <Link href="/assessments/select-client">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}