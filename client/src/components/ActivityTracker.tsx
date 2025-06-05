import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Clock, User, Building, CheckCircle, XCircle, AlertCircle, Search, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: number;
  userId: string;
  activityType: string;
  title: string;
  description: string;
  targetUserId?: string;
  assessmentId?: number;
  assessmentPublicId?: string;
  buildingName?: string;
  priority: "low" | "medium" | "high";
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  activityTypes: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  recentActivities: ActivityLog[];
}

export function ActivityTracker() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/activities', { type: selectedType !== "all" ? selectedType : undefined, limit: 100 }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ActivityStats>({
    queryKey: ['/api/activities/stats'],
    refetchInterval: 60000, // Refresh every minute
  });

  const filteredActivities = activities.filter((activity: ActivityLog) => {
    const matchesSearch = !searchTerm || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.buildingName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = selectedPriority === "all" || activity.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "edit_request_created":
      case "edit_request_approved":
      case "edit_request_denied":
        return <AlertCircle className="h-4 w-4" />;
      case "assessment_completed":
      case "assessment_created":
        return <Building className="h-4 w-4" />;
      case "user_created":
      case "user_login":
      case "account_created":
        return <User className="h-4 w-4" />;
      case "assessment_locked":
      case "assessment_unlocked":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatActivityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Activity Tracker
        </h2>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.priorityBreakdown.high || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Edit Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.activityTypes.edit_request_created || 0) + 
                 (stats.activityTypes.edit_request_approved || 0) + 
                 (stats.activityTypes.edit_request_denied || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activities">All Activities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Activity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="edit_request_created">Edit Requests</SelectItem>
                    <SelectItem value="edit_request_approved">Approvals</SelectItem>
                    <SelectItem value="edit_request_denied">Denials</SelectItem>
                    <SelectItem value="assessment_completed">Assessments</SelectItem>
                    <SelectItem value="user_created">User Management</SelectItem>
                    <SelectItem value="user_login">Logins</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Activities List */}
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No activities found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredActivities.map((activity: ActivityLog) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {getActivityIcon(activity.activityType)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {activity.title}
                          </h3>
                          <Badge variant={getPriorityColor(activity.priority)}>
                            {activity.priority}
                          </Badge>
                          <Badge variant="outline">
                            {formatActivityType(activity.activityType)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {activity.description}
                        </p>
                        
                        {activity.buildingName && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Building className="h-3 w-3" />
                            <span>{activity.buildingName}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                          </div>
                          <span>{format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.activityTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatActivityType(type)}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.priorityBreakdown).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{priority} Priority</span>
                        <Badge variant={getPriorityColor(priority)}>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}