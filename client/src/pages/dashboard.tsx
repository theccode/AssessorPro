import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Building, Plus, FileText, Users, BarChart3, LogOut } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/assessments", {
        buildingName: "New Assessment",
        status: "draft",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  const recentAssessments = assessments.slice(0, 5);
  const completedThisMonth = assessments.filter((a: Assessment) => 
    a.status === "completed" && new Date(a.updatedAt || "").getMonth() === new Date().getMonth()
  ).length;
  const draftAssessments = assessments.filter((a: Assessment) => a.status === "draft").length;
  const averageScore = assessments.length > 0 
    ? assessments.reduce((sum: number, a: Assessment) => sum + (a.overallScore || 0), 0) / assessments.length 
    : 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/assessments" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                Assessments
              </Link>
              <Link href="/reports" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                Reports
              </Link>
              {user?.role === "admin" && (
                <Link href="/users" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium">
                  Users
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 capitalize">{user?.role}</span>
              <Button variant="ghost" size="sm" asChild>
                <a href="/api/logout">
                  <LogOut className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Dashboard</h1>
          <p className="text-gray-600">Manage your building assessments with comprehensive tracking and reporting tools</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Assessments</span>
                <span className="font-semibold text-primary">{assessments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed This Month</span>
                <span className="font-semibold text-secondary">{completedThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Draft Assessments</span>
                <span className="font-semibold text-accent">{draftAssessments}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAssessments.length > 0 ? (
                recentAssessments.map((assessment: Assessment) => (
                  <div key={assessment.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      assessment.status === "completed" ? "bg-secondary" :
                      assessment.status === "draft" ? "bg-accent" : "bg-primary"
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{assessment.buildingName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(assessment.updatedAt || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <ProgressRing 
                  value={averageScore} 
                  max={100} 
                  size={128}
                  strokeWidth={8}
                  className="mb-4"
                />
                <p className="text-center text-gray-600 text-sm">Average Assessment Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            onClick={() => createAssessmentMutation.mutate()}
            disabled={createAssessmentMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
          <Button variant="outline" size="lg">
            <FileText className="h-4 w-4 mr-2" />
            View All Reports
          </Button>
        </div>

        {/* Recent Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length > 0 ? (
              <div className="space-y-4">
                {assessments.map((assessment: Assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {assessment.buildingName || "Untitled Assessment"}
                      </h3>
                      <p className="text-sm text-gray-500">{assessment.buildingLocation}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assessment.status === "completed" 
                            ? "bg-green-100 text-green-800"
                            : assessment.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {assessment.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {assessment.completedSections}/{assessment.totalSections} sections
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary">
                          {Math.round(assessment.overallScore || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          /{Math.round(assessment.maxPossibleScore || 100)}
                        </div>
                      </div>
                      <Progress 
                        value={((assessment.overallScore || 0) / (assessment.maxPossibleScore || 100)) * 100} 
                        className="w-20"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/assessments/${assessment.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first building assessment</p>
                <Button onClick={() => createAssessmentMutation.mutate()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
