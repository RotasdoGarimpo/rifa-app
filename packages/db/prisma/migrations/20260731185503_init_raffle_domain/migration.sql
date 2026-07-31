-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'DRAWN');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('FREE', 'RESERVED', 'PAID');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT,
    "priceCents" INTEGER NOT NULL,
    "totalTickets" INTEGER NOT NULL,
    "drawDate" TIMESTAMP(3),
    "drawChannel" TEXT NOT NULL DEFAULT 'Loteria Federal',
    "status" "RaffleStatus" NOT NULL DEFAULT 'OPEN',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'FREE',
    "reservationId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "raffleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Raffle_slug_key" ON "Raffle"("slug");

-- CreateIndex
CREATE INDEX "Raffle_status_featured_idx" ON "Raffle"("status", "featured");

-- CreateIndex
CREATE INDEX "Ticket_raffleId_status_idx" ON "Ticket"("raffleId", "status");

-- CreateIndex
CREATE INDEX "Ticket_reservationId_idx" ON "Ticket"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_raffleId_number_key" ON "Ticket"("raffleId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_sequence_key" ON "Reservation"("sequence");

-- CreateIndex
CREATE INDEX "Reservation_raffleId_status_idx" ON "Reservation"("raffleId", "status");

-- CreateIndex
CREATE INDEX "Reservation_status_expiresAt_idx" ON "Reservation"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
