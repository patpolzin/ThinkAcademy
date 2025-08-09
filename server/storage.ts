import { users, courses, enrollments, liveSessions, assignments, forums, reminders, type User, type Course, type Enrollment, type LiveSession, type Assignment, type Forum, type Reminder, type InsertUser, type InsertCourse, type InsertEnrollment, type InsertLiveSession, type InsertAssignment, type InsertForum, type InsertReminder } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

interface IStorage {
  // Users
  getUser(walletAddress: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserTokens(id: string, tokens: Record<string, string>): Promise<User>;
  makeUserAdmin(id: string): Promise<User>;
  makeUserTeacher(id: string): Promise<User>;
  
  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(courseData: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  
  // Enrollments
  getEnrollments(userId: string): Promise<Enrollment[]>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<Enrollment>;
  issueCertificate(enrollmentId: string): Promise<Enrollment>;
  
  // Live Sessions
  getLiveSessions(): Promise<LiveSession[]>;
  getLiveSession(id: string): Promise<LiveSession | undefined>;
  createLiveSession(sessionData: InsertLiveSession): Promise<LiveSession>;
  updateLiveSessionStatus(id: string, status: 'scheduled' | 'live' | 'ended', attendees?: number): Promise<LiveSession>;
  
  // Assignments
  getAssignments(courseId: string): Promise<Assignment[]>;
  createAssignment(assignmentData: InsertAssignment): Promise<Assignment>;
  
  // Forums
  getForumPosts(courseId: string): Promise<Forum[]>;
  getForumPostsByCourse(courseId: string): Promise<Forum[]>;
  createForumPost(forumData: InsertForum): Promise<Forum>;
  
  // Reminders
  getUserReminders(userId: string): Promise<Reminder[]>;
  createReminder(reminderData: InsertReminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalStudents: number;
    activeCourses: number;
    totalEnrollments: number;
    avgCompletionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase()));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return this.getUser(walletAddress);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserTokens(id: string, tokens: Record<string, string>): Promise<User> {
    const [user] = await db.update(users)
      .set({ tokenBalances: tokens })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async makeUserAdmin(id: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async makeUserTeacher(id: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ isTeacher: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([{
        ...userData,
        walletAddress: userData.walletAddress?.toLowerCase() || null
      }])
      .returning();
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values([courseData])
      .returning();
    return course;
  }

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return this.getEnrollments(userId);
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course> {
    const [course] = await db.update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.update(courses)
      .set({ isActive: false })
      .where(eq(courses.id, id));
  }

  async updateLiveSessionStatus(id: string, status: 'scheduled' | 'live' | 'ended', attendees?: number): Promise<LiveSession> {
    const updateData: any = { status };
    if (attendees !== undefined) {
      updateData.currentAttendees = attendees;
    }
    
    const [session] = await db.update(liveSessions)
      .set(updateData)
      .where(eq(liveSessions.id, id))
      .returning();
    return session;
  }

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    try {
      const [enrollment] = await db
        .insert(enrollments)
        .values(enrollmentData)
        .returning();
      return enrollment;
    } catch (error) {
      console.error('Database error creating enrollment:', error);
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }
  }

  async updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    const [enrollment] = await db.update(enrollments)
      .set({ 
        progress,
        lastAccessedAt: new Date(),
        ...(progress >= 100 ? { certificateIssued: true, certificateIssuedAt: new Date() } : {})
      })
      .where(eq(enrollments.id, enrollmentId))
      .returning();
    return enrollment;
  }

  async issueCertificate(enrollmentId: string): Promise<Enrollment> {
    const [enrollment] = await db.update(enrollments)
      .set({ 
        certificateIssued: true,
        certificateIssuedAt: new Date()
      })
      .where(eq(enrollments.id, enrollmentId))
      .returning();
    return enrollment;
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    return await db.select().from(liveSessions);
  }

  async getLiveSession(id: string): Promise<LiveSession | undefined> {
    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, id));
    return session || undefined;
  }

  async createLiveSession(sessionData: InsertLiveSession): Promise<LiveSession> {
    const [session] = await db
      .insert(liveSessions)
      .values([sessionData])
      .returning();
    return session;
  }

  async getAssignments(courseId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async createAssignment(assignmentData: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values([assignmentData])
      .returning();
    return assignment;
  }

  async getForumPosts(courseId: string): Promise<Forum[]> {
    return await db.select().from(forums).where(eq(forums.courseId, courseId));
  }

  async getForumPostsByCourse(courseId: string): Promise<Forum[]> {
    return this.getForumPosts(courseId);
  }

  async createForumPost(forumData: InsertForum): Promise<Forum> {
    const [forum] = await db
      .insert(forums)
      .values([forumData])
      .returning();
    return forum;
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(and(eq(reminders.userId, userId), eq(reminders.isActive, true)));
  }

  async createReminder(reminderData: InsertReminder): Promise<Reminder> {
    try {
      const [reminder] = await db
        .insert(reminders)
        .values(reminderData)
        .returning();
      return reminder;
    } catch (error) {
      console.error('Database error creating reminder:', error);
      throw new Error(`Failed to create reminder: ${error.message}`);
    }
  }

  async deleteReminder(id: string): Promise<void> {
    await db.update(reminders)
      .set({ isActive: false })
      .where(eq(reminders.id, id));
  }

  async getAnalytics(): Promise<{
    totalStudents: number;
    activeCourses: number;
    totalEnrollments: number;
    avgCompletionRate: number;
  }> {
    const [stats] = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT c.id) as active_courses,
        COUNT(DISTINCT e.id) as total_enrollments,
        COALESCE(AVG(e.progress), 0) as avg_completion_rate
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id
      LEFT JOIN courses c ON c.is_active = true
    `);
    
    return {
      totalStudents: Number(stats.total_students) || 0,
      activeCourses: Number(stats.active_courses) || 0,
      totalEnrollments: Number(stats.total_enrollments) || 0,
      avgCompletionRate: Number(stats.avg_completion_rate) || 0
    };
  }
}

export const storage = new DatabaseStorage();