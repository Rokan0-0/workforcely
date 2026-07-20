import { NextRequest, NextResponse } from 'next/server';
import { db, Employee } from '@/lib/db';

export async function GET(request: NextRequest) {
  const employees = db.getEmployees();
  const departments = db.getDepartments();
  return NextResponse.json({ employees, departments });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, departmentId, hireDate, salary, contactInfo, profilePhoto } = body;

    if (!name || !email || !departmentId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const employees = db.getEmployees();
    
    // Generate new unique ID
    const maxId = employees.reduce((max, emp) => {
      const num = parseInt(emp.id.replace('emp-', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `emp-${maxId + 1}`;

    const newEmployee: Employee = {
      id: newId,
      name,
      email,
      role: role || 'Employee',
      departmentId,
      hireDate: hireDate || new Date().toISOString().split('T')[0],
      salary: {
        base: Number(salary?.base) || 0,
        housing: Number(salary?.housing) || 0,
        transport: Number(salary?.transport) || 0,
      },
      contactInfo: {
        phone: contactInfo?.phone || '',
        address: contactInfo?.address || '',
        nextOfKin: contactInfo?.nextOfKin || '',
      },
      profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      onboardingChecklist: [
        { id: `ob-${Date.now()}-1`, title: 'Submit signed contract', completed: false, dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
        { id: `ob-${Date.now()}-2`, title: 'HR documentation & ID card capture', completed: false, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] },
        { id: `ob-${Date.now()}-3`, title: 'Set up work laptop and accounts', completed: false, dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] },
      ]
    };

    employees.push(newEmployee);
    db.updateEmployees(employees);

    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, role, departmentId, hireDate, salary, contactInfo, profilePhoto } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const employees = db.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Update fields
    const updatedEmployee = {
      ...employees[index],
      name: name || employees[index].name,
      email: email || employees[index].email,
      role: role || employees[index].role,
      departmentId: departmentId || employees[index].departmentId,
      hireDate: hireDate || employees[index].hireDate,
      salary: {
        base: salary?.base !== undefined ? Number(salary.base) : employees[index].salary.base,
        housing: salary?.housing !== undefined ? Number(salary.housing) : employees[index].salary.housing,
        transport: salary?.transport !== undefined ? Number(salary.transport) : employees[index].salary.transport,
      },
      contactInfo: {
        phone: contactInfo?.phone !== undefined ? contactInfo.phone : employees[index].contactInfo.phone,
        address: contactInfo?.address !== undefined ? contactInfo.address : employees[index].contactInfo.address,
        nextOfKin: contactInfo?.nextOfKin !== undefined ? contactInfo.nextOfKin : employees[index].contactInfo.nextOfKin,
      },
      profilePhoto: profilePhoto !== undefined ? profilePhoto : employees[index].profilePhoto,
    };

    employees[index] = updatedEmployee;
    db.updateEmployees(employees);

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const employees = db.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Prevent deleting the main logged-in HR admin account
    if (employees[index].email === 'olumide.sowore@workforcely.com') {
      return NextResponse.json({ success: false, error: 'Cannot delete the main HR Admin account' }, { status: 400 });
    }

    employees.splice(index, 1);
    db.updateEmployees(employees);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Request failed' }, { status: 400 });
  }
}
