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
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

export default function AssessmentDetail({ params }: { params: { id: string } }) {
  const assessmentId = parseInt(params.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto" />
              <span className="ml-3 text-xl font-medium text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {(assessment as any).buildingName || "GREDA-GBC Assessment"}
              </h1>
              <div className="flex items-center space-x-4">
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
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(((assessment as any).overallScore || 0) / 26)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
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
                            <span>{section.sectionType}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Images ({(media as any[]).filter((m: any) => m.fileType === "image").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(media as any[]).filter((m: any) => m.fileType === "image").length > 0 ? (
                    <div className="space-y-2">
                      {(media as any[]).filter((m: any) => m.fileType === "image").map((image: any) => (
                        <div key={image.id} className="p-2 border rounded flex items-center justify-between">
                          <p className="text-sm truncate">{image.fileName}</p>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No images uploaded</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Videos ({(media as any[]).filter((m: any) => m.fileType === "video").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(media as any[]).filter((m: any) => m.fileType === "video").length > 0 ? (
                    <div className="space-y-2">
                      {(media as any[]).filter((m: any) => m.fileType === "video").map((video: any) => (
                        <div key={video.id} className="p-2 border rounded flex items-center justify-between">
                          <p className="text-sm truncate">{video.fileName}</p>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No videos uploaded</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Music className="h-5 w-5 mr-2" />
                    Audio ({(media as any[]).filter((m: any) => m.fileType === "audio").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(media as any[]).filter((m: any) => m.fileType === "audio").length > 0 ? (
                    <div className="space-y-2">
                      {(media as any[]).filter((m: any) => m.fileType === "audio").map((audio: any) => (
                        <div key={audio.id} className="p-2 border rounded flex items-center justify-between">
                          <p className="text-sm truncate">{audio.fileName}</p>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No audio files uploaded</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileDown className="h-5 w-5 mr-2" />
                    Documents ({(media as any[]).filter((m: any) => m.fileType === "document").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(media as any[]).filter((m: any) => m.fileType === "document").length > 0 ? (
                    <div className="space-y-2">
                      {(media as any[]).filter((m: any) => m.fileType === "document").map((doc: any) => (
                        <div key={doc.id} className="p-2 border rounded flex items-center justify-between">
                          <p className="text-sm truncate">{doc.fileName}</p>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No documents uploaded</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}