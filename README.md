# DevQuiz

A full-stack quiz platform for developers to review and reinforce programming concepts through AI-generated and manually-created quizzes. Built first as a personal learning tool, then opened for broader use.

---

## Introduction

DevQuiz was created to solve a personal problem: having a structured, daily way to review programming concepts without relying on third-party quiz platforms that don't cover the specific topics or question formats needed for technical growth.

It supports AI-generated questions from course content, manual question creation by admins, automated daily scheduling, and detailed progress tracking — all within a clean, dark-themed interface built for developers.

---

## Use Cases

- **Personal review** — A developer uses DevQuiz daily to reinforce JavaScript and Python concepts before interviews.
- **Topic-based practice** — A student picks a React topic, configures a 10-question MCQ quiz, and reviews their mistakes with explanations.
- **Scheduled learning** — An admin sets up a weekly schedule so fresh questions are automatically generated every day at midnight.
- **Guest tryout** — A visitor tries a quiz without registering to evaluate the platform before signing up.

---

## Features

- **AI-Generated Questions** — Paste content or describe a topic; AI generates quiz questions automatically (Groq / Gemini)
- **Manual Question Creation** — Admins can write and publish questions directly through the admin panel
- **6 Question Types** — Multiple Choice, Predict Output, Fill in the Blank, Debugging, Code Writing, and mixed
- **Progress Tracking** — Tracks best score, quizzes taken, and topics completed per user
- **Auto-Scheduling** — Weekly schedule generates fresh questions daily at midnight
- **Randomized MCQ Options** — Answer choices shuffle every attempt to prevent memorization
- **Multi-Role Access** — Admin manages content; Students take quizzes only
- **Guest Mode** — Try quizzes without an account; progress is not saved
- **Published / Unpublished Questions** — Admins control question visibility with publish date tracking
- **Mobile Responsive** — Fully usable on phones and tablets

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling and responsive design |
| React Router v6 | Client-side routing |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python 3.11 | Runtime |
| SQLAlchemy 2.0 | ORM |
| Pydantic v2 | Request/response validation |
| python-jose | JWT token handling |
| passlib / bcrypt | Password hashing |
| slowapi | Rate limiting |

### Database
| Technology | Purpose |
|---|---|
| MySQL | Primary database (hosted on Hostinger) |

### AI
| Technology | Purpose |
|---|---|
| Groq / Gemini AI | AI question generation |

### Infrastructure
| Technology | Purpose |
|---|---|
| Render | Backend hosting (free tier) |
| Hostinger | Frontend hosting (shared hosting) |
| GitHub Actions | CI/CD — build and deploy frontend on push |
| rsync over SSH | Frontend deployment to Hostinger |

---

## Project Structure

```
DevQuiz/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py        # Environment settings (Pydantic BaseSettings)
│   │   │   ├── deps.py          # Dependency injection (current user, DB session)
│   │   │   └── security.py      # JWT creation, password hashing
│   │   ├── models/
│   │   │   ├── user.py          # User model with Role enum
│   │   │   ├── question.py      # Question, Option models
│   │   │   └── quiz_session.py  # QuizSession, QuizSessionItem, UserProgress
│   │   ├── routers/
│   │   │   ├── auth.py          # Register, login, guest login
│   │   │   ├── quiz.py          # Start quiz, submit answer, get results
│   │   │   ├── questions.py     # CRUD for questions, admin endpoints
│   │   │   ├── courses.py       # Course management
│   │   │   ├── topics.py        # Topic management
│   │   │   ├── users.py         # User management (admin)
│   │   │   └── schedule.py      # Weekly schedule management
│   │   ├── schemas/             # Pydantic schemas (request/response models)
│   │   ├── services/
│   │   │   └── quiz_engine.py   # Question selection logic
│   │   ├── database.py          # SQLAlchemy engine and session factory
│   │   └── main.py              # FastAPI app, lifespan, schema migrations
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── .htaccess            # Apache SPA routing (redirect all to index.html)
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Navbar.tsx       # Top navigation with auth/guest states
│   │   │       ├── AdminLayout.tsx  # Admin sidebar with collapsible nav
│   │   │       ├── ProtectedRoute.tsx
│   │   │       └── AdminRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth state, login, guest login, logout
│   │   ├── pages/
│   │   │   ├── HomePage.tsx         # Public landing page
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx     # Includes confirm password validation
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── QuizPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboardPage.tsx
│   │   │       ├── AdminCoursesPage.tsx
│   │   │       ├── AdminTopicsPage.tsx
│   │   │       ├── AdminQuestionsPage.tsx
│   │   │       ├── AdminAllQuestionsPage.tsx  # Published/Unpublished view
│   │   │       ├── AdminUsersPage.tsx
│   │   │       └── AdminSchedulePage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts       # Axios instance with auth header injection
│   │   │   └── types.ts     # Shared TypeScript interfaces
│   │   ├── App.tsx          # Routes definition
│   │   └── index.css        # Tailwind base + custom animations
│   ├── package.json
│   └── vite.config.ts
└── .github/
    └── workflows/
        └── deploy.yml       # Build and deploy frontend to Hostinger on push
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- MySQL database
- A Groq or Gemini API key (for AI question generation)

### 1. Clone the repository

```bash
git clone https://github.com/JPTWeb01/devquiz.git
cd devquiz
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see Environment Variables section), then run:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (see Environment Variables section), then run:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend — `backend/.env`

