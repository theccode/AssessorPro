import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Building, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  buildingName?: string;
}

export default function ClientSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  


  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (clientData: { id: string; buildingName?: string; firstName: string; lastName: string }) => {
      const response = await apiRequest("/api/assessments", "POST", {
        clientId: clientData.id,
        buildingName: clientData.buildingName || "Building Assessment",
        clientName: `${clientData.firstName} ${clientData.lastName}`,
        status: "draft"
      });
      return await response.json();
    },
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      setLocation(`/assessments/${assessment.publicId}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClientSelect = (client: Client) => {
    createAssessmentMutation.mutate({
      id: client.id,
      buildingName: client.buildingName,
      firstName: client.firstName,
      lastName: client.lastName
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <img src={gredaLogo} alt="GREDA Logo" className="h-8 w-8" />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">GREDA-GBC Assessor Pro</h1>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Select Client</span>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Create New Assessment</h2>
            <p className="text-muted-foreground">
              Select a client to create an assessment for
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-12 h-12 bg-muted rounded-full mb-3"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : clients?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Clients Available</h3>
                <p className="text-muted-foreground mb-6">
                  You need to have clients in the system before creating assessments.
                </p>
                <Button asChild>
                  <Link href="/admin">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Clients
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients?.map((client: Client) => (
                <Card 
                  key={client.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-primary"
                  onClick={() => handleClientSelect(client)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        {client.organizationName ? (
                          <Building className="w-6 h-6 text-primary" />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {client.firstName} {client.lastName}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {client.email}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {client.buildingName && (
                        <div className="p-2 bg-primary/10 rounded-md">
                          <p className="text-sm font-medium text-primary">Building</p>
                          <p className="text-sm truncate font-semibold">{client.buildingName}</p>
                        </div>
                      )}
                      {client.organizationName && (
                        <div className="p-2 bg-muted rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Organization</p>
                          <p className="text-sm truncate">{client.organizationName}</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {createAssessmentMutation.isPending && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p>Creating assessment...</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}