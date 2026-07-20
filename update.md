Add the following features to the existing Workforcely HR Management System. Keep all existing modules (Employee Management, Attendance & Leave, Payroll, Performance, Training, AI Assistant, Dashboard) intact — this is an additive upgrade.
1. Public Recruitment Landing Page

Standalone, simple branded landing page (separate from the main app) listing open job postings
Each posting has an "Apply" button opening a form (name, email, phone, resume/cover note text field, position applying for)
Submissions save directly into the local database and appear in the Admin's Recruitment pipeline as new applicants

2. Recruitment Reviewer Flow

In the admin Recruitment module, HR can move applicants through stages: Applied → Shortlisted → Interview → Offer → Hired/Rejected
When an applicant is moved to "Shortlisted" or "Hired," show an in-app toast/confirmation: "Email sent to [candidate email]" (mocked — no real email sent)
When moved to "Hired," auto-generate the employee profile and onboarding checklist (already exists) AND auto-generate login credentials, shown in a mock confirmation: "Login credentials sent to [email]"

3. Employee Photos

Add profile photo upload/display field to employee profiles (placeholder avatar if none uploaded)
Show photos in employee list, org chart, and profile views

4. In-App Memo & Notification System

Admin can create a company memo (title, body, target audience: all staff / specific department)
Employees see memos as notifications in their portal (bell icon with unread count)
Use this in place of email wherever realistic (e.g., leave approved/rejected, payroll processed, sanction issued)

5. Payroll Enhancements

Add manual override/adjustment field for HR (e.g., bonus, deduction, correction) on top of the automatic tax/pension calculation, with a reason note field
Keep existing self-service payslip view for employees

6. Reports & Sanctions Module

Employees can submit an incident report (description, category, date, optional evidence note)
HR reviews submitted reports in admin panel
HR can attach an outcome status: Under Review → Verbal Warning / Written Warning / Suspension / Resolved (No Action) / Escalated
Outcome history is logged on the employee's record (visible to HR only)
Employee gets notified of resolution via the in-app notification system (not raw status detail, just "Your report has been resolved" type message)

7. Training — Internal + External

Internal courses: title, description, modules/content, employee enrollment, completion tracking (already exists — keep)
External courses: HR adds a course with title, provider name (e.g., Udemy, Coursera), and an external link; employee can mark as "enrolled externally" and self-report completion

8. Performance Scoring

Formalize and display a performance score per employee made up of: Training completion rate, Punctuality/resumption time, Manager/customer review rating, Task completion rate
Show this as a clear breakdown (not just one number) on the employee's performance page — e.g., a small chart or scorecard with each component

9. Login Screen

Landing/login screen has two clear buttons: "HR Admin Login" and "Employee Login" (instead of one generic login form), each pre-filled or easy to access with demo credentials for the presentation

10. AI Assistant — Extend to Employees

Employees get their own AI assistant chat (smaller, scoped to their own data)
Can answer things like: "How many leave days do I have left?", "What's my next training deadline?", "Show me my last payslip summary"
Admin AI assistant remains as-is, with full org-wide query access

Demo data updates:

Add profile photos for all seeded employees (can use placeholder/generated avatars)
Seed a few incident reports in different stages of review (under review, resolved, escalated)
Seed 2-3 company memos
Seed a mix of internal and external training enrollments
Ensure performance scorecards have realistic varied data across the four components