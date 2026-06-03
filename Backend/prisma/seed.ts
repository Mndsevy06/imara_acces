import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@imara.cd' },
    update: {},
    create: {
      email: 'admin@imara.cd',
      name: 'Super Admin',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  // Create Agent
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@imara.cd' },
    update: {},
    create: {
      email: 'agent@imara.cd',
      name: 'Agent Mutombo',
      passwordHash: passwordHash,
      role: 'AGENT',
      agent: {
        create: {
          portail: 'Entrée Principale',
          shiftStart: '08:00',
          shiftEnd: '16:00',
        }
      }
    },
  });

  // Create Member
  const member = await prisma.user.upsert({
    where: { licensePlate: 'AA-482-BC' },
    update: {},
    create: {
      name: 'Jean Kabamba',
      role: 'MEMBER',
      licensePlate: 'AA-482-BC',
    },
  });

  console.log('Seed completed:');
  console.log({ admin, agentUser, member });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
