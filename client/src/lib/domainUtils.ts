import { useQuery } from "@tanstack/react-query";

interface DomainConfig {
  admin: string;
  assessor: string;
  client: string;
}

// Hook to get domain configuration
export function useDomainConfig() {
  const { data: domains } = useQuery<DomainConfig>({
    queryKey: ["/api/config/domains"],
    retry: false,
  });

  return domains || {
    admin: "www.assessorpro.app",
    assessor: "assessor.portal.assessorpro.app", 
    client: "client.portal.assessorpro.app"
  };
}

// Get current hostname
export function getCurrentHostname(): string {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return '';
}

// Check if we're in development mode
export function isDevelopmentMode(): boolean {
  return getCurrentHostname().includes('replit.dev') || 
         getCurrentHostname() === 'localhost' ||
         process.env.NODE_ENV === 'development';
}

// Get user's correct domain based on their role
export function getUserDomain(role: string, domains: DomainConfig): string {
  switch (role) {
    case "admin":
      return domains.admin;
    case "assessor":
      return domains.assessor;
    case "client":
      return domains.client;
    default:
      return domains.client; // Default to client domain
  }
}

// Get role from current domain
export function getRoleFromDomain(hostname: string, domains: DomainConfig): string | null {
  if (hostname === domains.admin || hostname.includes('www.assessorpro.app')) {
    return "admin";
  }
  if (hostname === domains.assessor || hostname.includes('assessor.portal.assessorpro.app')) {
    return "assessor";
  }
  if (hostname === domains.client || hostname.includes('client.portal.assessorpro.app')) {
    return "client";
  }
  return null;
}

// Check if user should be redirected to their correct domain
export function shouldRedirectToDomain(userRole: string, domains: DomainConfig): string | null {
  // Skip in development mode
  if (isDevelopmentMode()) {
    return null;
  }

  const currentHostname = getCurrentHostname();
  const expectedDomain = getUserDomain(userRole, domains);
  
  if (currentHostname !== expectedDomain) {
    const protocol = window.location.protocol;
    return `${protocol}//${expectedDomain}${window.location.pathname}${window.location.search}`;
  }
  
  return null;
}

// Redirect user to their correct domain
export function redirectToUserDomain(userRole: string, domains: DomainConfig): void {
  const redirectUrl = shouldRedirectToDomain(userRole, domains);
  if (redirectUrl) {
    console.log(`Redirecting ${userRole} user to correct domain: ${redirectUrl}`);
    window.location.href = redirectUrl;
  }
}

// Check if current domain matches expected role
export function validateDomainAccess(userRole: string, domains: DomainConfig): boolean {
  // Always allow in development
  if (isDevelopmentMode()) {
    return true;
  }

  const currentHostname = getCurrentHostname();
  const expectedRole = getRoleFromDomain(currentHostname, domains);
  
  return expectedRole === userRole;
}