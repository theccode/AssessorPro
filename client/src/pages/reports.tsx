import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  ArrowLeft, 
  Download, 
  Eye,
  Calendar,
  BarChart3,
  FileText,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Assessment } from "@shared/schema";

export default function Reports() {
  const { user } = useAuth();
  
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading reports...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-medium text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Reports</h1>
          <p className="text-muted-foreground">View and download your assessment reports</p>
        </div>

        {/* Reports Grid */}
        {(assessments as any[]).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Reports Available</h3>
              <p className="text-muted-foreground text-center mb-6">
                No assessment reports have been generated yet. Complete an assessment to generate your first report.
              </p>
              {(user as any)?.role !== "client" && (
                <Button asChild>
                  <Link href="/assessments/new">Create New Assessment</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(assessments as any[]).map((assessment: any) => (
              <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">
                        {assessment.buildingName || `Assessment #${assessment.id}`}
                      </CardTitle>
                      <Badge variant={assessment.status === "completed" ? "default" : "secondary"}>
                        {assessment.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(assessment.overallScore || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">/ 130</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Performance: {Math.round((assessment.overallScore || 0) / 130 * 100)}%
                    </div>

                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor((assessment.overallScore || 0) / 26)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">GREDA Rating</span>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/assessments/${assessment.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}