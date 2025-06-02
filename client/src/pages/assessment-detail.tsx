import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Building, 
  ArrowLeft, 
  Download, 
  FileText, 
  Printer,
  Image as ImageIcon,
  Video,
  Music,
  FileDown,
  BarChart3,
  TrendingUp,
  Star,
  Award,
  Eye,
  PieChart,
  MapPin,
  Calendar,
  User,
  Edit
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Assessment, AssessmentSection, AssessmentMedia } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

// Helper function to convert technical names to user-friendly names
function formatVariableName(name: string): string {
  if (!name || name === 'General') return 'Document Upload';
  
  // Convert camelCase and PascalCase to readable format
  let readable = name
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/\s+/g, ' ') // Remove extra spaces
    .trim();
  
  // Handle common technical terms - Title Case (Each Word Capitalized)
  const mappings: Record<string, string> = {
    'Building Info': 'Building Information',
    'General Info': 'General Information',
    'Water Conservation': 'Water Conservation',
    'Energy Efficiency': 'Energy Efficiency',
    'Indoor Environmental Quality': 'Indoor Environmental Quality',
    'Site And Transport': 'Site And Transportation',
    'Materials Resources': 'Materials And Resources',
    'Waste Management': 'Waste Management',
    'Innovation Points': 'Innovation Points',
    'Building Performance': 'Building Performance',
    'Sustainable Design': 'Sustainable Design Features',
    'HVAC System': 'HVAC System',
    'Lighting System': 'Lighting System',
    'Renewable Energy': 'Renewable Energy Systems',
    'Green Roof': 'Green Roof Features',
    'Rain Water': 'Rainwater Harvesting',
    'Solar Panel': 'Solar Panel Installation',
    'Insulation Type': 'Insulation Materials',
    'Window Type': 'Window Systems',
    'Floor Plan': 'Building Floor Plan',
    'Elevation View': 'Building Elevation',
    'Site Plan': 'Site Layout Plan',
    'General': 'General Documentation'
  };
  
  // Apply mapping or convert to Title Case
  let result = mappings[readable] || readable;
  
  // Ensure Title Case (capitalize each word)
  result = result.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
  
  return result;
}

// Helper function to format section names
function formatSectionName(sectionType: string): string {
  if (!sectionType) return 'General';
  
  const mappings: Record<string, string> = {
    'buildingInfo': 'Building Information',
    'generalInfo': 'General Information', 
    'waterConservation': 'Water Conservation',
    'energyEfficiency': 'Energy Efficiency',
    'indoorEnvironmentalQuality': 'Indoor Environmental Quality',
    'siteAndTransport': 'Site And Transportation',
    'materialsResources': 'Materials And Resources',
    'wasteManagement': 'Waste Management',
    'innovationPoints': 'Innovation Points'
  };
  
  let result = mappings[sectionType] || formatVariableName(sectionType);
  
  // Ensure Title Case (capitalize each word)
  result = result.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
  
  return result;
}

