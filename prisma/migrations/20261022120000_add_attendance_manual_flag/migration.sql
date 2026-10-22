-- AlterTable
ALTER TABLE "AttendanceEntry" ADD COLUMN "isManual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "manualNote" TEXT,
ADD COLUMN "manualAt" TIMESTAMP(3),
ADD COLUMN "origClockIn" TIMESTAMP(3),
ADD COLUMN "origClockOut" TIMESTAMP(3);
