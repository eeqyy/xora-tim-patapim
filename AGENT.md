# AGENT.md — Xora Project Architecture & Engineering Guidelines

> **Target Audience:** AI Coding Agents & Software Engineers
> **Repository:** Xora — Evidence-Based Learning Diagnostic & Root-Cause Navigator
> **Last Audited:** October 12, 2026
> **Active Working Branch:** `main`

> Dokumen ini adalah **acuan utama**. `README.md` mengikuti dokumen ini.
> Bila ada perbedaan antara kode dan dokumen ini, **kode adalah kebenaran** —
> perbarui dokumen ini setelah memverifikasi kode.

---

## 1. Project Overview

### 1.1 Mission and Purpose
**Xora** is an **Evidence-Based Learning Diagnostic & Root-Cause Navigator**. It transforms
software engineering education from rote memorization and coarse test scoring into a
continuous diagnostic loop: measure at concept granularity → store immutable evidence →
detect gaps → remediate the specific root cause.

### 1.2 The Problem Xora Solves
1. **Superficial Completion & Coarse Scoring:** A "70% passed" score never explains *which
   foundational concept* broke down. Gaps in prerequisites compound silently.
2. **Ungrounded "AI Tutoring":** Generic LLM tutors hallucinate because they lack granular,
   deterministic telemetry of what the learner actually knows.

### 1.3 The Core Diagnostic Loop
```
[1] Curriculum:  Subject → Level → Topic → Concept (with prerequisites)
        │
        ▼
[2] Diagnostic assessment (MCQ / CODE) served with sanitized answer keys
        │
        ▼
[3] Server-side scoring → immutable `evidence` rows (per question, per concept)
        │
        ▼
[4] Concept mastery state → `learner_concept_states` (mastery_score, confidence, gap_status)
        │
        ▼
[5] Root-cause navigation → `learning_actions` (recommendations / practice / verification)
```

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework:** React 18 (`^18.3.1`)
- **Build tool / dev server:** Vite 5 (`^5.4.0`, `@vitejs/plugin-react` `^4.3.1`)
- **Styling:** Vanilla CSS with custom design tokens in `frontend/src/index.css`.
  **Do NOT install TailwindCSS or any UI framework.**
- **Routing:** Custom History-API router in `frontend/src/context/RouterContext.jsx`
  (`useRouter`, `Link`, `ProtectedRoute`, `AdminRoute`). **Do NOT install react-router.**
- **State:** React Context (`AuthContext`, `RouterContext`) + local component state.
- **HTTP:** Always through the centralized client `frontend/src/services/api.js`.

### 2.2 Backend
- **Runtime:** Node.js 20+
- **HTTP:** Express 4 (`^4.19.2`), `cors` (`^2.8.5`)
- **Config:** `dotenv` — reads the **root `.env`** (`backend/db.js`, `backend/index.js`)
- **Auth:** **Opaque session tokens**, NOT JWT. `bcryptjs` (`^3.0.3`) hashes passwords;
  random tokens are hashed and stored in the `sessions` table.
  (`jsonwebtoken` and the old `middlewares/` + `config/auth.js` cluster were **removed**.)
- **DB driver:** `pg` (`^8.23.1`)
- **Dev:** `nodemon` (`^3.1.4`)

### 2.3 Database
- **Engine:** PostgreSQL (extension `pgcrypto` for `gen_random_uuid()`).
- **Connection:** `backend/db.js` builds a `pg.Pool` from `DATABASE_URL`; **SSL is enabled by
  default** (safe for remote Supabase). Disable it with `DATABASE_SSL=false` for local
  Homebrew Postgres that doesn't support SSL.
- **Canonical schema:** `database/init/01-schema.sql`. Historical migrations `002`–`008`
  live in `database/migrations/`; the changes still relevant for a fresh install have been
  **merged into `01-schema.sql`**.
- **Seed:** `backend/seed.js` via `npm run seed`.

> [!IMPORTANT]
> The project is **100% PostgreSQL**. `docker-compose.yml`, `.env.example`, and `README.md`
> have been updated to PostgreSQL (they previously contained legacy MySQL boilerplate).
> All queries must use PostgreSQL dialect (`$1, $2`, `RETURNING *`, `JSONB`, `ON CONFLICT`).

---

## 3. Directory Map

