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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
