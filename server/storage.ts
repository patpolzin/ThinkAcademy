import { 
  users, courses, enrollments, liveSessions, assignments, assignmentSubmissions, forums,
  type User, type InsertUser, type Course, type InsertCourse, 
  type Enrollment, type InsertEnrollment, type LiveSession, type InsertLiveSession,
  type Assignment, type InsertAssignment, type Forum, type InsertForum
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(id: string, tokens: Record<string, string>): Promise<User>;

  // Course management
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Enrollment management
  getEnrollmentsByUser(userId: string): Promise<(Enrollment & { course: Course })[]>;
  getEnrollmentsByCourse(courseId: string): Promise<(Enrollment & { user: User })[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(id: string, progress: number, completedLessons: number): Promise<Enrollment>;

  // Live session management
  getLiveSessions(): Promise<LiveSession[]>;
  getLiveSession(id: string): Promise<LiveSession | undefined>;
  createLiveSession(session: InsertLiveSession): Promise<LiveSession>;
  updateLiveSessionStatus(id: string, status: 'scheduled' | 'live' | 'ended', attendees?: number): Promise<LiveSession>;

  // Assignment management
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  // Forum management
  getForumPostsByCourse(courseId: string): Promise<(Forum & { user: User })[]>;
  createForumPost(post: InsertForum): Promise<Forum>;

  // Analytics
  getAnalytics(): Promise<{
    totalStudents: number;
    activeCourses: number;
    totalEnrollments: number;
    avgCompletionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserTokens(id: string, tokens: Record<string, string>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ tokenBalances: tokens })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true)).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values([course])
      .returning();
    return newCourse;
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ 
        ...updates, 
        tokenRequirement: updates.tokenRequirement as any,
        updatedAt: new Date() 
      })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.update(courses).set({ isActive: false }).where(eq(courses.id, id));
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.lastAccessedAt));
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db
      .insert(enrollments)
      .values([enrollment])
      .returning();
    return newEnrollment;
  }

  async updateEnrollmentProgress(id: string, progress: number, completedLessons: number): Promise<Enrollment> {
    const [enrollment] = await db
      .update(enrollments)
      .set({ 
        progress, 
        completedLessons,
        lastAccessedAt: new Date()
      })
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    return await db.select().from(liveSessions).orderBy(liveSessions.scheduledTime);
  }

  async getLiveSession(id: string): Promise<LiveSession | undefined> {
    const [session] = await db.select().from(liveSessions).where(eq(liveSessions.id, id));
    return session || undefined;
  }

  async createLiveSession(session: InsertLiveSession): Promise<LiveSession> {
    const [newSession] = await db
      .insert(liveSessions)
      .values([session])
      .returning();
    return newSession;
  }

  async updateLiveSessionStatus(id: string, status: 'scheduled' | 'live' | 'ended', attendees?: number): Promise<LiveSession> {
    const updates: any = { status };
    if (attendees !== undefined) {
      updates.currentAttendees = attendees;
    }
    
    const [session] = await db
      .update(liveSessions)
      .set(updates)
      .where(eq(liveSessions.id, id))
      .returning();
    return session;
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db
      .insert(assignments)
      .values([assignment])
      .returning();
    return newAssignment;
  }

  async getForumPostsByCourse(courseId: string): Promise<Forum[]> {
    return await db
      .select()
      .from(forums)
      .where(eq(forums.courseId, courseId))
      .orderBy(desc(forums.createdAt));
  }

  async createForumPost(post: InsertForum): Promise<Forum> {
    const [newPost] = await db
      .insert(forums)
      .values([post])
      .returning();
    return newPost;
  }

  async getAnalytics(): Promise<{
    totalStudents: number;
    activeCourses: number;
    totalEnrollments: number;
    avgCompletionRate: number;
  }> {
    const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [coursesCount] = await db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.isActive, true));
    const [enrollmentsCount] = await db.select({ count: sql<number>`count(*)` }).from(enrollments);
    const [avgProgress] = await db.select({ avg: sql<number>`avg(${enrollments.progress})` }).from(enrollments);

    return {
      totalStudents: studentsCount.count,
      activeCourses: coursesCount.count,
      totalEnrollments: enrollmentsCount.count,
      avgCompletionRate: Math.round(avgProgress.avg || 0),
    };
  }
}

export const storage = new DatabaseStorage();
