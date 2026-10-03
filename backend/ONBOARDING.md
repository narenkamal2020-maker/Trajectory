# LaunchLane Onboarding & AI Insights Ecosystem

## Overview

This document describes the production-grade onboarding system for LaunchLane that captures user preferences, processes resumes via an asynchronous AI pipeline, and serves a fully tailored dashboard experience.

## Architecture Components

### 1. **Database Schema** (Prisma ORM)

#### User
- `id`: UUID primary key
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `name`: User's full name
- `created_at`, `updated_at`: Timestamps
- Relations: `profile`, `resumes`, `applications`, `interviews`

#### UserProfile
- `id`: UUID primary key
- `user_id`: Foreign key to User (unique, cascading delete)
- `target_role`: e.g., "Full-Stack Engineer"
- `target_industry`: e.g., "FinTech"
- `experience_level`: e.g., "2-5 Years"
- `skills`: String array of technology tags
- `academic_project_summary`: Optional text field for projects
- `created_at`, `updated_at`: Timestamps

#### Resume
- `id`: UUID primary key
- `user_id`: Foreign key to User
- `file_url`: S3 path to stored resume
- `parsed_text`: Full plain-text extraction from PDF
- `parsed_json_data`: Metadata (word count, email, phone, website, estimated length)
- `ats_score`: Integer 0-100 (nullable until analysis complete)
- `detected_gaps`: JSON array of missing keywords/skills
- `actionable_suggestions`: JSON with `resumeFixes` and `profileMilestones` arrays
- `personalized_questions`: JSON array of 3 interview questions
- `created_at`, `updated_at`: Timestamps

---

## API Endpoints

### Authentication Routes

#### `POST /api/auth/register`
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "requiresOnboarding": true
}
```

#### `POST /api/auth/login`
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": { "id": "uuid", "name": "John Doe", "email": "user@example.com" },
  "requiresOnboarding": true
}
```

---

### Onboarding Routes

#### `POST /api/user/profile`
Create or update user profile. Automatically queues resume analysis if resume exists.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "targetRole": "Full-Stack Engineer",
  "targetIndustry": "FinTech",
  "experienceLevel": "2-5 Years",
  "skills": ["React", "Node.js", "PostgreSQL", "Docker"],
  "academicProjectSummary": "Built a hospital tracking system in React"
}
```

**Response (200 OK):**
```json
{
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "target_role": "Full-Stack Engineer",
    "target_industry": "FinTech",
    "experience_level": "2-5 Years",
    "skills": ["React", "Node.js", "PostgreSQL", "Docker"],
    "academic_project_summary": "Built a hospital tracking system in React",
    "created_at": "2026-06-13T10:00:00Z",
    "updated_at": "2026-06-13T10:00:00Z"
  },
  "analysisQueued": true,
  "onboardingComplete": false
}
```

#### `GET /api/user/onboarding-status`
Get detailed onboarding progress.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "userId": "uuid",
  "isComplete": false,
  "profileComplete": true,
  "resumeUploaded": true,
  "profileData": {
    "targetRole": "Full-Stack Engineer",
    "targetIndustry": "FinTech",
    "experienceLevel": "2-5 Years",
    "skillsCount": 4
  },
  "resumeAnalysisStatus": "processing",
  "nextStep": "Your resume is being analyzed. Check back in a few moments for personalized recommendations."
}
```

#### `POST /api/resumes/analyze`
Upload resume for analysis.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request:**
```
Form Data:
- resume: <PDF file>
```

**Response (201 Created):**
```json
{
  "message": "Resume uploaded, processing started.",
  "resumeId": "uuid",
  "metadata": {
    "lineCount": 45,
    "wordCount": 523,
    "email": "user@example.com",
    "phone": "+1-555-123-4567",
    "website": "https://github.com/user",
    "estimatedLength": "standard"
  },
  "analysisQueued": true
}
```

---

### Dashboard Routes

