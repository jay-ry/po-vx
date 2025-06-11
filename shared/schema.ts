import { pgTable, text, serial, integer, boolean, timestamp, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: json("permissions"), // For future permission-based access control
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

// Role Mandatory Courses - courses that are automatically assigned to users with specific roles
export const roleMandatoryCourses = pgTable("role_mandatory_courses", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    roleIdCourseIdUnique: unique("role_mandatory_courses_role_id_course_id").on(table.roleId, table.courseId),
  };
});

export const insertRoleMandatoryCourseSchema = createInsertSchema(roleMandatoryCourses).omit({
  id: true,
  createdAt: true,
});

export type InsertRoleMandatoryCourse = z.infer<typeof insertRoleMandatoryCourseSchema>;
export type RoleMandatoryCourse = typeof roleMandatoryCourses.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("frontliner"),
  xpPoints: integer("xp_points").notNull().default(0),
  avatar: text("avatar"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  xpPoints: true,
  createdAt: true,
});

// Training Areas
export const trainingAreas = pgTable("training_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrainingAreaSchema = createInsertSchema(trainingAreas).omit({
  id: true,
  createdAt: true,
});

// Modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  trainingAreaId: integer("training_area_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

// Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  duration: integer("duration").notNull(), // in minutes
  level: text("level").notNull().default("beginner"), // beginner, intermediate, advanced
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

// Units
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  duration: integer("duration").notNull().default(30), // in minutes
  xpPoints: integer("xp_points").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
});

// Learning Blocks
export const learningBlocks = pgTable("learning_blocks", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  type: text("type").notNull(), // video, text, interactive, scorm, image
  title: text("title").notNull(),
  content: text("content"), // For text content
  videoUrl: text("video_url"), // For videos
  imageUrl: text("image_url"), // For image content
  interactiveData: json("interactive_data"), // For simulations and interactive content
  // Note: scormPackageId is defined in the schema but doesn't exist in the database
  // We'll add it when we migrate the database
  // scormPackageId: integer("scorm_package_id"), // Reference to SCORM package
  order: integer("order").notNull(),
  xpPoints: integer("xp_points").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLearningBlockSchema = createInsertSchema(learningBlocks).omit({
  id: true,
  createdAt: true,
});

// Assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70),
  xpPoints: integer("xp_points").notNull().default(50),
  timeLimit: integer("time_limit"), // in minutes, null means no limit
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

// Assessment Questions
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("mcq"), // mcq, open_ended, video
  options: json("options"), // For MCQs
  correctAnswer: text("correct_answer"), // For MCQs, index of correct option
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

// User Progress
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  percentComplete: integer("percent_complete").notNull().default(0),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
});

// Learning Block Completions
export const blockCompletions = pgTable("block_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  blockId: integer("block_id").notNull(),
  completed: boolean("completed").notNull().default(true),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertBlockCompletionSchema = createInsertSchema(blockCompletions).omit({
  id: true,
  completedAt: true,
});

// Assessment Attempts
export const assessmentAttempts = pgTable("assessment_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assessmentId: integer("assessment_id").notNull(),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  answers: json("answers"), // User's answers
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAssessmentAttemptSchema = createInsertSchema(assessmentAttempts).omit({
  id: true,
  startedAt: true,
});

// Badges
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  xpPoints: integer("xp_points").notNull().default(100),
  type: text("type"), // e.g., 'course_completion', 'assessment', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

// User Badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

// AI Tutor Conversations
export const aiTutorConversations = pgTable("ai_tutor_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  messages: json("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiTutorConversationSchema = createInsertSchema(aiTutorConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrainingArea = z.infer<typeof insertTrainingAreaSchema>;
export type TrainingArea = typeof trainingAreas.$inferSelect;

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

export type InsertLearningBlock = z.infer<typeof insertLearningBlockSchema>;
export type LearningBlock = typeof learningBlocks.$inferSelect;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertBlockCompletion = z.infer<typeof insertBlockCompletionSchema>;
export type BlockCompletion = typeof blockCompletions.$inferSelect;

export type InsertAssessmentAttempt = z.infer<typeof insertAssessmentAttemptSchema>;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertAiTutorConversation = z.infer<typeof insertAiTutorConversationSchema>;
export type AiTutorConversation = typeof aiTutorConversations.$inferSelect;

// SCORM Packages
export const scormPackages = pgTable("scorm_packages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  version: text("version"),
  folderPath: text("folder_path").notNull(), // Path to the extracted SCORM package
  entryPoint: text("entry_point").notNull(), // Path to the main HTML file within the SCORM package
  manifestData: json("manifest_data"), // Parsed imsmanifest.xml data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScormPackageSchema = createInsertSchema(scormPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScormPackage = z.infer<typeof insertScormPackageSchema>;
export type ScormPackage = typeof scormPackages.$inferSelect;

// SCORM Tracking Data
export const scormTrackingData = pgTable("scorm_tracking_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scormPackageId: integer("scorm_package_id").notNull(),
  lessonStatus: text("lesson_status"), // completed, incomplete, not attempted, passed, failed, browsed
  location: text("location"), // bookmark
  suspendData: text("suspend_data"), // detailed state data
  score: integer("score"),
  completionStatus: text("completion_status"), // completed, incomplete, not attempted, unknown
  totalTime: text("total_time"), // time spent in the SCORM content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScormTrackingDataSchema = createInsertSchema(scormTrackingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScormTrackingData = z.infer<typeof insertScormTrackingDataSchema>;
export type ScormTrackingData = typeof scormTrackingData.$inferSelect;

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  certificateNumber: text("certificate_number").notNull().unique(),
  issueDate: timestamp("issue_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("active"), // active, expired, revoked
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  issueDate: true,
  createdAt: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // course_assigned, badge_earned, achievement, leaderboard_update, course_reminder
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  metadata: json("metadata"), // Additional data like courseId, badgeId, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
