import { NextRequest, NextResponse } from 'next/server';
import { db, JobPosting, JobApplicant, Employee, Notification } from '@/lib/db';

function getNewEmployeeId(employees: Employee[]) {
  return `emp-${employees.reduce((max, emp) => {
    const num = Number(emp.id.replace('emp-', '')) || 0;
    return num > max ? num : max;
  }, 0) + 1}`;
}

function createOnboardingChecklist() {
  const baseDate = new Date();
  return [
    { id: `ob-${Date.now()}-1`, title: 'Submit signed contract', completed: false, dueDate: new Date(baseDate.getTime() + 86400000 * 2).toISOString().split('T')[0] },
    { id: `ob-${Date.now()}-2`, title: 'HR documentation & ID capture', completed: false, dueDate: new Date(baseDate.getTime() + 86400000 * 4).toISOString().split('T')[0] },
    { id: `ob-${Date.now()}-3`, title: 'Set up employee accounts and tools', completed: false, dueDate: new Date(baseDate.getTime() + 86400000 * 6).toISOString().split('T')[0] }
  ];
}

function normalizeDate(date?: string) {
  if (!date) return undefined;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  const jobPostings = db.getJobPostings();
  const today = new Date().toISOString().split('T')[0];
  let updated = false;

  jobPostings.forEach((job) => {
    if (job.status === 'Open' && job.closingDate && job.closingDate <= today) {
      job.status = 'Closed';
      updated = true;
    }
  });

  if (updated) {
    db.updateJobPostings(jobPostings);
  }

  const jobApplicants = db.getJobApplicants();
  return NextResponse.json({ jobPostings, jobApplicants });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, title, departmentId, description, applicantId, status, employeeId, taskId, completed, jobId, name, email, phone, resumeText, coverNote, resumeFile } = body;

    const postings = db.getJobPostings();
    const applicants = db.getJobApplicants();
    const employees = db.getEmployees();
    const notifications = db.getNotifications();

    if (action === 'createJob') {
      if (!title || !departmentId || !description) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const newJob: JobPosting = {
        id: `job-${Date.now()}`,
        title,
        departmentId,
        description,
        status: 'Open',
        createdDate: new Date().toISOString().split('T')[0],
        closingDate: normalizeDate(body.closingDate)
      };

      postings.push(newJob);
      db.updateJobPostings(postings);

      return NextResponse.json({ success: true, job: newJob });
    }

    if (action === 'closeJob') {
      if (!jobId) {
        return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
      }

      const jobIndex = postings.findIndex((job) => job.id === jobId);
      if (jobIndex === -1) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      }

      postings[jobIndex].status = 'Closed';
      db.updateJobPostings(postings);

      return NextResponse.json({ success: true, job: postings[jobIndex] });
    }

    if (action === 'apply') {
      if (!name || !email || !jobId) {
        return NextResponse.json({ success: false, error: 'Name, email and job selection are required' }, { status: 400 });
      }

      const targetJob = postings.find((posting) => posting.id === jobId);
      if (!targetJob) {
        return NextResponse.json({ success: false, error: 'Selected job posting was not found' }, { status: 404 });
      }

      const newApplicant: JobApplicant = {
        id: `app-${Date.now()}`,
        jobId,
        name,
        email,
        phone: phone || '',
        resumeUrl: resumeFile || `/resumes/${name.toLowerCase().replace(/\s+/g, '_')}.txt`,
        resumeText: resumeText || '',
        coverNote: coverNote || '',
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      applicants.push(newApplicant);
      db.updateJobApplicants(applicants);

      // Create a notification for HR/Admins about the new applicant
      try {
        const note = {
          id: `note-${Date.now()}`,
          title: 'New Job Application',
          message: `${newApplicant.name} applied for ${targetJob.title}.`,
          audience: 'All Staff',
          read: false,
          createdDate: new Date().toISOString().split('T')[0]
        } as Notification;
        notifications.push(note);
        db.updateNotifications(notifications);
      } catch (err) {
        console.error('Failed to create application notification', err);
      }

      return NextResponse.json({ success: true, applicant: newApplicant, notification: `New applicant ${newApplicant.name}` });
    }

    if (action === 'updateApplicantStage') {
      if (!applicantId || !status) {
        return NextResponse.json({ success: false, error: 'Applicant ID and stage status are required' }, { status: 400 });
      }

      const index = applicants.findIndex(app => app.id === applicantId);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
      }

      applicants[index].status = status;
      const updatedApplicant = applicants[index];
      let notificationText = '';
      let credentials: { email: string; username: string; password: string } | undefined;

      if (status === 'Shortlisted') {
        notificationText = `Email sent to ${updatedApplicant.email} with interview next steps.`;
      }

      if (status === 'Hired') {
        notificationText = `Email sent to ${updatedApplicant.email} confirming their hire.`;

        const applicantExists = employees.find(emp => emp.email.toLowerCase() === updatedApplicant.email.toLowerCase());
        let employeeId = applicantExists?.id;

        if (!employeeId) {
          const newEmployeeId = getNewEmployeeId(employees);
          const defaultSalary = { base: 320000, housing: 100000, transport: 60000 };
          const newEmployee: Employee = {
            id: newEmployeeId,
            name: updatedApplicant.name,
            email: updatedApplicant.email,
            role: 'Employee',
            departmentId: postings.find((p) => p.id === updatedApplicant.jobId)?.departmentId || 'dept-5',
            hireDate: new Date().toISOString().split('T')[0],
            salary: defaultSalary,
            contactInfo: {
              phone: updatedApplicant.phone || '',
              address: '',
              nextOfKin: ''
            },
            profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
            onboardingChecklist: createOnboardingChecklist()
          };

          employees.push(newEmployee);
          db.updateEmployees(employees);
          employeeId = newEmployeeId;

          credentials = {
            email: updatedApplicant.email,
            username: updatedApplicant.email.split('@')[0],
            password: 'Welcome123!'
          };

          const hireNotification: Notification = {
            id: `note-${Date.now()}`,
            title: 'New Hire Onboarded',
            message: `Candidate ${updatedApplicant.name} has been moved to Hired and added to employee records.`,
            audience: 'Specific Employee',
            recipientId: employeeId,
            read: false,
            createdDate: new Date().toISOString().split('T')[0]
          };
          notifications.push(hireNotification);
          db.updateNotifications(notifications);
        }
      }

      db.updateJobApplicants(applicants);

      return NextResponse.json({ success: true, applicant: updatedApplicant, notification: notificationText, credentials });
    }

    if (action === 'updateChecklist') {
      if (!employeeId || !taskId) {
        return NextResponse.json({ success: false, error: 'Employee ID and Task ID are required' }, { status: 400 });
      }

      const employeesList = db.getEmployees();
      const empIndex = employeesList.findIndex(emp => emp.id === employeeId);
      if (empIndex === -1) {
        return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
      }

      const taskIndex = employeesList[empIndex].onboardingChecklist.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return NextResponse.json({ success: false, error: 'Checklist task not found' }, { status: 404 });
      }

      employeesList[empIndex].onboardingChecklist[taskIndex].completed = !!completed;
      db.updateEmployees(employeesList);

      return NextResponse.json({ success: true, employee: employeesList[empIndex] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

