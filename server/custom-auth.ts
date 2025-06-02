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
      console.log("Login attempt for:", req.body.email);
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? "Yes" : "No");
      if (!user || !user.passwordHash) {
        console.log("Login failed: User not found or no password hash");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      console.log("User status:", user.status);
      if (user.status !== "active") {
        console.log("Login failed: User not active");
        return res.status(401).json({ message: "Account is not active. Please contact administrator." });
      }

      // Verify password
      console.log("Verifying password...");
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      console.log("Password valid:", isValidPassword);
      if (!isValidPassword) {
        console.log("Login failed: Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Set session
      console.log("Session object:", req.session ? "exists" : "undefined");
      if (!req.session) {
        console.error("Session object is undefined");
        return res.status(500).json({ message: "Session not initialized" });
      }

      req.session.customUserId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        console.log("Login successful for user:", user.email);
        // Return user data (without password hash)
        const { passwordHash, ...userResponse } = user;
        res.json(userResponse);
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
}