import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, Edit, FileText, User } from "lucide-react";
import { Link } from "wouter";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface Assessment {
  id: number;
  buildingName?: string;
  publisherName?: string;
  buildingLocation?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedSections: number;
  totalSections: number;
  overallScore?: number;
}

export default function Drafts() {
  const { user } = useAuth();
  
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  // Filter only draft assessments
  const draftAssessments = assessments.filter((a: Assessment) => a.status === "draft");

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Logo" className="h-8 w-8 mr-3" />
              <span className="text-xl font-semibold text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/assessments">
                <Button variant="ghost">Assessments</Button>
              </Link>
              <Link href="/drafts">
                <Button variant="default">Drafts</Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <Link href="/api/logout">
                <Button variant="outline">Logout</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Draft Assessments</h1>
          <p className="text-muted-foreground mt-2">
            Continue working on your assessments in progress
          </p>
        </div>

        {/* Draft Assessments */}
        {draftAssessments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Draft Assessments</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any assessments in progress. Start a new assessment to begin.
              </p>
              <Link href="/assessments/select-client">
                <Button>
                  <Building className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftAssessments.map((assessment: Assessment) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {assessment.buildingName || "Untitled Assessment"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <CardDescription>
                          {assessment.publisherName || "Unknown Client"}
                        </CardDescription>
                      </div>
                      {assessment.buildingLocation && (
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <CardDescription>{assessment.buildingLocation}</CardDescription>
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{assessment.completedSections || 0}/{assessment.totalSections || 8}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${((assessment.completedSections || 0) / (assessment.totalSections || 8)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Updated {new Date(assessment.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/assessments/new?id=${assessment.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </Link>
                      <Link href={`/assessments/${assessment.id}/preview`}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}