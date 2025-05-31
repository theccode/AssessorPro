import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart
} from "lucide-react";
import { Link } from "wouter";
import type { Assessment, AssessmentSection, AssessmentMedia } from "@shared/schema";

export default function AssessmentDetail({ params }: { params: { id: string } }) {
  const assessmentId = parseInt(params.id);
  const [selectedSection, setSelectedSection] = useState("building-information");

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["/api/assessments", assessmentId],
  });

  const { data: media = [] } = useQuery({
    queryKey: ["/api/assessments", assessmentId, "media"],
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!assessment) {
    return <div className="min-h-screen flex items-center justify-center">Assessment not found</div>;
  }

  const sectionMedia = media.filter((m: AssessmentMedia) => m.sectionType === selectedSection);
  const images = sectionMedia.filter((m: AssessmentMedia) => m.fileType === "image");
  const videos = sectionMedia.filter((m: AssessmentMedia) => m.fileType === "video");
  const audios = sectionMedia.filter((m: AssessmentMedia) => m.fileType === "audio");
  const documents = sectionMedia.filter((m: AssessmentMedia) => m.fileType === "document");

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image": return <ImageIcon className="h-5 w-5" />;
      case "video": return <Video className="h-5 w-5" />;
      case "audio": return <Music className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-medium text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" size="sm">
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
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <Link href="/assessments" className="hover:text-primary">Assessments</Link>
          <span>/</span>
          <span className="text-gray-900">{assessment.buildingName || "Assessment Details"}</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {assessment.buildingName || "GREDA-GBC Assessment"}
              </h1>
              <div className="flex items-center space-x-4">
                <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
                  {assessment.status}
                </Badge>
                <span className="text-muted-foreground">
                  Last updated: {new Date(assessment.updatedAt || "").toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(assessment.overallScore || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
              <div className="text-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor((assessment.overallScore || 0) / 20)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>
        </div>

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
              Variables
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>

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
                        {assessment.buildingName || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                      <div className="p-3 bg-secondary rounded-lg text-foreground">
                        {assessment.buildingLocation || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Assessment Date</label>
                      <div className="p-3 bg-secondary rounded-lg text-foreground">
                        {new Date(assessment.createdAt || "").toLocaleDateString()}
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
                      <span className="text-2xl font-bold text-primary">{Math.round(assessment.overallScore || 0)}/130</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completion Status</span>
                      <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
                        {assessment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sections Completed</span>
                      <span className="font-medium">{assessment.completedSections || 0}/{assessment.totalSections || 8}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">GREDA-GBC Rating</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor((assessment.overallScore || 0) / 26)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {assessment.sections?.map((section: AssessmentSection) => (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{section.sectionName}</span>
                          <span className="text-sm text-muted-foreground">
                            {section.score || 0}/{section.maxScore || 0}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(((section.score || 0) / (section.maxScore || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Certification Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">GREDA-GBC Certification</span>
                        <Badge variant="outline">
                          {assessment.overallScore && assessment.overallScore >= 100 ? "Eligible" : "In Progress"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Minimum 100 credits required for certification
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Environmental Impact</span>
                        <span className="text-primary font-medium">
                          {Math.round((assessment.overallScore || 0) / 130 * 100)}%
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

          <TabsContent value="variables" className="mt-6">
            <div className="space-y-6">
              {assessment.sections?.map((section: AssessmentSection) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{section.sectionName}</span>
                      <Badge variant="outline">
                        {section.score || 0}/{section.maxScore || 0} credits
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.variables ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(section.variables).map(([key, value]) => (
                            <div key={key} className="p-3 border rounded-lg">
                              <div className="text-sm font-medium text-muted-foreground mb-1">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </div>
                              <div className="text-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No variable data available for this section.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Images ({media.filter((m: any) => m.fileType === "image").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {media.filter((m: any) => m.fileType === "image").length > 0 ? (
                    <div className="space-y-2">
                      {media.filter((m: any) => m.fileType === "image").map((image: any) => (
                        <div key={image.id} className="p-2 border rounded">
                          <p className="text-sm truncate">{image.fileName}</p>
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
                    Videos ({media.filter((m: any) => m.fileType === "video").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {media.filter((m: any) => m.fileType === "video").length > 0 ? (
                    <div className="space-y-2">
                      {media.filter((m: any) => m.fileType === "video").map((video: any) => (
                        <div key={video.id} className="p-2 border rounded">
                          <p className="text-sm truncate">{video.fileName}</p>
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
                    Audio ({media.filter((m: any) => m.fileType === "audio").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {media.filter((m: any) => m.fileType === "audio").length > 0 ? (
                    <div className="space-y-2">
                      {media.filter((m: any) => m.fileType === "audio").map((audio: any) => (
                        <div key={audio.id} className="p-2 border rounded">
                          <p className="text-sm truncate">{audio.fileName}</p>
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
                    Documents ({media.filter((m: any) => m.fileType === "document").length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {media.filter((m: any) => m.fileType === "document").length > 0 ? (
                    <div className="space-y-2">
                      {media.filter((m: any) => m.fileType === "document").map((doc: any) => (
                        <div key={doc.id} className="p-2 border rounded">
                          <p className="text-sm truncate">{doc.fileName}</p>
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

              {assessment.sections?.map((section: AssessmentSection) => (
                <TabsContent key={section.id} value={section.sectionType}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{section.sectionName}</span>
                        <Badge variant={section.isCompleted ? "default" : "secondary"}>
                          {section.isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-medium">Section Score</span>
                          <span className="text-2xl font-bold text-primary">
                            {Math.round(section.score || 0)} / {Math.round(section.maxScore || 0)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Performance: {section.maxScore > 0 ? Math.round((section.score / section.maxScore) * 100) : 0}%
                        </div>
                      </div>

                      {/* Variables */}
                      {section.variables && typeof section.variables === 'object' && (
                        <div className="mb-6">
                          <h4 className="text-lg font-medium mb-4">Variable Scores</h4>
                          <div className="space-y-3">
                            {Object.entries(section.variables).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-lg font-semibold text-primary">{value as number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Media Gallery Section */}
            {sectionMedia.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Supporting Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Images */}
                  {images.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium mb-4">Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image: AssessmentMedia) => (
                          <div key={image.id} className="relative group cursor-pointer">
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                              <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                                View
                              </Button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">{image.fileName}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {documents.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium mb-4">Documents</h4>
                      <div className="space-y-3">
                        {documents.map((doc: AssessmentMedia) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(doc.fileType)}
                              <div>
                                <div className="font-medium text-gray-900">{doc.fileName}</div>
                                <div className="text-sm text-gray-500">
                                  {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "Unknown size"}
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos and Audio */}
                  {(videos.length > 0 || audios.length > 0) && (
                    <div>
                      <h4 className="text-lg font-medium mb-4">Media Files</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((video: AssessmentMedia) => (
                          <div key={video.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{video.fileName}</span>
                              <Video className="h-5 w-5 text-primary" />
                            </div>
                            <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-3">
                              <Button variant="outline" size="sm">
                                <Video className="h-4 w-4 mr-2" />
                                Play Video
                              </Button>
                            </div>
                          </div>
                        ))}
                        {audios.map((audio: AssessmentMedia) => (
                          <div key={audio.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{audio.fileName}</span>
                              <Music className="h-5 w-5 text-secondary" />
                            </div>
                            <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-3">
                              <Button variant="outline" size="sm">
                                <Music className="h-4 w-4 mr-2" />
                                Play Audio
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Export Options */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
