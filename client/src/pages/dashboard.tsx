import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Building, Plus, FileText, Users, BarChart3, LogOut, Shield, Menu, X } from "lucide-react";
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
      // Direct redirect to logout endpoint
      window.location.href = "/api/logout";
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
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
              <span className="hidden sm:inline text-xs sm:text-sm text-muted-foreground capitalize bg-secondary px-2 py-1 rounded">{user?.role}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="p-2"
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
              ? "GREDA Green Building Reports Dashboard" 
              : "GREDA Green Building Assessment Dashboard"
            }
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.role === "client" 
              ? "Access your building sustainability reports and certification tracking with comprehensive GREDA-GBC performance analytics"
              : "Manage sustainable building evaluations with comprehensive GREDA-GBC certification tracking and environmental performance reporting"
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
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
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            <FileText className="h-4 w-4 mr-2" />
            {user?.role === "client" ? "View Assessment Reports" : "Sustainability Reports"}
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
                        {assessment.assessorName && (
                          <span className="text-xs text-gray-400">
                            By {assessment.assessorName}
                          </span>
                        )}
                        {assessment.conductedAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(assessment.conductedAt).toLocaleDateString()}
                          </span>
                        )}
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
                        <Link href={`/assessments/${assessment.publicId}/preview`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {user?.role === "client" ? "No reports available" : "No assessments yet"}
                </h3>
                <p className="text-gray-500 mb-4">
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
