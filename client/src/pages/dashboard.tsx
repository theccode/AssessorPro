import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import Header from "@/components/Header";
import { Building, Plus, FileText, Users, BarChart3, Star, Lock, Unlock } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  // Debug logging to see what assessments are being loaded
  console.log('Dashboard assessments data:', assessments);

  // Lock/unlock assessment mutation
  const lockMutation = useMutation({
    mutationFn: async ({ assessmentId, isLocked }: { assessmentId: number; isLocked: boolean }) => {
      const response = await apiRequest(`/api/assessments/${assessmentId}/lock`, "PATCH", { isLocked });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  // Only show completed/submitted assessments on dashboard
  const completedAssessments = (assessments as Assessment[]).filter((a: Assessment) => 
    a.status === "completed" || a.status === "submitted"
  );
  const recentAssessments = completedAssessments.slice(0, 5);
  const completedThisMonth = (assessments as Assessment[]).filter((a: Assessment) => 
    a.status === "completed" && new Date(a.updatedAt || "").getMonth() === new Date().getMonth()
  ).length;
  const draftAssessments = (assessments as Assessment[]).filter((a: Assessment) => a.status === "draft").length;
  const averageScore = completedAssessments.length > 0 
    ? completedAssessments.reduce((sum: number, a: Assessment) => sum + (a.overallScore || 0), 0) / completedAssessments.length 
    : 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {(user as any)?.role === "client" 
              ? `Welcome ${(user as any)?.firstName || "Client"} - GREDA Reports Dashboard` 
              : "GREDA Green Building Assessment Dashboard"
            }
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {(user as any)?.role === "client" 
              ? "View your building sustainability assessments, download reports, and track certification progress with comprehensive GREDA-GBC performance analytics"
              : "Manage sustainable building evaluations with comprehensive GREDA-GBC certification tracking and environmental performance reporting"
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {(user as any)?.role === "client" ? "My Assessments" : "Quick Stats"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {(user as any)?.role === "client" ? completedAssessments.length : (assessments as Assessment[]).length}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {(user as any)?.role === "client" ? "Completed Reports" : "Total Projects"}
                  </p>
                </div>
                <Building className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {(user as any)?.role === "client" ? "Avg. Score" : "This Month"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {(user as any)?.role === "client" 
                      ? `${averageScore.toFixed(1)}%` 
                      : completedThisMonth
                    }
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {(user as any)?.role === "client" ? "Sustainability Rating" : "Completed"}
                  </p>
                </div>
                {(user as any)?.role === "client" ? (
                  <ProgressRing value={averageScore} max={100} size={32} strokeWidth={3} />
                ) : (
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {((user as any)?.role === "admin" || (user as any)?.role === "assessor") && (
                  <Button asChild size="sm" className="w-full">
                    <Link href="/assessments/select-client">
                      <Plus className="h-4 w-4 mr-2" />
                      New Assessment
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild size="sm" className="w-full">
                  <Link href="/reports">
                    <FileText className="h-4 w-4 mr-2" />
                    {(user as any)?.role === "client" ? "View Reports" : "All Reports"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        {recentAssessments.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                {(user as any)?.role === "client" ? "Recent Reports" : "Recent Assessments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssessments.map((assessment: Assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-medium text-foreground">{assessment.buildingName}</h3>
                      <p className="text-sm text-muted-foreground">{assessment.buildingLocation || "No location specified"}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {assessment.status}
                        </span>
                        {assessment.overallScore && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{assessment.overallScore}%</span>
                          </div>
                        )}
                        {assessment.isLocked && (
                          <div className="flex items-center">
                            <Lock className="h-3 w-3 text-red-500 mr-1" />
                            <span className="text-xs text-red-600">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(user as any)?.role === "admin" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => lockMutation.mutate({ 
                            assessmentId: assessment.id, 
                            isLocked: !assessment.isLocked 
                          })}
                          disabled={lockMutation.isPending}
                        >
                          {assessment.isLocked ? (
                            <Unlock className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/assessment/${assessment.publicId}`} 
                              onClick={() => console.log('Clicking View Details for:', { 
                                id: assessment.id, 
                                buildingName: assessment.buildingName, 
                                publicId: assessment.publicId,
                                url: `/assessment/${assessment.publicId}`
                              })}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(assessments as Assessment[]).length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {(user as any)?.role === "client" ? "No Assessments Yet" : "Ready to Start"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {(user as any)?.role === "client" 
                  ? "Your sustainability assessments will appear here once they're completed."
                  : "Create your first building assessment to get started with GREDA-GBC certification."
                }
              </p>
              {((user as any)?.role === "admin" || (user as any)?.role === "assessor") && (
                <Button asChild>
                  <Link href="/assessments/select-client">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}