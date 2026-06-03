-- CreateEnum
CREATE TYPE "ScanSource" AS ENUM ('PHONE', 'BOITIER');

-- AlterTable
ALTER TABLE "AccessLog" ADD COLUMN     "source" "ScanSource" NOT NULL DEFAULT 'PHONE';
