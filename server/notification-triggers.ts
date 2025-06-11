import { IStorage } from "./storage";
import { InsertNotification } from "../shared/schema";

export class NotificationTriggers {
  constructor(private storage: IStorage) {}

  // Trigger when a new course is assigned to a user
  async onCourseAssigned(userId: number, courseId: number, courseName: string) {
    const notification: InsertNotification = {
      userId,
      type: "course_assigned",
      title: "New Course Available",
      message: `${courseName} has been assigned to your learning path. Start your journey today!`,
      read: false,
      metadata: { courseId }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger when a user earns a badge
  async onBadgeEarned(userId: number, badgeId: number, badgeName: string) {
    const notification: InsertNotification = {
      userId,
      type: "badge_earned",
      title: "Achievement Unlocked!",
      message: `Congratulations! You have earned the "${badgeName}" badge.`,
      read: false,
      metadata: { badgeId }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger when a user completes a course
  async onCourseCompleted(userId: number, courseId: number, courseName: string) {
    const notification: InsertNotification = {
      userId,
      type: "achievement",
      title: "Course Completed!",
      message: `Fantastic work! You have successfully completed "${courseName}".`,
      read: false,
      metadata: { courseId }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger when leaderboard position changes
  async onLeaderboardUpdate(userId: number, newPosition: number, previousPosition?: number) {
    let message = "";
    if (!previousPosition) {
      message = "You have joined the learning leaderboard. Complete courses to climb the rankings!";
    } else if (newPosition < previousPosition) {
      message = `Great progress! You've moved up to position ${newPosition} on the leaderboard.`;
    } else {
      message = `Your current leaderboard position is ${newPosition}. Keep learning to improve!`;
    }

    const notification: InsertNotification = {
      userId,
      type: "leaderboard_update",
      title: "Leaderboard Update",
      message,
      read: false,
      metadata: { position: newPosition, previousPosition }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger course reminders for inactive users
  async onCourseReminder(userId: number, courseId: number, courseName: string) {
    const notification: InsertNotification = {
      userId,
      type: "course_reminder",
      title: "Course Reminder",
      message: `Don't forget to continue your ${courseName} course. You're making great progress!`,
      read: false,
      metadata: { courseId }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger when user passes an assessment
  async onAssessmentPassed(userId: number, assessmentId: number, score: number) {
    const notification: InsertNotification = {
      userId,
      type: "achievement",
      title: "Assessment Passed!",
      message: `Excellent work! You passed the assessment with a score of ${score}%.`,
      read: false,
      metadata: { assessmentId, score }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger when user receives a certificate
  async onCertificateEarned(userId: number, courseId: number, courseName: string) {
    const notification: InsertNotification = {
      userId,
      type: "achievement",
      title: "Certificate Earned!",
      message: `Congratulations! You have earned a certificate for completing "${courseName}".`,
      read: false,
      metadata: { courseId }
    };
    await this.storage.createNotification(notification);
  }

  // Trigger welcome notification for new users
  async onUserWelcome(userId: number, userName: string) {
    const notification: InsertNotification = {
      userId,
      type: "achievement",
      title: "Welcome to VX Academy!",
      message: `Welcome ${userName}! Start your learning journey by exploring our courses.`,
      read: false,
      metadata: {}
    };
    await this.storage.createNotification(notification);
  }
}