import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { 
  ClipboardList, 
  FileText, 
  BarChart3, 
  Download, 
  Eye, 
  Plus, 
  Calendar,
  TrendingUp,
  Users,
  Activity,
  ArrowLeft,
  Lock,
  Unlock
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AssessorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");

  // Fetch assessments data
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessments"],
    retry: false,
  });

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

  // Calculate analytics data
  const totalAssessments = assessments.length;
  const completedAssessments = assessments.filter((a: any) => a.status === "completed").length;
  const draftAssessments = assessments.filter((a: any) => a.status === "draft").length;
  const inProgressAssessments = assessments.filter((a: any) => a.status === "in_progress").length;

  // Recent assessments for quick access
  const recentAssessments = assessments
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "draft": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assessor Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {(user as any)?.firstName || (user as any)?.email}! Create assessments, manage reports, and view analytics.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalAssessments}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{completedAssessments}</div>
                <p className="text-xs text-muted-foreground">Ready for review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{inProgressAssessments}</div>
                <p className="text-xs text-muted-foreground">Active assessments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{draftAssessments}</div>
                <p className="text-xs text-muted-foreground">Saved drafts</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for efficient workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button asChild className="h-auto p-4">
                  <Link href="/assessments/select-client">
                    <div className="flex flex-col items-center gap-2">
                      <Plus className="h-6 w-6" />
                      <span>New Assessment</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link href="/drafts">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-6 w-6" />
                      <span>View Drafts</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link href="/reports">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>View Reports</span>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest assessment activity</CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="text-center py-4">Loading assessments...</div>
              ) : recentAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assessments yet. Create your first assessment to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssessments.map((assessment: any) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{assessment.buildingName || "Unnamed Building"}</p>
                        <p className="text-sm text-muted-foreground">
                          Updated {new Date(assessment.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status.replace('_', ' ')}
                        </Badge>
                        {assessment.isLocked && (
                          <div className="flex items-center">
                            <Lock className="h-3 w-3 text-red-500 mr-1" />
                            <span className="text-xs text-red-600">Locked</span>
                          </div>
                        )}
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
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/assessments/${assessment.id}/preview`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Management</CardTitle>
              <CardDescription>Create, view, and manage all your building assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                    <Link href="/assessments/select-client">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Assessment
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/drafts">
                      <FileText className="w-4 h-4 mr-2" />
                      View Draft Assessments
                    </Link>
                  </Button>
                </div>

                {/* Assessment List */}
                {assessmentsLoading ? (
                  <div className="text-center py-8">Loading assessments...</div>
                ) : assessments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No assessments found</p>
                    <p className="text-sm">Create your first assessment to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assessments.map((assessment: any) => (
                      <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{assessment.buildingName || "Unnamed Building"}</CardTitle>
                            <Badge className={getStatusColor(assessment.status)}>
                              {assessment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <p>Publisher: {assessment.publisherName || "Not specified"}</p>
                            <p>Updated: {new Date(assessment.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/assessments/${assessment.id}/preview`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            {assessment.status !== "completed" && (
                              <Button size="sm" asChild>
                                <Link href={`/assessments/${assessment.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Downloads</CardTitle>
              <CardDescription>View and download assessment reports and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button asChild>
                  <Link href="/reports">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View All Reports
                  </Link>
                </Button>

                {/* Completed Assessments Available for Reports */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Available Reports</h4>
                  {assessments.filter((a: any) => a.status === "completed").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No completed assessments available for reports</p>
                      <p className="text-sm">Complete assessments to generate reports</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {assessments
                        .filter((a: any) => a.status === "completed")
                        .slice(0, 5)
                        .map((assessment: any) => (
                          <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">{assessment.buildingName || "Unnamed Building"}</p>
                              <p className="text-sm text-muted-foreground">
                                Completed: {new Date(assessment.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/assessments/${assessment.id}/preview`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Analytics</CardTitle>
              <CardDescription>Insights and trends from your assessment work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Of all assessments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {completedAssessments > 0 ? "B+" : "N/A"}
                      </div>
                      <p className="text-sm text-muted-foreground">Completed assessments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {assessments.filter((a: any) => {
                          const assessmentDate = new Date(a.createdAt);
                          const now = new Date();
                          return assessmentDate.getMonth() === now.getMonth() && 
                                 assessmentDate.getFullYear() === now.getFullYear();
                        }).length}
                      </div>
                      <p className="text-sm text-muted-foreground">New assessments</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Trends */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Recent Activity</h4>
                  <div className="space-y-2">
                    {assessments.length > 0 ? (
                      assessments.slice(0, 5).map((assessment: any) => (
                        <div key={assessment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {assessment.status === "completed" ? "Completed" : "Updated"} assessment for {assessment.buildingName || "Unnamed Building"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(assessment.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No activity data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}