-- PRMS first weekly ranking check (Mon 26 Oct); ZERO.1 video, blog and guide PDF published (28 Oct).

INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwrank1026first', 'jw4fe8a49f92ec978cc79a1e2', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'First weekly ranking check done.', 60, '2026-10-26 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw4fe8a49f92ec978cc79a1e2')
ON CONFLICT ("id") DO NOTHING;
UPDATE "Task" SET "progress" = 60, "updatedAt" = now() WHERE "id" = 'jw4fe8a49f92ec978cc79a1e2';

INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwzero1028video', 'jw368272aa0bd923f2c2a7eb5', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Video live on YouTube with SEO; blog published on gasneeds.com.', 100, '2026-10-28 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw368272aa0bd923f2c2a7eb5')
ON CONFLICT ("id") DO NOTHING;
UPDATE "Task" SET "status" = 'COMPLETED', "progress" = 100, "completedAt" = '2026-10-28 09:00:00', "updatedAt" = now() WHERE "id" = 'jw368272aa0bd923f2c2a7eb5';

INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwzero1028guide', 'jw3e672e774efa9a1a6ae1602', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Guide published; PDF available for download. SEO on its blog page next.', 75, '2026-10-28 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw3e672e774efa9a1a6ae1602')
ON CONFLICT ("id") DO NOTHING;
UPDATE "Task" SET "status" = 'IN_PROGRESS', "progress" = 75, "updatedAt" = now() WHERE "id" = 'jw3e672e774efa9a1a6ae1602';

-- Campaigns & SEO heading: same rollup as recomputeTaskProgress (src/lib/tasks.ts)
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT "parentTaskId" FROM "Task" WHERE "id" = 'jw4fe8a49f92ec978cc79a1e2');
