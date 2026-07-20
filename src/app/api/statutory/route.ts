import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  calculateNigerianTax,
  calculateNigerianPension,
  calculateNigerianNHF,
  calculateNigerianNSITF,
  calculateNigerianITF
} from '@/lib/db';

export async function GET(request: NextRequest) {
  const employees = db.getEmployees();
  const departments = db.getDepartments();

  const statutoryBreakdown = employees.map(emp => {
    const dept = departments.find(d => d.id === emp.departmentId);
    const gross = emp.salary.base + emp.salary.housing + emp.salary.transport;
    const paye = calculateNigerianTax(gross);
    const pensionEmployee = calculateNigerianPension(emp.salary);
    const pensionEmployer = gross * 0.10; // 10% employer pension
    const nhf = calculateNigerianNHF(emp.salary.base);
    const nsitf = calculateNigerianNSITF(gross);
    const itf = calculateNigerianITF(gross);

    // State mapping heuristic based on contact address
    let stateAuthority = 'Lagos (LIRS)';
    if (emp.contactInfo.address.toLowerCase().includes('abuja')) stateAuthority = 'Abuja (FCT-IRS)';
    if (emp.contactInfo.address.toLowerCase().includes('enugu')) stateAuthority = 'Enugu (EIRS)';

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      department: dept?.name || 'Unknown',
      stateAuthority,
      grossSalary: gross,
      payeTax: Math.round(paye),
      pensionEmployee: Math.round(pensionEmployee),
      pensionEmployer: Math.round(pensionEmployer),
      nhfDeduction: Math.round(nhf),
      nsitfContribution: Math.round(nsitf),
      itfContribution: Math.round(itf),
      totalStatutory: Math.round(paye + pensionEmployee + nhf)
    };
  });

  const totals = statutoryBreakdown.reduce((acc, curr) => {
    acc.totalGross += curr.grossSalary;
    acc.totalPaye += curr.payeTax;
    acc.totalPensionEmployee += curr.pensionEmployee;
    acc.totalPensionEmployer += curr.pensionEmployer;
    acc.totalNhf += curr.nhfDeduction;
    acc.totalNsitf += curr.nsitfContribution;
    acc.totalItf += curr.itfContribution;
    return acc;
  }, {
    totalGross: 0,
    totalPaye: 0,
    totalPensionEmployee: 0,
    totalPensionEmployer: 0,
    totalNhf: 0,
    totalNsitf: 0,
    totalItf: 0
  });

  return NextResponse.json({ statutoryBreakdown, totals });
}
