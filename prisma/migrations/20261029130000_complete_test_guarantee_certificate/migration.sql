-- Jai, 29 Oct 2026: Test & Guarantee Certificate design and editing completed and
-- sent for review. Marks the task added in 20261029120000 complete and logs the update.

UPDATE "Task"
SET "status" = 'COMPLETED', "progress" = 100, "completedAt" = '2026-10-29 13:00:00', "updatedAt" = now()
WHERE "id" = 'jw29oct2026testguarcert01';

INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jw29oct2026testguarcert02', 'jw29oct2026testguarcert01', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Design and editing completed; sent for review.', 100, '2026-10-29 13:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw29oct2026testguarcert01')
ON CONFLICT ("id") DO NOTHING;
