# Abu Dhabi VX Academy - Training Platform

An advanced AI-powered training platform for Abu Dhabi frontline professionals, delivering personalized and interactive learning experiences with robust content management and engagement tools.

## Overview

The VX Academy platform serves as a comprehensive learning system to train frontline staff on visitor experience, featuring curriculum management, assessments, and gamification elements to enhance engagement and learning outcomes.

## Key Features

- **Content Management Hierarchy**: Training Areas > Modules > Courses > Units > Learning Blocks > Assessments
- **Personalized Learning Paths**: AI-driven learning recommendations based on user progress and performance
- **Interactive Content**: Various content types including video, text, and interactive elements
- **Assessment System**: Quizzes and tests with scoring and feedback
- **Gamification**: Badges, XP points, and leaderboards to increase engagement
- **Admin Dashboard**: Comprehensive management interface for all content and user data
- **Multilingual Support**: Including English and Arabic, with potential for Urdu expansion
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query for data fetching and cache management
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Session-based authentication with Passport.js
- **AI Integration**: OpenAI for personalized tutoring and content recommendations

## Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server with `npm run dev`

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express API
- `/shared` - Shared types and schemas between frontend and backend
- `/public` - Static assets

## License

All rights reserved. This project is proprietary to Abu Dhabi VX Academy.