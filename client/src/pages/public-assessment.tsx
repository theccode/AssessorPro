import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, User, Calendar, Award, FileText, Image, Video, Music, File } from "lucide-react";
import { useState } from "react";

interface AssessmentMedia {
  id: number;
  sectionType: string;
  fieldName: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  url: string;
}

interface AssessmentSection {
  sectionType: string;
  score: number;
  maxScore: number;
  responses: any;
  notes: string | null;
  completedAt: string | null;
}

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
  sections: AssessmentSection[];
  media: AssessmentMedia[];
  certificationType: string;
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

const sectionDisplayNames: Record<string, string> = {
  'site-transport': 'Site & Transportation',
  'water-efficiency': 'Water Efficiency',
  'energy-efficiency': 'Energy Efficiency',
  'materials-resources': 'Materials & Resources',
  'indoor-quality': 'Indoor Environmental Quality',
  'innovation': 'Innovation & Design',
  'regional-priority': 'Regional Priority',
  'integrative-process': 'Integrative Process'
};

const getCertificationColor = (type: string) => {
  switch (type) {
    case 'Gold': return 'bg-yellow-500';
    case 'Silver': return 'bg-gray-400';
    case 'Bronze': return 'bg-amber-600';
    default: return 'bg-green-600';
  }
};

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith('image/')) return Image;
  if (mimeType?.startsWith('video/')) return Video;
  if (mimeType?.startsWith('audio/')) return Music;
  return File;
};

export function PublicAssessment() {
  const [, params] = useRoute("/public/assessment/:publicId");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const { data: assessment, isLoading, error } = useQuery<PublicAssessmentData>({
    queryKey: [`/api/public/assessment/${params?.publicId}/full`],
    enabled: !!params?.publicId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              The assessment you're looking for is not available or may have been archived.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = Math.round((assessment.overallScore / assessment.maxPossibleScore) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Green Building Assessment Report
          </h1>
          <p className="text-gray-700 text-lg">
            Detailed assessment data for {assessment.buildingName}
          </p>
        </div>

        {/* Overview Card */}
        <Card className="bg-white/90 backdrop-blur border shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-gray-900">
                  <Building2 className="w-6 h-6 text-green-600" />
                  {assessment.buildingName}
                </CardTitle>
                {assessment.buildingLocation && (
                  <p className="flex items-center gap-2 text-gray-700 mt-1">
                    <MapPin className="w-4 h-4" />
                    {assessment.buildingLocation}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {assessment.overallScore}/{assessment.maxPossibleScore}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    {completionPercentage}% Score
                  </div>
                </div>
                <Badge className={`${getCertificationColor(assessment.certificationType)} text-white px-3 py-1`}>
                  <Award className="w-4 h-4 mr-1" />
                  {assessment.certificationType}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {assessment.digitalAddress && (
                <div>
                  <span className="font-medium text-gray-900">Digital Address:</span>
                  <p className="text-gray-700">{assessment.digitalAddress}</p>
                </div>
              )}
              {assessment.phoneNumber && (
                <div>
                  <span className="font-medium text-gray-900">Contact:</span>
                  <p className="text-gray-700">{assessment.phoneNumber}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-900">Assessed by:</span>
                <p className="text-gray-700 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {assessment.assessorName}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-900">Assessment Date:</span>
                <p className="text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(assessment.conductedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Building Specifications */}
        {(assessment.buildingFootprint > 0 || assessment.siteArea > 0 || assessment.numberOfBedrooms > 0) && (
          <Card className="bg-white/90 backdrop-blur border shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Building Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                {assessment.buildingFootprint > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Footprint:</span>
                    <p className="text-gray-700">{assessment.buildingFootprint} m²</p>
                  </div>
                )}
                {assessment.siteArea > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Site Area:</span>
                    <p className="text-gray-700">{assessment.siteArea} m²</p>
                  </div>
                )}
                {assessment.numberOfBedrooms > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Bedrooms:</span>
                    <p className="text-gray-700">{assessment.numberOfBedrooms}</p>
                  </div>
                )}
                {assessment.numberOfFloors > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Floors:</span>
                    <p className="text-gray-700">{assessment.numberOfFloors}</p>
                  </div>
                )}
                {assessment.numberOfWindows > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Windows:</span>
                    <p className="text-gray-700">{assessment.numberOfWindows}</p>
                  </div>
                )}
                {assessment.numberOfDoors > 0 && (
                  <div>
                    <span className="font-medium text-gray-900">Doors:</span>
                    <p className="text-gray-700">{assessment.numberOfDoors}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment Sections */}
        <Card className="bg-white/90 backdrop-blur border shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Assessment Breakdown</CardTitle>
            <p className="text-gray-700">
              Detailed scores by assessment category
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.sections.map((section, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSection(selectedSection === section.sectionType ? null : section.sectionType)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">
                      {sectionDisplayNames[section.sectionType] || section.sectionType}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-gray-900 border-gray-300">
                        {section.score}/{section.maxScore}
                      </Badge>
                      {section.score > 0 && (
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${(section.score / section.maxScore) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedSection === section.sectionType && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {section.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1 text-gray-900">Notes:</p>
                          <p className="text-sm text-gray-700">{section.notes}</p>
                        </div>
                      )}
                      
                      {section.responses && Object.keys(section.responses).length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-2 text-gray-900">Assessment Details:</p>
                          <div className="space-y-1">
                            {Object.entries(section.responses).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium text-gray-900">{key.replace(/_/g, ' ')}:</span>
                                <span className="ml-2 text-gray-700">
                                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {section.completedAt && (
                        <p className="text-xs text-gray-600">
                          Completed: {new Date(section.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Media Files */}
        {assessment.media.length > 0 && (
          <Card className="bg-white/90 backdrop-blur border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5" />
                Supporting Documentation
              </CardTitle>
              <p className="text-gray-700">
                Media files and documentation from the assessment
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {assessment.media.map((mediaItem) => {
                  const IconComponent = getFileIcon(mediaItem.mimeType);
                  return (
                    <div
                      key={mediaItem.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-700">
                          {sectionDisplayNames[mediaItem.sectionType] || mediaItem.sectionType}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate text-gray-900" title={mediaItem.fileName}>
                        {mediaItem.fileName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {mediaItem.fileType.toUpperCase()}
                      </p>
                      <a
                        href={mediaItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline mt-1 block font-medium"
                      >
                        View File
                      </a>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        {assessment.additionalNotes && (
          <Card className="bg-white/90 backdrop-blur border shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {assessment.additionalNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-sm text-gray-700">
          <Separator className="mb-4 bg-gray-300" />
          <p className="font-medium">This assessment report was generated by the GREDA Green Building Certification system.</p>
          <p className="mt-1">
            For more information about green building certification, contact us at{' '}
            {assessment.assessorInfo && (
              <span className="font-medium text-gray-900">{assessment.assessorInfo.email}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}