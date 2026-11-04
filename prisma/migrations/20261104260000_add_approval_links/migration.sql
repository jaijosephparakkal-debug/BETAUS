-- Links shared on an approval request (Drive, e-invoice, Zoho, anywhere) instead of uploaded files.
CREATE TABLE "ApprovalLink" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApprovalLink_approvalRequestId_idx" ON "ApprovalLink"("approvalRequestId");

ALTER TABLE "ApprovalLink" ADD CONSTRAINT "ApprovalLink_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalLink" ADD CONSTRAINT "ApprovalLink_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
