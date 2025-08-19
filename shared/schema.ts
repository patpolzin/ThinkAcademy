import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  walletAddress: varchar("wallet_address", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  connectedWalletType: varchar("connected_wallet_type", { length: 50 }),
  isEmailAuth: boolean("is_email_auth").default(false),
  tokenBalances: jsonb("token_balances").$type<Record<string, string>>().default({}),
  profilePicture: varchar("profile_picture", { length: 500 }),
  contactInfo: jsonb("contact_info").$type<Record<string, string>>().default({}),
  isAdmin: boolean("is_admin").default(false),
  isInstructor: boolean("is_instructor").default(false),
  completedCourses: integer("completed_courses").default(0),
  certificatesEarned: integer("certificates_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  difficulty: varchar("difficulty", { length: 50 }),
  duration: integer("duration").default(0), // Duration in hours
  instructorName: varchar("instructor_name", { length: 255 }),
  instructorId: integer("instructor_id").references(() => users.id),
  tokenRequirement: jsonb("token_requirement").$type<{
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    network?: 'mainnet' | 'base';
    tokenName?: string;
    tokenAddress?: string;
    minAmount?: string;
    options?: Array<{
      type: 'ERC20' | 'NFT';
      network: 'mainnet' | 'base';
      tokenName: string;
      tokenAddress: string;
      minAmount: string;
    }>;
  }>(),
  isActive: boolean("is_active").default(true),
  lessonCount: integer("lesson_count").default(0),
  assignmentCount: integer("assignment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPercentage: integer("progress_percentage").default(0),
  certificateIssued: boolean("certificate_issued").default(false),
});

// Add reminders table
export const reminders = pgTable("reminders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
  reminderTime: timestamp("reminder_time").notNull(),
  webhookUrl: varchar("webhook_url", { length: 500 }),
  isSent: boolean("is_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveSessions = pgTable("live_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructorId: integer("instructor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  sessionUrl: varchar("session_url", { length: 500 }),
  tokenRequirement: jsonb("token_requirement"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(60),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").$type<'pending' | 'submitted' | 'graded'>().default('pending'),
  grade: integer("grade"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at"),
  gradedAt: timestamp("graded_at"),
});

// Extended schema for comprehensive course management
export const lessons = pgTable("lessons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),
  videoUrl: varchar("video_url", { length: 500 }),
  duration: integer("duration"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull().default('[]'),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  isPassed: boolean("is_passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 500 }),
  fileType: varchar("file_type", { length: 50 }),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forumId: varchar("forum_id").notNull().references(() => forums.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isCompleted: boolean("is_completed").default(false),
  watchTime: integer("watch_time").default(0), // in seconds
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  reminders: many(reminders),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
  liveSessions: many(liveSessions),
  assignments: many(assignments),
  forumPosts: many(forums),
  lessons: many(lessons),
  quizzes: many(quizzes),
  resources: many(resources),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const liveSessionsRelations = relations(liveSessions, ({ many }) => ({
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

export const forumsRelations = relations(forums, ({ one, many }) => ({
  course: one(courses, { fields: [forums.courseId], references: [courses.id] }),
  user: one(users, { fields: [forums.userId], references: [users.id] }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  forum: one(forums, { fields: [forumReplies.forumId], references: [forums.id] }),
  user: one(users, { fields: [forumReplies.userId], references: [users.id] }),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
}));

export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizResults.quizId], references: [quizzes.id] }),
  user: one(users, { fields: [quizResults.userId], references: [users.id] }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  course: one(courses, { fields: [resources.courseId], references: [courses.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true, lastAccessedAt: true });
export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true });
export const insertForumSchema = createInsertSchema(forums).omit({ id: true, createdAt: true });
export const insertForumReplySchema = createInsertSchema(forumReplies).omit({ id: true, createdAt: true });
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
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
