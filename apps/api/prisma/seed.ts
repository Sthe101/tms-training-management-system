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

main()
  .then(() => seedDivisions())
  .then(() => seedTrainings())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
