import { NextRequest, NextResponse } from 'next/server';
import { db, calculateNigerianTax, calculateNigerianPension, Payroll } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const month = searchParams.get('month');

  let list = db.getPayroll();

  if (employeeId) {
    list = list.filter(p => p.employeeId === employeeId);
  }

  if (month) {
    list = list.filter(p => p.month === month);
  }

  return NextResponse.json({ payroll: list });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month } = body; // YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ success: false, error: 'Valid month (YYYY-MM) is required' }, { status: 400 });
    }

    const employees = db.getEmployees();
    const currentPayroll = db.getPayroll();

    let payId = currentPayroll.reduce((max, pr) => {
      const num = parseInt(pr.id.replace('pr-', ''));
      return num > max ? num : max;
    }, 0) + 1;

    const newRecords: Payroll[] = [];

    employees.forEach(emp => {
      // Check if employee already has payroll for this month
      const exists = currentPayroll.find(pr => pr.employeeId === emp.id && pr.month === month);
      if (exists) return;

      const gross = emp.salary.base + emp.salary.housing + emp.salary.transport;
      const pension = calculateNigerianPension(emp.salary);
      const tax = calculateNigerianTax(gross);
      const netPay = gross - pension - tax;

      const newRecord: Payroll = {
        id: `pr-${payId++}`,
        employeeId: emp.id,
        month,
        basePay: emp.salary.base,
        allowanceHousing: emp.salary.housing,
        allowanceTransport: emp.salary.transport,
        tax: Number(tax.toFixed(2)),
        pension: Number(pension.toFixed(2)),
        overrideAmount: 0,
        overrideReason: '',
        netPay: Number(netPay.toFixed(2)),
        status: 'Paid',
        paymentDate: `${month}-26`
      };

      currentPayroll.push(newRecord);
      newRecords.push(newRecord);
    });

    db.updatePayroll(currentPayroll);

    // Notify employees that their payslips are ready
    try {
      const notifications = db.getNotifications();
      const today = new Date().toISOString().split('T')[0];
      newRecords.forEach(rec => {
        const note = {
          id: `note-${Date.now()}-${rec.employeeId}`,
          title: 'Payslip Processed',
          message: `Your payslip for the month of ${month} has been processed and is ready for review.`,
          audience: 'Specific Employee' as const,
          recipientId: rec.employeeId,
          read: false,
          createdDate: today
        };
        notifications.push(note);
      });
      db.updateNotifications(notifications);
    } catch (err) {
      console.error('Failed to create payroll notifications', err);
    }

    return NextResponse.json({ success: true, message: `Generated ${newRecords.length} payroll records for ${month}`, generated: newRecords.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, overrideAmount, overrideReason } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payroll record ID is required' }, { status: 400 });
    }

    const payroll = db.getPayroll();
    const index = payroll.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Payroll record not found' }, { status: 404 });
    }

    const record = payroll[index];
    record.overrideAmount = Number(overrideAmount) || 0;
    record.overrideReason = overrideReason || '';
    
    const gross = record.basePay + record.allowanceHousing + record.allowanceTransport;
    const net = gross - record.pension - record.tax + record.overrideAmount;
    record.netPay = Number(net.toFixed(2));

    payroll[index] = record;
    db.updatePayroll(payroll);

    // Notify employee of payroll adjustment
    try {
      const note = {
        id: `note-${Date.now()}`,
        title: 'Payroll Adjustment',
        message: `Your payslip for ${record.month} has been adjusted by ₦${record.overrideAmount.toLocaleString()}${record.overrideReason ? ` (${record.overrideReason})` : ''}.`,
        audience: 'Specific Employee' as const,
        recipientId: record.employeeId,
        read: false,
        createdDate: new Date().toISOString().split('T')[0]
      };
      const notifications = db.getNotifications();
      notifications.push(note);
      db.updateNotifications(notifications);
    } catch (err) {
      console.error('Failed to create payroll override notification', err);
    }

    return NextResponse.json({ success: true, payroll: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
