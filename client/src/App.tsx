import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AssessmentForm from "@/pages/assessment-form";
import AssessmentPreview from "@/pages/assessment-preview";
import AssessmentDetail from "@/pages/assessment-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientSelection from "@/pages/client-selection";
import Drafts from "@/pages/drafts";
import InvitationAccept from "@/pages/invitation-accept";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Switch>
      {/* Public invitation route - no authentication required */}
      <Route path="/invitations/:token/accept" component={InvitationAccept} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/assessments/select-client" component={ClientSelection} />
          <Route path="/assessments/new" component={AssessmentForm} />
          <Route path="/assessments/:id/preview" component={AssessmentPreview} />
          <Route path="/assessments/:id" component={AssessmentDetail} />
          <Route path="/drafts" component={Drafts} />
          {user?.role === "admin" && (
            <Route path="/admin" component={AdminDashboard} />
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
