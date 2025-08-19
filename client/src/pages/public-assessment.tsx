import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  MapPin, 
  Calendar, 
  User, 
  Award,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileDown,
  Star
} from "lucide-react";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface PublicAssessmentData {
  assessment: {
    id: number;
    publicId: string;
    buildingName: string;
    buildingLocation: string;
    digitalAddress: string;
    phoneNumber: string;
    additionalNotes: string;
    overallScore: number;
    maxPossibleScore: number;
    status: string;
    conductedAt: string;
    assessorName: string;
    clientName: string;
    buildingFootprint: number;
    roomHeight: number;
    numberOfBedrooms: number;
    siteArea: number;
    numberOfWindows: number;
    numberOfDoors: number;
    averageWindowSize: number;
    numberOfFloors: number;
    totalGreenArea: number;
  };
  sections: Array<{
    id: number;
    sectionName: string;
    score: number;
    maxScore: number;
    variables: Array<{
      variableName: string;
      value: any;
      score: number;
      maxScore: number;
    }>;
  }>;
  media: Array<{
    id: number;
    sectionName: string;
    variableName: string;
    fileName: string;
    fileType: string;
  }>;
}

export function PublicAssessment() {
  const [match, params] = useRoute("/public/assessment/:publicId");
  
  console.log("PublicAssessment component rendered", { match, params });
  
  const { data, isLoading, error } = useQuery<PublicAssessmentData>({
    queryKey: [`/api/public/assessment/${params?.publicId}/full`],
    enabled: !!params?.publicId,
  });

  console.log("Query state:", { data, isLoading, error, publicId: params?.publicId });

  const getCertificationType = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return { type: 'Gold', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (percentage >= 60) return { type: 'Silver', color: 'bg-gray-400', textColor: 'text-gray-700' };
    if (percentage >= 40) return { type: 'Bronze', color: 'bg-amber-600', textColor: 'text-amber-700' };
    return { type: 'Basic', color: 'bg-green-600', textColor: 'text-green-700' };
  };

  const getMediaIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileDown className="h-4 w-4" />;
  };

  const formatVariableName = (name: string): string => {
    if (!name || name === 'General') return 'Document Upload';
    
    let readable = name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
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
    };
    
    return mappings[readable] || readable;
  };

  const formatSectionName = (sectionName: string): string => {
    const mappings: Record<string, string> = {
      'site-transport': 'Site & Transportation',
      'water-efficiency': 'Water Efficiency', 
      'energy-efficiency': 'Energy Efficiency',
      'materials-resources': 'Materials & Resources',
      'indoor-environmental-quality': 'Indoor Environmental Quality',
      'innovation': 'Innovation',
      'waste-pollution': 'Waste & Pollution',
      'regional-priority': 'Regional Priority'
    };
    
    return mappings[sectionName] || sectionName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading assessment data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    console.error("Error loading public assessment:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">
              The assessment you're looking for could not be found or is not publicly available.
            </p>
            {error && (
              <p className="text-center text-sm text-red-500 mt-2">
                Error: {error.message || "Unknown error"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!params?.publicId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">
              No assessment ID provided in the URL.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assessment, sections, media } = data;
  const certification = getCertificationType(assessment.overallScore, assessment.maxPossibleScore);
  const scorePercentage = (assessment.overallScore / assessment.maxPossibleScore) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Green Building Assessment Report</h1>
                <p className="text-gray-600">Detailed assessment data for {assessment.buildingName}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${certification.color} text-white text-lg px-4 py-2`}>
                {certification.type}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Certification Level</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Building Overview */}
        <Card className="shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center space-x-2 text-xl text-gray-900">
              <Building className="h-6 w-6 text-green-600" />
              <span>Building Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">Building Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-600" />
                      <div>
                        <span className="text-sm text-gray-600">Building Name:</span>
                        <p className="font-medium text-gray-900">{assessment.buildingName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <div>
                        <span className="text-sm text-gray-600">Location:</span>
                        <p className="font-medium text-gray-900">{assessment.buildingLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <span className="text-sm text-gray-600">Digital Address:</span>
                        <p className="font-medium text-gray-900">{assessment.digitalAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <div>
                        <span className="text-sm text-gray-600">Assessment Date:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(assessment.conductedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <span className="text-sm text-gray-600">Conducted by:</span>
                        <p className="font-medium text-gray-900">{assessment.assessorName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">Overall Score</h3>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {assessment.overallScore}/{assessment.maxPossibleScore}
                    </div>
                    <div className="text-lg text-gray-700 mb-4">
                      {scorePercentage.toFixed(1)}% Score
                    </div>
                    <Progress value={scorePercentage} className="w-full h-3" />
                    <Badge className={`${certification.color} text-white mt-4`}>
                      <Award className="h-4 w-4 mr-1" />
                      {certification.type} Certification
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {assessment.additionalNotes && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{assessment.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Building Specifications */}
        {(assessment.buildingFootprint > 0 || assessment.siteArea > 0 || assessment.numberOfBedrooms > 0) && (
          <Card className="shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center space-x-2 text-xl text-gray-900">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span>Building Specifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {assessment.buildingFootprint > 0 && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessment.buildingFootprint}</div>
                    <div className="text-sm text-gray-600">Building Footprint (m²)</div>
                  </div>
                )}
                {assessment.siteArea > 0 && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessment.siteArea}</div>
                    <div className="text-sm text-gray-600">Site Area (m²)</div>
                  </div>
                )}
                {assessment.numberOfBedrooms > 0 && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessment.numberOfBedrooms}</div>
                    <div className="text-sm text-gray-600">Number of Bedrooms</div>
                  </div>
                )}
                {assessment.numberOfFloors > 0 && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessment.numberOfFloors}</div>
                    <div className="text-sm text-gray-600">Number of Floors</div>
                  </div>
                )}
                {assessment.totalGreenArea > 0 && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessment.totalGreenArea}</div>
                    <div className="text-sm text-gray-600">Green Area (m²)</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment Scores by Category */}
        <Card className="shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center space-x-2 text-xl text-gray-900">
              <Star className="h-6 w-6 text-green-600" />
              <span>Detailed Scores by Assessment Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {sections.map((section) => {
                const sectionPercentage = section.maxScore > 0 ? (section.score / section.maxScore) * 100 : 0;
                return (
                  <div key={section.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {formatSectionName(section.sectionName)}
                      </h3>
                      <Badge variant="outline" className="text-gray-700">
                        {section.score}/{section.maxScore}
                      </Badge>
                    </div>
                    <Progress value={sectionPercentage} className="h-2 mb-2" />
                    <p className="text-sm text-gray-600">{sectionPercentage.toFixed(1)}% achieved</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Supporting Documentation */}
        {media.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center space-x-2 text-xl text-gray-900">
                <FileText className="h-6 w-6 text-purple-600" />
                <span>Supporting Documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Media files and documentation from the assessment
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3 mb-2">
                      {getMediaIcon(item.fileType)}
                      <span className="font-medium text-gray-900 truncate">{item.fileName}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Section:</span> {formatSectionName(item.sectionName)}
                      </p>
                      {item.variableName && item.variableName !== 'General' && (
                        <p className="text-gray-600">
                          <span className="font-medium">Category:</span> {formatVariableName(item.variableName)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-gray-900">GREDA-GBC Assessment Platform</span>
          </div>
          <p className="text-gray-600">
            This assessment was conducted using the GREDA Green Building Certification standards.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Generated on {new Date().toLocaleDateString()} • Assessment ID: {assessment.publicId}
          </p>
        </div>
      </div>
    </div>
  );
}