```env
# Database
DATABASE_URL=mysql+pymysql://user:password@host:3306/dbname

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI (use one or both)
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `SECRET_KEY` | Secret used to sign JWT tokens — keep this random and private |
| `ALGORITHM` | JWT signing algorithm (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifespan in minutes (10080 = 7 days) |
| `GROQ_API_KEY` | API key for Groq-based AI question generation |
| `GEMINI_API_KEY` | API key for Gemini-based AI question generation |

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL for all API requests |

---

## Deployment Workflow

### Backend — Render

The FastAPI backend is deployed on Render's free tier. Render auto-deploys on every push to `main` that affects the `backend/` directory.

On startup, the app runs `_ensure_schema()` which safely applies any missing DDL changes (ALTER TABLE wrapped in try/except) without breaking existing data.

### Frontend — GitHub Actions → Hostinger

Defined in `.github/workflows/deploy.yml`.

**Trigger:** Push to `main` affecting `frontend/**`, or manual dispatch.

**Steps:**
1. Checkout code
2. Setup Node.js 20 with npm cache
3. `npm ci` — install dependencies
4. `npm run build` — Vite production build with `VITE_API_URL` injected
5. Deploy `frontend/dist/` to Hostinger via `rsync` over SSH (port 65002, IPv4 forced with `-4`, 3 retry attempts)

**Required GitHub Secret:**

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Private SSH key authorized on the Hostinger server |

---

## Architecture Overview

```
Browser
  │
  ▼
React SPA (Hostinger)
  │  JWT in localStorage / sessionStorage
  ▼
FastAPI REST API (Render)
  │
  ├── Auth Router      → issues JWT tokens
  ├── Quiz Router      → manages sessions, answers, results
  ├── Questions Router → CRUD, publish/unpublish
  ├── Courses Router   → course and topic management
  ├── Schedule Router  → weekly question scheduling
  └── Users Router     → admin user management
        │
        ▼
    MySQL (Hostinger)
        │
        └── Tables: users, courses, topics, questions,
                    quiz_sessions, quiz_session_items,
                    user_progress, weekly_schedules
```

**Data flow — taking a quiz:**
1. Student selects a topic and configures the quiz
2. `POST /api/quiz/start` creates a `QuizSession` and `QuizSessionItem` records; MCQ options are shuffled
3. For each question, student submits an answer via `POST /api/quiz/answer`
4. Backend checks correctness, updates score, flushes to DB, then counts unanswered items
5. When all items are answered, session is marked `COMPLETED` and `UserProgress` is updated
6. Student is redirected to the results page via `GET /api/quiz/results/{session_id}`

**Guest mode:**
- `GET /api/auth/guest` returns a 24-hour JWT for a shared guest account
- Token is stored in `sessionStorage` (cleared on tab close)
- Quiz sessions are created normally but `UserProgress` is never updated for the guest account

---

## Security Features

### Authentication
- JWT-based authentication with configurable expiry
- Passwords hashed with bcrypt via passlib
- Guest tokens stored in sessionStorage (not persisted across browser sessions)

### Authorization
- Three roles: `admin`, `editor`, `student`
- `AdminRoute` on the frontend blocks non-admin users from accessing the admin panel
- Backend verifies role from JWT on every protected endpoint
- Guest account has `student` role — cannot access any admin endpoint

### API Security
- Rate limiting on auth endpoints via slowapi (10 req/min for register, 20 req/min for login, 30 req/min for guest)
- CORS configured to allow only the production frontend origin
- No sensitive data returned in API responses (password hashes never serialized)
- `is_master` flag on users prevents master accounts from being modified or deleted via the API

### Data Protection
- `.env` files are gitignored — secrets never committed to the repository
- SSH private key stored as a GitHub Actions secret, never in code
- Database credentials only in environment variables, not in source

---

## Courses Available

| Course | Topics |
|---|---|
| JavaScript | Core JS, async, DOM, ES6+ |
| Python | Syntax, OOP, data structures |
| React | Hooks, components, state |
| TypeScript | Types, generics, interfaces |
| HTML & CSS | Markup, layout, selectors |
| AI Engineering | Prompting, models, pipelines |

---

## License

This project was built for personal use and learning. Feel free to fork and adapt it for your own purposes.
