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
import LoadingScreen from "@/components/loading-screen";
import Dashboard from "@/pages/dashboard";
import AssessmentForm from "@/pages/assessment-form";
import AssessmentPreview from "@/pages/assessment-preview";
import AssessmentDetail from "@/pages/assessment-detail";
import AssessmentRedirect from "@/pages/assessment-redirect";
import Assessments from "@/pages/assessments";
import AdminDashboard from "@/pages/admin-dashboard";
import AssessorDashboard from "@/pages/assessor-dashboard";
import ClientSelection from "@/pages/client-selection";
import Drafts from "@/pages/drafts";
import Reports from "@/pages/reports";
import InvitationAccept from "@/pages/invitation-accept";
import Portfolio from "@/pages/portfolio";
import Profile from "@/pages/profile";
import ActivityLogs from "@/pages/activity-logs";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const domains = useDomainConfig();

  // Check if we're on admin domain
  const isAdminDomain = !isDevelopmentMode() && 
    (getCurrentHostname() === 'www.assessorpro.app' || getCurrentHostname().includes('www.assessorpro.app'));

  // Handle domain-based redirects when user is authenticated
  // Skip automatic redirects for admin users to allow access to main dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role && !isDevelopmentMode() && user.role !== 'admin') {
      redirectToUserDomain(user.role, domains);
    }
  }, [isAuthenticated, user?.role, domains]);

  // Get current domain's role in production
  const currentDomainRole = isDevelopmentMode() ? null : getRoleFromDomain(getCurrentHostname(), domains);

  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/invitations/:token/accept" component={InvitationAccept} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/login" component={Login} />
      
      {isLoading ? (
        <Route path="*" component={LoadingScreen} />
      ) : !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* In development, show role-specific dashboards based on user role */}
          {isDevelopmentMode() ? (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/assessments/select-client" component={ClientSelection} />
              <Route path="/assessments/new" component={AssessmentForm} />
              <Route path="/assessments/:id/edit" component={AssessmentForm} />
              <Route path="/assessments/:id/preview" component={AssessmentPreview} />
              <Route path="/assessments" component={Assessments} />
              <Route path="/assessment/:id" component={AssessmentDetail} />
              <Route path="/drafts" component={Drafts} />
              <Route path="/reports" component={Reports} />
              <Route path="/profile" component={Profile} />
              <Route path="/activity-logs" component={ActivityLogs} />
              <Route path="/activity" component={ActivityLogs} />
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
              {currentDomainRole === "admin" && user?.role === "admin" ? (
                <>
                  <Route path="/" component={Dashboard} />
                  <Route path="/admin" component={AdminDashboard} />
                  <Route path="/assessments/select-client" component={ClientSelection} />
                  <Route path="/assessments/new" component={AssessmentForm} />
                  <Route path="/assessments/:id/edit" component={AssessmentForm} />
                  <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                  <Route path="/assessments" component={Assessments} />
                  <Route path="/assessment/:id" component={AssessmentDetail} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/activity-logs" component={ActivityLogs} />
                  <Route path="/activity" component={ActivityLogs} />
                </>
              ) : currentDomainRole === "assessor" && user?.role === "assessor" ? (
                <>
                  <Route path="/" component={AssessorDashboard} />
                  <Route path="/assessments/select-client" component={ClientSelection} />
                  <Route path="/assessments/new" component={AssessmentForm} />
                  <Route path="/assessments/:id/edit" component={AssessmentForm} />
                  <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                  <Route path="/assessments" component={Assessments} />
                  <Route path="/assessment/:id" component={AssessmentDetail} />
                  <Route path="/drafts" component={Drafts} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/activity-logs" component={ActivityLogs} />
                  <Route path="/activity" component={ActivityLogs} />
                </>
              ) : currentDomainRole === "client" && user?.role === "client" ? (
                <>
                  <Route path="/" component={Dashboard} />
                  <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                  <Route path="/assessments" component={Assessments} />
                  <Route path="/assessment/:id" component={AssessmentDetail} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/activity-logs" component={ActivityLogs} />
                  <Route path="/activity" component={ActivityLogs} />
                </>
              ) : (
                /* Fallback routes for authenticated users when domain/role don't match */
                <>
                  {user?.role === "admin" && (
                    <>
                      <Route path="/" component={AdminDashboard} />
                      <Route path="/assessments/select-client" component={ClientSelection} />
                      <Route path="/assessments/new" component={AssessmentForm} />
                      <Route path="/assessments/:id/edit" component={AssessmentForm} />
                      <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                      <Route path="/assessments" component={Assessments} />
                      <Route path="/assessment/:id" component={AssessmentDetail} />
                      <Route path="/reports" component={Reports} />
                      <Route path="/profile" component={Profile} />
                    </>
                  )}
                  {user?.role === "assessor" && (
                    <>
                      <Route path="/" component={AssessorDashboard} />
                      <Route path="/assessments/select-client" component={ClientSelection} />
                      <Route path="/assessments/new" component={AssessmentForm} />
                      <Route path="/assessments/:id/edit" component={AssessmentForm} />
                      <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                      <Route path="/assessments" component={Assessments} />
                      <Route path="/assessment/:id" component={AssessmentDetail} />
                      <Route path="/drafts" component={Drafts} />
                      <Route path="/reports" component={Reports} />
                      <Route path="/profile" component={Profile} />
                    </>
                  )}
                  {user?.role === "client" && (
                    <>
                      <Route path="/" component={Dashboard} />
                      <Route path="/assessments/:id/preview" component={AssessmentPreview} />
                      <Route path="/assessments" component={Assessments} />
                      <Route path="/assessment/:id" component={AssessmentDetail} />
                      <Route path="/reports" component={Reports} />
                      <Route path="/profile" component={Profile} />
                    </>
                  )}
                  {/* Default fallback for authenticated users */}
                  {!user?.role && <Route path="/" component={Dashboard} />}
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
