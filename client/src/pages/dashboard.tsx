import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Building, Plus, FileText, Users, BarChart3, LogOut, Shield, Menu, X, Star, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to home page
      window.location.href = "/";
    },
  });

  // Only show completed/submitted assessments on dashboard
  const completedAssessments = assessments.filter((a: Assessment) => 
    a.status === "completed" || a.status === "submitted"
  );
  const recentAssessments = completedAssessments.slice(0, 5);
  const completedThisMonth = assessments.filter((a: Assessment) => 
    a.status === "completed" && new Date(a.updatedAt || "").getMonth() === new Date().getMonth()
  ).length;
  const draftAssessments = assessments.filter((a: Assessment) => a.status === "draft").length;
  const averageScore = completedAssessments.length > 0 
    ? completedAssessments.reduce((sum: number, a: Assessment) => sum + (a.overallScore || 0), 0) / completedAssessments.length 
    : 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-6 sm:h-8 w-auto" />
              <span className="ml-2 sm:ml-3 text-sm sm:text-xl font-medium text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
                Dashboard
              </Link>
              {(user?.role === "admin" || user?.role === "assessor") && (
                <>
                  <Link href="/assessments/select-client" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
                    New Assessment
                  </Link>
                  <Link href="/drafts" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
                    Drafts
                  </Link>
                </>
              )}
              <Link href="/reports" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
                {user?.role === "client" ? "My Reports" : "Reports"}
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
            
            {/* Mobile and Desktop Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || user?.role}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Link href="/profile">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-4 py-3 space-y-2">
              <Link 
                href="/" 
                className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              {(user?.role === "admin" || user?.role === "assessor") && (
                <Link 
                  href="/assessments" 
                  className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Assessments
                </Link>
              )}
              <Link 
                href="/reports" 
                className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {user?.role === "client" ? "My Reports" : "Reports"}
              </Link>
              {user?.role === "admin" && (
                <Link 
                  href="/admin" 
                  className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              <div className="pt-2 border-t border-border">
                <span className="block text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded w-fit">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {user?.role === "client" 
              ? `Welcome ${user?.firstName || "Client"} - GREDA Reports Dashboard` 
              : "GREDA Green Building Assessment Dashboard"
            }
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.role === "client" 
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
                {user?.role === "client" ? "My Assessments" : "Quick Stats"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {user?.role === "client" ? "Total Assessments" : "Active Assessments"}
                </span>
                <span className="font-semibold text-primary">{assessments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed This Month</span>
                <span className="font-semibold text-secondary">{completedThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {user?.role === "client" ? "Pending Reviews" : "Draft Assessments"}
                </span>
                <span className="font-semibold text-accent">{draftAssessments}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {user?.role === "client" ? "Assessment History" : "Recent Activity"}
              </CardTitle>
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
                      <p className="text-sm text-foreground">{assessment.buildingName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role === "client" && assessment.assessorName ? 
                          `Assessed by: ${assessment.assessorName}` : 
                          assessment.buildingLocation || "No location specified"
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assessment.updatedAt || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {user?.role === "client" ? "No assessments yet" : "No recent activity"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {user?.role === "client" ? "Sustainability Score" : "Performance Overview"}
              </CardTitle>
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
                <p className="text-center text-muted-foreground text-sm">
                  {user?.role === "client" ? "Average Building Score" : "Average Assessment Score"}
                </p>
                {user?.role === "client" && averageScore > 0 && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      {averageScore >= 80 ? "Excellent Performance" :
                       averageScore >= 60 ? "Good Performance" :
                       averageScore >= 40 ? "Fair Performance" : "Needs Improvement"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {(user?.role === "admin" || user?.role === "assessor") && (
            <Button 
              size="lg" 
              asChild
              variant="default"
            >
              <Link href="/assessments/select-client">
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Link>
            </Button>
          )}
          <Button variant="outline" size="lg" asChild className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            <Link href="/reports">
              <FileText className="h-4 w-4 mr-2" />
              {user?.role === "client" ? "View Assessment Reports" : "Sustainability Reports"}
            </Link>
          </Button>
        </div>

        {/* Recent Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === "client" ? "My Assessment Reports" : "Recent Assessments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length > 0 ? (
              <div className="space-y-4">
                {assessments.map((assessment: Assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {assessment.buildingName || "Untitled Assessment"}
                      </h3>
                      <p className="text-sm text-muted-foreground">{assessment.buildingLocation}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assessment.status === "completed" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : assessment.status === "draft"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}>
                          {assessment.status === "completed" ? "Report Available" : 
                           assessment.status === "draft" ? "In Progress" : assessment.status}
                        </span>
                        {user?.role === "client" && assessment.overallScore && (
                          <span className="text-sm font-medium text-primary">
                            Score: {assessment.overallScore}%
                          </span>
                        )}
                        {user?.role !== "client" && (
                          <span className="text-sm text-muted-foreground">
                            {assessment.completedSections}/{assessment.totalSections} sections
                          </span>
                        )}
                        {assessment.assessorName && user?.role === "client" && (
                          <span className="text-xs text-muted-foreground">
                            Assessed by: {assessment.assessorName}
                          </span>
                        )}
                        {assessment.conductedAt && (
                          <span className="text-xs text-muted-foreground">
                            {user?.role === "client" ? "Completed: " : ""}
                            {new Date(assessment.conductedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Star Rating */}
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => {
                          const score = assessment.overallScore || 0;
                          let stars = 0;
                          if (score >= 106) stars = 5; // Diamond/5★ (106-130)
                          else if (score >= 80) stars = 4; // 4★ (80-105)
                          else if (score >= 60) stars = 3; // 3★ (60-79)
                          else if (score >= 45) stars = 2; // 2★ (45-59)
                          else if (score >= 1) stars = 1; // 1★ (1-44)
                          
                          return (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < stars
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          );
                        })}
                        <span className="ml-2 text-sm text-muted-foreground">GREDA Rating</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary">
                          {Math.round(assessment.overallScore || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          /{Math.round(assessment.maxPossibleScore || 100)}
                        </div>
                      </div>
                      <Progress 
                        value={((assessment.overallScore || 0) / (assessment.maxPossibleScore || 100)) * 100} 
                        className="w-20"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/assessments/${assessment.publicId}/preview`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {user?.role === "client" ? "No reports available" : "No assessments yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {user?.role === "client" 
                    ? "Assessment reports will appear here once they are completed and shared with you" 
                    : "Get started by creating your first building assessment"
                  }
                </p>
                {(user?.role === "admin" || user?.role === "assessor") && (
                  <Button onClick={() => createAssessmentMutation.mutate()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
