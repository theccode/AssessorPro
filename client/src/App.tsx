import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useDomainConfig, redirectToUserDomain, getCurrentHostname, isDevelopmentMode, getRoleFromDomain } from "@/lib/domainUtils";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import AssessmentForm from "@/pages/assessment-form";
import AssessmentPreview from "@/pages/assessment-preview";
import AssessmentDetail from "@/pages/assessment-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import AssessorDashboard from "@/pages/assessor-dashboard";
import ClientSelection from "@/pages/client-selection";
import Drafts from "@/pages/drafts";
import Reports from "@/pages/reports";
import InvitationAccept from "@/pages/invitation-accept";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const domains = useDomainConfig();

  // Handle domain-based redirects when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role && !isDevelopmentMode()) {
      redirectToUserDomain(user.role, domains);
    }
  }, [isAuthenticated, user?.role, domains]);

  // Get current domain's role in production
  const currentDomainRole = isDevelopmentMode() ? null : getRoleFromDomain(getCurrentHostname(), domains);

  return (
    <Switch>
      {/* Public invitation route - no authentication required */}
      <Route path="/invitations/:token/accept" component={InvitationAccept} />
      <Route path="/login" component={Login} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* In development, show role-specific dashboards based on user role */}
          {isDevelopmentMode() ? (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/assessments/select-client" component={ClientSelection} />
              <Route path="/assessments/new" component={AssessmentForm} />
              <Route path="/assessments/:id/preview" component={AssessmentPreview} />
              <Route path="/assessments/:id/edit" component={AssessmentForm} />
              <Route path="/assessments/:id" component={AssessmentDetail} />
              <Route path="/drafts" component={Drafts} />
              <Route path="/reports" component={Reports} />
              {user?.role === "admin" && (
                <Route path="/admin" component={AdminDashboard} />
              )}
              {user?.role === "assessor" && (
                <Route path="/assessor" component={AssessorDashboard} />
              )}
            </>
          ) : (
            /* In production, show content based on current domain */
            <>
              {currentDomainRole === "admin" && user?.role === "admin" && (
                <>
                  <Route path="/" component={AdminDashboard} />
                  <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                  <Route path="/assessments/:id" component={AssessmentDetail} />
                  <Route path="/reports" component={Reports} />
                </>
              )}
              {currentDomainRole === "assessor" && user?.role === "assessor" && (
                <>
                  <Route path="/" component={AssessorDashboard} />
                  <Route path="/assessments/select-client" component={ClientSelection} />
                  <Route path="/assessments/new" component={AssessmentForm} />
                  <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                  <Route path="/assessments/:id/edit" component={AssessmentForm} />
                  <Route path="/assessments/:id" component={AssessmentDetail} />
                  <Route path="/drafts" component={Drafts} />
                  <Route path="/reports" component={Reports} />
                </>
              )}
              {currentDomainRole === "client" && user?.role === "client" && (
                <>
                  <Route path="/" component={Dashboard} />
                  <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                  <Route path="/assessments/:id" component={AssessmentDetail} />
                  <Route path="/reports" component={Reports} />
                </>
              )}
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
