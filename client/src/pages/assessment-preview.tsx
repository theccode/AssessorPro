import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Building, Edit, Download, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Assessment, AssessmentSection } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

export default function AssessmentPreview({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const assessmentId = parseInt(params.id);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["/api/assessments", assessmentId],
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!assessment) {
    return <div className="min-h-screen flex items-center justify-center">Assessment not found</div>;
  }

  const overallPercentage = assessment.maxPossibleScore > 0 
    ? (assessment.overallScore / assessment.maxPossibleScore) * 100 
    : 0;

  const getStarRating = (percentage: number) => {
    if (percentage >= 91) return 5;
    if (percentage >= 76) return 4;
    if (percentage >= 51) return 3;
    if (percentage >= 26) return 2;
    return 1;
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 91) return "Excellent Performance";
    if (percentage >= 76) return "Good Performance";
    if (percentage >= 51) return "Average Performance";
    if (percentage >= 26) return "Below Average";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto" />
              <span className="ml-3 text-xl font-medium text-gray-900">GREDA-GBC Assessor Pro</span>
            </div>
            <Button variant="outline" asChild>
              <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Assessment Preview</h1>
          <p className="text-gray-600">Review your building assessment before final submission</p>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {assessment.buildingName || "Untitled Assessment"}
                </h2>
                <p className="text-gray-600 mb-4">{assessment.buildingLocation}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Assessment Date</div>
                    <div className="font-medium">
                      {new Date(assessment.updatedAt || "").toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="font-medium capitalize">{assessment.status}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <ProgressRing
                  value={overallPercentage}
                  max={100}
                  size={160}
                  strokeWidth={10}
                  className="mb-4 mx-auto"
                />
                <div className="text-lg font-medium text-gray-900">
                  {getPerformanceLevel(overallPercentage)}
                </div>
                <div className="flex justify-center mt-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < getStarRating(overallPercentage) ? "text-accent" : "text-gray-300"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {assessment.sections?.map((section: AssessmentSection) => {
            const sectionPercentage = section.maxScore > 0 ? (section.score / section.maxScore) * 100 : 0;
            const stars = getStarRating(sectionPercentage);

            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{section.sectionName}</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < stars ? "text-accent" : "text-gray-300"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(section.score || 0)}
                    </span>
                    <span className="text-gray-500">/ {Math.round(section.maxScore || 0)} max</span>
                  </div>
                  <Progress value={sectionPercentage} className="h-3 mb-3" />
                  <div className="text-sm text-gray-600">
                    {section.isCompleted ? "Completed" : "In Progress"}
                  </div>
                  
                  {/* Variables breakdown */}
                  {section.variables && typeof section.variables === 'object' && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(section.variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href={`/assessments/${assessmentId}/form`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Assessment
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button size="lg">
            <Check className="h-4 w-4 mr-2" />
            Submit Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
