import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiLimiter, authLimiter, queueLimiter } from './middleware/rate-limiter.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { authenticateToken } from './auth/auth.middleware';

import * as authController from './auth/auth.controller';
import * as appController from './modules/applications/application.controller';
import * as resController from './modules/resumes/resume.controller';
import * as intController from './modules/ai-center/interview.controller';
import * as dashController from './modules/dashboard/dashboard.controller';
import * as profController from './modules/users/profile.controller';
import * as questionController from './modules/questions/question.controller';
import * as skillController from './modules/skills/skill.controller';
import * as analyticsController from './modules/analytics/analytics.controller';

const app = express();

// Security & Parsing Middlewares
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Multer setup for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX formats are allowed'));
    }
  }
});

// Auth Routes (with specific rate limiting)
const authRouter = express.Router();
authRouter.post('/register', authLimiter, authController.register);
authRouter.post('/login', authLimiter, authController.login);
authRouter.post('/refresh', authLimiter, authController.refresh);
app.use('/api/auth', authRouter);

// Protected API Routes
const apiRouter = express.Router();
apiRouter.use(authenticateToken);
apiRouter.use(apiLimiter);

// Dashboard & Analytics
apiRouter.get('/dashboard/overview', dashController.getOverview);
apiRouter.get('/user/onboarding-status', profController.getOnboardingStatus);
apiRouter.get('/analytics/trajectory', analyticsController.getTrajectoryAnalytics);
apiRouter.get('/analytics/dashboard', appController.getDashboardAnalytics);

// User Profile
apiRouter.post('/user/profile', queueLimiter, profController.upsertProfile);

// Skills & Proficiencies
apiRouter.get('/skills/categories', skillController.getSkillCategories);
apiRouter.get('/skills/user', skillController.getUserSkills);

// Coding Practice & Questions
apiRouter.get('/questions', questionController.getQuestions);
apiRouter.get('/questions/:id', questionController.getQuestionDetails);
apiRouter.post('/questions/submit', questionController.submitSolution);

// Applications Pipeline Tracker
apiRouter.post('/applications', appController.createApplication);
apiRouter.get('/applications', appController.getApplications);

// Resumes
apiRouter.post('/resumes/analyze', queueLimiter, upload.single('resume'), resController.uploadAndAnalyze);

// AI Mock Interviews
apiRouter.post('/interviews/start', intController.startInterview);
apiRouter.post('/interviews/:id/respond', intController.respondToInterview);
apiRouter.post('/interviews/:id/finalize', intController.finalizeInterview);

app.use('/api', apiRouter);

// Global Error Handler
app.use(errorMiddleware);

// Start server
app.listen(env.PORT, () => {
  logger.info(`🚀 LaunchLane Trajectory Backend successfully running on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
