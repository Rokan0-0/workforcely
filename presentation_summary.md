# Workforcely HR & LMS Platform: Integration Summary

This document structures the features of **Workforcely** by user role: first detailing what the **HR Admin** can manage, and then detailing what the **Employee** can access via self-service. Feed this directly into your presentation script writer.

---

## Part 1: HR Admin View & Capabilities

The HR Admin has full organization-wide visibility and administrative authority. Here is everything the HR Admin can manage and execute:

### 👤 Employee & Organization Management
*   **Employee Directory (CRUD)**: Create, edit, and delete employee profiles (name, role, department, salary structure, contact info, and profile photo uploads).
*   **Visual Org Chart**: View a real-time hierarchy diagram illustrating manager-employee relationships, complete with user photos and department tags.

### 📅 Time, Attendance & Leaves
*   **Manual Adjustments**: View organization-wide check-in logs and manually edit or add attendance marks (Present, Late, Absent).
*   **Leave Approvals Portal**: Manage employee leave requests, with the ability to review reasons and click **Approve** or **Reject** (which automatically triggers notification alerts for the employee).

### 💳 Payroll Administration
*   **Nigerian PAYE & Pension Tracker**: Automatically computes standard income tax (Nigerian PAYE) and pension contributions (8% deduction) based on basic + housing + transport allowances.
*   **HR Salary Overrides**: Manually apply bonuses, deductions, or correction overrides on top of standard calculations, complete with mandatory reason-logging.
*   **Payslip Archive**: Store and retrieve historical payroll runs and generate detailed payslips.

### 📈 Performance Cycle Management
*   **File Performance Review Modal**: A modern, interactive popup form accessed from the scorecard catalog to evaluate employees.
*   **KPI Weight Calibration**: Assign key performance goals/KPIs to an employee, with a validation safeguard enforcing that weights sum to exactly 100%.
*   **Star Ratings & Comments**: Rate employees on a 1-5 scale and log descriptive growth feedback, which instantly updates the employee's scorecard.

### 📚 Course Builder & LMS Management
*   **Syllabus Designer**: Create text-based courses, add modular lessons (supporting markdown formatting and YouTube video URLs), and establish course categories, difficulties, and durations.
*   **Quiz Constructor**: Set up optional evaluation checkpoints featuring multiple-choice or true-false questions, pass marks, and maximum retake limits.
*   **External Integration**: Register external courses (e.g. Udemy, Coursera) with external link redirects and self-reporting completion trackers.
*   **LMS Analytics**: Track organization-wide completion rates, average quiz scores, and course drop-off points.

### ⚖️ Incidents & Sanction Pipeline
*   **Incident Inbox**: Review incident reports filed by staff.
*   **Sanction Progression**: Apply official outcomes (Under Review → Verbal Warning / Written Warning / Suspension / Resolved / Escalated).
*   **Outcome Auditing**: Maintain a permanent, HR-only log of sanction outcomes on the employee’s profile, automatically alerting the employee upon resolution.

### 📢 Company Memo Broadcasts
*   **Targeted Announcements**: Publish company-wide bulletins targeted to "All Staff" or to "Specific Departments".
*   **Global Alerts**: Trigger real-time, in-app notifications (bell icon alerts) to matching employees.

### 📁 Recruitment Pipeline (Kanban)
*   **Public Job Listings**: Publish open positions to a public landing page featuring application forms (including resume and cover note submissions).
*   **Kanban Board Pipeline**: Progress candidates through stages: Applied → Shortlisted → Interview → Offer → Hired/Rejected.
*   **Email Sync Mockups**:
    *   Moving to *Shortlisted* or *Hired* triggers confirmation toasts showing `"Email sent to [candidate]"`.
    *   Moving to *Hired* automatically creates the employee record, sets up the onboarding checklist, and creates login credentials (triggering a credential delivery confirmation).

### 🤖 Organization-Wide AI Assistant
*   **Full Database Queries**: HR Admin can interact with a natural-language AI to query organization-wide data (e.g., `"Who is on leave next week?"`, `"Show me employees due for a review"`, `"Total payroll cost this month"`), returning formatted data lists.

---

## Part 2: Employee Self-Service View & Capabilities

The Employee view is restricted solely to the employee's own records, safeguarding organization privacy while enabling full self-service.

### 📊 Dashboard & Onboarding Checklist
*   **Onboarding Progress Tracker**: View assigned tasks (e.g., "Submit signed contract", "Setup work laptop") and check off tasks as they are completed.
*   **Personalized Analytics**: View visual charts detailing personal attendance patterns and performance cycles.

### 📅 Self-Service Attendance & Leaves
*   **Mobile-Friendly Punch Clock**: Click **Clock In** and **Clock Out** directly from the dashboard to log daily hours.
*   **Leave Balance Dashboard**: View remaining annual, sick, and casual leave allocations.
*   **Leave Request Form**: Submit digital leave requests detailing duration, leave type, and reasons.

### 💳 Payslip Self-Service
*   **Interactive Payslips**: View and inspect monthly salary breakdowns, tax calculations, pension deductions, and HR overrides.
*   **Direct Download**: Download individual payslips locally for personal accounting.

### 📈 Goal Self-Service & Scorecards
*   **Performance & Goals Sidebar Navigation**: Direct portal sidebar link to the Performance Scorecard page, enabling full employee visibility.
*   **Overall Performance Gauge**: View a composite performance score compiled from:
    1.  *Training Completion Rate* (LMS progress)
    2.  *Punctuality Rate* (daily clock-in times)
    3.  *Manager Review Rating* (average star rating)
    4.  *Task/Checklist Completion Rate* (KPI progress)
*   **Goal Status Updates**: Toggle assigned KPI statuses (Not Started → In Progress → Completed) to dynamically update the overall scorecard score.

### 📚 Course Player & Certificate Download
*   **Course Catalog**: Browse internal and external training courses, filter by difficulty/category, and self-enroll.
*   **Syllabus Viewer**: Navigate course syllabuses in-place in the same tab.
*   **Sequential Lesson Locks**: Access courses with sequential locks (Lesson 2 remains locked until Lesson 1 is completed and marked done).
*   **HTML & Video Player**: Read course lessons with rich markdown styling and watch embedded YouTube instruction videos.
*   **Attempts-Limited Quizzes**: Take evaluation quizzes with automatic passing grade verification.
*   **Premium Printable Certificates**: Instantly download a Workforcely-branded completion certificate upon passing, featuring name, score, issue date, and director signature.

### ⚖️ Incident Submission
*   **Report Builder**: File incident reports (Safety, Conflict, Facility, etc.) with description text and optional evidence notes.
*   **Resolution Notifications**: Receive immediate notifications once HR resolves the report.

### 🔔 In-App Memos & Notification Alerts
*   **Notification Bell**: View unread notification counts.
*   **Targeted Feeds**: Read announcements and memos broadcast to all staff or specifically to the employee's department.

### 🤖 Scoped AI Assistant
*   **Private Scoped Queries**: Access a private AI chatbot scoped *only* to the employee's personal data. Employees can ask: `"How many leave days do I have left?"`, `"Show me my last payslip summary"`, or `"What training deadline do I have next?"`.
