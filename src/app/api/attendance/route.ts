import { NextRequest, NextResponse } from 'next/server';
import { db, Attendance } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  let logs = db.getAttendance();

  if (employeeId) {
    logs = logs.filter(log => log.employeeId === employeeId);
  }

  if (date) {
    logs = logs.filter(log => log.date === date);
  }

  return NextResponse.json({ attendance: logs });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, action, date, clockIn, clockOut, status } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const logs = db.getAttendance();
    const todayStr = date || new Date().toISOString().split('T')[0];

    if (action === 'clockIn') {
      // Check if already clocked in today
      const alreadyLogged = logs.find(log => log.employeeId === employeeId && log.date === todayStr);
      if (alreadyLogged) {
        return NextResponse.json({ success: false, error: 'Already clocked in today' }, { status: 400 });
      }

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Late after 8:30 AM
      const isLate = hours > 8 || (hours === 8 && minutes > 30);
      const attStatus = isLate ? 'Late' : 'Present';

      const newAtt: Attendance = {
        id: `att-${Date.now()}`,
        employeeId,
        date: todayStr,
        clockIn: timeStr,
        clockOut: null,
        status: attStatus
      };

      logs.push(newAtt);
      db.updateAttendance(logs);
      return NextResponse.json({ success: true, log: newAtt });
    }

    if (action === 'clockOut') {
      // Find today's clock in
      const todayLog = logs.find(log => log.employeeId === employeeId && log.date === todayStr);
      if (!todayLog) {
        return NextResponse.json({ success: false, error: 'No clock-in record found for today' }, { status: 400 });
      }
      if (todayLog.clockOut) {
        return NextResponse.json({ success: false, error: 'Already clocked out today' }, { status: 400 });
      }

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

      todayLog.clockOut = timeStr;
      db.updateAttendance(logs);
      return NextResponse.json({ success: true, log: todayLog });
    }

    if (action === 'manual') {
      if (!date || !status) {
        return NextResponse.json({ success: false, error: 'Date and status are required for manual logging' }, { status: 400 });
      }

      // Check if record already exists for this employee and date
      const existingIndex = logs.findIndex(log => log.employeeId === employeeId && log.date === date);

      const logRecord: Attendance = {
        id: existingIndex !== -1 ? logs[existingIndex].id : `att-man-${Date.now()}`,
        employeeId,
        date,
        clockIn: clockIn || '',
        clockOut: clockOut || null,
        status
      };

      if (existingIndex !== -1) {
        logs[existingIndex] = logRecord;
      } else {
        logs.push(logRecord);
      }

      db.updateAttendance(logs);
      return NextResponse.json({ success: true, log: logRecord });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
