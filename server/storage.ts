import { users, type User, type InsertUser, courses, type Course, badges, type Badge, userProgress, type UserProgress, blockCompletions, type BlockCompletion, userBadges, type UserBadge, aiTutorConversations, type AiTutorConversation, assessmentAttempts, type AssessmentAttempt, trainingAreas, type TrainingArea, modules, type Module, units, type Unit, learningBlocks, type LearningBlock, assessments, type Assessment, questions, type Question, scormPackages, type ScormPackage, scormTrackingData, type ScormTrackingData, type InsertCourse, type InsertBadge, type InsertUserProgress, type InsertBlockCompletion, type InsertUserBadge, type InsertAiTutorConversation, type InsertAssessmentAttempt, type InsertTrainingArea, type InsertModule, type InsertUnit, type InsertLearningBlock, type InsertAssessment, type InsertQuestion, type InsertScormPackage, type InsertScormTrackingData, roles, type Role, type InsertRole, roleMandatoryCourses, type RoleMandatoryCourse, type InsertRoleMandatoryCourse, certificates, type Certificate, type InsertCertificate, notifications, type Notification, type InsertNotification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Role Management
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, roleData: Partial<Role>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // Role Mandatory Courses
  getRoleMandatoryCourses(roleId: number): Promise<Course[]>;
  addMandatoryCourseToRole(data: InsertRoleMandatoryCourse): Promise<RoleMandatoryCourse>;
  removeMandatoryCourseFromRole(roleId: number, courseId: number): Promise<boolean>;
  getMandatoryCoursesForUser(userId: number): Promise<Course[]>;
  
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Course Management
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Badge Management
  getBadge(id: number): Promise<Badge | undefined>;
  getBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined>;
  
  // User Progress
  getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined>;
  getUserProgressForAllCourses(userId: number): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: number, courseId: number, data: Partial<UserProgress>): Promise<UserProgress | undefined>;
  
  // Block Completions
  getBlockCompletion(userId: number, blockId: number): Promise<BlockCompletion | undefined>;
  createBlockCompletion(completion: InsertBlockCompletion): Promise<BlockCompletion>;
  
  // User Badges
  getUserBadges(userId: number): Promise<UserBadge[]>;
  createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  
  // AI Tutor Conversations
  getAiTutorConversation(userId: number): Promise<AiTutorConversation | undefined>;
  createAiTutorConversation(conversation: InsertAiTutorConversation): Promise<AiTutorConversation>;
  updateAiTutorConversation(id: number, messages: any[]): Promise<AiTutorConversation | undefined>;
  
  // Assessment Attempts
  getAssessmentAttempts(userId: number, assessmentId: number): Promise<AssessmentAttempt[]>;
  createAssessmentAttempt(attempt: InsertAssessmentAttempt): Promise<AssessmentAttempt>;
  
  // Training Areas
  getTrainingAreas(): Promise<TrainingArea[]>;
  getTrainingArea(id: number): Promise<TrainingArea | undefined>;
  createTrainingArea(area: InsertTrainingArea): Promise<TrainingArea>;
  updateTrainingArea(id: number, data: Partial<TrainingArea>): Promise<TrainingArea | undefined>;
  deleteTrainingArea(id: number): Promise<boolean>;
  
  // Modules
  getModules(trainingAreaId?: number): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, data: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;
  
  // Units
  getUnits(courseId: number): Promise<Unit[]>;
  getUnit(id: number): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  
  // Learning Blocks
  getLearningBlocks(unitId: number): Promise<LearningBlock[]>;
  getLearningBlock(id: number): Promise<LearningBlock | undefined>;
  createLearningBlock(block: InsertLearningBlock): Promise<LearningBlock>;
  updateLearningBlock(id: number, data: Partial<LearningBlock>): Promise<LearningBlock | undefined>;
  deleteLearningBlock(id: number): Promise<boolean>;
  
  // Assessments
  getAssessments(unitId: number): Promise<Assessment[]>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  
  // Questions
  getQuestions(assessmentId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, data: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // SCORM Packages
  getScormPackages(): Promise<ScormPackage[]>;
  getScormPackage(id: number): Promise<ScormPackage | undefined>;
  createScormPackage(packageData: InsertScormPackage): Promise<ScormPackage>;
  updateScormPackage(id: number, data: Partial<ScormPackage>): Promise<ScormPackage | undefined>;
  deleteScormPackage(id: number): Promise<boolean>;
  
  // SCORM Tracking Data
  getScormTrackingData(userId: number, scormPackageId: number): Promise<ScormTrackingData | undefined>;
  createScormTrackingData(trackingData: InsertScormTrackingData): Promise<ScormTrackingData>;
  updateScormTrackingData(id: number, data: Partial<ScormTrackingData>): Promise<ScormTrackingData | undefined>;
  
  // Leaderboard
  getLeaderboard(limit?: number): Promise<User[]>;
  
  // Certificates
  getUserCertificates(userId: number): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateByCourseAndUser(userId: number, courseId: number): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: number, data: Partial<Certificate>): Promise<Certificate | undefined>;

  // Notifications
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private badges: Map<number, Badge>;
  private userProgress: Map<string, UserProgress>; // key: userId-courseId
  private blockCompletions: Map<string, BlockCompletion>; // key: userId-blockId
  private userBadges: Map<number, UserBadge[]>; // key: userId
  private aiTutorConversations: Map<number, AiTutorConversation>; // key: userId
  private assessmentAttempts: Map<string, AssessmentAttempt[]>; // key: userId-assessmentId
  private trainingAreas: Map<number, TrainingArea>;
  private modules: Map<number, Module>;
  private units: Map<number, Unit>;
  private learningBlocks: Map<number, LearningBlock>;
  private assessments: Map<number, Assessment>;
  private questions: Map<number, Question>;
  private certificates: Map<number, Certificate>;
  private scormPackages: Map<number, ScormPackage>;
  private scormTrackingData: Map<string, ScormTrackingData>; // key: userId-scormPackageId
  private roles: Map<number, Role>; // key: roleId
  private roleMandatoryCourses: Map<string, RoleMandatoryCourse>; // key: roleId-courseId
  
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.badges = new Map();
    this.userProgress = new Map();
    this.blockCompletions = new Map();
    this.userBadges = new Map();
    this.aiTutorConversations = new Map();
    this.assessmentAttempts = new Map();
    this.trainingAreas = new Map();
    this.modules = new Map();
    this.units = new Map();
    this.learningBlocks = new Map();
    this.assessments = new Map();
    this.questions = new Map();
    this.certificates = new Map();
    this.scormPackages = new Map();
    this.scormTrackingData = new Map();
    this.roles = new Map();
    this.roleMandatoryCourses = new Map();
    
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Seed default roles
    this.createRole({
      name: "admin",
      description: "Administrator with full access to all features",
      permissions: {}
    });
    
    this.createRole({
      name: "supervisor",
      description: "Supervises and monitors team performance",
      permissions: {}
    });
    
    this.createRole({
      name: "content_creator",
      description: "Creates and manages learning content",
      permissions: {}
    });
    
    this.createRole({
      name: "frontliner",
      description: "Front-line staff who access training materials",
      permissions: {}
    });
    
    // Seed admin user
    this.createUser({
      username: "admin",
      password: "admin_special_password", // Special case handled in comparePasswords function
      name: "Admin User",
      email: "admin@vx-academy.ae",
      role: "admin"
    });
  }
  
  // Role Management
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  
  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(role => role.name === name);
  }
  
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }
  
  async createRole(role: InsertRole): Promise<Role> {
    const id = this.currentId++;
    const newRole: Role = { ...role, id, createdAt: new Date() };
    this.roles.set(id, newRole);
    return newRole;
  }
  
  async updateRole(id: number, roleData: Partial<Role>): Promise<Role | undefined> {
    const existingRole = this.roles.get(id);
    if (!existingRole) return undefined;
    
    const updatedRole = { ...existingRole, ...roleData };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }
  
  async deleteRole(id: number): Promise<boolean> {
    // Check if role is in use before deleting
    const usersWithRole = Array.from(this.users.values()).some(
      user => user.role === this.roles.get(id)?.name
    );
    
    if (usersWithRole) {
      return false; // Can't delete a role that's in use
    }
    
    // Also delete any mandatory courses for this role
    Array.from(this.roleMandatoryCourses.keys())
      .filter(key => key.startsWith(`${id}-`))
      .forEach(key => this.roleMandatoryCourses.delete(key));
    
    return this.roles.delete(id);
  }
  
  // Role Mandatory Courses
  async getRoleMandatoryCourses(roleId: number): Promise<Course[]> {
    // Get all mandatory course entries for this role
    const mandatoryCourseIds = Array.from(this.roleMandatoryCourses.values())
      .filter(entry => entry.roleId === roleId)
      .map(entry => entry.courseId);
    
    // Get the actual course objects
    return Array.from(this.courses.values())
      .filter(course => mandatoryCourseIds.includes(course.id));
  }
  
  async addMandatoryCourseToRole(data: InsertRoleMandatoryCourse): Promise<RoleMandatoryCourse> {
    // Check if role and course exist
    const role = this.roles.get(data.roleId);
    const course = this.courses.get(data.courseId);
    
    if (!role || !course) {
      throw new Error("Role or course not found");
    }
    
    const id = this.currentId++;
    const newEntry: RoleMandatoryCourse = {
      ...data,
      id,
      createdAt: new Date()
    };
    
    const key = `${data.roleId}-${data.courseId}`;
    this.roleMandatoryCourses.set(key, newEntry);
    
    return newEntry;
  }
  
  async removeMandatoryCourseFromRole(roleId: number, courseId: number): Promise<boolean> {
    const key = `${roleId}-${courseId}`;
    return this.roleMandatoryCourses.delete(key);
  }
  
  async getMandatoryCoursesForUser(userId: number): Promise<Course[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    // Find the role by name
    const role = Array.from(this.roles.values()).find(r => r.name === user.role);
    if (!role) return [];
    
    // Get mandatory courses for this role
    return this.getRoleMandatoryCourses(role.id);
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, xpPoints: 0, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Course Management
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.currentId++;
    const newCourse: Course = { ...course, id, createdAt: new Date() };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const existingCourse = this.courses.get(id);
    if (!existingCourse) return undefined;
    
    const updatedCourse = { ...existingCourse, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Badge Management
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }

  async getBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.currentId++;
    const newBadge: Badge = { ...badge, id, createdAt: new Date() };
    this.badges.set(id, newBadge);
    return newBadge;
  }

  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const existingBadge = this.badges.get(id);
    if (!existingBadge) return undefined;
    
    const updatedBadge = { ...existingBadge, ...data };
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }

  // User Progress
  async getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined> {
    return this.userProgress.get(`${userId}-${courseId}`);
  }

  async getUserProgressForAllCourses(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      progress => progress.userId === userId
    );
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentId++;
    const newProgress: UserProgress = { 
      ...progress, 
      id, 
      createdAt: new Date() 
    };
    this.userProgress.set(`${progress.userId}-${progress.courseId}`, newProgress);
    return newProgress;
  }

  async updateUserProgress(userId: number, courseId: number, data: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const key = `${userId}-${courseId}`;
    const existingProgress = this.userProgress.get(key);
    if (!existingProgress) return undefined;
    
    const updatedProgress = { ...existingProgress, ...data };
    this.userProgress.set(key, updatedProgress);
    return updatedProgress;
  }

  // Block Completions
  async getBlockCompletion(userId: number, blockId: number): Promise<BlockCompletion | undefined> {
    return this.blockCompletions.get(`${userId}-${blockId}`);
  }

  async createBlockCompletion(completion: InsertBlockCompletion): Promise<BlockCompletion> {
    const id = this.currentId++;
    const newCompletion: BlockCompletion = { 
      ...completion, 
      id, 
      completedAt: new Date() 
    };
    this.blockCompletions.set(`${completion.userId}-${completion.blockId}`, newCompletion);
    return newCompletion;
  }

  // User Badges
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadges.get(userId) || [];
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentId++;
    const newUserBadge: UserBadge = { 
      ...userBadge, 
      id, 
      earnedAt: new Date() 
    };
    
    const userBadges = this.userBadges.get(userBadge.userId) || [];
    userBadges.push(newUserBadge);
    this.userBadges.set(userBadge.userId, userBadges);
    
    return newUserBadge;
  }

  // AI Tutor Conversations
  async getAiTutorConversation(userId: number): Promise<AiTutorConversation | undefined> {
    return this.aiTutorConversations.get(userId);
  }

  async createAiTutorConversation(conversation: InsertAiTutorConversation): Promise<AiTutorConversation> {
    const id = this.currentId++;
    const now = new Date();
    const newConversation: AiTutorConversation = { 
      ...conversation, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.aiTutorConversations.set(conversation.userId, newConversation);
    return newConversation;
  }

  async updateAiTutorConversation(id: number, messages: any[]): Promise<AiTutorConversation | undefined> {
    const conversation = Array.from(this.aiTutorConversations.values())
      .find(conv => conv.id === id);
    
    if (!conversation) return undefined;
    
    const updatedConversation: AiTutorConversation = {
      ...conversation,
      messages,
      updatedAt: new Date()
    };
    
    this.aiTutorConversations.set(conversation.userId, updatedConversation);
    return updatedConversation;
  }

  // Assessment Attempts
  async getAssessmentAttempts(userId: number, assessmentId: number): Promise<AssessmentAttempt[]> {
    return this.assessmentAttempts.get(`${userId}-${assessmentId}`) || [];
  }

  async createAssessmentAttempt(attempt: InsertAssessmentAttempt): Promise<AssessmentAttempt> {
    const id = this.currentId++;
    const startedAt = new Date();
    const newAttempt: AssessmentAttempt = { 
      ...attempt, 
      id, 
      startedAt,
      completedAt: attempt.completedAt || startedAt
    };
    
    const key = `${attempt.userId}-${attempt.assessmentId}`;
    const attempts = this.assessmentAttempts.get(key) || [];
    attempts.push(newAttempt);
    this.assessmentAttempts.set(key, attempts);
    
    return newAttempt;
  }

  // Training Areas
  async getTrainingAreas(): Promise<TrainingArea[]> {
    return Array.from(this.trainingAreas.values());
  }

  async getTrainingArea(id: number): Promise<TrainingArea | undefined> {
    return this.trainingAreas.get(id);
  }

  async createTrainingArea(area: InsertTrainingArea): Promise<TrainingArea> {
    const id = this.currentId++;
    const newArea: TrainingArea = { ...area, id, createdAt: new Date() };
    this.trainingAreas.set(id, newArea);
    return newArea;
  }
  
  async updateTrainingArea(id: number, data: Partial<TrainingArea>): Promise<TrainingArea | undefined> {
    const existingArea = this.trainingAreas.get(id);
    if (!existingArea) return undefined;
    
    const updatedArea = { ...existingArea, ...data };
    this.trainingAreas.set(id, updatedArea);
    return updatedArea;
  }
  
  async deleteTrainingArea(id: number): Promise<boolean> {
    return this.trainingAreas.delete(id);
  }

  // Modules
  async getModules(trainingAreaId?: number): Promise<Module[]> {
    const modules = Array.from(this.modules.values());
    if (trainingAreaId) {
      return modules.filter(module => module.trainingAreaId === trainingAreaId);
    }
    return modules;
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const id = this.currentId++;
    const newModule: Module = { ...module, id, createdAt: new Date() };
    this.modules.set(id, newModule);
    return newModule;
  }
  
  async updateModule(id: number, data: Partial<Module>): Promise<Module | undefined> {
    const existingModule = this.modules.get(id);
    if (!existingModule) return undefined;
    
    const updatedModule = { ...existingModule, ...data };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }
  
  async deleteModule(id: number): Promise<boolean> {
    return this.modules.delete(id);
  }

  // Units
  async getUnits(courseId: number): Promise<Unit[]> {
    return Array.from(this.units.values())
      .filter(unit => unit.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    return this.units.get(id);
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const id = this.currentId++;
    const newUnit: Unit = { ...unit, id, createdAt: new Date() };
    this.units.set(id, newUnit);
    return newUnit;
  }

  // Learning Blocks
  async getLearningBlocks(unitId: number): Promise<LearningBlock[]> {
    return Array.from(this.learningBlocks.values())
      .filter(block => block.unitId === unitId)
      .sort((a, b) => a.order - b.order);
  }

  async getLearningBlock(id: number): Promise<LearningBlock | undefined> {
    return this.learningBlocks.get(id);
  }

  async createLearningBlock(block: InsertLearningBlock): Promise<LearningBlock> {
    const id = this.currentId++;
    const newBlock: LearningBlock = { ...block, id, createdAt: new Date() };
    this.learningBlocks.set(id, newBlock);
    return newBlock;
  }
  
  async updateLearningBlock(id: number, data: Partial<LearningBlock>): Promise<LearningBlock | undefined> {
    const existingBlock = this.learningBlocks.get(id);
    if (!existingBlock) return undefined;
    
    const updatedBlock = { ...existingBlock, ...data };
    this.learningBlocks.set(id, updatedBlock);
    return updatedBlock;
  }
  
  async deleteLearningBlock(id: number): Promise<boolean> {
    return this.learningBlocks.delete(id);
  }

  // Assessments
  async getAssessments(unitId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.unitId === unitId);
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.currentId++;
    const newAssessment: Assessment = { ...assessment, id, createdAt: new Date() };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }
  
  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    const existingAssessment = this.assessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...data };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  async deleteAssessment(id: number): Promise<boolean> {
    return this.assessments.delete(id);
  }

  // Questions
  async getQuestions(assessmentId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.assessmentId === assessmentId)
      .sort((a, b) => a.order - b.order);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.currentId++;
    const newQuestion: Question = { ...question, id, createdAt: new Date() };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  async updateQuestion(id: number, data: Partial<Question>): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedQuestion = { ...existingQuestion, ...data };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.xpPoints - a.xpPoints)
      .slice(0, limit);
  }

  // SCORM Packages
  async getScormPackages(): Promise<ScormPackage[]> {
    return Array.from(this.scormPackages.values());
  }

  async getScormPackage(id: number): Promise<ScormPackage | undefined> {
    return this.scormPackages.get(id);
  }

  async createScormPackage(packageData: InsertScormPackage): Promise<ScormPackage> {
    const id = this.currentId++;
    const now = new Date();
    const newPackage: ScormPackage = {
      ...packageData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.scormPackages.set(id, newPackage);
    return newPackage;
  }

  async updateScormPackage(id: number, data: Partial<ScormPackage>): Promise<ScormPackage | undefined> {
    const existingPackage = this.scormPackages.get(id);
    if (!existingPackage) return undefined;
    
    const updatedPackage: ScormPackage = {
      ...existingPackage,
      ...data,
      updatedAt: new Date()
    };
    this.scormPackages.set(id, updatedPackage);
    return updatedPackage;
  }

  async deleteScormPackage(id: number): Promise<boolean> {
    return this.scormPackages.delete(id);
  }

  // SCORM Tracking Data
  async getScormTrackingData(userId: number, scormPackageId: number): Promise<ScormTrackingData | undefined> {
    return this.scormTrackingData.get(`${userId}-${scormPackageId}`);
  }

  async createScormTrackingData(trackingData: InsertScormTrackingData): Promise<ScormTrackingData> {
    const id = this.currentId++;
    const now = new Date();
    const newTrackingData: ScormTrackingData = {
      ...trackingData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.scormTrackingData.set(`${trackingData.userId}-${trackingData.scormPackageId}`, newTrackingData);
    return newTrackingData;
  }

  async updateScormTrackingData(id: number, data: Partial<ScormTrackingData>): Promise<ScormTrackingData | undefined> {
    const trackingData = Array.from(this.scormTrackingData.values())
      .find(data => data.id === id);
    
    if (!trackingData) return undefined;
    
    const updatedTrackingData: ScormTrackingData = {
      ...trackingData,
      ...data,
      updatedAt: new Date()
    };
    
    this.scormTrackingData.set(`${trackingData.userId}-${trackingData.scormPackageId}`, updatedTrackingData);
    return updatedTrackingData;
  }
  
  // Certificate Methods
  async getUserCertificates(userId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(cert => cert.userId === userId);
  }
  
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }
  
  async getCertificateByCourseAndUser(userId: number, courseId: number): Promise<Certificate | undefined> {
    return Array.from(this.certificates.values()).find(
      cert => cert.userId === userId && cert.courseId === courseId
    );
  }
  
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = this.currentId++;
    const now = new Date();
    const newCertificate: Certificate = {
      id,
      createdAt: now,
      ...certificate
    };
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }
  
  async updateCertificate(id: number, data: Partial<Certificate>): Promise<Certificate | undefined> {
    const certificate = this.certificates.get(id);
    if (!certificate) {
      return undefined;
    }
    
    const updatedCertificate = { ...certificate, ...data };
    this.certificates.set(id, updatedCertificate);
    return updatedCertificate;
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from './database-storage';

// Create an instance of DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