export default function AssessmentDetail({ params }: { params: { id: string } }) {
  const assessmentId = parseInt(params.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  
  // Don't render if ID is not a valid number
  if (isNaN(assessmentId) || !params.id) {
    return null;
  }

  const { data: assessment, isLoading } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
  });

  const { data: media = [] } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/media`],
    enabled: !!assessmentId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/sections`],
    enabled: !!assessmentId,
  });

  // PDF Download functionality
  const downloadPDFMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/assessments/${assessmentId}/pdf`, "GET");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${assessment?.buildingName || 'assessment'}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download PDF report",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    downloadPDFMutation.mutate();
    setTimeout(() => setIsGeneratingPDF(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!assessment) {
    return <div className="min-h-screen flex items-center justify-center">Assessment not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto flex-shrink-0" />
              <span className="ml-3 text-lg lg:text-xl font-medium text-foreground truncate">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {(user?.role === "admin" || user?.role === "assessor") && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/assessments/${assessmentId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Assessment
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" asChild>
                <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <Link href="/assessments" className="hover:text-primary">Assessments</Link>
          <span>/</span>
          <span className="text-foreground">{(assessment as any).buildingName || "Assessment Details"}</span>
        </div>

        {/* Header with Score and Rating */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2 truncate">
                {(assessment as any).buildingName || "GREDA-GBC Assessment"}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant={(assessment as any).status === "completed" ? "default" : "secondary"}>
                  {(assessment as any).status}
                </Badge>
                <span className="text-muted-foreground">
                  Last updated: {new Date((assessment as any).updatedAt || "").toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {Math.round((assessment as any).overallScore || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
                <div className="text-xs text-muted-foreground">/ 130 Credits</div>
              </div>
              <div className="text-center">
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => {
                    const score = (assessment as any).overallScore || 0;
                    let stars = 0;
                    if (score >= 106) stars = 5; // Diamond/5★ (106-130)
                    else if (score >= 80) stars = 4; // 4★ (80-105)
                    else if (score >= 60) stars = 3; // 3★ (60-79)
                    else if (score >= 45) stars = 2; // 2★ (45-59)
                    else if (score >= 1) stars = 1; // 1★ (1-44)
                    
                    return (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < stars
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-sm text-muted-foreground">GREDA Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="variables">
              <PieChart className="h-4 w-4 mr-2" />
              Variables & Data
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media Files
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Building Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Building Name</label>
                      <div className="p-3 bg-secondary rounded-lg text-foreground">
                        {(assessment as any).buildingName || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                      <div className="p-3 bg-secondary rounded-lg text-foreground">
                        {(assessment as any).buildingLocation || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Assessment Date</label>
                      <div className="p-3 bg-secondary rounded-lg text-foreground">
                        {new Date((assessment as any).createdAt || "").toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assessment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Overall Score</span>
                      <span className="text-2xl font-bold text-primary">{Math.round((assessment as any).overallScore || 0)}/130</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completion Status</span>
                      <Badge variant={(assessment as any).status === "completed" ? "default" : "secondary"}>
                        {(assessment as any).status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sections Completed</span>
                      <span className="font-medium">{(assessment as any).completedSections || 0}/{(assessment as any).totalSections || 8}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Performance</span>
                      <span className="text-primary font-medium">
                        {Math.round(((assessment as any).overallScore || 0) / 130 * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Section Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {sections.length > 0 ? sections.map((section: any) => (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{section.sectionType || 'Section'}</span>
                          <span className="text-sm text-muted-foreground">
                            {section.score || 0}/20
                          </span>
                        </div>
                        <Progress 
                          value={((section.score || 0) / 20) * 100} 
                          className="h-2"
                        />
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No section data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Certification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">GREDA-GBC Certification</span>
                        <Badge variant="outline">
                          {(assessment as any).overallScore && (assessment as any).overallScore >= 100 ? "Eligible" : "In Progress"}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min(((assessment as any).overallScore || 0) / 100 * 100, 100)}
                        className="mb-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        {100 - ((assessment as any).overallScore || 0)} credits needed for certification
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Environmental Impact</span>
                        <span className="text-primary font-medium">
                          {Math.round(((assessment as any).overallScore || 0) / 130 * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sustainability performance rating
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Variables & Data Tab */}
          <TabsContent value="variables" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Building Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Building Type</label>
                        <p className="text-foreground">{(assessment as any).buildingType || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Floor Area</label>
                        <p className="text-foreground">{(assessment as any).floorArea || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Construction Year</label>
                        <p className="text-foreground">{(assessment as any).constructionYear || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Occupancy</label>
                        <p className="text-foreground">{(assessment as any).occupancy || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Assessment Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assessor</label>
                      <p className="text-foreground">{(assessment as any).assessorName || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Client</label>
                      <p className="text-foreground">{(assessment as any).clientName || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                      <p className="text-foreground">
                        {(assessment as any).createdAt ? new Date((assessment as any).createdAt).toLocaleDateString() : "Not available"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-foreground">
                        {(assessment as any).updatedAt ? new Date((assessment as any).updatedAt).toLocaleDateString() : "Not available"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Variables Display */}
              {sections.length > 0 && (
                <div className="col-span-full">
                  <h3 className="text-lg font-semibold mb-4">Section Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section: any) => (
                      <Card key={section.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{formatSectionName(section.sectionType)}</span>
                            <Badge variant="outline">
                              {section.score || 0}/20 credits
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {section.variables && typeof section.variables === 'object' ? (
                              Object.entries(section.variables).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </span>
                                  <span className="text-sm text-foreground">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No variable data available</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Media Files Tab */}
          <TabsContent value="media" className="mt-6">
            {/* Group media files by section */}
            {sections.length > 0 ? (
              <div className="space-y-6">
                {sections.map((section: any) => {
                  const sectionMedia = (media as any[]).filter((m: any) => m.sectionType === section.sectionType);
                  if (sectionMedia.length === 0) return null;
                  
                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{formatSectionName(section.sectionType)}</span>
                          <Badge variant="outline">{sectionMedia.length} files</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                          {sectionMedia.map((file: any) => (
                            <div key={file.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{file.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Variable: {formatVariableName(file.fieldName || file.variableName || 'General')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Type: {file.fileType}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(`/api/media/${file.id}`, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* File preview */}
                              <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                {file.fileType === "image" ? (
                                  <img 
                                    src={`/api/media/${file.id}`}
                                    alt={file.fileName}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewMedia(file)}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling!.classList.remove('hidden');
                                    }}
                                  />
                                ) : file.fileType === "video" ? (
                                  <video 
                                    controls 
                                    className="w-full h-full"
                                    preload="metadata"
                                  >
                                    <source src={`/api/media/${file.id}`} />
                                    Your browser does not support video playback.
                                  </video>
                                ) : file.fileType === "audio" ? (
                                  <div className="flex flex-col items-center space-y-2">
                                    <Music className="h-8 w-8 text-muted-foreground" />
                                    <audio controls className="w-full">
                                      <source src={`/api/media/${file.id}`} />
                                      Your browser does not support audio playback.
                                    </audio>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-2">
                                    <FileDown className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Document</span>
                                  </div>
                                )}
                                
                                {/* Fallback icon for failed image loads */}
                                <div className="hidden flex-col items-center space-y-2">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Image</span>
                                </div>
                              </div>
                              
                              {/* File actions */}
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(file.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setPreviewMedia(file)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `/api/media/${file.id}`;
                                      link.download = file.fileName;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No media files available for this assessment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Media Preview Modal */}
      {previewMedia && (
        <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="truncate">{previewMedia.fileName}</span>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/api/media/${previewMedia.id}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/media/${previewMedia.id}`;
                      link.download = previewMedia.fileName;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </DialogTitle>
              <DialogDescription>
                Preview of {formatVariableName(previewMedia.fieldName || previewMedia.variableName || 'General')} media file
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">
                Variable: {formatVariableName(previewMedia.fieldName || previewMedia.variableName || 'General')} | 
                Type: {previewMedia.fileType} | 
                Uploaded: {new Date(previewMedia.createdAt).toLocaleDateString()}
              </div>
              <div className="relative bg-muted rounded-lg overflow-hidden max-h-[70vh] flex items-center justify-center">
                {previewMedia.fileType === "image" ? (
                  <img 
                    src={`/api/media/${previewMedia.id}`}
                    alt={previewMedia.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : previewMedia.fileType === "video" ? (
                  <video 
                    controls 
                    className="max-w-full max-h-full"
                    autoPlay
                  >
                    <source src={`/api/media/${previewMedia.id}`} />
                    Your browser does not support video playback.
                  </video>
                ) : previewMedia.fileType === "audio" ? (
                  <div className="p-8 flex flex-col items-center space-y-4">
                    <Music className="h-16 w-16 text-muted-foreground" />
                    <audio controls className="w-full max-w-md">
                      <source src={`/api/media/${previewMedia.id}`} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center space-y-4">
                    <FileDown className="h-16 w-16 text-muted-foreground" />
                    <span className="text-lg font-medium">{previewMedia.fileName}</span>
                    <span className="text-muted-foreground">Document file - click Download to view</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}