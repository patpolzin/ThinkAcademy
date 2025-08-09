import { users, courses, enrollments, liveSessions, assignments, forums, type User, type Course, type Enrollment, type LiveSession, type Assignment, type Forum, type InsertUser, type InsertCourse, type InsertEnrollment, type InsertLiveSession, type InsertAssignment, type InsertForum } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

interface IStorage {
  // Users
  getUser(walletAddress: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  
  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(courseData: InsertCourse): Promise<Course>;
  
  // Enrollments
  getEnrollments(userId: string): Promise<Enrollment[]>;
  createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment>;
  
  // Live Sessions
  getLiveSessions(): Promise<LiveSession[]>;
  createLiveSession(sessionData: InsertLiveSession): Promise<LiveSession>;
  
  // Assignments
  getAssignments(courseId: string): Promise<Assignment[]>;
  createAssignment(assignmentData: InsertAssignment): Promise<Assignment>;
  
  // Forums
  getForumPosts(courseId: string): Promise<Forum[]>;
  createForumPost(forumData: InsertForum): Promise<Forum>;
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

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values([enrollmentData])
      .returning();
    return enrollment;
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    return await db.select().from(liveSessions);
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

  async createForumPost(forumData: InsertForum): Promise<Forum> {
    const [forum] = await db
      .insert(forums)
      .values([forumData])
      .returning();
    return forum;
  }
}

export const storage = new DatabaseStorage();