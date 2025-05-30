import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data
  });

  // If there's a 401 error or no user data, user is not authenticated
  const isAuthenticated = !!user && !error && error?.message !== "Unauthorized";

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
