import { users, type User, type InsertUser, modules, type Module, type InsertModule,
  trainingAreas, type TrainingArea, type InsertTrainingArea, courses, type Course, type InsertCourse,
  units, type Unit, type InsertUnit, learningBlocks, type LearningBlock, type InsertLearningBlock,
  assessments, type Assessment, type InsertAssessment, questions, type Question, type InsertQuestion,
  userProgress, type UserProgress, type InsertUserProgress, blockCompletions, type BlockCompletion, type InsertBlockCompletion,
  assessmentAttempts, type AssessmentAttempt, type InsertAssessmentAttempt, badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge, aiTutorConversations, type AiTutorConversation, type InsertAiTutorConversation,
  scormPackages, type ScormPackage, type InsertScormPackage, scormTrackingData, type ScormTrackingData, type InsertScormTrackingData,
  roles, type Role, type InsertRole, roleMandatoryCourses, type RoleMandatoryCourse, type InsertRoleMandatoryCourse,
  certificates, type Certificate, type InsertCertificate, notifications, type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, and } from "drizzle-orm";
import session from "express-session";
import { IStorage } from "./storage";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Role Management
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }
  
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }
  
  async updateRole(id: number, roleData: Partial<Role>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(roleData)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }
  
  async deleteRole(id: number): Promise<boolean> {
    try {
      // First check if the role exists
      const roleToDelete = await this.getRole(id);
      if (!roleToDelete) return false;
      
      // For system roles, we'll handle differently - allow deletion regardless of user assignment
      const isSystemRole = ["admin", "supervisor", "content_creator", "frontliner"].includes(roleToDelete.name);
      
      if (!isSystemRole) {
        // Only check for users if it's not a system role
        const userResults = await db
          .select()
          .from(users)
          .where(eq(users.role, roleToDelete.name));
        
        // If users are using this non-system role, don't allow deletion
        if (userResults.length > 0) {
          return false; // Can't delete a non-system role that's in use
        }
      }
      
      // Delete any mandatory courses for this role
      await db.delete(roleMandatoryCourses).where(eq(roleMandatoryCourses.roleId, id));
      
      // Now we can safely delete the role
      const deleteResult = await db.delete(roles).where(eq(roles.id, id));
      
      // Return true if at least one row was affected
      return deleteResult.rowCount !== null && deleteResult.rowCount > 0;
    } catch (error) {
      console.error("Error in deleteRole:", error);
      return false;
    }
  }
  
  // Role Mandatory Courses
  async getRoleMandatoryCourses(roleId: number): Promise<Course[]> {
    try {
      // First, get all the role-course relationship entries
      const mandatoryCourseIds = await db
        .select()
        .from(roleMandatoryCourses)
        .where(eq(roleMandatoryCourses.roleId, roleId));
      
      // If there are no mandatory courses, return empty array
      if (mandatoryCourseIds.length === 0) {
        return [];
      }

      // Get all courses that match the course IDs
      const courseResults = [];
      for (const rel of mandatoryCourseIds) {
        const course = await this.getCourse(rel.courseId);
        if (course) {
          courseResults.push({
            ...course,
            // Include the relation ID as a property on the course
            relationId: rel.id
          });
        }
      }

      return courseResults;
    } catch (error) {
      console.error("Error in getRoleMandatoryCourses:", error);
      return [];
    }
  }
  
  async addMandatoryCourseToRole(data: InsertRoleMandatoryCourse): Promise<RoleMandatoryCourse> {
    // Check if role and course exist
    const role = await this.getRole(data.roleId);
    const course = await this.getCourse(data.courseId);
    
    if (!role || !course) {
      throw new Error("Role or course not found");
    }
    
    // Check if this role-course relation already exists
    const existingRelations = await db
      .select()
      .from(roleMandatoryCourses)
      .where(and(
        eq(roleMandatoryCourses.roleId, data.roleId),
        eq(roleMandatoryCourses.courseId, data.courseId)
      ));
    
    // If it already exists, return the existing relation
    if (existingRelations.length > 0) {
      return existingRelations[0];
    }
    
    // Otherwise create a new one
    const [newEntry] = await db
      .insert(roleMandatoryCourses)
      .values(data)
      .returning();
    
    return newEntry;
  }
  
  async removeMandatoryCourseFromRole(roleId: number, courseId: number): Promise<boolean> {
    const result = await db
      .delete(roleMandatoryCourses)
      .where(
        and(
          eq(roleMandatoryCourses.roleId, roleId),
          eq(roleMandatoryCourses.courseId, courseId)
        )
      );
    
    return result.rowCount > 0;
  }
  
  async getMandatoryCoursesForUser(userId: number): Promise<Course[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Find the role by name
    const role = await this.getRoleByName(user.role);
    if (!role) return [];
    
    // Get mandatory courses for this role
    return this.getRoleMandatoryCourses(role.id);
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First, delete related data to avoid foreign key constraint issues
      
      // Delete user progress
      await db.delete(userProgress).where(eq(userProgress.userId, id));
      
      // Delete user badges
      await db.delete(userBadges).where(eq(userBadges.userId, id));
      
      // Delete block completions
      await db.delete(blockCompletions).where(eq(blockCompletions.userId, id));
      
      // Delete assessment attempts
      await db.delete(assessmentAttempts).where(eq(assessmentAttempts.userId, id));
      
      // Delete AI tutor conversations
      await db.delete(aiTutorConversations).where(eq(aiTutorConversations.userId, id));
      
      // Delete certificates
      await db.delete(certificates).where(eq(certificates.userId, id));
      
      // Delete SCORM tracking data
      await db.delete(scormTrackingData).where(eq(scormTrackingData.userId, id));
      
      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Course Management
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  // Badge Management
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }
  
  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const [updatedBadge] = await db
      .update(badges)
      .set(data)
      .where(eq(badges.id, id))
      .returning();
    return updatedBadge;
  }

  // User Progress
  async getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined> {
    const result = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.courseId, courseId)
      ));
    
    return result[0];
  }

  async getUserProgressForAllCourses(userId: number): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateUserProgress(userId: number, courseId: number, data: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const [updatedProgress] = await db
      .update(userProgress)
      .set(data)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)))
      .returning();
    return updatedProgress;
  }

  // Block Completions
  async getBlockCompletion(userId: number, blockId: number): Promise<BlockCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(blockCompletions)
      .where(eq(blockCompletions.userId, userId))
      .where(eq(blockCompletions.blockId, blockId));
    return completion;
  }

  async createBlockCompletion(completion: InsertBlockCompletion): Promise<BlockCompletion> {
    const [newCompletion] = await db
      .insert(blockCompletions)
      .values(completion)
      .returning();
    return newCompletion;
  }

  // User Badges
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db
      .insert(userBadges)
      .values(userBadge)
      .returning();
    return newUserBadge;
  }

  // AI Tutor Conversations
  async getAiTutorConversation(userId: number): Promise<AiTutorConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiTutorConversations)
      .where(eq(aiTutorConversations.userId, userId));
    return conversation;
  }

  async createAiTutorConversation(conversation: InsertAiTutorConversation): Promise<AiTutorConversation> {
    const [newConversation] = await db
      .insert(aiTutorConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateAiTutorConversation(id: number, messages: any[]): Promise<AiTutorConversation | undefined> {
    const [updatedConversation] = await db
      .update(aiTutorConversations)
      .set({ messages, updatedAt: new Date() })
      .where(eq(aiTutorConversations.id, id))
      .returning();
    return updatedConversation;
  }

  // Assessment Attempts
  async getAssessmentAttempts(userId: number, assessmentId: number): Promise<AssessmentAttempt[]> {
    return await db
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.userId, userId))
      .where(eq(assessmentAttempts.assessmentId, assessmentId));
  }

  async createAssessmentAttempt(attempt: InsertAssessmentAttempt): Promise<AssessmentAttempt> {
    const [newAttempt] = await db
      .insert(assessmentAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  // Training Areas
  async getTrainingAreas(): Promise<TrainingArea[]> {
    return await db.select().from(trainingAreas);
  }

  async getTrainingArea(id: number): Promise<TrainingArea | undefined> {
    const [area] = await db
      .select()
      .from(trainingAreas)
      .where(eq(trainingAreas.id, id));
    return area;
  }

  async createTrainingArea(area: InsertTrainingArea): Promise<TrainingArea> {
    const [newArea] = await db
      .insert(trainingAreas)
      .values(area)
      .returning();
    return newArea;
  }

  async updateTrainingArea(id: number, data: Partial<TrainingArea>): Promise<TrainingArea | undefined> {
    const [updatedArea] = await db
      .update(trainingAreas)
      .set(data)
      .where(eq(trainingAreas.id, id))
      .returning();
    return updatedArea;
  }

  async deleteTrainingArea(id: number): Promise<boolean> {
    const result = await db.delete(trainingAreas).where(eq(trainingAreas.id, id));
    return result.rowCount > 0;
  }

  // Modules
  async getModules(trainingAreaId?: number): Promise<Module[]> {
    if (trainingAreaId) {
      return await db
        .select()
        .from(modules)
        .where(eq(modules.trainingAreaId, trainingAreaId));
    }
    return await db.select().from(modules);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: number, data: Partial<Module>): Promise<Module | undefined> {
    const [updatedModule] = await db
      .update(modules)
      .set(data)
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    const result = await db.delete(modules).where(eq(modules.id, id));
    return result.rowCount > 0;
  }

  // Units
  async getUnits(courseId: number): Promise<Unit[]> {
    return await db
      .select()
      .from(units)
      .where(eq(units.courseId, courseId))
      .orderBy(asc(units.order));
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    return unit;
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const [newUnit] = await db.insert(units).values(unit).returning();
    return newUnit;
  }

  async updateUnit(id: number, data: Partial<Unit>): Promise<Unit | undefined> {
    const [updatedUnit] = await db
      .update(units)
      .set(data)
      .where(eq(units.id, id))
      .returning();
    return updatedUnit;
  }

  async deleteUnit(id: number): Promise<boolean> {
    const result = await db.delete(units).where(eq(units.id, id));
    return result.rowCount > 0;
  }

  // Learning Blocks
  async getLearningBlocks(unitId: number): Promise<LearningBlock[]> {
    try {
      if (isNaN(unitId)) {
        console.error("Invalid unit ID provided to getLearningBlocks:", unitId);
        return [];
      }
      
      console.log(`Executing database query for learning blocks with unitId: ${unitId}`);
      const results = await db
        .select()
        .from(learningBlocks)
        .where(eq(learningBlocks.unitId, unitId))
        .orderBy(asc(learningBlocks.order));
      
      console.log(`Database returned ${results?.length || 0} learning blocks`);
      return results || [];
    } catch (error) {
      console.error("Database error in getLearningBlocks:", error);
      throw error; // Re-throw to be handled by the API endpoint
    }
  }

  async getLearningBlock(id: number): Promise<LearningBlock | undefined> {
    const [block] = await db.select().from(learningBlocks).where(eq(learningBlocks.id, id));
    return block;
  }

  async createLearningBlock(block: InsertLearningBlock): Promise<LearningBlock> {
    const [newBlock] = await db.insert(learningBlocks).values(block).returning();
    return newBlock;
  }
  
  async updateLearningBlock(id: number, data: Partial<LearningBlock>): Promise<LearningBlock | undefined> {
    const [updatedBlock] = await db
      .update(learningBlocks)
      .set(data)
      .where(eq(learningBlocks.id, id))
      .returning();
    return updatedBlock;
  }
  
  async deleteLearningBlock(id: number): Promise<boolean> {
    const result = await db
      .delete(learningBlocks)
      .where(eq(learningBlocks.id, id));
    return result.rowCount > 0;
  }

  // Assessments
  async getAssessments(unitId: number): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.unitId, unitId));
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }
  
  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set(data)
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }
  
  async deleteAssessment(id: number): Promise<boolean> {
    const result = await db
      .delete(assessments)
      .where(eq(assessments.id, id));
    return result.rowCount > 0;
  }

  // Questions
  async getQuestions(assessmentId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.assessmentId, assessmentId))
      .orderBy(asc(questions.order));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<Question | undefined> {
    const [question] = await db
      .update(questions)
      .set(data)
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.xpPoints))
      .limit(limit);
  }
  
  // Certificates
  async getUserCertificates(userId: number): Promise<Certificate[]> {
    return await db.select().from(certificates).where(eq(certificates.userId, userId));
  }
  
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate;
  }
  
  async getCertificateByCourseAndUser(userId: number, courseId: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates)
      .where(and(
        eq(certificates.userId, userId),
        eq(certificates.courseId, courseId)
      ));
    return certificate;
  }
  
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values(certificate).returning();
    return newCertificate;
  }
  
  async updateCertificate(id: number, data: Partial<Certificate>): Promise<Certificate | undefined> {
    const [updatedCertificate] = await db.update(certificates)
      .set(data)
      .where(eq(certificates.id, id))
      .returning();
    return updatedCertificate;
  }

  // SCORM Packages
  async getScormPackages(): Promise<ScormPackage[]> {
    return await db.select().from(scormPackages);
  }

  async getScormPackage(id: number): Promise<ScormPackage | undefined> {
    const [package_] = await db.select().from(scormPackages).where(eq(scormPackages.id, id));
    return package_;
  }

  async createScormPackage(packageData: InsertScormPackage): Promise<ScormPackage> {
    const [newPackage] = await db.insert(scormPackages).values(packageData).returning();
    return newPackage;
  }

  async updateScormPackage(id: number, data: Partial<ScormPackage>): Promise<ScormPackage | undefined> {
    const [updatedPackage] = await db
      .update(scormPackages)
      .set(data)
      .where(eq(scormPackages.id, id))
      .returning();
    return updatedPackage;
  }

  async deleteScormPackage(id: number): Promise<boolean> {
    const result = await db.delete(scormPackages).where(eq(scormPackages.id, id));
    return result.rowCount > 0;
  }

  // SCORM Tracking Data
  async getScormTrackingData(userId: number, scormPackageId: number): Promise<ScormTrackingData | undefined> {
    const [trackingData] = await db
      .select()
      .from(scormTrackingData)
      .where(and(
        eq(scormTrackingData.userId, userId),
        eq(scormTrackingData.scormPackageId, scormPackageId)
      ));
    return trackingData;
  }

  async createScormTrackingData(trackingData: InsertScormTrackingData): Promise<ScormTrackingData> {
    const [newTrackingData] = await db
      .insert(scormTrackingData)
      .values(trackingData)
      .returning();
    return newTrackingData;
  }

  async updateScormTrackingData(id: number, data: Partial<ScormTrackingData>): Promise<ScormTrackingData | undefined> {
    const [updatedTrackingData] = await db
      .update(scormTrackingData)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scormTrackingData.id, id))
      .returning();
    return updatedTrackingData;
  }

  // Notifications
  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    return result.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}