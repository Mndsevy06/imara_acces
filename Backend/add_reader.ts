import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const readerId = '000000000000';
  
  // Get first configuration to link the reader to something if possible
  const config = await prisma.configuration.findFirst();
  
  const reader = await prisma.cardReader.upsert({
    where: { id: readerId },
    update: {},
    create: {
      id: readerId,
      label: 'Lecteur Principal (Entrée)',
      type: 'NFC',
      location: 'Portail Principal',
      configurationId: config?.id || null
    },
  });

  console.log('Reader created/updated:', reader);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
