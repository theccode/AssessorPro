import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, FileText, Download, Calendar, Star } from "lucide-react";
import { Link } from "wouter";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

export default function Reports() {
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter assessments based on user role
  const filteredAssessments = assessments?.filter((assessment: any) => {
    if (user?.role === "client") {
      return assessment.clientId === user.id;
    }
    return true; // Admins and assessors can see all
  }) || [];

  const completedAssessments = filteredAssessments.filter((a: any) => a.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src={gredaLogo} alt="GREDA-GBC" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment Reports</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.role === "client" ? "Your building assessment reports" : "All assessment reports"}
                </p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedAssessments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedAssessments.length > 0
                  ? Math.round(
                      completedAssessments.reduce((sum: number, a: any) => sum + (a.overallScore || 0), 0) /
                      completedAssessments.length
                    )
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedAssessments.filter((a: any) => {
                  const assessmentDate = new Date(a.conductedAt || a.createdAt);
                  const now = new Date();
                  return assessmentDate.getMonth() === now.getMonth() && 
                         assessmentDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Assessment Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedAssessments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No completed reports
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.role === "client" 
                    ? "You don't have any completed assessment reports yet."
                    : "No completed assessment reports available."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedAssessments.map((assessment: any) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {assessment.buildingName || "Unnamed Building"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {assessment.buildingLocation || "No location specified"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Score: {assessment.overallScore || 0}/{assessment.maxPossibleScore || 130}</span>
                        <span>
                          {assessment.maxPossibleScore > 0
                            ? `${Math.round((assessment.overallScore / assessment.maxPossibleScore) * 100)}%`
                            : "0%"}
                        </span>
                        <Badge variant="secondary">
                          {assessment.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link to={`/assessments/${assessment.publicId}/preview`}>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}