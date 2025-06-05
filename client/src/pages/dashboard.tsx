import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { Building, Plus, FileText, Users, BarChart3, Star, Lock, Unlock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment } from "@shared/schema";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(2); // Reduced to 2 to show pagination with current data

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

  // Filtered and sorted assessments with search
  const filteredAssessments = useMemo(() => {
    let filtered = [...completedAssessments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((assessment) =>
        assessment.buildingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.buildingLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((assessment) => assessment.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime();
        case "score":
          return (b.overallScore || 0) - (a.overallScore || 0);
        case "name":
          return (a.buildingName || "").localeCompare(b.buildingName || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [completedAssessments, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssessments = filteredAssessments.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const recentAssessments = paginatedAssessments;
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
        {completedAssessments.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-xl">
                  {(user as any)?.role === "client" ? "Recent Reports" : "Recent Assessments"}
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  {/* Search Input */}
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Latest</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Results Summary */}
              <div className="text-sm text-muted-foreground mt-2">
                Showing {paginatedAssessments.length} of {filteredAssessments.length} assessments
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssessments.map((assessment: Assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">{assessment.buildingName}</h3>
                          <p className="text-sm text-muted-foreground">{assessment.buildingLocation || "No location specified"}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 min-w-0">
                          {assessment.overallScore && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">{assessment.overallScore}%</span>
                            </div>
                          )}
                          <div className="flex items-center min-w-[60px]">
                            {assessment.isLocked && (
                              <>
                                <Lock className="h-3 w-3 text-red-500 mr-1" />
                                <span className="text-xs text-red-600">Locked</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded-full">
                          {assessment.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {assessment.isLocked ? (
                        <Lock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-600" />
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/assessment/${assessment.publicId}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* No Results Message */}
                {paginatedAssessments.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <h4 className="text-lg font-medium text-foreground mb-1">No assessments found</h4>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? `No assessments match "${searchTerm}"` : "Try adjusting your filters"}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
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
      
      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BuildAssess Pro - GREDA Green Building Assessment Platform. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}