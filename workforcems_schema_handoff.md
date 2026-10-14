# 🗄️ WorkforceMS Database Schema & Developer Handoff Guide

This handoff document explains **how user accounts authenticate**, how **WorkforceMS Standalone Mode** works under the hood, and provides the full relational database schema for backend integration.

---

## 🔑 1. How Account Authentication & Switching Work

### **Authentication Architecture (`/api/auth`)**:
- **Session Context**: The application uses a central React context (`SessionContext` in `src/app/dashboard/session-provider.tsx`) fed by `POST /api/auth` and `GET /api/auth`.
- **Auto-Login on Site Entry (`/`)**:
  When a user opens the root site URL (`/`), `src/app/page.tsx` automatically initializes the session with default Admin credentials (`employeeId: 'emp-2'` - Olumide Sowore) and immediately opens **AI LMS & Training** (`/dashboard/training`).
- **Instant Role Switcher**:
  In the topbar header, the **Role Switcher** dropdown allows instant switching between:
  - `Admin: Olumide (HR Admin)`
  - `Admin: Chioma (HR Admin)`
  - `Employee: Fatima (Finance)`
  - `Employee: Taiwo (Recent Hire)`
  
  When a role is switched, `switchRole(employeeId)` posts to `/api/auth`, updates the user session, and re-renders the appropriate Admin vs. Employee views in real time.

### **Production Backend Handoff**:
For your lead backend engineer ("the main guy"), you can replace the mock authentication in `src/app/api/auth/route.ts` with standard NextAuth, Supabase Auth, or JWT sessions connected to the `employees` table in PostgreSQL.

---

## 🗄️ 2. Database Schema File (`workforcems_schema.sql`)

The production PostgreSQL database schema script is saved directly in your root project directory:
📍 **`workforcems_schema.sql`** ([workforcems_schema.sql](file:///c:/Users/Rokan/Documents/Project/Workforcely/workforcems_schema.sql))

### **Schema Table Breakdown**:

| Table Name | Description | Key Foreign Keys |
| :--- | :--- | :--- |
| **`employees`** | Stores personnel, emails, password hashes, roles (`HR Admin`/`Employee`), salary breakdowns, contact info, and onboarding JSON. | `department_id -> departments.id` |
| **`departments`** | Company department hierarchy. | `manager_id -> employees.id` |
| **`lms_courses`** | Training course catalog (title, category, difficulty, duration, thumbnail URL, external link). | `created_by -> employees.id` |
| **`lms_modules`** | Sequential course modules/lessons (title, markdown content, duration, video embed URL). | `course_id -> lms_courses.id` |
| **`lms_quizzes`** | Course assessment quizzes (pass mark %, max attempts allowed). | `course_id -> lms_courses.id` |
| **`lms_quiz_questions`** | Quiz questions (multiple choice / true-false, JSON options, correct answer). | `quiz_id -> lms_quizzes.id` |
| **`lms_enrollments`** | Employee course progress (status, % completed, current lesson, quiz score, pass boolean). | `employee_id -> employees.id`, `course_id -> lms_courses.id` |
| **`lms_certificates`** | Verified completion certificates (issue date, score, pass mark, unique cert #). | `enrollment_id -> lms_enrollments.id` |
| **`hmo_plans`** | Corporate health insurance tiers (Hygeia, AXA Mansard, Reliance, Leadway). | - |
| **`hmo_enrollments`** | Employee digital HMO membership cards and dependants (Spouse & Children JSON). | `employee_id -> employees.id`, `plan_id -> hmo_plans.id` |
| **`hmo_claims`** | Out-of-pocket medical refund claims (hospital name, diagnosis, amount, status, receipt URL). | `employee_id -> employees.id` |
| **`disciplinary_queries`**| Statutory HR query studio & defense statements. | `employee_id -> employees.id`, `issued_by -> employees.id` |

---

## 🚀 3. How to Apply the Schema in PostgreSQL / Supabase

Your developer can run the schema file directly using `psql`, Supabase SQL Editor, or AWS RDS:

```bash
# Apply schema to local or remote PostgreSQL database
psql -h localhost -U postgres -d workforcems_db -f workforcems_schema.sql
```
