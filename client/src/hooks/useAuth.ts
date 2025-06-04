import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data
  });

  // If there's a 401 error or no user data, user is not authenticated
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
