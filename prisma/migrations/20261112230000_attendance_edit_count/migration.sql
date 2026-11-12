-- How many times each attendance day was edited by the person (shown in their review report).
ALTER TABLE "AttendanceEntry" ADD COLUMN "editCount" INTEGER NOT NULL DEFAULT 0;
UPDATE "AttendanceEntry" SET "editCount" = 1 WHERE "isManual" = true;
