import type { RequestHandler } from "express";
import { storage } from "./storage";

// Domain configuration
const DOMAIN_CONFIG = {
  admin: "www.assessorpro.app",
  assessor: "assessor.portal.assessorpro.app", 
  client: "client.portal.assessorpro.app"
};

// Get user's correct domain based on their role
function getUserDomain(role: string): string {
  switch (role) {
    case "admin":
      return DOMAIN_CONFIG.admin;
    case "assessor":
      return DOMAIN_CONFIG.assessor;
    case "client":
      return DOMAIN_CONFIG.client;
    default:
      return DOMAIN_CONFIG.client; // Default to client domain
  }
}

// Get role from domain
function getRoleFromDomain(hostname: string): string | null {
  if (hostname === DOMAIN_CONFIG.admin || hostname.includes('www.assessorpro.app')) {
    return "admin";
  }
  if (hostname === DOMAIN_CONFIG.assessor || hostname.includes('assessor.portal.assessorpro.app')) {
    return "assessor";
  }
  if (hostname === DOMAIN_CONFIG.client || hostname.includes('client.portal.assessorpro.app')) {
    return "client";
  }
  return null;
}

// Check if user is on correct domain for their role
export const domainRoleMiddleware: RequestHandler = async (req, res, next) => {
  // Skip domain checks for API routes and development
  if (req.path.startsWith('/api/') || 
      req.hostname.includes('replit.dev') || 
      req.hostname === 'localhost' ||
      process.env.NODE_ENV === 'development') {
    return next();
  }

  // Skip if user is not authenticated
  if (!req.user) {
    return next();
  }

  try {
    const userSession = req.user as any;
    const userId = userSession.claims?.sub;
    
    if (!userId) {
      return next();
    }

    // Get user data to check role
    const user = await storage.getUser(userId);
    if (!user) {
      return next();
    }

    const userRole = user.role;
    const currentDomain = req.hostname;
    const expectedDomain = getUserDomain(userRole);
    
    // Allow admins to access any domain without redirecting
    // Only redirect non-admin users if they're on wrong domain
    if (userRole !== 'admin' && currentDomain !== expectedDomain) {
      const protocol = req.secure ? 'https' : 'http';
      const redirectUrl = `${protocol}://${expectedDomain}${req.originalUrl}`;
      
      console.log(`Redirecting ${userRole} user from ${currentDomain} to ${expectedDomain}`);
      return res.redirect(302, redirectUrl);
    }

    next();
  } catch (error) {
    console.error('Domain routing error:', error);
    next(); // Continue on error to avoid breaking the app
  }
};

// Middleware to validate domain access based on role
export const validateDomainAccess: RequestHandler = async (req, res, next) => {
  // Skip validation for API routes and development
  if (req.path.startsWith('/api/') || 
      req.hostname.includes('replit.dev') || 
      req.hostname === 'localhost' ||
      process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const expectedRole = getRoleFromDomain(req.hostname);
    
    // If we can't determine role from domain, allow access
    if (!expectedRole) {
      return next();
    }

    // Skip if user is not authenticated
    if (!req.user) {
      return next();
    }

    const userSession = req.user as any;
    const userId = userSession.claims?.sub;
    
    if (!userId) {
      return next();
    }

    // Get user data to check role
    const user = await storage.getUser(userId);
    if (!user) {
      return next();
    }

    // Check if user's role matches domain
    if (user.role !== expectedRole) {
      const correctDomain = getUserDomain(user.role);
      const protocol = req.secure ? 'https' : 'http';
      const redirectUrl = `${protocol}://${correctDomain}/`;
      
      console.log(`Access denied: ${user.role} user on ${expectedRole} domain, redirecting to ${correctDomain}`);
      return res.redirect(302, redirectUrl);
    }

    next();
  } catch (error) {
    console.error('Domain access validation error:', error);
    next(); // Continue on error
  }
};

// Get domain configuration for frontend
export function getDomainConfig() {
  return DOMAIN_CONFIG;
}

export { getUserDomain, getRoleFromDomain };