/**
 * One-shot script: normalize all existing cardId values in the DB
 * to uppercase hex without separators (matching ESP32 output format).
 * Run: npx tsx normalize_cards.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeCardId(raw: string): string {
  return raw.replace(/[\s:.\-]/g, '').toUpperCase();
}

async function main() {
  const users = await prisma.user.findMany({
    where: { cardId: { not: null } },
    select: { id: true, name: true, cardId: true },
  });

  console.log(`\nFound ${users.length} user(s) with a cardId:\n`);

  let updated = 0;
  for (const user of users) {
    const original = user.cardId!;
    const normalized = normalizeCardId(original);
    const label = `  [${user.name}]  "${original}" → "${normalized}"`;

    if (original !== normalized) {
      await prisma.user.update({
        where: { id: user.id },
        data: { cardId: normalized },
      });
      console.log(`✔ UPDATED  ${label}`);
      updated++;
    } else {
      console.log(`✓ OK       ${label}`);
    }
  }

  console.log(`\n${updated} record(s) updated.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
