-- CreateTable
CREATE TABLE "TaskTitlePreset" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTitlePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskTitlePreset_membershipId_title_key" ON "TaskTitlePreset"("membershipId", "title");

-- AddForeignKey
ALTER TABLE "TaskTitlePreset" ADD CONSTRAINT "TaskTitlePreset_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
