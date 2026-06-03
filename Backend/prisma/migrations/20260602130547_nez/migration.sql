/*
  Warnings:

  - The values [QR] on the enum `CardReaderType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardReaderType_new" AS ENUM ('NFC', 'RFID', 'BOTH');
ALTER TABLE "CardReader" ALTER COLUMN "type" TYPE "CardReaderType_new" USING ("type"::text::"CardReaderType_new");
ALTER TYPE "CardReaderType" RENAME TO "CardReaderType_old";
ALTER TYPE "CardReaderType_new" RENAME TO "CardReaderType";
DROP TYPE "public"."CardReaderType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Configuration" ADD COLUMN     "creatorId" TEXT;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
