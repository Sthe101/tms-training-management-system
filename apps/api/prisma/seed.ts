import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@tms.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@tms.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@tms.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@tms.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'clerk@tms.com' },
    update: {},
    create: {
      name: 'Clerk User',
      email: 'clerk@tms.com',
      password: hashedPassword,
      role: 'CLERK',
    },
  });
}

async function seedDivisions() {
  const divisionsData = [
    { name: 'Operations', departments: ['Production', 'Logistics'] },
    { name: 'Engineering', departments: ['Maintenance', 'Design'] },
    { name: 'Safety & Compliance', departments: ['HSE', 'Quality Control'] },
    { name: 'Administration', departments: ['HR', 'Finance'] },
  ];

  for (const { name, departments } of divisionsData) {
    const division = await prisma.division.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    for (const deptName of departments) {
      const existing = await prisma.department.findFirst({
        where: { name: deptName, divisionId: division.id },
      });
      if (!existing) {
        await prisma.department.create({
          data: { name: deptName, divisionId: division.id },
        });
      }
    }
  }
}

async function seedTrainings() {
  const trainings = [
    'OH HIRA',
    'IBI Awareness',
    'First Aid Level 1 & 2',
    'Environmental Awareness',
    'Fire Safety',
    'Lifting & Rigging',
    'Working at Heights',
    'Confined Space Entry',
  ];

  for (const name of trainings) {
    await prisma.trainingCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function seedEmployees() {
  const deptNames = ['Production', 'Logistics', 'Maintenance', 'Design', 'HSE', 'Quality Control', 'HR', 'Finance'];
  const departments = await Promise.all(
    deptNames.map((name) => prisma.department.findFirst({ where: { name } }))
  );
  const deptMap: Record<string, string> = {};
  deptNames.forEach((name, i) => {
    if (departments[i]) deptMap[name] = departments[i]!.id;
  });

  const employees = [
    { name: 'John Smith', employeeNumber: 'EMP001', dept: 'Production' },
    { name: 'Sarah Johnson', employeeNumber: 'EMP002', dept: 'Logistics' },
    { name: 'Michael Brown', employeeNumber: 'EMP003', dept: 'Maintenance', role: 'MANAGER' },
    { name: 'Emily Davis', employeeNumber: 'EMP004', dept: 'HSE' },
    { name: 'Robert Wilson', employeeNumber: 'EMP005', dept: 'HR', role: 'MANAGER' },
    { name: 'Jessica Taylor', employeeNumber: 'EMP006', dept: 'Finance' },
    { name: 'David Anderson', employeeNumber: 'EMP007', dept: 'Design' },
    { name: 'Lisa Thomas', employeeNumber: 'EMP008', dept: 'Quality Control' },
  ];

  for (const { name, employeeNumber, dept, role } of employees) {
    const departmentId = deptMap[dept];
    if (!departmentId) continue;
    const existing = await prisma.employee.findUnique({ where: { employeeNumber } });
    if (!existing) {
      await prisma.employee.create({
        data: { name, employeeNumber, departmentId, role: (role as any) || 'EMPLOYEE' },
      });
    }
  }
}

main()
  .then(() => seedDivisions())
  .then(() => seedTrainings())
  .then(() => seedEmployees())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
