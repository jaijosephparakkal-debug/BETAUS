-- Links shared on a task (Drive, e-invoice, Zoho, anywhere) instead of uploaded files.
CREATE TABLE "TaskLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskLink_taskId_idx" ON "TaskLink"("taskId");

ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
