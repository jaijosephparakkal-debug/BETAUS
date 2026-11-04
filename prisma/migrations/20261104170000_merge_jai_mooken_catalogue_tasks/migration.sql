-- Jai: the MOOKEN catalogue redesign was on his KPI three times. Bring it together in one task
-- (jwn04mookenredesign): the two in-progress tasks become its first logs, then are removed.
-- Completed last Friday, 30 Oct 2026. Safe to re-run.

INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn06mook01', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Started: re-edit the MOOKEN catalogue in Canva to match the printed PDF and add 3 new products (hanging clamps, gas hoses, gas stoves); conformity certificate received.', 10, '2026-10-29 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn06mook02', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Catalogue re-edited: product photos improved for clarity, 3 new products added, layout changed; sent for approval.', 20, '2026-10-29 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;
UPDATE "TaskComment" SET "progressAt" = 35, "createdAt" = '2026-10-29 15:00:00' WHERE "id" = 'jwn04mooken01';
UPDATE "TaskComment" SET "progressAt" = 55, "createdAt" = '2026-10-30 09:00:00' WHERE "id" = 'jwn04mooken02';
UPDATE "TaskComment" SET "progressAt" = 80, "createdAt" = '2026-10-30 13:00:00' WHERE "id" = 'jwn04mooken03';
UPDATE "TaskComment" SET "progressAt" = 100, "createdAt" = '2026-10-30 18:00:00' WHERE "id" = 'jwn04mooken04';

UPDATE "Task" SET
  "description" = 'Started as a re-edit of the MOOKEN catalogue in Canva with 3 new products (hanging clamps, gas hoses, gas stoves), then redesigned as a brand-new A4 catalogue in black and yellow (modern, corporate, Dubai industry standard).',
  "status" = 'COMPLETED', "progress" = 100,
  "completedAt" = '2026-10-30 18:00:00', "createdAt" = '2026-10-29 09:00:00', "updatedAt" = now()
WHERE "id" = 'jwn04mookenredesign';

DELETE FROM "Task"
WHERE "id" IN ('cmumjj3150001nnu74xbir98c', 'jw29oct2026catalogreedit01')
  AND EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign');

UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
