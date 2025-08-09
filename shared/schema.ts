import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").unique(),
  email: text("email").unique(),
  displayName: text("display_name"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  isEmailAuth: boolean("is_email_auth").default(false),
  connectedWalletType: text("connected_wallet_type"),
  tokenBalances: jsonb("token_balances").$type<Record<string, string>>().default({}),
  isAdmin: boolean("is_admin").default(false),
  isTeacher: boolean("is_teacher").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  instructor: text("instructor").notNull(),
  duration: text("duration"),
  category: text("category"),
  imageUrl: text("image_url"),
  maxStudents: integer("max_students"),
  isActive: boolean("is_active").default(true),
  tokenRequirement: jsonb("token_requirement").$type<{
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    tokenName?: string;
    tokenAddress?: string;
    minAmount?: string;
    options?: Array<{
      type: 'ERC20' | 'NFT';
      tokenName: string;
      tokenAddress: string;
      minAmount: string;
    }>;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0),
  completedLessons: integer("completed_lessons").default(0),
  totalLessons: integer("total_lessons").default(0),
  completedAssignments: integer("completed_assignments").default(0),
  totalAssignments: integer("total_assignments").default(0),
  certificateIssued: boolean("certificate_issued").default(false),
  certificateIssuedAt: timestamp("certificate_issued_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Add reminders table
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
  reminderTime: timestamp("reminder_time").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveSessions = pgTable("live_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  instructor: text("instructor").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").$type<'scheduled' | 'live' | 'ended'>().default('scheduled'),
  maxAttendees: integer("max_attendees").default(100),
  currentAttendees: integer("current_attendees").default(0),
  recordingEnabled: boolean("recording_enabled").default(true),
  roomUrl: text("room_url"),
  recordingUrl: text("recording_url"),
  tokenRequirement: jsonb("token_requirement").$type<{
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    tokenName?: string;
    tokenAddress?: string;
    minAmount?: string;
    options?: Array<{
      type: 'ERC20' | 'NFT';
      tokenName: string;
      tokenAddress: string;
      minAmount: string;
    }>;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  dueDate: timestamp("due_date"),
  points: integer("points").default(100),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").$type<'pending' | 'submitted' | 'graded'>().default('pending'),
  grade: integer("grade"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at"),
  gradedAt: timestamp("graded_at"),
});

export const forums = pgTable("forums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default('Discussion'),
  isResolved: boolean("is_resolved").default(false),
  replies: integer("replies").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  assignmentSubmissions: many(assignmentSubmissions),
  forumPosts: many(forums),
  reminders: many(reminders),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
  liveSessions: many(liveSessions),
  assignments: many(assignments),
  forumPosts: many(forums),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const liveSessionsRelations = relations(liveSessions, ({ one, many }) => ({
  course: one(courses, { fields: [liveSessions.courseId], references: [courses.id] }),
  reminders: many(reminders),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
  session: one(liveSessions, { fields: [reminders.sessionId], references: [liveSessions.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(assignments, { fields: [assignmentSubmissions.assignmentId], references: [assignments.id] }),
  user: one(users, { fields: [assignmentSubmissions.userId], references: [users.id] }),
}));

export const forumsRelations = relations(forums, ({ one }) => ({
  course: one(courses, { fields: [forums.courseId], references: [courses.id] }),
  user: one(users, { fields: [forums.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true, lastAccessedAt: true });
export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertForumSchema = createInsertSchema(forums).omit({ id: true, createdAt: true, lastReplyAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type LiveSession = typeof liveSessions.$inferSelect;
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type Forum = typeof forums.$inferSelect;
export type InsertForum = z.infer<typeof insertForumSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
