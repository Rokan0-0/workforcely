# Workforcely Core Upgrades Walkthrough

All additive upgrade features requested in `update.md` (and subsequent UX requests) have been fully implemented, verified, and compiled. 

Below is the guide to help you go through and demo each feature.

---

## 💻 UX Optimizations

### 1. Zero Loading screen Flashes (Caching)
- **What it does**: Navigating between tabs (e.g. from Dashboard to Employees to Payroll and back) is now **instantaneous** with zero loading page flashes.
- **How to test**: Click through the sidebar items. Previously, you would see a fullscreen "Loading..." text for 200ms on every click. Now, previous data renders immediately, and updates itself in the background silently.

### 2. Premium Scrollbars
- **What it does**: Bulky native browser scrollbars have been replaced by custom, thin, sleek scrollbars.
- **How to test**: Scroll down any page (like the main Admin dashboard or employee list). The scrollbar handles dynamically adjust color matching Light and Dark modes.

---

## 📢 Memos & Annoucements

### 3. Modal Publisher Form
- **What it does**: The "Publish a New Memo" section has been collapsed into a single inline **`+ Publish Memo`** button next to the title. When clicked, it launches a clean, focused pop-up modal.
- **How to test**: 
  1. Log in as **Admin: Olumide (HR)** or **Chioma**.
  2. Go to **Memos & Announcements** on the sidebar.
  3. Click **`+ Publish Memo`** next to the "Company Memos" title.
  4. Type your announcement and click **Publish Memo**. On success, it automatically closes after 1.5 seconds.
  5. Switch role to **Employee: Fatima** or **Taiwo**. You will immediately see a notification badge on the bell icon at the top!

---

## 🔔 In-App Notifications

### 4. Interactive Bell Redirection
- **What it does**: Clicking on the bell icon shows notifications. Clicking any item marks it read and redirects you directly to the **Memos & Announcements** page to read notices in detail.
- **How to test**: Click the notification dropdown, click any of the unread items, and verify that the dropdown closes and routes you to the memos center.

---

## 👥 Employees & Org Management

### 5. Employee Details Profile Modal
- **What it does**: Clicking on an employee row in the HR Directory launches a premium profile detail modal.
- **How to test**:
  1. Go to **Employees** as Admin.
  2. Click anywhere on an employee's row (e.g., Chioma or Fatima).
  3. A gorgeous modal displays their profile photo (with initials placeholder fallback), hire date, contact info, residential details, next of kin, and full gross salary breakdown.
  4. Click **Edit Profile** inside the modal (or the pencil edit icon directly in the row action column) to modify the details.

### 6. Photo Uploads
- **What it does**: Supports uploading Base64 images for employees.
- **How to test**: Edit an employee, choose an image file, and save. The image is rendered immediately in the sidebar, user avatar badge, org chart nodes, and profile modals.

---

## 📊 Workplace Incident & Safety Log

### 7. Occupational Safety vs. Disciplinary Form Controls
- **What it does**: Dynamically changes resolution outcomes and instructions depending on the category of the incident report. For `Safety` or `Facility` cases, HR can assign `Investigation Logged` or `Hazard Mitigated` outcomes with safety notes. For `Conflict` or `Behavior` cases, HR can issue warnings or suspensions.
- **How to test**:
  1. Log in as Fatima, go to **Incidents & Sanctions** and review the pre-logged safety incident *"Slipped while moving packages"*. 
  2. Notice that the Resolution selector shows safety-relevant outcomes (`Investigation Logged`, `Hazard Mitigated`) instead of warnings, and the note placeholder prompts for mitigation actions.

### 8. Target Employee Accusation & Warning Memo Pipeline
- **What it does**: Allows employees to file hazard or behavioral reports against another employee, and enables HR to send warning notices directly to that accused employee.
- **How to test**:
  1. Log in as **Employee: Fatima**. Go to **Incidents & Sanctions** and click **`File New Incident Report`**.
  2. Select category **Workplace Conflict / Dispute**. Under **Accused Employee**, select **Taiwo** (Employee B). Submit the report.
  3. Switch to **Admin: Olumide (HR)**. Go to **Incidents & Sanctions** and click **`Review / Resolve`** on Fatima's new report.
  4. Notice the **`ACCUSED / TARGET EMPLOYEE: Taiwo`** details tag.
  5. Go to the new red action card: **`Disciplinary Action: Issue Notice to Accused Employee`**.
  6. Type a warning memo (e.g., *"HR is investigating a dispute. Please meet with HR at 3 PM."*) and click **`Send Warning Memo to Taiwo`**.
  7. This appends a notice to the case timeline and immediately sends an in-app notification to Taiwo. Switch to Taiwo to see it!

---

## 📈 Performance & Goal Scorecards

### 9. Predetermined Review Cycles
- **What it does**: Replaces the free-text "Review Cycle" input field with pre-structured company-wide cycles matching HR cycles:
  - **Quarterly** (`Q1 2026`, `Q2 2026`, `Q3 2026`, `Q4 2026`)
  - **Semi-Annually** (`H1 2026 (Mid-Year)`, `H2 2026 (Year-End)`)
  - **Annually** (`FY 2026 Annual Review`, `FY 2027 Annual Review`)
- **How to test**: Log in as Olumide (HR), go to **Performance** and scroll down to the "Record Performance Evaluation" card. Select the Cycle Type and corresponding Period.

### 10. Dynamic KPIs & Gauges
- **What it does**: Computes dynamic overall score averages based on: LMS course completion, punctuality rate, manager reviews, and onboarding checklist rates.
- **How to test**: Go to **Performance**. Observe the circular gauge and mini metrics grids.

---

## 🎓 Training & LMS

### 11. External Training Support
- **What it does**: Supports creating and marking external courses (Udemy, Coursera) with external link references.
- **How to test**:
  1. Create a course and toggle **External Course** on. Add the provider and link.
  2. Log in as an Employee, click **Enroll Externally** on the course card.
  3. In your enrollment details drawer, click the direct resource link and click **Mark as Completed** to update progress to 100%.

---

## 🤖 AI Assistant Scoping

### 12. Employee Context Boundaries
- **What it does**: Filters LLM context prompts to only the employee's logs when logged into the Employee Portal.
- **How to test**: Log in as Fatima, go to **AI Assistant** and click the suggestions:
  - *"How many leave days do I have left?"*
  - *"What's my next training deadline?"*
  - *"Show me my last payslip summary"*
  You will see targeted, personal summaries.
