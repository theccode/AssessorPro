import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Award, MapPin, User, Calendar, Building, Leaf, Star, FileText, Image, Video, Music, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface PublicAssessmentData {
  id: string;
  buildingName: string;
  buildingLocation: string;
  digitalAddress: string;
  detailedAddress: string;
  phoneNumber: string;
  additionalNotes: string;
  buildingFootprint: number;
  roomHeight: number;
  numberOfBedrooms: number;
  siteArea: number;
  numberOfWindows: number;
  numberOfDoors: number;
  averageWindowSize: number;
  numberOfFloors: number;
  totalGreenArea: number;
  overallScore: number;
  maxPossibleScore: number;
  completedSections: number;
  totalSections: number;
  assessorName: string;
  assessorRole: string;
  clientName: string;
  conductedAt: string;
  certificationType: string;
  sections: Array<{
    sectionType: string;
    score: number;
    maxScore: number;
    responses: Record<string, any>;
    notes: string;
    completedAt: string;
  }>;
  media: Array<{
    id: number;
    sectionType: string;
    fieldName: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    url: string;
  }>;
  assessorInfo: {
    name: string;
    role: string;
    email: string;
  } | null;
  clientInfo: {
    name: string;
    email: string;
  } | null;
}

export default function PublicAssessment() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: assessment, isLoading, error } = useQuery<PublicAssessmentData>({
    queryKey: ['/api/public/assessment', publicId, 'full'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The assessment you're looking for could not be found or is not available for public viewing.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            This may be because the assessment is not completed, has been archived, or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const scorePercentage = assessment.maxPossibleScore > 0 
    ? (assessment.overallScore / assessment.maxPossibleScore) * 100 
    : 0;

  const getCertificationColor = (type: string) => {
    switch (type) {
      case 'Gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      case 'Bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const sectionNames: Record<string, string> = {
    'building_information': 'Building Information',
    'site_transport': 'Site & Transport',
    'water_efficiency': 'Water Efficiency',
    'energy_efficiency': 'Energy Efficiency',
    'indoor_environmental_quality': 'Indoor Environmental Quality',
    'materials_resources': 'Materials & Resources',
    'waste_pollution': 'Waste & Pollution',
    'innovation': 'Innovation'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 text-white p-2 rounded-lg">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                GREDA Green Building Assessment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verified Sustainability Rating
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {assessment.buildingName}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{assessment.buildingLocation}</span>
              </div>
              {assessment.digitalAddress && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Digital Address: {assessment.digitalAddress}
                </p>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {assessment.overallScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                out of {assessment.maxPossibleScore}
              </div>
              <Progress 
                value={scorePercentage} 
                className="w-full mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {scorePercentage.toFixed(1)}% Score
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <Badge className={`text-lg px-4 py-2 ${getCertificationColor(assessment.certificationType)}`}>
                <Award className="w-4 h-4 mr-2" />
                {assessment.certificationType} Certified
              </Badge>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Certified on {new Date(assessment.conductedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Building Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Building Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assessment.buildingFootprint > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Building Footprint</span>
                  <p className="text-lg text-gray-900 dark:text-white">{assessment.buildingFootprint} m²</p>
                </div>
              )}
              {assessment.numberOfBedrooms > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bedrooms</span>
                  <p className="text-lg text-gray-900 dark:text-white">{assessment.numberOfBedrooms}</p>
                </div>
              )}
              {assessment.numberOfFloors > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Floors</span>
                  <p className="text-lg text-gray-900 dark:text-white">{assessment.numberOfFloors}</p>
                </div>
              )}
              {assessment.siteArea > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Site Area</span>
                  <p className="text-lg text-gray-900 dark:text-white">{assessment.siteArea} m²</p>
                </div>
              )}
              {assessment.totalGreenArea > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Green Area</span>
                  <p className="text-lg text-gray-900 dark:text-white">{assessment.totalGreenArea} m²</p>
                </div>
              )}
              {assessment.numberOfWindows > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Windows</span>
                  <p className="text-lg text-gray-900 dark:text-white">{assessment.numberOfWindows}</p>
                </div>
              )}
            </div>
            
            {assessment.additionalNotes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Notes</span>
                <p className="text-gray-900 dark:text-white mt-1">{assessment.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Assessment Breakdown
            </CardTitle>
            <CardDescription>
              Detailed scoring across all {assessment.sections.length} assessment categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessment.sections.map((section, index) => {
                const sectionPercentage = section.maxScore > 0 
                  ? (section.score / section.maxScore) * 100 
                  : 0;
                
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {sectionNames[section.sectionType] || section.sectionType}
                      </h3>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {section.score}/{section.maxScore}
                        </span>
                        <div className="text-xs text-gray-500">
                          {sectionPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={sectionPercentage} className="mb-2" />
                    {section.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {section.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Media Files */}
        {assessment.media.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Assessment Media
              </CardTitle>
              <CardDescription>
                Supporting documentation and evidence ({assessment.media.length} files)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessment.media.map((mediaItem) => (
                  <div key={mediaItem.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getFileIcon(mediaItem.mimeType)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {mediaItem.fileName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      {sectionNames[mediaItem.sectionType] || mediaItem.sectionType}
                    </div>
                    {mediaItem.mimeType.startsWith('image/') && (
                      <img 
                        src={mediaItem.url} 
                        alt={mediaItem.fileName}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(mediaItem.url, '_blank')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Assessment Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.assessorInfo && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Lead Assessor
                  </h3>
                  <p className="text-gray-900 dark:text-white">{assessment.assessorInfo.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{assessment.assessorInfo.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    {assessment.assessorInfo.role}
                  </Badge>
                </div>
              )}
              
              {assessment.clientInfo && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Property Owner
                  </h3>
                  <p className="text-gray-900 dark:text-white">{assessment.clientInfo.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{assessment.clientInfo.email}</p>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Assessment conducted on {new Date(assessment.conductedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
            <Leaf className="w-5 h-5" />
            <span className="font-semibold">GREDA Green Building Council</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This assessment is verified and certified by GREDA Green Building Council
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            For more information, visit www.greda.org
          </p>
        </div>
      </div>
    </div>
  );
}