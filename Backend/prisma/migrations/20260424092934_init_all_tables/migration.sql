-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT', 'MEMBER');

-- CreateEnum
CREATE TYPE "UserProfile" AS ENUM ('PROFESSEUR', 'ETUDIANT', 'PERSONNEL', 'DIRECTION', 'FIDELE');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "ParkingType" AS ENUM ('PROFESSOR', 'STUDENT', 'VISITOR', 'STAFF', 'CHURCH');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "CardReaderType" AS ENUM ('NFC', 'RFID', 'QR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ENTREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('LOCKED', 'EDITABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "profile" "UserProfile",
    "licensePlate" TEXT,
    "cardId" TEXT,
    "avatar" TEXT,
    "presenceStatus" "PresenceStatus" NOT NULL DEFAULT 'OUT',
    "assignedParkingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ParkingType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "configurationId" TEXT,

    CONSTRAINT "ParkingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portail" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "shiftStart" TEXT NOT NULL,
    "shiftEnd" TEXT NOT NULL,
    "readerId" TEXT,
    "configurationId" TEXT,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardReader" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CardReaderType" NOT NULL,
    "location" TEXT NOT NULL,
    "configurationId" TEXT,

    CONSTRAINT "CardReader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userNameSnapshot" TEXT NOT NULL,
    "plateSnapshot" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "parkingId" TEXT NOT NULL,
    "status" "AccessStatus" NOT NULL,
    "failReason" TEXT,
    "agentId" TEXT,
    "readerId" TEXT,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConfigStatus" NOT NULL DEFAULT 'EDITABLE',
    "deployedAt" TIMESTAMP(3),
    "tilemapId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tilemap" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 20,
    "height" INTEGER NOT NULL DEFAULT 20,
    "gridData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tilemap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "fromParkingId" TEXT NOT NULL,
    "toParkingId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "orgName" TEXT NOT NULL DEFAULT 'Collège Imara / ECOPO',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@imara.cd',
    "address" TEXT NOT NULL DEFAULT '',
    "vocalGuidanceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "strictCapacityControl" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyReportsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorAuthEnabled" BOOLEAN NOT NULL DEFAULT false,
    "accentColor" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_licensePlate_key" ON "User"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "User_cardId_key" ON "User"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_tilemapId_key" ON "Configuration"("tilemapId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedParkingId_fkey" FOREIGN KEY ("assignedParkingId") REFERENCES "ParkingZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingZone" ADD CONSTRAINT "ParkingZone_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "CardReader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardReader" ADD CONSTRAINT "CardReader_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "ParkingZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "CardReader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_tilemapId_fkey" FOREIGN KEY ("tilemapId") REFERENCES "Tilemap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_fromParkingId_fkey" FOREIGN KEY ("fromParkingId") REFERENCES "ParkingZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_toParkingId_fkey" FOREIGN KEY ("toParkingId") REFERENCES "ParkingZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
