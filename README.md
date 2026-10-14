<p align="center">
  <img src="public/logo.png" alt="Workforcely Logo" width="200" />
</p>

<h1 align="center">Workforcely</h1>

<p align="center">
  <strong>Enterprise HR Management, Automated Statutory Payroll, LMS & Scoped AI People Analytics</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI_Assistant-8E75C4?style=flat-square&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## 📌 Executive Summary

**Workforcely** is an all-in-one Human Resource Management System (HRMS) and self-service workplace portal engineered for high-growth enterprises and African SME hybrids (Retail, Logistics & FinTech).

It bridges operational gaps by combining **granular personnel management**, **automated statutory compliance (PAYE, Pension, HMO)**, an **interactive LMS with verifiable certificates**, and a **Scoped AI HR Reasoning Assistant** powered by Google Gemini.

---

## 🚀 Key Modules & Capabilities

### 1. 👥 Employee Directory & Visual Org Chart
- **Dynamic Organization Chart**: Visual interactive tree displaying reporting hierarchies, department heads, and vacant manager roles.
- **Rich Profiles**: Comprehensive tracking of bank details, statutory IDs, emergency contacts, compensation bands, and employment statuses.

### 2. ⏱️ Attendance & Real-Time Time Tracking
- **Self-Service Punch In/Out**: One-click shift check-ins with timestamp logging and IP/session verification.
- **Attendance Insights**: Monthly breakdown of on-time arrivals, late marks, leaves taken, and overtime hours.

### 3. 💵 Payroll & Nigerian Statutory Compliance
- **Automated Tax Calculation**: Built-in statutory logic for PAYE, Consolidated Relief Allowance (CRA), Pension Reform Act (8% employee / 10% employer), and NHF.
- **Instant Payslip Generation**: Detailed PDF/print-ready payslips highlighting gross pay, statutory withholdings, bonuses, and net payouts.
- **Statutory Remittance Reports**: One-click exports for State Internal Revenue Services (SIRS) and Pension Fund Administrators (PFAs).

### 4. 🏥 Benefits & HMO Administration
- **Health Insurance Tiers**: Managed plans (Bronze, Silver, Gold, Platinum) with primary provider selections and dependent quotas.
- **Enrollment Lifecycles**: Direct employee HMO tier selections with automatic payroll deduction synchronization.

### 5. 📚 Learning Management System (LMS) & Certifications
- **Curated Course Catalog**: Modules covering compliance, workplace safety, FinTech regulations, and leadership.
- **Interactive Quizzes**: Knowledge checks with automatic scoring and passing thresholds.
- **Verifiable Certificates**: Dynamic completion certificates with unique verification IDs ready for print and download.

### 6. 🎯 Recruitment & Public Careers Portal
- **Job Requisition Pipeline**: Visual Kanban board moving candidates across *Applied*, *Screening*, *Interview*, *Offered*, and *Hired*.
- **Public Career Page**: Candidate-facing job board with instant application submission and resume linking.

### 7. ⚠️ Workplace Incidents & Official Memos
- **Anonymous/Named Incident Reports**: Structured ticketing for workplace hazards, disputes, or equipment failures with manager audit trails.
- **Broadcast Memos**: Company-wide announcements with priority indicators (Urgent, Notice, Policy Updates).

### 8. 🤖 Scoped AI HR Assistant (Gemini)
- **Natural Language Analytics**: Conversational queries across headcount, payroll burn rate, department distributions, and leave calendars.
- **Scoped Data Isolation**: Read-only, context-aware reasoning preventing accidental data leakage while delivering instant operational answers.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | Vanilla CSS Tokens + Tailwind CSS, [Lucide React](https://lucide.dev/) Icons |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with RLS) & Local Fallback Store |
| **Artificial Intelligence** | [Google Gemini API](https://ai.google.dev/) (Flash HR Reasoning Agent) |
| **Presentations** | Built-in pitch deck (`/presentation`) & Python PPTX generators |

---

## 🔑 Demo Access & Role Accounts

Workforcely features one-click role switching on the welcome portal:

| Role | Demo User | Email | Access Scope |
|---|---|---|---|
| **HR Admin** | Olumide Sowore | `olumide.sowore@workforcely.com` | Full administrative access: personnel, payroll overrides, memos, compliance. |
| **Staff (Standard)** | Fatima Abubakar | `fatima.abubakar@workforcely.com` | Self-service portal: view payslips, request leave, report incidents. |
| **New Hire** | Taiwo Adeyemi | `taiwo.adeyemi@workforcely.com` | Onboarding dashboard, active training courses & certificates. |

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v18.17+ or v20+
- **npm** or **pnpm** / **yarn**

### 2. Clone & Install
```bash
git clone https://github.com/Rokan0-0/workforcely.git
cd workforcely

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```env
GEMINI_API_KEY="your_google_gemini_api_key"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 📂 Project Structure

```
workforcely/
├── public/
│   ├── logo.png               # High-resolution brand emblem & wordmark
│   ├── logo.svg               # Scalable horizontal vector badge
│   ├── logo-dark.svg          # Dark-mode optimized vector badge
│   └── logo-icon.svg          # Modern geometric "W" vector app icon
├── src/
│   ├── app/
│   │   ├── api/               # API endpoints (Auth, Employees, AI Assistant, Payroll)
│   │   ├── dashboard/         # Protected HR Portal (Analytics, Employees, LMS, Payroll, etc.)
│   │   ├── recruitment/       # Public Candidate Job Board & Application Form
│   │   ├── presentation/      # Built-in Interactive Pitch Deck
│   │   ├── globals.css        # Core design tokens, light/dark themes & typography
│   │   ├── layout.tsx         # Root layout with branded favicon & meta
│   │   └── page.tsx           # Role-based Welcome & Quick Login screen
│   └── lib/
│       ├── db.ts              # In-memory mock database & seed store
│       └── supabase.ts        # Supabase client connector
├── workforcems_schema.sql     # PostgreSQL database migration & RLS definitions
└── package.json
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