```text
xora-project/
├── AGENT.md                       # This guideline (source of truth for architecture)
├── README.md                      # Setup documentation
├── UPGRADE.md                     # Langkah upgrade setelah git pull
├── docker-compose.yml             # PostgreSQL + backend + frontend
├── .env.example                   # Environment template
│
├── database/
│   ├── init/01-schema.sql         # Canonical PostgreSQL DDL (28 tables, enums, indexes, triggers)
│   ├── migrations/                # 002..008 (historical; core parts merged into 01)
│   └── seeds/                     # Extra question-bank data & scripts
│
├── backend/
│   ├── index.js                   # Express app, route mounting, 404 + central error handler
│   ├── db.js                      # pg.Pool (conditional SSL)
│   ├── seed.js                    # Dev seed data
│   ├── middleware/
│   │   ├── auth.js                # requireAuth → session token → req.user/req.token
│   │   └── requireAdmin.js        # requireAdmin guard (ADMIN role)
│   ├── config/
│   │   ├── aiPrompt.js            # Prompt/format for AI analysis
│   │   ├── aiProvider.js          # OpenRouter client
│   │   └── masteryThresholds.js   # Mastery/gap thresholds
│   ├── routes/                    # 16 route files (see §4)
│   ├── services/                  # 17 services (business logic)
│   └── utils/
│       ├── errors.js              # ApiError + sendError + isValidUuid
│       ├── grading.js             # answer grading helpers
│       ├── password.js            # bcrypt hash/compare
│       ├── session.js             # bearer extraction / token hashing
│       └── aiValidator.js         # validate AI JSON output
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx                # Route switch + layout + NotFoundPage fallback
        ├── index.css              # Design system (tokens + components)
        ├── context/
        │   ├── AuthContext.jsx    # login/register/logout, tokenStorage, refreshUser
        │   └── RouterContext.jsx  # History router: currentPath/search/query/navigate
        ├── services/
        │   └── api.js             # Centralized API client
        ├── components/
        │   ├── Navbar.jsx, Button.jsx, Icons.jsx, PageContainer.jsx, PageHeader.jsx,
        │   ├── GlassPanel.jsx, StatusBadge.jsx, StatCard.jsx, ProgressBar.jsx,
        │   ├── EmptyState.jsx, ErrorState.jsx, LoadingState.jsx,
        │   ├── AssessmentMetaFields.jsx, index.js (barrel export)
        └── pages/
            ├── HomePage.jsx, LoginPage.jsx, RegisterPage.jsx, ProfilePage.jsx,
            ├── LearningPathPage.jsx, ProgressPage.jsx, AssessmentListPage.jsx,
            ├── AssessmentPage.jsx, AssessmentResultPage.jsx,
            ├── AdminAssessmentsPage.jsx, AdminAssessmentEditorPage.jsx,
            └── NotFoundPage.jsx   # 404
```

**Backend services (17):** `aiService`, `assessmentService`, `attemptService`, `authService`,
`conceptService`, `gapService`, `historyService`, `learningPathService`, `levelService`,
`masteryService`, `practiceService`, `profileService`, `questionService`,
`recommendationService`, `sessionService`, `subjectService`, `topicService`.

---

## 4. API Contracts

All routes are mounted in `backend/index.js`. Private routes require
`Authorization: Bearer <token>` (session token) via `middleware/auth.js`.

### 4.1 Auth (`/api/auth`)
| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | No | Register + create learner profile → `{ data: { user, token } }` (201) |
| POST | `/api/auth/login` | No | Authenticate → `{ data: { user, token, expiresAt } }` |
| POST | `/api/auth/logout` | Yes | Revoke current session (`sessions.status = 'REVOKED'`) |
| GET | `/api/auth/me` | Yes | Current user (`{ data: { user } }`) |

### 4.2 Profile (`/api/profile`) — all require auth
`GET /` · `PATCH /` · `PATCH /onboarding`

### 4.3 Catalog & Knowledge (public)
`GET /api/subjects`, `/api/subjects/:id`
`GET /api/levels`, `/api/levels/:id`
`GET /api/topics`, `/api/topics/:id`
`GET /api/concepts`, `/api/concepts/:id`, `/api/concepts/:id/prerequisites`
`GET /api/learning-path` (auth), `/api/learning-path/:subjectId` (auth)

### 4.4 Assessments & Questions (`/api/assessments`)
| Method | Path | Auth | Notes |
| :--- | :--- | :--- | :--- |
| GET | `/levels/status` | auth | Learner level progression |
| GET | `/` | auth | List assessments (filters: `subject_id`, `level_id`, `topic_id`) |
| GET | `/:id` | auth | Assessment metadata |
| GET | `/:id/questions` | auth | **Sanitized** — `correct_answer.correct` is stripped |
| POST | `/:id/attempts` | auth | Start/resume attempt (assessmentService) |
| POST | `/:id/reassess` | auth | Start reassessment |
| GET | `/attempts/:attemptId` | auth | Attempt summary (ownership checked) |
| POST | `/attempts/:attemptId/submit` | auth | Score + store evidence + gap/AI analysis (transaction) |
| POST | `/attempts/:attemptId/analyze-gap` | auth | (Re)run gap analysis |
| Admin | `/admin/questions/bank` (GET/POST), `/admin/questions/bank/:questionId` (GET/PUT/DELETE), `/admin/questions/bank/:questionId/toggle-active` (PATCH) | ADMIN | Question bank CRUD |
| Admin | `/admin/full/:id` (GET), `/` (POST), `/:id` (PUT/DELETE), `/:id/questions` (POST), `/:id/questions/reorder` (PUT), `/:id/questions/:questionId` (PUT/DELETE) | ADMIN | Assessment editor |

