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
  FileDown
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
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-medium text-gray-900">BuildAssess Pro</span>
            </div>
            <Button variant="outline" asChild>
              <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
            </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Details</h1>
          <div className="flex items-center space-x-4">
            <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
              {assessment.status}
            </Badge>
            <span className="text-gray-500">
              Last updated: {new Date(assessment.updatedAt || "").toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Section Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <Button
                    variant={selectedSection === "building-information" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedSection("building-information")}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Building Information
                  </Button>
                  {assessment.sections?.map((section: AssessmentSection) => (
                    <Button
                      key={section.id}
                      variant={selectedSection === section.sectionType ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedSection(section.sectionType)}
                    >
                      {getFileIcon("document")}
                      <span className="ml-2 text-sm">{section.sectionName}</span>
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={selectedSection} onValueChange={setSelectedSection}>
              <TabsContent value="building-information">
                <Card>
                  <CardHeader>
                    <CardTitle>Building Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {assessment.buildingName || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Publisher Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {assessment.publisherName || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Building Location</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {assessment.buildingLocation || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {assessment.detailedAddress || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {assessment.phoneNumber || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {new Date(assessment.createdAt || "").toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {assessment.additionalNotes && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                          {assessment.additionalNotes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

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
