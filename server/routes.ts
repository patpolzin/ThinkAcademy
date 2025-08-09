import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCourseSchema, insertEnrollmentSchema, insertLiveSessionSchema, insertReminderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/connect-wallet", async (req, res) => {
    try {
      const { walletAddress, connectedWalletType, tokenBalances } = req.body;
      
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        user = await storage.createUser({
          walletAddress,
          connectedWalletType,
          tokenBalances: tokenBalances || {},
          isEmailAuth: false,
        });
      } else {
        user = await storage.updateUserTokens(user.id, tokenBalances || {});
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Wallet connection error:", error);
      res.status(500).json({ error: "Failed to connect wallet" });
    }
  });

  app.post("/api/auth/connect-email", async (req, res) => {
    try {
      const { email, walletAddress } = req.body;
      
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        user = await storage.createUser({
          email,
          walletAddress,
          connectedWalletType: 'privy-email',
          isEmailAuth: true,
          tokenBalances: {},
        });
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Email connection error:", error);
      res.status(500).json({ error: "Failed to connect with email" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { displayName, profilePicture, bio } = req.body;
      const user = await storage.updateUser(req.params.id, { displayName, profilePicture, bio });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  app.put("/api/users/:id/tokens", async (req, res) => {
    try {
      const { tokenBalances } = req.body;
      const user = await storage.updateUserTokens(req.params.id, tokenBalances);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update token balances" });
    }
  });

  // Admin routes
  app.post("/api/admin/make-admin/:id", async (req, res) => {
    try {
      const user = await storage.makeUserAdmin(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to make user admin" });
    }
  });

  app.post("/api/admin/make-teacher/:id", async (req, res) => {
    try {
      const user = await storage.makeUserTeacher(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to make user teacher" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid course data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const updates = req.body;
      const course = await storage.updateCourse(req.params.id, updates);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments/user/:userId", async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.params.userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.put("/api/enrollments/:id/progress", async (req, res) => {
    try {
      const { progress } = req.body;
      const enrollment = await storage.updateEnrollmentProgress(req.params.id, progress);
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.post("/api/enrollments/:id/certificate", async (req, res) => {
    try {
      const enrollment = await storage.issueCertificate(req.params.id);
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to issue certificate" });
    }
  });

  app.get("/api/enrollments/course/:courseId", async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByCourse(req.params.courseId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course enrollments" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid enrollment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  // Live session routes
  app.get("/api/live-sessions", async (req, res) => {
    try {
      const sessions = await storage.getLiveSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch live sessions" });
    }
  });

  app.post("/api/live-sessions", async (req, res) => {
    try {
      const sessionData = insertLiveSessionSchema.parse(req.body);
      const session = await storage.createLiveSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create live session" });
    }
  });

  app.put("/api/live-sessions/:id/status", async (req, res) => {
    try {
      const { status, attendees } = req.body;
      const session = await storage.updateLiveSessionStatus(req.params.id, status, attendees);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session status" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Forum routes
  app.get("/api/forums/course/:courseId", async (req, res) => {
    try {
      const posts = await storage.getForumPostsByCourse(req.params.courseId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forum posts" });
    }
  });

  // Reminder routes
  app.get("/api/reminders/user/:userId", async (req, res) => {
    try {
      const reminders = await storage.getUserReminders(req.params.userId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const reminderData = req.body;
      const reminder = await storage.createReminder(reminderData);

      // Trigger webhook for Make.com integration
      try {
        const user = await storage.getUser(reminderData.userId);
        const session = await storage.getLiveSession(reminderData.sessionId);
        
        if (user && session) {
          const reminderTimeMs = new Date(reminderData.reminderTime).getTime();
          const sessionTimeMs = new Date(session.scheduledTime).getTime();
          const minutesBefore = Math.round((sessionTimeMs - reminderTimeMs) / 60000);

          const webhookData = {
            type: 'reminder_created',
            userId: reminderData.userId,
            userEmail: user.contactEmail || user.email,
            userPhone: user.contactPhone,
            preferredContactMethod: user.preferredContactMethod || 'email',
            sessionTitle: session.title,
            sessionTime: session.scheduledTime,
            reminderTime: reminderData.reminderTime,
            minutesBefore: minutesBefore,
            message: `Reminder: "${session.title}" starts in ${minutesBefore} minutes at ${new Date(session.scheduledTime).toLocaleString()}`
          };

          // Send to Make.com webhook - add MAKE_WEBHOOK_URL to your environment variables
          const webhookUrl = process.env.MAKE_WEBHOOK_URL;
          if (webhookUrl) {
            console.log('Sending reminder webhook to Make.com:', webhookData);
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookData)
            });
          } else {
            console.log('Webhook data ready for Make.com:', webhookData);
          }
        }
      } catch (webhookError) {
        console.error('Webhook error (non-critical):', webhookError);
        // Don't fail the reminder creation if webhook fails
      }

      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      await storage.deleteReminder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