### 4.5 Attempts (`/api/attempts`) — thin alias layer over `attemptService`
`POST /` · `GET /` · `GET /:id` · `POST /:id/submit` · `DELETE /:id`

> **Note:** `/api/attempts/*` (attemptService) and `/api/assessments/:id/attempts`
> + `/api/assessments/attempts/:id/submit` (assessmentService) are **two
> implementations of the attempt lifecycle**. Both are live and must keep working;
> prefer the `/api/assessments/*` path for full analysis output.

### 4.6 Diagnostics, Gaps, Mastery, Remediation, History
- `GET /api/mastery`, `GET /api/mastery/concepts/:conceptId`
- `GET /api/gaps`, `GET /api/gaps/:conceptId`, `POST /api/gaps/:conceptId/diagnose`
- `GET /api/diagnostics/:id`, `POST /api/diagnostics/:id/verify/start`
- `GET /api/recommendations`, `/next` (alias `/next-step`), `/:id/materials`,
  `POST /:id/start`, `/:id/complete`, `/:id/skip`
- `GET /api/practices`, plus practice attempt routes
- `GET /api/history`
- `GET /api/health` (public) · `POST /api/ai/analyze`, `GET /api/ai/health`

### 4.7 Error & not-found responses
- Unknown endpoints return **JSON 404**: `{ "status": "error", "message": "Endpoint tidak ditemukan: <METHOD> <path>" }`.
- A centralized error handler in `index.js` reuses `utils/errors.sendError`, so all
  errors share the shape `{ status: "error", message }` (never leaks stack traces).

---

## 5. Domain Model & Business Rules

### 5.1 Tables (28, in `database/init/01-schema.sql`)
Identity: `users`, `roles`, `user_roles`, `sessions`.
Profiles: `learner_profiles`, `admin_profiles`.
Curriculum: `subjects`, `levels`, `topics`, `materials`, `concepts`, `topic_concepts`,
`concept_prerequisites`, `learning_paths`.
Assessment: `assessments`, `questions`, `attempts`, `attempt_questions` (snapshot), `evidence`.
Diagnostics/remediation: `diagnostics`, `diagnostic_verifications`, `learning_actions`,
`learner_concept_states`.
Telemetry: `learning_events`, `audit_logs`, `learner_analytics`, `concept_analytics`,
`learning_path_analytics`.

Key columns added to match code (migrations 006/007, merged into schema):
- `questions`: `material`, `is_active`, `explanation`, `deleted_at`; `assessment_id` &
  `order_index` are **nullable** (bank questions).
- `assessments`: `difficulty`.
- `attempts`: `is_passed`, `material_scores` (JSONB), `topic_scores` (JSONB),
  `ai_analysis` (JSONB), `ai_status`.
- `attempt_questions`: pins the served question set/order per attempt.

### 5.2 Strict Business Rules
1. **Identity & ownership:** the learner id is derived from the **verified session token**
   (`req.user.id`), never from request bodies/params. Attempts are readable/submittable
   only by their owner (else 403).
2. **Server-side scoring & zero key leakage:** `GET /api/assessments/:id/questions` must
   never return `correct_answer.correct`. Scoring happens only on the server.
3. **Transactions:** multi-table mutations (submit + evidence + status/analysis; register +
   profile) run inside `BEGIN … COMMIT` with rollback on error and `client.release()` in `finally`.
4. **Truth in UI:** never display fabricated metrics. Fall back to honest labels such as
   *"Belum terpetakan"* / *"Evidence Needed"*.

---

## 6. Frontend Design System

Visual identity: **light glassmorphism over a soft slate background with an indigo primary**.
Tokens live in `frontend/src/index.css` — **always read the file; examples of the real ones:**

```css
:root {
  --color-bg: #f8fafc;
  --color-surface: rgba(255, 255, 255, 0.85);
  --color-surface-solid: #ffffff;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-text-main: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;

  --color-border: rgba(226, 232, 240, 0.85);
  --color-success: #059669;
  --color-error: #dc2626;
  --color-warning: #d97706;
  --color-info: #2563eb;
}
```

Rules: reach for existing component classes (`glass-panel`, `badge`, `page-container`,
etc.) and shared components instead of ad-hoc inline styles; keep WCAG AA contrast;
provide visible `:focus-visible` outlines; respect `prefers-reduced-motion`.

