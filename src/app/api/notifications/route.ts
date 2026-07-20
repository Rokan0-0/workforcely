import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const employeeId = cookieStore.get('session_employee_id')?.value;

  if (!employeeId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const employees = db.getEmployees();
  const employee = employees.find(e => e.id === employeeId);
  if (!employee) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const notifications = db.getNotifications();
  
  // Filter notifications relevant to the logged-in user
  const userNotifications = notifications.filter(note => {
    if (note.audience === 'All Staff') return true;
    if (note.audience === 'Specific Employee' && note.recipientId === employeeId) return true;
    if (note.audience === 'Specific Department' && note.departmentId === employee.departmentId) return true;
    return false;
  });

  return NextResponse.json({ success: true, notifications: userNotifications });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const employeeId = cookieStore.get('session_employee_id')?.value;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body;

    const notifications = db.getNotifications();

    if (action === 'markRead') {
      if (id) {
        // Mark specific notification as read
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          notifications[index].read = true;
        }
      } else {
        // Mark all as read for this employee
        const employees = db.getEmployees();
        const employee = employees.find(e => e.id === employeeId);
        
        notifications.forEach((note, index) => {
          const isForUser = 
            note.audience === 'All Staff' ||
            (note.audience === 'Specific Employee' && note.recipientId === employeeId) ||
            (note.audience === 'Specific Department' && employee && note.departmentId === employee.departmentId);
          
          if (isForUser) {
            notifications[index].read = true;
          }
        });
      }

      db.updateNotifications(notifications);
      
      // Return updated filtered notifications
      const employees = db.getEmployees();
      const employee = employees.find(e => e.id === employeeId);
      const userNotifications = notifications.filter(note => {
        if (note.audience === 'All Staff') return true;
        if (note.audience === 'Specific Employee' && note.recipientId === employeeId) return true;
        if (note.audience === 'Specific Department' && employee && note.departmentId === employee.departmentId) return true;
        return false;
      });

      return NextResponse.json({ success: true, notifications: userNotifications });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
  }
}
