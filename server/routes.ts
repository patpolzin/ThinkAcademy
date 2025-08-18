import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DirectStorage } from "./dbDirect";
import { insertUserSchema, insertCourseSchema, insertEnrollmentSchema, insertLiveSessionSchema, insertReminderSchema } from "@shared/schema";
import { z } from "zod";

const directDb = new DirectStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/connect-wallet", async (req, res) => {
    try {
      const { walletAddress, connectedWalletType, tokenBalances } = req.body;
      
      let user = await directDb.getUser(walletAddress);
      
      if (!user) {
        user = await directDb.createUser({
          walletAddress,
          connectedWalletType,
          tokenBalances: tokenBalances || {},
          isEmailAuth: false,
          displayName: `User ${walletAddress.slice(-6)}`
        });
      } else {
        if (user.id) {
          user = await directDb.updateUserTokens(user.id.toString(), tokenBalances || {});
        }
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
      
      // For now, use direct user creation since we don't have getUserByEmail in directDb yet
      let user = await directDb.createUser({
        email,
        walletAddress,
        connectedWalletType: 'privy-email',
        isEmailAuth: true,
        tokenBalances: {},
      });
      
      res.json({ user });
    } catch (error) {
      console.error("Email connection error:", error);
      res.status(500).json({ error: "Failed to connect with email" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await directDb.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.put("/api/users/:walletAddress/profile", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUserProfile(req.params.walletAddress, updates);
      res.json(user);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(req.params.userId);
      res.json(progress);
    } catch (error) {
      console.error("Progress fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

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

  // Instructor-specific routes
  app.get("/api/instructor/courses/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const instructorCourses = await storage.getCoursesByInstructor(walletAddress.toLowerCase());
      res.json(instructorCourses);
    } catch (error) {
      console.error("Instructor courses fetch error:", error);
      res.status(500).json({ error: "Failed to fetch instructor courses" });
    }
  });

  app.get("/api/instructor/analytics/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const analytics = await storage.getInstructorAnalytics(walletAddress.toLowerCase());
      res.json(analytics);
    } catch (error) {
      console.error("Instructor analytics fetch error:", error);
      res.status(500).json({ error: "Failed to fetch instructor analytics" });
    }
  });

  // Admin routes for user management
  app.get("/api/admin/users", async (req, res) => {
    try {
      console.log("Fetching all users for admin panel...");
      const allUsers = await storage.getAllUsers();
      console.log(`Found ${allUsers.length} users`);
      res.json(allUsers);
    } catch (error) {
      console.error("Admin users fetch error:", error);
      res.status(500).json({ error: "Failed to fetch users", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin routes
  app.post("/api/admin/make-admin/:walletAddress", async (req, res) => {
    try {
      // First get or create the user
      let user = await storage.getUser(req.params.walletAddress);
      if (!user) {
        user = await storage.createUser({
          walletAddress: req.params.walletAddress.toLowerCase(),
          displayName: `User ${req.params.walletAddress.slice(-6)}`,
          isAdmin: true
        });
      } else {
        user = await storage.makeUserAdmin(user.id);
      }
      res.json(user);
    } catch (error) {
      console.error("Make admin error:", error);
      res.status(500).json({ error: "Failed to make user admin" });
    }
  });

  app.post("/api/admin/make-instructor/:walletAddress", async (req, res) => {
    try {
      // First get or create the user
      let user = await storage.getUser(req.params.walletAddress);
      if (!user) {
        user = await storage.createUser({
          walletAddress: req.params.walletAddress.toLowerCase(),
          displayName: `Instructor ${req.params.walletAddress.slice(-6)}`,
          isInstructor: true
        });
      } else {
        user = await storage.makeUserInstructor(user.id);
      }
      res.json(user);
    } catch (error) {
      console.error("Make instructor error:", error);
      res.status(500).json({ error: "Failed to make user instructor" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await directDb.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Course fetch error:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await directDb.getCourse(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Course detail fetch error:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await directDb.createCourse(courseData);
      res.json(course);
    } catch (error) {
      console.error("Course creation error:", error);
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
      const enrollments = await directDb.getUserEnrollments(req.params.userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Enrollments fetch error:", error);
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
      console.log("Enrollment request body:", req.body);
      
      // Handle conversion of wallet address to user ID and string courseId to number
      let { userId, courseId, ...rest } = req.body;
      
      // Convert wallet address to user ID if needed
      if (typeof userId === 'string' && userId.startsWith('0x')) {
        const user = await directDb.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        userId = user.id;
      }
      
      // Convert courseId to number if it's a string
      if (typeof courseId === 'string') {
        courseId = parseInt(courseId);
      }
      
      const enrollmentData = { userId, courseId, ...rest };
      console.log("Processed enrollment data:", enrollmentData);
      
      const enrollment = await directDb.createEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error) {
      console.error("Enrollment error:", error);
      res.status(500).json({ error: "Failed to create enrollment", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Live session routes
  app.get("/api/live-sessions", async (req, res) => {
    try {
      const sessions = await directDb.getLiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Live sessions fetch error:", error);
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
      const analytics = await directDb.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      res.status(500).json({ error: "Failed to fetch analytics", details: error instanceof Error ? error.message : 'Unknown error' });
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
      console.log("Reminder request body:", req.body);
      const reminderData = {
        ...req.body,
        reminderTime: new Date(req.body.reminderTime)
      };
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
      console.error("Reminder error:", error);
      res.status(500).json({ error: "Failed to create reminder", details: error instanceof Error ? error.message : 'Unknown error' });
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

  // Lesson routes
  app.get('/api/courses/:courseId/lessons', async (req, res) => {
    try {
      const lessons = await storage.getLessons(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ error: 'Failed to fetch lessons' });
    }
  });

  app.post('/api/courses/:courseId/lessons', async (req, res) => {
    try {
      const lesson = await storage.createLesson({
        ...req.body,
        courseId: req.params.courseId
      });
      res.json(lesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ error: 'Failed to create lesson' });
    }
  });

  app.put('/api/lessons/:id', async (req, res) => {
    try {
      const lesson = await storage.updateLesson(req.params.id, req.body);
      res.json(lesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ error: 'Failed to update lesson' });
    }
  });

  app.delete('/api/lessons/:id', async (req, res) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({ error: 'Failed to delete lesson' });
    }
  });

  // Quiz routes
  app.get('/api/courses/:courseId/quizzes', async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes(req.params.courseId);
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
  });

  app.post('/api/courses/:courseId/quizzes', async (req, res) => {
    try {
      const quiz = await storage.createQuiz({
        ...req.body,
        courseId: req.params.courseId
      });
      res.json(quiz);
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ error: 'Failed to create quiz' });
    }
  });

  // Resource routes
  app.get('/api/courses/:courseId/resources', async (req, res) => {
    try {
      const resources = await storage.getResources(req.params.courseId);
      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });

  app.post('/api/courses/:courseId/resources', async (req, res) => {
    try {
      const resource = await storage.createResource({
        ...req.body,
        courseId: req.params.courseId
      });
      res.json(resource);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ error: 'Failed to create resource' });
    }
  });

  // Forum reply routes
  app.get('/api/forums/:forumId/replies', async (req, res) => {
    try {
      const replies = await storage.getForumReplies(req.params.forumId);
      res.json(replies);
    } catch (error) {
      console.error('Error fetching forum replies:', error);
      res.status(500).json({ error: 'Failed to fetch forum replies' });
    }
  });

  app.post('/api/forums/:forumId/replies', async (req, res) => {
    try {
      const reply = await storage.createForumReply({
        ...req.body,
        forumId: req.params.forumId
      });
      res.json(reply);
    } catch (error) {
      console.error('Error creating forum reply:', error);
      res.status(500).json({ error: 'Failed to create forum reply' });
    }
  });

  // Enrollment management routes
  // Removed duplicate enrollment route - using the one with data conversion above

  app.delete('/api/enrollments/:userId/:courseId', async (req, res) => {
    try {
      await storage.unenrollUser(req.params.userId, req.params.courseId);
      res.status(204).send();
    } catch (error) {
      console.error('Error unenrolling user:', error);
      res.status(500).json({ error: 'Failed to unenroll user' });
    }
  });

  app.get('/api/enrollments/:userId/:courseId/check', async (req, res) => {
    try {
      const isEnrolled = await directDb.checkEnrollment(req.params.userId, req.params.courseId);
      res.json({ isEnrolled });
    } catch (error) {
      console.error('Error checking enrollment:', error);
      res.status(500).json({ error: 'Failed to check enrollment' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
