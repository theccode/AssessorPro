import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function AssessmentRedirect() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  // Fetch all assessments to find the one with matching internal ID
  const { data: assessments } = useQuery({
    queryKey: ["/api/assessments"],
  });

  useEffect(() => {
    if (assessments && id) {
      // Find assessment with matching internal ID
      const assessment = (assessments as any[]).find((a: any) => a.id === parseInt(id));
      
      if (assessment?.publicId) {
        // Redirect to new UUID-based URL
        navigate(`/assessments/${assessment.publicId}/preview`);
      } else {
        // If not found, redirect to assessments list
        navigate("/assessments");
      }
    }
  }, [assessments, id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to assessment...</p>
      </div>
    </div>
  );
}