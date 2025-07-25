import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Unlock
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Assessment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Assessments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: allAssessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

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
          <div>
            <h1 className="text-4xl font-bold mb-2">Assessment Management</h1>
            <p className="text-gray-300">Manage and review building assessments</p>
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

        {/* Completed Assessments */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Completed Assessments
          </h2>
          
          {completedAssessments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {completedAssessments.map((assessment: Assessment) => (
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
                        value={assessment.maxPossibleScore > 0 ? (assessment.overallScore / assessment.maxPossibleScore) * 100 : 0} 
                        className="h-2"
                      />
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Performance: {assessment.maxPossibleScore > 0 ? Math.round((assessment.overallScore / assessment.maxPossibleScore) * 100) : 0}%
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
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/assessments/${assessment.publicId}/edit`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        )}
                      </div>

                      {user?.role === "admin" && (
                        <div className="flex space-x-2">
                          {assessment.isLocked ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => unlockMutation.mutate(assessment.publicId)}
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
                              onClick={() => lockMutation.mutate(assessment.publicId)}
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
                            onClick={() => requestEditMutation.mutate(assessment.publicId)}
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
          ) : (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No completed assessments</h3>
              <p className="text-muted-foreground mb-6">
                {user?.role === "client" 
                  ? "No completed assessments are available for your account yet."
                  : "Complete assessments from your drafts to see them here, or create new assessments."
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

        {/* Draft Assessments */}
        {(user?.role === "admin" || user?.role === "assessor") && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Draft Assessments</h2>
            
            {draftAssessments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {draftAssessments.map((assessment: Assessment) => (
                  <Card key={assessment.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-semibold text-white">
                          {assessment.buildingName || "Untitled Assessment"}
                        </CardTitle>
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-200">
                          Draft
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
                          <span>Progress</span>
                          <span className="font-medium">
                            {assessment.completedSections || 0}/{assessment.totalSections || 8} sections
                          </span>
                        </div>
                        <Progress 
                          value={assessment.totalSections > 0 ? (assessment.completedSections / assessment.totalSections) * 100 : 0} 
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