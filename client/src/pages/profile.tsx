import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Lock, Mail, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organizationName: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Initialize form when user data loads
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        organizationName: user.organizationName || ""
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await apiRequest("/api/auth/profile", "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update profile", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const response = await apiRequest("/api/auth/reset-password", "POST", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Password reset successfully",
        description: "A confirmation email has been sent to your email address"
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to reset password", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation password do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    resetPasswordMutation.mutate(passwordForm);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account settings and security
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={!isEditingProfile}
                />
              </div>

              {user?.role === "client" && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Building/Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={profileForm.organizationName}
                    onChange={(e) => setProfileForm({ ...profileForm, organizationName: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
                  {user?.role}
                </div>
              </div>

              {user?.role === "client" && (
                <>
                  <div className="space-y-2">
                    <Label>Subscription Tier</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
                      {user?.subscriptionTier}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription Status</Label>
                    <div className={`px-3 py-2 rounded-md text-sm capitalize ${
                      user?.subscriptionStatus === "active" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}>
                      {user?.subscriptionStatus}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                {!isEditingProfile ? (
                  <Button type="button" onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Reset form to original values
                        setProfileForm({
                          firstName: user?.firstName || "",
                          lastName: user?.lastName || "",
                          email: user?.email || "",
                          organizationName: user?.organizationName || ""
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Password Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Change your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Email Notification</p>
                    <p>When you reset your password, a confirmation email will be sent to your registered email address for security purposes.</p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={resetPasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              >
                {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}