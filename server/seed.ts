import { db } from './db';
import { users, userProgress, blockCompletions, badges, userBadges } from '@shared/schema';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq, and, sql } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    console.log('Checking for admin user...');
    // Check if admin user exists
    const adminUsers = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (adminUsers.length === 0) {
      console.log('Admin user not found, creating...');
      // Create admin user
      const hashedPassword = await hashPassword('password');
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        email: 'admin@vx-academy.ae',
        role: 'admin',
        xpPoints: 0
      });
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
    
    // Check for demo users
    const demoUsers = await db.select().from(users).where(eq(users.username, 'instructor'));
    
    if (demoUsers.length === 0) {
      console.log('Creating demo users...');
      
      // Create instructor
      const instructorPassword = await hashPassword('password');
      const [instructor] = await db.insert(users).values({
        username: 'instructor',
        password: instructorPassword,
        name: 'Sara Ahmed',
        email: 'sara@vx-academy.ae',
        role: 'instructor',
        xpPoints: 500
      }).returning();
      
      // Create frontline staff users with different progress levels
      const staffPassword = await hashPassword('password');
      
      // Beginner user (just started)
      const [beginner] = await db.insert(users).values({
        username: 'ahmed',
        password: staffPassword,
        name: 'Ahmed Khan',
        email: 'ahmed@vx-academy.ae',
        role: 'staff',
        xpPoints: 20,
        language: 'en'
      }).returning();
      
      // Intermediate user (some progress)
      const [intermediate] = await db.insert(users).values({
        username: 'fatima',
        password: staffPassword,
        name: 'Fatima Al Zaabi',
        email: 'fatima@vx-academy.ae',
        role: 'staff',
        xpPoints: 150,
        language: 'ar'
      }).returning();
      
      // Advanced user (significant progress)
      const [advanced] = await db.insert(users).values({
        username: 'hassan',
        password: staffPassword,
        name: 'Hassan Ali',
        email: 'hassan@vx-academy.ae',
        role: 'staff',
        xpPoints: 350,
        language: 'en'
      }).returning();
      
      // Add progress records for sample users
      if (beginner && intermediate && advanced) {
        // For beginner - just started first course
        await db.insert(userProgress).values({
          userId: beginner.id,
          courseId: 1,
          completed: false,
          percentComplete: 10
        });
        
        // For intermediate - completed first course, started second
        await db.insert(userProgress).values({
          userId: intermediate.id,
          courseId: 1,
          completed: true,
          percentComplete: 100
        });
        
        await db.insert(userProgress).values({
          userId: intermediate.id,
          courseId: 2,
          completed: false,
          percentComplete: 30
        });
        
        // For advanced - completed multiple courses
        await db.insert(userProgress).values({
          userId: advanced.id,
          courseId: 1,
          completed: true,
          percentComplete: 100
        });
        
        await db.insert(userProgress).values({
          userId: advanced.id,
          courseId: 2,
          completed: true,
          percentComplete: 100
        });
        
        await db.insert(userProgress).values({
          userId: advanced.id,
          courseId: 3,
          completed: false,
          percentComplete: 75
        });
        
        // Add some block completions for advanced user
        const learningBlocks = await db.query.learningBlocks.findMany();
        if (learningBlocks.length > 0) {
          for (let i = 0; i < Math.min(5, learningBlocks.length); i++) {
            await db.insert(blockCompletions).values({
              userId: advanced.id,
              blockId: learningBlocks[i].id,
              completed: true
            });
          }
        }
      }
      
      console.log('Demo users created successfully!');
    } else {
      console.log('Demo users already exist.');
    }
    
    // Check for badges
    const existingBadges = await db.select().from(badges);
    
    if (existingBadges.length === 0) {
      console.log('Creating badges...');
      
      // Create completion badges
      await db.insert(badges).values([{
        name: 'Course Completion',
        description: 'Successfully completed a course in VX Academy',
        imageUrl: 'https://img.icons8.com/fluent/96/000000/diploma.png',
        xpPoints: 100,
        type: 'course_completion'
      }]);
      
      await db.insert(badges).values([{
        name: 'Abu Dhabi Expert',
        description: 'Completed all Abu Dhabi Information courses',
        imageUrl: 'https://img.icons8.com/fluent/96/000000/trophy.png',
        xpPoints: 200,
        type: 'area_completion'
      }]);
      
      await db.insert(badges).values([{
        name: 'First Assessment',
        description: 'Passed your first assessment',
        imageUrl: 'https://img.icons8.com/fluent/96/000000/test.png',
        xpPoints: 50,
        type: 'assessment'
      }]);
      
      await db.insert(badges).values([{
        name: 'Perfect Score',
        description: 'Achieved 100% on an assessment',
        imageUrl: 'https://img.icons8.com/fluent/96/000000/medal.png',
        xpPoints: 75,
        type: 'assessment_perfect'
      }]);
      
      // Award badges to existing advanced users
      const advancedUser = await db.select().from(users).where(eq(users.username, 'hassan')).limit(1);
      if (advancedUser.length > 0) {
        const allBadges = await db.select().from(badges);
        
        // Award all badges to advanced user
        for (const badge of allBadges) {
          await db.insert(userBadges).values({
            userId: advancedUser[0].id,
            badgeId: badge.id,
            earnedAt: new Date()
          });
        }
      }
      
      console.log('Badges created successfully!');
    } else {
      console.log('Badges already exist.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}