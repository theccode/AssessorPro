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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src={gredaLogo} alt="GREDA-GBC" className="h-10 sm:h-12 w-auto flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Assessment Reports</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {user?.role === "client" ? "Your building assessment reports" : "All assessment reports"}
                </p>
              </div>
            </div>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{completedAssessments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {completedAssessments.length > 0
                  ? Math.round(
                      completedAssessments.reduce((sum: number, a: any) => sum + (a.overallScore || 0), 0) /
                      completedAssessments.length
                    )
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
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
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No completed reports
                </h3>
                <p className="text-muted-foreground">
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3">
                        <Building className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                            {assessment.buildingName || "Unnamed Building"}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {assessment.buildingLocation || "No location specified"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">
                          Score: {assessment.overallScore || 0}/{assessment.maxPossibleScore || 130}
                        </span>
                        <span className="font-medium">
                          {assessment.maxPossibleScore > 0
                            ? `${Math.round((assessment.overallScore / assessment.maxPossibleScore) * 100)}%`
                            : "0%"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {assessment.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-start">
                      <Link to={`/assessments/${assessment.publicId}/preview`} className="w-full sm:w-auto">
                        <Button size="sm" variant="outline" className="w-full sm:w-auto">
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