import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  Plus, 
  Eye, 
  Edit,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  Lock,
  Unlock,
  ArrowLeft,
  Search,
  Filter,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  User
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Assessment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Assessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  const { data: allAssessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  // Filter and search assessments
  const filteredAssessments = useMemo(() => {
    return allAssessments.filter((assessment: Assessment) => {
      // Status filter
      if (statusFilter !== "all" && assessment.status !== statusFilter) {
        return false;
      }
      
      // Search term filter (building name, client name, or assessor name)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const buildingName = assessment.buildingName?.toLowerCase() || "";
        const clientName = assessment.clientName?.toLowerCase() || "";
        const assessorName = assessment.assessorName?.toLowerCase() || "";
        
        return buildingName.includes(searchLower) || 
               clientName.includes(searchLower) || 
               assessorName.includes(searchLower);
      }
      
      return true;
    });
  }, [allAssessments, statusFilter, searchTerm]);

  // Group assessments by client
  const groupedAssessments = useMemo(() => {
    const grouped = filteredAssessments.reduce((acc: any, assessment: Assessment) => {
      const clientName = assessment.clientName || "Unknown Client";
      if (!acc[clientName]) {
        acc[clientName] = [];
      }
      acc[clientName].push(assessment);
      return acc;
    }, {});
    
    // Sort clients alphabetically and sort assessments within each client by creation date
    const sortedGrouped: any = {};
    Object.keys(grouped)
      .sort()
      .forEach(clientName => {
        sortedGrouped[clientName] = grouped[clientName].sort((a: Assessment, b: Assessment) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      });
    
    return sortedGrouped;
  }, [filteredAssessments]);

  // Function to toggle client folder expansion
  const toggleClientExpansion = (clientName: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientName)) {
        newSet.delete(clientName);
      } else {
        newSet.add(clientName);
      }
      return newSet;
    });
  };

  // Lock/unlock mutations for admins
  const lockMutation = useMutation({
    mutationFn: async (assessmentPublicId: string) => {
      return await apiRequest(`/api/assessments/${assessmentPublicId}/lock`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Assessment Locked",
        description: "Assessment has been locked for editing.",
      });
    },
  });

  // Request edit mutation for assessors on completed assessments
  const requestEditMutation = useMutation({
    mutationFn: async (assessmentPublicId: string) => {
      return await apiRequest(`/api/assessments/${assessmentPublicId}/request-edit`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Edit Request Sent",
        description: "Your request to edit this completed assessment has been submitted to administrators.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit edit request.",
        variant: "destructive",
      });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (assessmentPublicId: string) => {
      return await apiRequest(`/api/assessments/${assessmentPublicId}/unlock`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Assessment Unlocked",
        description: "Assessment has been unlocked for editing.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 text-white">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const assessments = Array.isArray(allAssessments) ? allAssessments : [];
  const completedAssessments = assessments.filter((assessment: Assessment) => assessment.status === 'completed');
  const draftAssessments = assessments.filter((assessment: Assessment) => assessment.status !== 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold mb-2">Assessment Management</h1>
              <p className="text-gray-300">Manage and review building assessments</p>
            </div>
          </div>
          {(user?.role === "admin" || user?.role === "assessor") && (
            <Link href="/assessments/new">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-5 w-5 mr-2" />
                New Assessment
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by building name, client, or assessor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredAssessments.length} of {allAssessments.length} assessments
            </div>
          </div>
        </div>

        {/* Assessments List */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Building className="h-6 w-6 mr-2" />
            {statusFilter === "all" ? "All Assessments" : 
             statusFilter === "completed" ? "Completed Assessments" : "Draft Assessments"}
          </h2>
          
          {Object.keys(groupedAssessments).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedAssessments).map(([clientName, clientAssessments]) => (
                <div key={clientName} className="border border-white/20 rounded-lg bg-white/5 backdrop-blur-sm">
                  {/* Client Folder Header */}
                  <button
                    onClick={() => toggleClientExpansion(clientName)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {expandedClients.has(clientName) ? (
                        <FolderOpen className="h-5 w-5 text-green-400" />
                      ) : (
                        <Folder className="h-5 w-5 text-green-400" />
                      )}
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-white/70" />
                        <span className="text-lg font-semibold text-white">{clientName}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {clientAssessments.length} assessment{clientAssessments.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {expandedClients.has(clientName) ? (
                      <ChevronDown className="h-5 w-5 text-white/70" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-white/70" />
                    )}
                  </button>
                  
                  {/* Client Assessments */}
                  {expandedClients.has(clientName) && (
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {clientAssessments.map((assessment: Assessment) => (
                <Card key={assessment.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-semibold text-white">
                        {assessment.buildingName || "Untitled Assessment"}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-green-600/20 text-green-100 border-green-500/30">
                        Completed
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {assessment.buildingLocation || "Location not specified"}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "Date not available"}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Score</span>
                        <span className="font-medium">
                          {assessment.overallScore || 0}/{assessment.maxPossibleScore || 130}
                        </span>
                      </div>
                      <Progress 
                        value={assessment.maxPossibleScore && assessment.maxPossibleScore > 0 ? (assessment.overallScore || 0) / assessment.maxPossibleScore * 100 : 0} 
                        className="h-2"
                      />
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Performance: {assessment.maxPossibleScore && assessment.maxPossibleScore > 0 ? Math.round(((assessment.overallScore || 0) / assessment.maxPossibleScore) * 100) : 0}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/assessments/${assessment.publicId}/preview`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                        {(user?.role === "admin" || user?.role === "assessor") && (
                          <div className="flex items-center space-x-2 flex-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                if (assessment.isLocked) {
                                  toast({
                                    title: "Assessment Locked",
                                    description: "This assessment is locked. Use 'Request Edit' to unlock it for editing.",
                                    variant: "destructive",
                                  });
                                } else {
                                  window.location.href = `/assessments/${assessment.publicId}/edit`;
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            {assessment.isLocked && (
                              <Lock className="h-3 w-3 text-amber-600 flex-shrink-0" title="Assessment is locked" />
                            )}
                          </div>
                        )}
                      </div>

                      {user?.role === "admin" && (
                        <div className="flex space-x-2">
                          {assessment.isLocked ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => unlockMutation.mutate(assessment.publicId || "")}
                              disabled={unlockMutation.isPending}
                            >
                              {unlockMutation.isPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Unlocking...
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Unlock
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => lockMutation.mutate(assessment.publicId || "")}
                              disabled={lockMutation.isPending}
                            >
                              {lockMutation.isPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Locking...
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Lock
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {(user?.role === "assessor") && assessment.status === 'completed' && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => requestEditMutation.mutate(assessment.publicId || "")}
                            disabled={requestEditMutation.isPending}
                          >
                            {requestEditMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Requesting...
                              </>
                            ) : (
                              <>
                                <Edit className="h-3 w-3 mr-1" />
                                Request Edit
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                        </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? `No assessments found for "${searchTerm}"` : 
                 statusFilter === "completed" ? "No completed assessments" :
                 statusFilter === "draft" ? "No draft assessments" : "No assessments found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? "Try adjusting your search terms or filters" : 
                 user?.role === "client" 
                  ? "No assessments are available for your account yet."
                  : "Create your first assessment to get started."
                }
              </p>
              {(user?.role === "admin" || user?.role === "assessor") && (
                <Link href="/assessments/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Assessment
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
                          <MapPin className="h-3 w-3 mr-1" />
                          {assessment.buildingLocation || "Location not specified"}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "Date not available"}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">
                            {assessment.completedSections || 0}/{assessment.totalSections || 8} sections
                          </span>
                        </div>
                        <Progress 
                          value={assessment.totalSections && assessment.totalSections > 0 ? ((assessment.completedSections || 0) / assessment.totalSections) * 100 : 0} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/assessments/${assessment.publicId}/preview`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/assessments/${assessment.publicId}/edit`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Continue
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No draft assessments</h3>
                <p className="text-muted-foreground mb-6">
                  Start a new assessment to begin evaluating building sustainability.
                </p>
                <Link href="/assessments/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Assessment
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}