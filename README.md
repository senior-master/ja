# 🎓 CBT Master - Smart JAMB Preparation Platform

CBT Master is a premium, full-stack Progressive Web App (PWA) designed to help Nigerian students pass the JAMB UTME. It combines a realistic exam simulator with AI-driven explanations, gamification, and deep performance analytics.

## 🚀 Features

1. **CBT Master (Real Exam Mode)**
   - Simulates the exact JAMB interface (180 questions, 120 minutes).
   - Includes the 4-subject format (English + 3 others).
   - Flags, question palette, and auto-submit timer.

2. **Practice Mode**
   - Flexible: Pick up to 4 subjects, choose the number of questions, and set a custom timer.
   - No instant feedback (just like the real exam).

3. **Learning Mode**
   - Pick specific topics (e.g., "Algebra" or "Genetics").
   - Instant feedback with detailed explanations.
   - Powered by **Smart Tutor** (Google Gemini API) for step-by-step breakdowns of difficult questions.

4. **Gamification & Analytics**
   - **Daily Streaks:** Tracks consecutive days of study.
   - **Leaderboard:** Top 100 unique users based on highest CBT score.
   - **Weakness Radar:** Analyzes past exams to identify topics where the student struggles most.

5. **Admin Dashboard**
   - View real-time platform analytics (users, exams taken, average rating).
   - Read user feedback and bug reports.
   - **Question Fixing:** Edit reported questions directly from the app, update the DB, and clear the report instantly.

6. **PWA & Auto-Updates**
   - Installable on Android/iOS home screens.
   - Service worker automatically checks for updates on launch.

## 💻 Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS (Bybit-inspired Dark/Amber theme), Zustand (State Management), KaTeX (Math rendering).
- **Backend/Database:** Supabase (PostgreSQL, Auth, RLS, REST API).
- **AI Integration:** Cloudflare Workers (Proxy for Google Gemini API) to keep keys secure.
- **Hosting:** Cloudflare Pages (Frontend via GitHub Actions) & Supabase (Database).
- **Analytics:** Cloudflare Web Analytics.

## 📁 Folder Structure

- **.github/workflows/**: CI/CD Pipelines (Deploy Pages, Deploy Worker)
- **app/**: React Frontend
  - **public/**: Static assets (Icons, _headers, _redirects)
  - **src/**
    - **components/**: Reusable UI (AITutor, QuestionCard, Navigator, etc.)
    - **pages/**: Route pages (Landing, Home, Dashboard, Runner, Results)
    - **services/**: API calls (Supabase client, fetch questions)
    - **store/**: Zustand global state (useExamStore)
    - **App.tsx**: Routing
    - **main.tsx**: Entry point & PWA setup
  - **package.json**
  - **vite.config.ts**: Build & PWA config
- **cloudflare-worker/**: AI Proxy Worker
  - **worker.js**: Secure fetch logic for Gemini API
  - **wrangler.toml**: Worker config

## 🧠 Core Logic & Data Flow

### 1. State Management (Zustand)
The app relies on a single massive store (`src/store/useExamStore.ts`). It handles the user session, the active exam questions, the timer (`endTime` as a timestamp to prevent cheating on refresh), selected answers, and UI states (modals, calculators). It is persisted to `localStorage` so the app survives refreshes.

### 2. The Timer
Instead of counting down every second (which fails when the tab is throttled), the store saves an `endTime` timestamp. The `ExamTimer` component calculates the difference between `Date.now()` and `endTime` on every render. If it hits zero, it triggers the auto-submit function.

### 3. The AI Tutor (Cloudflare Worker)
To prevent exposing the Gemini API key, the frontend sends a POST request to the Cloudflare Worker. The Worker holds the `GEMINI_API_KEYS` secret, rotates through them, calls the Gemini API, and returns the text to the frontend.

### 4. Database Security (Supabase RLS)
Row Level Security is strictly enforced:
- **Students** can only read their own results, insert their own feedback/reports, and read questions.
- **Public** can read the leaderboard (RPC function `get_leaderboard`).
- **Admin** (verified by JWT email) can read all reports, feedback, and update questions.

### 5. Smart Scoring
- In **CBT Mode**, scores are normalized to JAMB's 400-point scale (100 per subject).
- In **Practice/Learning Mode**, scores are raw (e.g., 15/20).