---

## 7. Frontend UX & Integration Rules
1. **Centralized API client:** route every HTTP call through `services/api.js`.
2. **Routing:** use `useRouter().navigate(to)` or `<Link to>`; never `window.location.href`
   except for external redirects. `currentPath` is **pathname-only**; read query params via
   `query` (`URLSearchParams`) from `useRouter()`.
3. **Unknown routes:** fall back to `NotFoundPage` (404) — never silently render HomePage.
4. **Protected routes:** wrap views in `<ProtectedRoute>` / `<AdminRoute>` in `App.jsx`.
5. **State handling:** every async view handles `loading`, `error` (with retry), `empty`,
   and `success`.

---

## 8. Backend & API Integration Rules
1. **Layering:** Route → Service → Pool/DB. Routes validate + return; services hold logic.
2. **Parameterized SQL only** (`$1, $2`). Never concatenate user input.
3. **Transactions** for atomic multi-step mutations (see §5.2).
4. **Errors:** throw `ApiError` (via `utils/errors` helpers) or an error with `.status`/
   `.statusCode`; routes call `sendError(res, error)`. A centralized handler catches the rest.
5. **No secret leakage:** never return password hashes/tokens/keys.

---

## 9. Coding Standards
- Components/pages/contexts: PascalCase (`AssessmentPage.jsx`, `AuthContext.jsx`).
- Backend services/routes: camelCase (`assessmentService.js`, `learningPath.js`).
- DB tables/columns: snake_case (`learner_concept_states`, `order_index`).
- Prefer shared components (`Button`, `StatusBadge`, `GlassPanel`, `PageContainer`, …) from
  `frontend/src/components`.
- **Dependency policy:** no gratuitous npm packages; confirm before adding.

---

## 10. Git & Collaboration Safety Rules
1. **Check context first:** `git branch --show-current` + `git status --short`.
2. **Active branch:** `main` (integrates via pull requests).
3. **`package-lock.json` (root-less) for `backend/` and `frontend/` is tracked** in git —
   commit lockfile changes together with `package.json`, don't leave them dangling.
4. **Prohibited:** `git reset --hard`, `git push --force`/`-f`, switching/merging/rebasing
   branches without explicit user direction.
5. **Never commit** `.env`, secrets, or credentials. (`.gitignore` already ignores `.env`.)
6. **Pre-commit:** `git diff --check` + `npm run build` in `frontend/`.

---

## 11. Verification Checklist
**Frontend:** `npm run build` passes; no broken imports; links have real handlers;
responsive; WCAG AA contrast; focus styles preserved.
**Backend:** validate inputs; auth enforced on private routes; ownership checks;
parameterized SQL; answer keys stripped; transactions on atomic mutations.
**General:** `git diff --check` clean; `git status --short` reviewed; report honestly what
was tested and what remains.

---

## 12. Standard Development Workflow
1. Audit & discover (read code, run `git status --short`).
2. Align with existing patterns.
3. Plan the smallest viable edit.
4. Implement.
5. Compile & test (`npm run build`; hit real endpoints).
6. `git diff --check`.
7. Document & report (changes, verification, and upgrade steps for teammates).
8. **Await user authorization** before commit/push.

---

## 13. Current State & Known Limitations

### 13.1 Working (verified)
- **Auth:** register / login / logout / me using **session tokens** (`sessions`).
- **Catalog & learning path:** subjects, levels, topics, concepts, prerequisites, learning path.
- **Assessments & attempts:** list/detail, sanitized questions, start/resume attempt,
  transactional server-side scoring, evidence creation, `attempt_questions` snapshot,
  per-material/topic scores, `is_passed`, optional AI analysis (`ai_status`).
- **Diagnostics pipeline:** mastery, gaps, diagnostics verification, recommendations
  (`learning_actions`), practices, history.
- **Admin:** assessment editor + question bank CRUD.
- **Frontend:** all pages build; unknown routes render a 404 page.

### 13.2 Known limitations / not yet implemented
- **AI features** require `AI_API_KEY`; otherwise `/api/ai/*` → 503 and `ai_status = FAILED`.
  There is **no** `OnboardingPage`/`DashboardPage` (those were removed from the docs).
- **Two attempt-lifecycle implementations** coexist (`attemptService` vs
  `assessmentService`) — unify later for maintainability.
- **`docker-compose` fresh install** is untested in CI; the config is validated with
  `docker compose config`.

---

## 14. Next Development Principles
1. Unify the attempt lifecycle (single service, keep `/api/assessments/attempts/*` contract).
2. Harden input validation (e.g., reject malformed UUIDs on path/query params).
3. Keep `AGENT.md`, `README.md`, and the schema in lockstep — verify against code before editing.
4. Every diagnostic conclusion shown to the learner must cite the evidence that justifies it.
