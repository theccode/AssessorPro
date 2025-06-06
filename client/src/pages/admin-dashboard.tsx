import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, Shield, Activity, CreditCard, Settings, Plus, Loader2, ArrowLeft, UserCheck, LogOut, Archive, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { ActivityTracker } from "@/components/ActivityTracker";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "assessor" | "client";
  status: "active" | "suspended" | "pending";
  subscriptionTier: "free" | "basic" | "premium" | "enterprise";
  subscriptionStatus: "active" | "inactive" | "trial" | "cancelled";
  organizationName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface Invitation {
  id: number;
  email: string;
  role: "admin" | "assessor" | "client";
  subscriptionTier: string;
  status: "pending" | "accepted" | "expired";
  organizationName?: string;
  createdAt: string;
  expiresAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "client" as "admin" | "assessor" | "client",
    subscriptionTier: "free",
    organizationName: ""
  });

  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "client" as "admin" | "assessor" | "client",
    subscriptionTier: "free",
    organizationName: "",
    password: ""
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/admin/invitations"],
    retry: false,
  });

  // Fetch assessments
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  // Fetch audit logs
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
    retry: false,
  });

  // Send invitation mutation
  const inviteUserMutation = useMutation({
    mutationFn: (data: typeof inviteForm) => apiRequest("/api/admin/invitations", "POST", data),
    onSuccess: () => {
      toast({ title: "Invitation sent successfully" });
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "client", subscriptionTier: "free", organizationName: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: () => {
      toast({ title: "Failed to send invitation", variant: "destructive" });
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: typeof createUserForm) => apiRequest("/api/admin/users", "POST", data),
    onSuccess: () => {
      toast({ title: "User created successfully" });
      setCreateUserDialogOpen(false);
      setCreateUserForm({ 
        email: "", 
        firstName: "", 
        lastName: "", 
        role: "client", 
        subscriptionTier: "free", 
        organizationName: "",
        password: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      apiRequest(`/api/admin/users/${userId}/status`, "PATCH", { status }),
    onSuccess: () => {
      toast({ title: "User status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    }
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ userId, tier, status }: { userId: string; tier: string; status: string }) =>
      apiRequest(`/api/admin/users/${userId}/subscription`, "PATCH", { tier, status }),
    onSuccess: () => {
      toast({ title: "Subscription updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    }
  });

  // Reset password mutation
  const resetUserPasswordMutation = useMutation({
    mutationFn: (userId: string) => apiRequest(`/api/admin/users/${userId}/reset-password`, "POST"),
    onSuccess: () => {
      toast({ title: "Password reset email sent" });
    },
    onError: () => {
      toast({ title: "Failed to reset password", variant: "destructive" });
    }
  });

  // Archive assessment mutation
  const archiveAssessmentMutation = useMutation({
    mutationFn: (assessmentId: number) => apiRequest(`/api/assessments/${assessmentId}/archive`, "POST"),
    onSuccess: () => {
      toast({ title: "Assessment archived successfully" });
      setArchiveDialogOpen(false);
      setSelectedAssessment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
    onError: () => {
      toast({ title: "Failed to archive assessment", variant: "destructive" });
    }
  });

  // Helper functions for styling
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "assessor": return "bg-blue-100 text-blue-800";
      case "client": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free": return "bg-gray-100 text-gray-800";
      case "basic": return "bg-blue-100 text-blue-800";
      case "premium": return "bg-purple-100 text-purple-800";
      case "enterprise": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage users, assessments, and system settings
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Back to Dashboard</span>
              <span className="xs:hidden">Back</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/logout">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Logout</span>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="assessments" className="text-xs sm:text-sm">
            <Shield className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Assessments</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="text-xs sm:text-sm">
            <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Invitations</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm">
            <Activity className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and subscription levels
                  </CardDescription>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full xs:w-auto">
                        <UserPlus className="w-4 h-4 mr-2" />
                        <span className="hidden xs:inline">Send Invitation</span>
                        <span className="xs:hidden">Invite</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send User Invitation</DialogTitle>
                        <DialogDescription>
                          Send an invitation email to a new user
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select value={inviteForm.role} onValueChange={(value: any) => setInviteForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="assessor">Assessor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                          <Select value={inviteForm.subscriptionTier} onValueChange={(value) => setInviteForm(prev => ({ ...prev, subscriptionTier: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organizationName">Organization (Optional)</Label>
                          <Input
                            id="organizationName"
                            value={inviteForm.organizationName}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, organizationName: e.target.value }))}
                            placeholder="Company Name"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => inviteUserMutation.mutate(inviteForm)}
                          disabled={inviteUserMutation.isPending || !inviteForm.email}
                          className="w-full"
                        >
                          {inviteUserMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Invitation"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full xs:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden xs:inline">Create User</span>
                        <span className="xs:hidden">Create</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account directly
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={createUserForm.firstName}
                              onChange={(e) => setCreateUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={createUserForm.lastName}
                              onChange={(e) => setCreateUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="createEmail">Email</Label>
                          <Input
                            id="createEmail"
                            type="email"
                            value={createUserForm.email}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={createUserForm.password}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="createRole">Role</Label>
                          <Select value={createUserForm.role} onValueChange={(value: any) => setCreateUserForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="assessor">Assessor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="createSubscriptionTier">Subscription Tier</Label>
                          <Select value={createUserForm.subscriptionTier} onValueChange={(value) => setCreateUserForm(prev => ({ ...prev, subscriptionTier: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="createOrganizationName">Organization (Optional)</Label>
                          <Input
                            id="createOrganizationName"
                            value={createUserForm.organizationName}
                            onChange={(e) => setCreateUserForm(prev => ({ ...prev, organizationName: e.target.value }))}
                            placeholder="Company Name"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => createUserMutation.mutate(createUserForm)}
                          disabled={createUserMutation.isPending || !createUserForm.email || !createUserForm.firstName || !createUserForm.lastName || !createUserForm.password}
                          className="w-full"
                        >
                          {createUserMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create User"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="space-y-4">
                  {users.map((user: User) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h4 className="font-medium text-sm sm:text-base">{user.firstName} {user.lastName}</h4>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                            <Badge className={getTierColor(user.subscriptionTier)}>{user.subscriptionTier}</Badge>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
                        {user.organizationName && (
                          <p className="text-xs text-muted-foreground">Organization: {user.organizationName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatusMutation.mutate({
                            userId: user.id,
                            status: user.status === "active" ? "suspended" : "active"
                          })}
                          disabled={updateUserStatusMutation.isPending}
                        >
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetUserPasswordMutation.mutate(user.id)}
                          disabled={resetUserPasswordMutation.isPending}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Management</CardTitle>
              <CardDescription>
                Manage all assessments, archive completed ones, and monitor assessment lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="text-center py-4">Loading assessments...</div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assessments available
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment: any) => {
                    console.log('Assessment data in admin dashboard:', assessment);
                    return (
                    <div key={assessment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h4 className="font-medium text-sm sm:text-base">{assessment.buildingName || 'Unnamed Assessment'}</h4>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge className={assessment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {assessment.status || 'Unknown'}
                            </Badge>
                            {assessment.isLocked && (
                              <Badge className="bg-red-100 text-red-800">Locked</Badge>
                            )}
                            {assessment.isArchived && (
                              <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{assessment.buildingLocation || 'Location not specified'}</p>
                        <p className="text-xs text-muted-foreground">
                          Assessor: {assessment.assessorName || 'Unknown'} | Client: {assessment.clientName || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score: {assessment.overallScore || 0}/{assessment.maxPossibleScore || 127}
                        </p>
                        {assessment.conductedAt && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {new Date(assessment.conductedAt).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          ID: {assessment.id} | Status: {assessment.status} | Archived: {assessment.isArchived ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/assessments/${assessment.publicId}/preview`}>
                            View Details
                          </Link>
                        </Button>
                        {(assessment.status === 'completed' || assessment.status === 'submitted') && !assessment.isArchived && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              console.log('Archive button clicked for assessment:', assessment);
                              setSelectedAssessment(assessment);
                              setArchiveDialogOpen(true);
                            }}
                            disabled={archiveAssessmentMutation.isPending}
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Management</CardTitle>
              <CardDescription>
                View and manage pending user invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="text-center py-4">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending invitations
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invite: Invitation) => (
                    <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h4 className="font-medium text-sm sm:text-base">{invite.email}</h4>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge className={getRoleColor(invite.role)}>{invite.role}</Badge>
                            <Badge className={invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                              {invite.status}
                            </Badge>
                            <Badge className={getTierColor(invite.subscriptionTier)}>{invite.subscriptionTier}</Badge>
                          </div>
                        </div>
                        {invite.organizationName && (
                          <p className="text-xs text-muted-foreground">Organization: {invite.organizationName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Sent: {new Date(invite.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityTracker />
        </TabsContent>
      </Tabs>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Archive Assessment - Irreversible Action
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="font-medium text-foreground">
                You are about to permanently archive "{selectedAssessment?.buildingName || 'this assessment'}".
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="font-medium text-destructive mb-2">⚠️ WARNING: This action is IRREVERSIBLE</div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Assessment will be permanently removed from public gallery</li>
                  <li>• All parties (assessor and client) will be notified</li>
                  <li>• Assessment cannot be restored once archived</li>
                  <li>• Data will remain for compliance but assessment becomes inactive</li>
                </ul>
              </div>
              <div className="text-sm text-muted-foreground">
                Only proceed if you are certain this assessment should be permanently archived.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAssessment && archiveAssessmentMutation.mutate(selectedAssessment.id)}
              disabled={archiveAssessmentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveAssessmentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                "Permanently Archive Assessment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Assessor Pro - GREDA Green Building Assessment Platform. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}