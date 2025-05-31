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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, Shield, Activity, CreditCard, Settings, Plus } from "lucide-react";
import { Link } from "wouter";

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
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "client" as const,
    subscriptionTier: "free" as const,
    organizationName: ""
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/admin/invitations"],
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "assessor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "client": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "enterprise": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "premium": return "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200";
      case "basic": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "free": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage users, invitations, and system access</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/assessments/select-client">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Link>
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new user with specified role and access level
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value: any) => setInviteForm({ ...inviteForm, role: value })}>
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
              <div className="grid gap-2">
                <Label htmlFor="tier">Subscription Tier</Label>
                <Select value={inviteForm.subscriptionTier} onValueChange={(value: any) => setInviteForm({ ...inviteForm, subscriptionTier: value })}>
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
              <div className="grid gap-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  placeholder="Company Name"
                  value={inviteForm.organizationName}
                  onChange={(e) => setInviteForm({ ...inviteForm, organizationName: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => inviteUserMutation.mutate(inviteForm)}>
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Invites</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and subscription levels
              </CardDescription>
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
                            <Badge className={`${getRoleColor(user.role)} text-xs`}>{user.role}</Badge>
                            <Badge className={`${getStatusColor(user.status)} text-xs`}>{user.status}</Badge>
                            <Badge className={`${getTierColor(user.subscriptionTier)} text-xs`}>
                              {user.subscriptionTier}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground break-all">{user.email}</p>
                        {user.organizationName && (
                          <p className="text-xs sm:text-sm text-muted-foreground">{user.organizationName}</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Select
                          value={user.status}
                          onValueChange={(status) => 
                            updateUserStatusMutation.mutate({ userId: user.id, status })
                          }
                        >
                          <SelectTrigger className="w-full sm:w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={`${user.subscriptionTier}-${user.subscriptionStatus}`}
                          onValueChange={(value) => {
                            const [tier, status] = value.split('-');
                            updateSubscriptionMutation.mutate({ 
                              userId: user.id, 
                              tier, 
                              status 
                            });
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free-inactive">Free (Inactive)</SelectItem>
                            <SelectItem value="basic-active">Basic (Active)</SelectItem>
                            <SelectItem value="premium-active">Premium (Active)</SelectItem>
                            <SelectItem value="enterprise-active">Enterprise (Active)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Track and manage user invitations
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
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{invite.email}</h4>
                          <Badge className={getRoleColor(invite.role)}>{invite.role}</Badge>
                          <Badge className={getStatusColor(invite.status)}>{invite.status}</Badge>
                        </div>
                        {invite.organizationName && (
                          <p className="text-sm text-muted-foreground">{invite.organizationName}</p>
                        )}
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

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>
                View system activity and admin actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="text-center py-4">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs available
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.slice(0, 10).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{log.userId}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}