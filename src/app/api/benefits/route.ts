import { NextRequest, NextResponse } from 'next/server';
import { db, EmployeeHMOEnrollment, EWARequest } from '@/lib/db';

export async function GET(request: NextRequest) {
  const hmoPlans = db.getHmoPlans();
  const hmoEnrollments = db.getHmoEnrollments();
  const ewaRequests = db.getEwaRequests();
  return NextResponse.json({ hmoPlans, hmoEnrollments, ewaRequests });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, employeeId, planId, dependants, amount } = body;

    const hmoEnrollments = db.getHmoEnrollments();
    const ewaRequests = db.getEwaRequests();

    if (action === 'enrollHmo') {
      if (!employeeId || !planId) {
        return NextResponse.json({ success: false, error: 'Employee ID and Plan ID are required' }, { status: 400 });
      }

      // Check existing
      const existingIdx = hmoEnrollments.findIndex(e => e.employeeId === employeeId);
      const newEnrollment: EmployeeHMOEnrollment = {
        id: existingIdx >= 0 ? hmoEnrollments[existingIdx].id : `hmo-en-${Date.now()}`,
        employeeId,
        planId,
        dependants: dependants || [],
        enrolledDate: new Date().toISOString().split('T')[0]
      };

      if (existingIdx >= 0) {
        hmoEnrollments[existingIdx] = newEnrollment;
      } else {
        hmoEnrollments.push(newEnrollment);
      }

      db.updateHmoEnrollments(hmoEnrollments);
      return NextResponse.json({ success: true, enrollment: newEnrollment });
    }

    if (action === 'requestEwa') {
      if (!employeeId || !amount) {
        return NextResponse.json({ success: false, error: 'Employee ID and requested amount are required' }, { status: 400 });
      }

      const employee = db.getEmployees().find(e => e.id === employeeId);
      if (!employee) {
        return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
      }

      const gross = employee.salary.base + employee.salary.housing + employee.salary.transport;
      // Assume ~15 days worked in mid-month -> earned ~50%
      const maxEarned = Math.round(gross * 0.5);
      const reqAmt = Number(amount);

      if (reqAmt > maxEarned * 0.5) {
        return NextResponse.json({
          success: false,
          error: `Requested amount exceeds max available EWA limit (₦${(maxEarned * 0.5).toLocaleString()})`
        }, { status: 400 });
      }

      const newRequest: EWARequest = {
        id: `ewa-${Date.now()}`,
        employeeId,
        month: new Date().toISOString().substring(0, 7),
        earnedAmount: maxEarned,
        requestedAmount: reqAmt,
        fee: 500, // Fixed ₦500 transaction fee
        status: 'Disbursed',
        requestDate: new Date().toISOString().split('T')[0]
      };

      ewaRequests.push(newRequest);
      db.updateEwaRequests(ewaRequests);
      return NextResponse.json({ success: true, ewaRequest: newRequest });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error processing request' }, { status: 500 });
  }
}
