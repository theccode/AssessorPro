import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, User, LogOut, Activity } from "lucide-react";
import { Link } from "wouter";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";
import { NotificationCenter } from "@/components/NotificationCenter";

export default function Header() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to the appropriate landing page based on current domain
      const hostname = window.location.hostname;
      
      // Check if we're on a role-specific domain
      if (hostname.includes('assessor.portal')) {
        window.location.replace("/");
      } else if (hostname.includes('client.portal')) {
        window.location.replace("/");
      } else if (hostname.includes('www.')) {
        window.location.replace("/");
      } else {
        // For localhost or other development domains
        window.location.replace("/");
      }
    },
  });

  return (
    <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img src={gredaLogo} alt="GREDA Green Building" className="h-6 sm:h-8 w-auto" />
            <span className="ml-2 sm:ml-3 text-sm sm:text-xl font-medium text-foreground">GREDA-GBC Assessor Pro</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
              Dashboard
            </Link>
            {((user as any)?.role === "admin" || (user as any)?.role === "assessor") && (
              <>
                <Link href="/assessments/select-client" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
                  New Assessment
                </Link>
                <Link href="/drafts" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
                  Drafts
                </Link>
              </>
            )}
            <Link href="/reports" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors">
              {(user as any)?.role === "client" ? "My Reports" : "Reports"}
            </Link>
            <Link href="/activity-logs" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
              <Activity className="h-4 w-4" />
              Activity
            </Link>
            {(user as any)?.role === "admin" && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>
          
          {/* Mobile and Desktop Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="hidden sm:inline text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              {(user as any)?.firstName && (user as any)?.lastName ? `${(user as any).firstName} ${(user as any).lastName}` : (user as any)?.email || (user as any)?.role}
            </span>
            <NotificationCenter />
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Link href="/profile">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-2">
            <Link 
              href="/" 
              className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {((user as any)?.role === "admin" || (user as any)?.role === "assessor") && (
              <>
                <Link 
                  href="/assessments/select-client" 
                  className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Assessment
                </Link>
                <Link 
                  href="/drafts" 
                  className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Drafts
                </Link>
              </>
            )}
            <Link 
              href="/reports" 
              className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {(user as any)?.role === "client" ? "My Reports" : "Reports"}
            </Link>
            <Link 
              href="/activity-logs" 
              className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Activity Logs
            </Link>
            {(user as any)?.role === "admin" && (
              <Link 
                href="/admin" 
                className="block text-muted-foreground hover:text-foreground py-2 text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}