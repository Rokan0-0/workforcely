import { NextRequest, NextResponse } from 'next/server';
import { db, LeaveRequest } from '@/lib/db';

function calculateDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  const leaves = db.getLeaveRequests();

  if (employeeId) {
    // Return employee specific leaves and balances
    const empLeaves = leaves.filter(l => l.employeeId === employeeId);
    
    // Calculate leave balance dynamically
    // Base: 20 Annual, 10 Sick, 5 Casual
    let annualUsed = 0;
    let sickUsed = 0;
    let casualUsed = 0;

    empLeaves.forEach(l => {
      if (l.status === 'Approved') {
        const days = calculateDays(l.startDate, l.endDate);
        if (l.leaveType === 'Annual') annualUsed += days;
        if (l.leaveType === 'Sick') sickUsed += days;
        if (l.leaveType === 'Casual') casualUsed += days;
      }
    });

    return NextResponse.json({
      leaves: empLeaves,
      balances: {
        Annual: { allocated: 20, used: annualUsed, remaining: Math.max(0, 20 - annualUsed) },
        Sick: { allocated: 10, used: sickUsed, remaining: Math.max(0, 10 - sickUsed) },
        Casual: { allocated: 5, used: casualUsed, remaining: Math.max(0, 5 - casualUsed) },
      }
    });
  }

  // Return all leaves
  return NextResponse.json({ leaves });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, leaveType, startDate, endDate, reason } = body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const leaves = db.getLeaveRequests();

    const newRequest: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeId,
      leaveType,
      startDate,
      endDate,
      status: 'Pending',
      reason
    };

    leaves.push(newRequest);
    db.updateLeaveRequests(leaves);

    return NextResponse.json({ success: true, leave: newRequest });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, approvalComment } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Request ID and status are required' }, { status: 400 });
    }

    const leaves = db.getLeaveRequests();
    const index = leaves.findIndex(l => l.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    leaves[index].status = status;
    if (approvalComment !== undefined) {
      leaves[index].approvalComment = approvalComment;
    }

    db.updateLeaveRequests(leaves);

    // Notify employee of status change
    try {
      const empId = leaves[index].employeeId;
      const lType = leaves[index].leaveType;
      const sDate = leaves[index].startDate;
      const eDate = leaves[index].endDate;
      const note = {
        id: `note-${Date.now()}`,
        title: `Leave request ${status}`,
        message: `Your ${lType} leave request from ${sDate} to ${eDate} has been ${status.toLowerCase()}${approvalComment ? `. Comment: ${approvalComment}` : ''}.`,
        audience: 'Specific Employee' as const,
        recipientId: empId,
        read: false,
        createdDate: new Date().toISOString().split('T')[0]
      };
      const notifications = db.getNotifications();
      notifications.push(note);
      db.updateNotifications(notifications);
    } catch (err) {
      console.error('Failed to create leave notification', err);
    }

    return NextResponse.json({ success: true, leave: leaves[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
