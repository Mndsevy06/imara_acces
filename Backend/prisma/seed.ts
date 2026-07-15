import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // On génère le hash pour le mot de passe "12345678"
  const passwordHash = await bcrypt.hash('12345678', 10);

  // Création d'un seul utilisateur (Admin par défaut pour avoir tous les accès)
  const admin = await prisma.user.upsert({
    where: { email: 'a@gmail.com' },
    update: {},
    create: {
      email: 'a@gmail.com',
      name: 'Admin',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Seed completed. Utilisateur créé:');
  console.log(admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
