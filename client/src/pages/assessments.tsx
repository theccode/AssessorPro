import { useQuery } from "@tanstack/react-query";
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
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Assessment } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from 'xlsx';
import { apiRequest } from "@/lib/queryClient";
import { assessmentSections, sectionVariables } from "@/lib/assessment-data";

export default function Assessments() {
  const { user } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<{ [key: number]: boolean }>({});
  const [isGeneratingExcel, setIsGeneratingExcel] = useState<{ [key: number]: boolean }>({});
  
  const { data: allAssessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
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
      // Fetch assessment sections
      const sectionsResponse = await apiRequest(`/api/assessments/${assessment.id}/sections`);
      const sections = await sectionsResponse.json();

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Add GREDA logo and header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GREDA-GBC Assessment Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Building: ${assessment.buildingName || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Location: ${assessment.buildingLocation || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Overall Score: ${Math.round(assessment.overallScore || 0)}/130`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Status: ${assessment.status}`, 20, yPosition);
      yPosition += 15;

      // Add sections data
      sections.forEach((section: any) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(section.sectionType.replace(/-/g, ' ').toUpperCase(), 20, yPosition);
        yPosition += 10;

        pdf.setFont('helvetica', 'normal');
        if (section.data) {
          const sectionData = typeof section.data === 'string' ? JSON.parse(section.data) : section.data;
          Object.entries(sectionData).forEach(([key, value]) => {
            if (yPosition > 280) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(`${formatVariableName(key)}: ${value}`, 25, yPosition);
            yPosition += 6;
          });
        }
        yPosition += 10;
      });

      // Generate and download the PDF file
      const fileName = `GREDA_Assessment_${assessment.buildingName || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF file. Please try again.');
    } finally {
      setIsGeneratingPDF(prev => ({ ...prev, [assessment.id]: false }));
    }
  };

  // Excel Download functionality
  const handleDownloadExcel = async (assessment: Assessment) => {
    setIsGeneratingExcel(prev => ({ ...prev, [assessment.id]: true }));
    try {
      // Fetch assessment sections
      const sectionsResponse = await apiRequest(`/api/assessments/${assessment.id}/sections`);
      const sections = await sectionsResponse.json();

      const workbook = XLSX.utils.book_new();

      // Create overview sheet
      const overviewData = [
        ['GREDA-GBC Assessment Report'],
        [''],
        ['Building Name', assessment.buildingName || 'N/A'],
        ['Location', assessment.buildingLocation || 'N/A'],
        ['Overall Score', `${Math.round(assessment.overallScore || 0)}/130`],
        ['Status', assessment.status],
        ['Created Date', new Date(assessment.createdAt || '').toLocaleDateString()],
        [''],
      ];

      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

      // Create sheets for each section
      sections.forEach((section: any) => {
        const sectionData = typeof section.data === 'string' ? JSON.parse(section.data) : section.data;
        const sheetData = [
          [section.sectionType.replace(/-/g, ' ').toUpperCase()],
          [''],
        ];

        if (sectionData) {
          Object.entries(sectionData).forEach(([key, value]) => {
            sheetData.push([formatVariableName(key), value]);
          });
        }

        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        const sheetName = section.sectionType.replace(/-/g, ' ').substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      });

      // Generate and download the Excel file
      const fileName = `GREDA_Assessment_${assessment.buildingName || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/logout">Logout</Link>
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
                    <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
                      {assessment.status}
                    </Badge>
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
                        <Link href={`/assessment/${assessment.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                      {(user?.role === "admin" || user?.role === "assessor") && (
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/assessments/${assessment.id}/edit`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      )}
                    </div>
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