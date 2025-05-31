import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Calendar, Edit, FileText, User, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface Assessment {
  id: number;
  buildingName?: string;
  publisherName?: string;
  buildingLocation?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedSections: number;
  totalSections: number;
  overallScore?: number;
}

export default function Drafts() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  // Filter and search draft assessments
  const filteredDraftAssessments = useMemo(() => {
    let filtered = assessments.filter((a: Assessment) => a.status === "draft");

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((a: Assessment) => 
        (a.buildingName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.publisherName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.buildingLocation || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply progress filter
    if (progressFilter === "not-started") {
      filtered = filtered.filter((a: Assessment) => (a.completedSections || 0) === 0);
    } else if (progressFilter === "in-progress") {
      filtered = filtered.filter((a: Assessment) => 
        (a.completedSections || 0) > 0 && (a.completedSections || 0) < (a.totalSections || 8)
      );
    } else if (progressFilter === "almost-done") {
      filtered = filtered.filter((a: Assessment) => 
        (a.completedSections || 0) >= (a.totalSections || 8) * 0.75
      );
    }

    // Apply sorting
    if (sortBy === "updated") {
      filtered = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === "progress") {
      filtered = filtered.sort((a, b) => (b.completedSections || 0) - (a.completedSections || 0));
    } else if (sortBy === "client") {
      filtered = filtered.sort((a, b) => (a.publisherName || "").localeCompare(b.publisherName || ""));
    } else if (sortBy === "building") {
      filtered = filtered.sort((a, b) => (a.buildingName || "").localeCompare(b.buildingName || ""));
    }

    return filtered;
  }, [assessments, searchTerm, progressFilter, sortBy]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Logo" className="h-8 w-8 mr-3" />
              <span className="text-xl font-semibold text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/assessments">
                <Button variant="ghost">Assessments</Button>
              </Link>
              <Link href="/drafts">
                <Button variant="default">Drafts</Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <Link href="/api/logout">
                <Button variant="outline">Logout</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Draft Assessments</h1>
          <p className="text-muted-foreground mt-2">
            Continue working on your assessments in progress
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by client, building, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Progress Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by progress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Progress</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="almost-done">Almost Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="client">Client Name</SelectItem>
                <SelectItem value="building">Building Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {filteredDraftAssessments.length} draft{filteredDraftAssessments.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
            {(searchTerm || progressFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setProgressFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Draft Assessments Grouped by Client */}
        {filteredDraftAssessments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Draft Assessments</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any assessments in progress. Start a new assessment to begin.
              </p>
              <Link href="/assessments/select-client">
                <Button>
                  <Building className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Group assessments by client */}
            {Object.entries(
              filteredDraftAssessments.reduce((groups: Record<string, Assessment[]>, assessment: Assessment) => {
                const clientKey = `${assessment.publisherName || "Unknown Client"}`;
                if (!groups[clientKey]) {
                  groups[clientKey] = [];
                }
                groups[clientKey].push(assessment);
                return groups;
              }, {})
            ).map(([clientName, clientAssessments]) => (
              <div key={clientName} className="space-y-4">
                {/* Client Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{clientName}</h2>
                  <Badge variant="outline">{clientAssessments.length} draft{clientAssessments.length > 1 ? 's' : ''}</Badge>
                </div>

                {/* Assessments for this client */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientAssessments.map((assessment: Assessment) => (
                    <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {assessment.buildingName || "Untitled Building"}
                            </CardTitle>
                            {assessment.buildingLocation && (
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <CardDescription>{assessment.buildingLocation}</CardDescription>
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">Draft</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Progress */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{assessment.completedSections || 0}/{assessment.totalSections || 8}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ 
                                  width: `${((assessment.completedSections || 0) / (assessment.totalSections || 8)) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Last Updated */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Updated {new Date(assessment.updatedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Link href={`/assessments/new?id=${assessment.id}`} className="flex-1">
                              <Button className="w-full" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Continue
                              </Button>
                            </Link>
                            <Link href={`/assessments/${assessment.id}/preview`}>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}