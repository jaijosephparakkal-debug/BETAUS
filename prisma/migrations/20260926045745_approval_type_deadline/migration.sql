-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "requestType" TEXT NOT NULL DEFAULT 'APPROVAL';
