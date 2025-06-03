import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { Express, RequestHandler } from "express";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "assessor", "client"]).optional(),
});

// Middleware to check if user is authenticated via custom auth
export const isCustomAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.customUserId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Setup custom authentication routes
export function setupCustomAuth(app: Express) {
  // Configure session middleware
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key-for-dev',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  }));
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (user.status !== "active") {
        return res.status(401).json({ message: "Account is not active. Please contact administrator." });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Set session
      req.session.customUserId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        // Get domain configuration for role-based redirection
        const getDomainForRole = (role: string): string => {
          switch (role) {
            case 'admin':
              return 'www.assessorpro.app';
            case 'assessor':
              return 'assessor.portal.assessorpro.app';
            case 'client':
              return 'client.portal.assessorpro.app';
            default:
              return 'www.assessorpro.app';
          }
        };

        const targetDomain = getDomainForRole(user.role);
        const currentDomain = req.hostname;

        // Return user data (without password hash)
        const { passwordHash, ...userResponse } = user;
        
        // In development, skip domain redirection
        if (process.env.NODE_ENV === 'development') {
          res.json(userResponse);
        } else {
          // If user is not on their correct domain, include redirect URL
          if (currentDomain !== targetDomain) {
            const protocol = req.secure ? 'https' : 'http';
            const redirectUrl = `${protocol}://${targetDomain}`;
            
            return res.json({
              ...userResponse,
              redirect: redirectUrl
            });
          }

          res.json(userResponse);
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Register endpoint (for admin use)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = "client" } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user with unique ID
      const userId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.upsertUser({
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        status: "active",
      });

      // Return user data (without password hash)
      const { passwordHash: _, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint for custom auth
  app.get("/api/auth/current-user", isCustomAuthenticated, async (req, res) => {
    try {
      const userId = req.session.customUserId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Return user data (without password hash)
      const { passwordHash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update profile endpoint
  app.put("/api/auth/profile", isCustomAuthenticated, async (req, res) => {
    try {
      const userId = req.session.customUserId;
      const { firstName, lastName, email, organizationName } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        organizationName,
        updatedAt: new Date()
      });

      const { passwordHash, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Reset password endpoint with email notification
  app.post("/api/auth/reset-password", isCustomAuthenticated, async (req, res) => {
    try {
      const userId = req.session.customUserId;
      const { currentPassword, newPassword } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      });

      // Send email notification
      if (user.email) {
        try {
          const { emailService } = await import("./email-service");
          await emailService.sendEmail({
            to: user.email,
            subject: "Password Reset Confirmation - GREDA Assessment Platform",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Password Reset Confirmation</h2>
                <p>Hello ${user.firstName || user.email},</p>
                <p>This email confirms that your password has been successfully reset for your GREDA Assessment Platform account.</p>
                <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; color: #065f46;"><strong>Account Details:</strong></p>
                  <p style="margin: 8px 0 0 0; color: #065f46;">Email: ${user.email}</p>
                  <p style="margin: 4px 0 0 0; color: #065f46;">Role: ${user.role}</p>
                  <p style="margin: 4px 0 0 0; color: #065f46;">Reset Time: ${new Date().toLocaleString()}</p>
                </div>
                <p>If you did not initiate this password reset, please contact our support team immediately.</p>
                <p>For security reasons, we recommend:</p>
                <ul>
                  <li>Using a strong, unique password</li>
                  <li>Not sharing your credentials with anyone</li>
                  <li>Logging out of shared devices</li>
                </ul>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This email was sent from the GREDA Assessment Platform. If you have questions, please contact our support team.
                </p>
              </div>
            `,
            text: `
Password Reset Confirmation

Hello ${user.firstName || user.email},

This email confirms that your password has been successfully reset for your GREDA Assessment Platform account.

Account Details:
- Email: ${user.email}
- Role: ${user.role}
- Reset Time: ${new Date().toLocaleString()}

If you did not initiate this password reset, please contact our support team immediately.

For security reasons, we recommend using a strong, unique password and not sharing your credentials with anyone.
            `
          });
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          // Don't fail the password reset if email fails
        }
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}