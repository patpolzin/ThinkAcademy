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
  makeUserInstructor(id: string): Promise<User>;
  updateUserProfile(walletAddress: string, updates: Partial<InsertUser>): Promise<User>;
  getUserProgress(userId: string): Promise<{
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalCertificatesEarned: number;
    recentEnrollments: Enrollment[];
  }>;
  
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
    try {
      const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase()));
      return user || undefined;
    } catch (error) {
      console.error('Database error getting user:', error);
      return undefined;
    }
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
    // Get current user data to merge with updates for completion calculation
    const currentUser = await this.getUserById(id);
    const mergedData = { ...currentUser, ...updates };
    
    const [user] = await db.update(users)
      .set({
        ...updates,
        lastLoginAt: new Date(),
        profileCompletionScore: this.calculateProfileCompletion(mergedData)
      })
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

  async makeUserInstructor(id: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ isInstructor: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(walletAddress: string, updates: Partial<InsertUser>): Promise<User> {
    // Get current user data to merge with updates for completion calculation
    const currentUser = await this.getUser(walletAddress);
    const mergedData = { ...currentUser, ...updates };
    
    const [user] = await db.update(users)
      .set({ 
        ...updates,
        lastLoginAt: new Date(),
        profileCompletionScore: this.calculateProfileCompletion(mergedData)
      })
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .returning();
    return user;
  }

  private calculateProfileCompletion(userData: Partial<InsertUser>): number {
    let score = 0;
    if (userData.displayName) score += 20;
    if (userData.bio) score += 20;
    if (userData.profilePicture) score += 20;
    if (userData.contactEmail) score += 20;
    if (userData.contactPhone) score += 20;
    return score;
  }

  async getUserProgress(userId: string): Promise<{
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalCertificatesEarned: number;
    recentEnrollments: Enrollment[];
  }> {
    const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    const completedCourses = userEnrollments.filter(e => (e.progress || 0) >= 100);
    const certificatesEarned = userEnrollments.filter(e => e.certificateIssued);
    const recentEnrollments = userEnrollments.slice(-5);

    return {
      totalCoursesEnrolled: userEnrollments.length,
      totalCoursesCompleted: completedCourses.length,
      totalCertificatesEarned: certificatesEarned.length,
      recentEnrollments
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getCoursesByInstructor(walletAddress: string): Promise<Course[]> {
    // For now, return courses created by this instructor user
    const instructorUser = await this.getUserByWalletAddress(walletAddress);
    if (!instructorUser?.isInstructor) {
      return [];
    }
    
    // Return courses where instructor contains the display name or wallet
    return await db.select().from(courses).where(
      sql`${courses.instructor} LIKE '%${instructorUser.displayName || 'Instructor'}%' OR ${courses.instructor} LIKE '%${walletAddress.slice(-6)}%'`
    );
  }

  async getInstructorAnalytics(walletAddress: string): Promise<{
    totalStudents: number;
    avgCompletion: number;
    totalRevenue: number;
    activeCourses: number;
  }> {
    try {
      const instructorCourses = await this.getCoursesByInstructor(walletAddress);
      const courseIds = instructorCourses.map(c => c.id);
      
      if (courseIds.length === 0) {
        return { totalStudents: 0, avgCompletion: 0, totalRevenue: 0, activeCourses: 0 };
      }
      
      let courseEnrollments: any[] = [];
      if (courseIds.length > 0) {
        for (const courseId of courseIds) {
          const enrolls = await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
          courseEnrollments.push(...enrolls);
        }
      }
      
      const totalStudents = new Set(courseEnrollments.map(e => e.userId)).size;
      const avgCompletion = courseEnrollments.length > 0 ? 
        courseEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / courseEnrollments.length : 0;
      
      return {
        totalStudents,
        avgCompletion: Math.round(avgCompletion),
        totalRevenue: 0, // To be implemented with payment system
        activeCourses: instructorCourses.filter(c => c.isActive).length
      };
    } catch (error) {
      console.error("Instructor analytics error:", error);
      return { totalStudents: 0, avgCompletion: 0, totalRevenue: 0, activeCourses: 0 };
    }
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
    try {
      // Ensure token requirement has proper type
      const tokenReq = courseData.tokenRequirement as any;
      const safeTokenRequirement = {
        type: (tokenReq?.type as 'NONE' | 'ERC20' | 'NFT' | 'EITHER') || 'NONE',
        tokenName: tokenReq?.tokenName || undefined,
        tokenAddress: tokenReq?.tokenAddress || undefined,
        minAmount: tokenReq?.minAmount || undefined
      };
      
      const [course] = await db
        .insert(courses)
        .values([{
          ...courseData,
          tokenRequirement: safeTokenRequirement
        }])
        .returning();
      return course;
    } catch (error) {
      console.error("Course creation error:", error);
      throw error;
    }
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
    try {
      // Use simple queries instead of complex SQL to avoid compatibility issues
      const allUsers = await db.select().from(users);
      const allCourses = await db.select().from(courses).where(eq(courses.isActive, true));
      const allEnrollments = await db.select().from(enrollments);
      
      const avgProgress = allEnrollments.length > 0 ? 
        allEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / allEnrollments.length : 0;
      
      return {
        totalStudents: allUsers.length,
        activeCourses: allCourses.length,
        totalEnrollments: allEnrollments.length,
        avgCompletionRate: Math.round(avgProgress)
      };
    } catch (error) {
      console.error("Analytics error:", error);
      // Return safe defaults if query fails
      return {
        totalStudents: 0,
        activeCourses: 0,
        totalEnrollments: 0,
        avgCompletionRate: 0
      };
    }
  }
}

export const storage = new DatabaseStorage();