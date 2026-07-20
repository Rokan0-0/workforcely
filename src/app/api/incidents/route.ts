import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, IncidentReport, IncidentHistoryEntry } from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const employeeId = cookieStore.get('session_employee_id')?.value;

  if (!employeeId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const employees = db.getEmployees();
  const user = employees.find(e => e.id === employeeId);

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const incidents = db.getIncidentReports();

  if (user.role === 'HR Admin') {
    return NextResponse.json({ success: true, incidents });
  } else {
    const userIncidents = incidents.filter(i => i.employeeId === employeeId);
    return NextResponse.json({ success: true, incidents: userIncidents });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const employeeId = cookieStore.get('session_employee_id')?.value;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, description, evidenceNote, targetEmployeeId } = body;

    if (!category || !description) {
      return NextResponse.json({ success: false, error: 'Category and description are required' }, { status: 400 });
    }

    const incidents = db.getIncidentReports();
    
    // Generate new ID
    const newIdNum = incidents.reduce((max, inc) => {
      const num = parseInt(inc.id.replace('ir-', ''));
      return num > max ? num : max;
    }, 0) + 1;
    const newId = `ir-${newIdNum}`;

    const today = new Date().toISOString().split('T')[0];

    const newReport: IncidentReport = {
      id: newId,
      employeeId,
      targetEmployeeId: targetEmployeeId || undefined,
      category,
      description,
      evidenceNote: evidenceNote || '',
      date: today,
      status: 'Under Review',
      history: [
        { status: 'Under Review', note: 'Incident report submitted.', date: today }
      ]
    };

    incidents.push(newReport);
    db.updateIncidentReports(incidents);

    return NextResponse.json({ success: true, incident: newReport });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const employeeId = cookieStore.get('session_employee_id')?.value;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employees = db.getEmployees();
    const user = employees.find(e => e.id === employeeId);

    if (!user || user.role !== 'HR Admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only HR Admin can update incident statuses' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, status, outcomeNote, warningMessage } = body;

    if (action === 'sendWarningToTarget') {
      if (!id || !warningMessage) {
        return NextResponse.json({ success: false, error: 'ID and warningMessage are required' }, { status: 400 });
      }
      const incidents = db.getIncidentReports();
      const index = incidents.findIndex(i => i.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Incident report not found' }, { status: 404 });
      }
      const report = incidents[index];
      if (!report.targetEmployeeId) {
        return NextResponse.json({ success: false, error: 'No target employee listed on this report' }, { status: 400 });
      }

      const today = new Date().toISOString().split('T')[0];
      // Append warning to incident timeline
      report.history.push({
        status: 'Written Warning',
        note: `Disciplinary notice issued to target employee: "${warningMessage}"`,
        date: today
      });
      incidents[index] = report;
      db.updateIncidentReports(incidents);

      // Create in-app notification for the target employee (Employee B)
      const notifications = db.getNotifications();
      notifications.push({
        id: `note-${Date.now()}`,
        title: 'HR Disciplinary Warning',
        message: `HR has issued a warning notice to you concerning a workplace incident report: "${warningMessage}".`,
        audience: 'Specific Employee',
        recipientId: report.targetEmployeeId,
        read: false,
        createdDate: today
      });
      db.updateNotifications(notifications);

      return NextResponse.json({ success: true, incident: report });
    }

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and Status are required' }, { status: 400 });
    }

    const incidents = db.getIncidentReports();
    const index = incidents.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Incident report not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const report = incidents[index];
    
    // Append to history
    const historyEntry: IncidentHistoryEntry = {
      status,
      note: outcomeNote || `Status updated to ${status}.`,
      date: today
    };

    report.status = status;
    report.history.push(historyEntry);

    incidents[index] = report;
    db.updateIncidentReports(incidents);

    // Send in-app notification to the employee
    try {
      const notifications = db.getNotifications();
      
      const message = status === 'Resolved' 
        ? 'Your incident report has been resolved by HR.' 
        : `Your incident report status has been updated to: ${status}.`;

      notifications.push({
        id: `note-${Date.now()}`,
        title: 'Incident Report Update',
        message,
        audience: 'Specific Employee',
        recipientId: report.employeeId,
        read: false,
        createdDate: today
      });
      db.updateNotifications(notifications);
    } catch (err) {
      console.error('Failed to dispatch incident notification', err);
    }

    return NextResponse.json({ success: true, incident: report });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
