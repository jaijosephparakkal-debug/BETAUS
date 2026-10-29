-- CreateTable
CREATE TABLE "LeaveDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveDay_userId_date_key" ON "LeaveDay"("userId", "date");

-- AddForeignKey
ALTER TABLE "LeaveDay" ADD CONSTRAINT "LeaveDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
