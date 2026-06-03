import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cardId = '046335BB230389';
  
  // Find an existing user or create a test one
  let user = await prisma.user.findFirst({
    where: { role: 'MEMBER' }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Utilisateur Test',
        role: 'MEMBER',
        cardId: cardId,
        licensePlate: 'ABC-1234'
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { cardId: cardId }
    });
  }

  console.log('User associated with card:', user.name, 'Card ID:', cardId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
