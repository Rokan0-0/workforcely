Build a full-stack HR Management System web app called "Workforcely".
Tech & Design:

Responsive design (mobile, tablet, desktop) — fully usable on phone screens
Light mode (default) and dark mode toggle
Color scheme: deep navy/blue primary (#1E3A5F or similar), teal/green accent (#14B8A6 or similar) for positive actions/approvals, clean gray/white neutrals, good contrast for accessibility
Clean, modern enterprise SaaS look (similar feel to BambooHR/Workday) — sidebar navigation, card-based dashboards, clear typography

User Roles:

HR Admin — full access to all modules below
Employee — self-service portal (own profile, attendance, leave, payslips, training, performance reviews)

Modules:

Employee Management

CRUD for employees: name, role, department, hire date, salary, contact info, profile photo
Department list/management
Simple org chart view

Recruitment & Onboarding

Job postings (create/list/close)
Applicant tracking (stages: applied, interview, offer, hired/rejected)
Onboarding checklist for new hires (tasks with completion status)

Attendance & Leave

Clock in/out (admin can also manually mark attendance)
Leave types (annual, sick, casual), leave balance tracking
Leave request + approval workflow (employee submits, admin approves/rejects)

Payroll

Salary structure per employee (base, allowances, deductions)
Auto-calculate tax/pension/deductions, net pay
Generate payslips (viewable/downloadable)
Payroll history log

Performance Management

Goals/KPIs per employee
Review cycles with ratings (e.g., 1-5 scale) and comments
History of past reviews

Training & Development

Course catalog (title, description, duration)
Employee enrollment
Completion tracking/status

Dashboard & Analytics (Admin home)

Headcount by department (chart)
Attendance trends over time (chart)
Payroll cost breakdown (chart)
Performance rating distribution (chart)
Leave requests pending approval (count/list)

AI HR Assistant (key differentiator feature)

Chat-style interface accessible from admin dashboard
Answers natural-language questions using the seeded data, e.g.:

"Who is on leave next week?"
"Show me employees due for a performance review"
"What's our total payroll cost this month?"
"Which department has the highest attendance rate?"

Should query/reason over the actual database, not give generic responses

Demo Data Seeding:

Seed the database with a realistic demo company: a Nigerian SME retail/fintech hybrid called "Workforcely Demo Co" (or similar)
25-30 employees across 5 departments (e.g., Sales, Engineering, Finance, HR, Operations) with realistic Nigerian names
1-2 months of attendance history (varied — some absences, late check-ins)
Mix of leave requests: some pending, some approved, some rejected
Full payroll history for the past 2-3 months with calculated payslips
Performance reviews for at least half the employees, with varied ratings and comments
Several job postings with applicants in different stages
Training courses with enrollments at different completion statuses
Onboarding checklists for 2-3 recently hired employees (partially completed)

Login:

Pre-seeded login for HR Admin and at least 2 sample Employee accounts so judges can switch roles and explore both views during the demo
