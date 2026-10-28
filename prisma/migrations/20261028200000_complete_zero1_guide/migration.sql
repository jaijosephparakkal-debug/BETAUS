-- ZERO.1 How It Works guide: published, SEO running on its blog page (28 Oct).
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwzero1028guideseo', 'jw3e672e774efa9a1a6ae1602', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'SEO running on the guide''s blog page.', 100, '2026-10-28 10:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw3e672e774efa9a1a6ae1602')
ON CONFLICT ("id") DO NOTHING;
UPDATE "Task" SET "status" = 'COMPLETED', "progress" = 100, "completedAt" = '2026-10-28 09:00:00', "updatedAt" = now()
WHERE "id" = 'jw3e672e774efa9a1a6ae1602';

-- Campaigns & SEO heading: same rollup as recomputeTaskProgress (src/lib/tasks.ts)
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT "parentTaskId" FROM "Task" WHERE "id" = 'jw3e672e774efa9a1a6ae1602');
