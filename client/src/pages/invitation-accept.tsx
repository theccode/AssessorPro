import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface InvitationData {
  email: string;
  role: string;
  organizationName?: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
}

export default function InvitationAccept() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    // Fetch invitation details
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load invitation");
      }

      setInvitation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || accepted) return;

    setAccepting(true);
    try {
      const response = await apiRequest(`/api/invitations/${token}/accept`, "POST", {});
      
      // Always mark as accepted on successful response
      setAccepted(true);
      toast({
        title: "Invitation accepted!",
        description: "You can now log in to access the platform.",
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Please try again.";
      
      // If invitation was already processed, redirect to login
      if (errorMessage.includes("already processed")) {
        toast({
          title: "Invitation already accepted",
          description: "Redirecting you to login...",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
      } else {
        toast({
          title: "Failed to accept invitation",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setAccepting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "assessor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "client": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "expired": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              variant="outline" 
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Invitation Accepted!</CardTitle>
            <CardDescription>
              Redirecting you to the login page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = invitation.status === "expired" || new Date() > new Date(invitation.expiresAt);
  const isAlreadyAccepted = invitation.status === "accepted";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src={gredaLogo} alt="GREDA Logo" className="w-16 h-16 object-contain" />
          </div>
          <CardTitle>Platform Invitation</CardTitle>
          <CardDescription>
            You've been invited to join the GREDA Green Building Assessment Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Email:</span>
              <span className="text-sm">{invitation.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Role:</span>
              <Badge className={getRoleColor(invitation.role)}>
                {invitation.role}
              </Badge>
            </div>
            
            {invitation.organizationName && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Building Name:</span>
                <span className="text-sm">{invitation.organizationName}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(invitation.status)}
                <span className="text-sm capitalize">{invitation.status}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Expires:</span>
              <span className="text-sm">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {isAlreadyAccepted ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This invitation has already been accepted.
              </p>
              <Button asChild className="w-full">
                <a href="/login">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Login
                </a>
              </Button>
            </div>
          ) : isExpired ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-destructive">
                This invitation has expired. Please contact an administrator for a new invitation.
              </p>
              <Button 
                onClick={() => setLocation("/")} 
                variant="outline" 
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Click below to accept this invitation and gain access to the platform.
                </p>
              </div>
              
              <Button 
                onClick={handleAcceptInvitation}
                disabled={accepting}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}