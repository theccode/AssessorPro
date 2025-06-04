import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Calendar, Edit, FileText, User, Search, Filter, ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface Assessment {
  id: number;
  buildingName?: string;
  clientName?: string;
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
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });

  // Filter and search draft assessments, then group by client
  const clientFolders = useMemo(() => {
    let filtered = assessments.filter((a: Assessment) => a.status === "draft");

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((a: Assessment) => 
        (a.buildingName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // Apply sorting to individual assessments
    if (sortBy === "updated") {
      filtered = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === "progress") {
      filtered = filtered.sort((a, b) => (b.completedSections || 0) - (a.completedSections || 0));
    } else if (sortBy === "building") {
      filtered = filtered.sort((a, b) => (a.buildingName || "").localeCompare(b.buildingName || ""));
    }

    // Group by client
    const groups = filtered.reduce((acc: Record<string, Assessment[]>, assessment: Assessment) => {
      const clientKey = assessment.clientName || "Unknown Client";
      if (!acc[clientKey]) {
        acc[clientKey] = [];
      }
      acc[clientKey].push(assessment);
      return acc;
    }, {});

    // Convert to array and sort clients if needed
    const clientFolders = Object.entries(groups).map(([clientName, assessments]) => ({
      clientName,
      assessments,
      totalDrafts: assessments.length,
      lastUpdated: Math.max(...assessments.map(a => new Date(a.updatedAt).getTime()))
    }));

    // Sort client folders
    if (sortBy === "client") {
      clientFolders.sort((a, b) => a.clientName.localeCompare(b.clientName));
    } else {
      clientFolders.sort((a, b) => b.lastUpdated - a.lastUpdated);
    }

    return clientFolders;
  }, [assessments, searchTerm, progressFilter, sortBy]);

  const totalDrafts = clientFolders.reduce((sum, folder) => sum + folder.totalDrafts, 0);

  const toggleFolder = (clientName: string) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(clientName)) {
      newOpenFolders.delete(clientName);
    } else {
      newOpenFolders.add(clientName);
    }
    setOpenFolders(newOpenFolders);
  };

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
              <img src={gredaLogo} alt="GREDA Logo" className="h-6 sm:h-8 w-6 sm:w-8 mr-2 sm:mr-3" />
              <span className="text-sm sm:text-xl font-semibold text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
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
            <div className="md:hidden flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Draft Assessments</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Continue working on your assessments in progress
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by client, building, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Progress Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger className="w-full sm:w-40">
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
                <SelectTrigger className="w-full sm:w-40">
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
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {totalDrafts} draft{totalDrafts !== 1 ? 's' : ''} across {clientFolders.length} client{clientFolders.length !== 1 ? 's' : ''}
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

        {/* Client Folders */}
        {clientFolders.length === 0 ? (
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
          <div className="space-y-4">
            {clientFolders.map((folder) => (
              <Collapsible 
                key={folder.clientName} 
                open={openFolders.has(folder.clientName)}
                onOpenChange={() => toggleFolder(folder.clientName)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {openFolders.has(folder.clientName) ? (
                            <FolderOpen className="w-5 h-5 text-primary" />
                          ) : (
                            <Folder className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <CardTitle className="text-lg">{folder.clientName}</CardTitle>
                            <CardDescription>
                              {folder.totalDrafts} draft assessment{folder.totalDrafts > 1 ? 's' : ''} • 
                              Last updated {new Date(folder.lastUpdated).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {folder.totalDrafts} draft{folder.totalDrafts > 1 ? 's' : ''}
                          </Badge>
                          {openFolders.has(folder.clientName) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {folder.assessments.map((assessment: Assessment) => (
                          <Card key={assessment.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base mb-2">
                                    {assessment.buildingName || "Untitled Building"}
                                  </CardTitle>
                                  {assessment.buildingLocation && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Building className="w-3 h-3 text-muted-foreground" />
                                      <CardDescription className="text-xs">{assessment.buildingLocation}</CardDescription>
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs">Draft</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {/* Progress */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{assessment.completedSections || 0}/{assessment.totalSections || 8}</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div 
                                      className="bg-primary h-1.5 rounded-full transition-all" 
                                      style={{ 
                                        width: `${((assessment.completedSections || 0) / (assessment.totalSections || 8)) * 100}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Last Updated */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(assessment.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                  <Link href={`/assessments/new?id=${assessment.id}`} className="flex-1">
                                    <Button className="w-full" size="sm">
                                      <Edit className="w-3 h-3 mr-2" />
                                      Continue
                                    </Button>
                                  </Link>
                                  <Link href={`/assessments/${assessment.id}/preview`}>
                                    <Button variant="outline" size="sm">
                                      <FileText className="w-3 h-3" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}