import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
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
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function AssessorDashboard() {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");

  // Fetch assessments data
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessments"],
    retry: false,
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
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assessor Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {user?.firstName || user?.email}! View assessment analytics and insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>



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
  );
}