#### `GET /api/dashboard/overview`
Get user's personalized dashboard (requires onboarding complete).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK) - Full Dashboard:**
```json
{
  "requiresOnboarding": false,
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "careerBlueprint": {
    "targetRole": "Full-Stack Engineer",
    "targetIndustry": "FinTech",
    "experienceLevel": "2-5 Years",
    "skills": ["React", "Node.js", "PostgreSQL", "Docker"],
    "atsCompatibilityScore": 82,
    "metricsSummary": "Ready for technical pipeline"
  },
  "actionableSuggestions": {
    "resumeFixes": [
      "Your profile targets FinTech applications, but your resume lacks explicit mentions of transaction safety or ACID compliance.",
      "Quantify the performance metrics of your projects (e.g., 'Improved API response time by 40%')."
    ],
    "profileMilestones": [
      "Great job! Your resume received an ATS score of 82/100.",
      "Focus on the suggested improvements to enhance your candidacy further."
    ]
  },
  "personalizedQuestions": [
    "How did you handle state management and side effects in your most complex React application?",
    "Tell me about a time when you had to optimize a slow database query in production.",
    "What architectural tradeoffs did you consider when choosing your tech stack?"
  ],
  "pipelineMetrics": {\n    "totalApplications": 12,\n    "applicationsByStage": {\n      "APPLIED": 5,\n      "OA": 3,\n      "INTERVIEW": 2,\n      "OFFER": 1,\n      "REJECTED": 1\n    },\n    "interviewsCompleted": 4,\n    "bestScore": 92.5,\n    "averageScore": "87.3\"\n  },\n  "generatedAt": "2026-06-13T10:30:00Z\"\n}\n```\n\n**Response (200 OK) - Onboarding Required:**\n```json\n{\n  \"requiresOnboarding\": true\n}\n```\n\n---\n\n## Asynchronous Processing Pipeline\n\n### Queue Architecture (BullMQ + Redis)\n\n#### Job: `profile-analysis`\nTriggered when:\n1. User completes onboarding profile\n2. User uploads a resume\n\n**Job Payload:**\n```typescript\n{\n  userId: string;        // User's UUID\n  resumeId: string;      // Resume's UUID\n}\n```\n\n**Processing Steps:**\n1. Fetch UserProfile and Resume from database\n2. Extract raw text from resume\n3. Call LLM with structured prompt\n4. Parse and validate JSON response using Zod schema\n5. Update Resume record with analysis results\n6. Invalidate user's dashboard cache\n7. Log completion\n\n**Retry Configuration:**\n- Attempts: 3\n- Backoff: Exponential (2000ms initial delay)\n- TTL: 30,000ms (job timeout)\n\n**Output Schema (Zod Validated):**\n```typescript\n{\n  atsScore: number;                    // 0-100\n  detectedGaps: string[];              // Missing keywords/skills\n  actionableSuggestions: string[];     // Max 4 strings\n  personalizedQuestions: string[];     // Exactly 3 strings\n}\n```\n\n---\n\n## Caching Strategy\n\n### Cache Keys & TTL\n\n| Key Pattern | TTL | Invalidation Trigger |\n|---|---|---|\n| `user:dashboard:cache:{userId}` | 5 min | Profile update, resume upload, analysis complete |\n| `user:onboarding:status:{userId}` | 2 min | Profile update, resume upload |\n| `resume:analysis:{resumeId}` | 30 min | Analysis completion |\n| `user:profile:{userId}` | 10 min | Profile update |\n\n### Invalidation Patterns\n\n```typescript\n// Invalidate single dashboard\nawait CacheService.invalidateDashboard(userId);\n\n// Invalidate all user caches\nawait CacheService.invalidateUserProfile(userId);\n\n// Invalidate all resume analyses\nawait CacheService.invalidateResumeAnalysis(userId);\n```\n\n---\n\n## Rate Limiting\n\n### Queue Limiter\n- **Window:** 1 hour\n- **Max Requests:** 3 per user\n- **Applies to:** `/user/profile`, `/resumes/analyze`\n- **Message:** \"Background analysis queue limit reached. Please try again later.\"\n\n### Auth Limiter\n- **Window:** 15 minutes\n- **Max Requests:** 10 per IP\n- **Applies to:** `/auth/register`, `/auth/login`, `/auth/refresh`\n\n---\n\n## Error Handling & Graceful Degradation\n\n### Structured Error Responses\n\n```json\n{\n  \"statusCode\": 400,\n  \"message\": \"Validation failed\",\n  \"errors\": [\n    {\n      \"field\": \"skills\",\n      \"message\": \"At least one skill required\",\n      \"code\": \"too_small\"\n    }\n  ],\n  \"requestId\": \"req-1686484800000\",\n  \"timestamp\": \"2026-06-13T10:30:00Z\"\n}\n```\n\n### AI Analysis Failure Recovery\n\nIf background worker fails:\n1. Retry job 3 times with exponential backoff\n2. If still failing, write fallback data to Resume record:\n   - `ats_score`: Existing score or 0\n   - `detected_gaps`: [\"Resume parsing incomplete.\"]\n   - `actionable_suggestions`: Placeholder messages\n   - `personalized_questions`: Generic fallback questions\n3. User dashboard remains functional with cached/fallback data\n4. Error logged with request ID for debugging\n\n---\n\n## Frontend Integration\n\n### Onboarding Flow\n\n```typescript\nimport { handleOnboardingRedirect } from '@/types/onboarding';\n\n// After login, check onboarding status\nconst res = await fetch('/api/auth/login', { /* ... */ });\nconst auth = await res.json();\n\nif (handleOnboardingRedirect(auth, router)) {\n  // Redirect to /onboarding\n  return;\n}\n\n// User is fully onboarded, show dashboard\n```\n\n### Profile Form Validation\n\n```typescript\nimport { validateProfileForm, EXPERIENCE_LEVELS, INDUSTRY_OPTIONS } from '@/types/onboarding';\n\nconst handleSubmit = async (formData) => {\n  const errors = validateProfileForm(formData);\n  if (errors.length > 0) {\n    // Show validation errors\n    setErrors(errors);\n    return;\n  }\n\n  // Submit to API\n  const res = await fetch('/api/user/profile', {\n    method: 'POST',\n    headers: { 'Authorization': `Bearer ${token}` },\n    body: JSON.stringify(formData)\n  });\n};\n```\n\n### Dashboard Polling for Analysis Status\n\n```typescript\n// Poll onboarding status until analysis complete\nconst pollAnalysisStatus = async () => {\n  while (true) {\n    const res = await fetch('/api/user/onboarding-status', {\n      headers: { 'Authorization': `Bearer ${token}` }\n    });\n    const status = await res.json();\n\n    if (status.resumeAnalysisStatus === 'completed') {\n      // Show dashboard\n      const dashboard = await fetch('/api/dashboard/overview', {\n        headers: { 'Authorization': `Bearer ${token}` }\n      }).then(r => r.json());\n      showDashboard(dashboard);\n      break;\n    }\n\n    // Wait 3 seconds before polling again\n    await new Promise(r => setTimeout(r, 3000));\n  }\n};\n```\n\n---\n\n## Monitoring & Logging\n\n### Key Metrics to Track\n\n1. **Onboarding Completion Rate**\n   - % of users who complete profile + resume\n   - Time to complete onboarding\n\n2. **Resume Analysis**\n   - Job success rate\n   - Average processing time\n   - ATS score distribution\n   - Error rate and types\n\n3. **Cache Performance**\n   - Cache hit/miss ratio\n   - Cache invalidation frequency\n\n4. **API Performance**\n   - Response times by endpoint\n   - Error rates\n   - Rate limit hits\n\n### Log Format\n\n```\n[2026-06-13T10:30:00.000Z] [INFO] [req-1686484800000] User registration: john@example.com\n[2026-06-13T10:31:00.000Z] [INFO] [Worker-job-123] Starting analysis for user uuid, resume uuid\n[2026-06-13T10:32:00.000Z] [INFO] [Worker-job-123] Successfully analyzed resume (atsScore: 82)\n```\n\n---\n\n## Deployment Checklist\n\n- [ ] Set `OPENAI_API_KEY` environment variable\n- [ ] Configure Redis connection (`REDIS_URL`)\n- [ ] Ensure PostgreSQL is running (`DATABASE_URL`)\n- [ ] Run `prisma migrate deploy`\n- [ ] Start background worker: `node dist/workers/analyzer.worker.js`\n- [ ] Start API server: `npm run dev`\n- [ ] Verify queue is healthy: `redis-cli keys profile-analysis-queue:*`\n- [ ] Test end-to-end onboarding flow\n- [ ] Monitor logs for errors\n\n---\n\n## Future Enhancements\n\n1. **Real OpenAI Integration**\n   - Replace mock LLM with structured outputs\n   - Add prompt engineering for better suggestions\n\n2. **Advanced Analytics**\n   - Track user success metrics\n   - Correlate resume improvements with interview success\n\n3. **Parallel Processing**\n   - Process multiple resumes simultaneously\n   - Add job prioritization logic\n\n4. **Webhook Notifications**\n   - Notify users when analysis is complete\n   - Email summaries of recommendations\n\n5. **A/B Testing**\n   - Test different onboarding flows\n   - Measure impact on completion rates\n