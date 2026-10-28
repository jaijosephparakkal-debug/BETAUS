-- GASNEEDS master catalogue: the overall task is done (PO raised 27 Oct), and the old
-- milestone tasks fold into the master catalogue timeline. A milestone whose date
-- already has a timeline entry (23 Jul, 1 Sep, 23 Sep) is simply removed.

UPDATE "Task" SET "status" = 'COMPLETED', "progress" = 100, "completedAt" = '2026-10-27 09:00:00', "updatedAt" = now()
WHERE "id" = 'cmumhx66u001xukr0e3t2df03';
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwcat1027overall', 'cmumhx66u001xukr0e3t2df03', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'PO raised; waiting for the print.', 100, '2026-10-27 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'cmumhx66u001xukr0e3t2df03')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwcat0819l500', 'jw9fff97f07a5cb1e25ce3ad3', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'L-500 and CG-500 sections built.', 45, '2026-08-19 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw9fff97f07a5cb1e25ce3ad3')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwcat0822seitron', 'jw9fff97f07a5cb1e25ce3ad3', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Seitron gas safety section built.', 50, '2026-08-22 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw9fff97f07a5cb1e25ce3ad3')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwcat0903fullcopy', 'jw9fff97f07a5cb1e25ce3ad3', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'First full copy, 436 pages.', 60, '2026-09-03 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw9fff97f07a5cb1e25ce3ad3')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwcat0917drafts', 'jw9fff97f07a5cb1e25ce3ad3', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Print and digital draft editions.', 75, '2026-09-17 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw9fff97f07a5cb1e25ce3ad3')
ON CONFLICT ("id") DO NOTHING;

DELETE FROM "Task" WHERE "id" IN (
  'cmumhx66s0011ukr0wpm8892i', -- L-500 and CG-500 sections built (19 Aug, now a timeline entry)
  'cmumhx66s0015ukr0jpg1pscl', -- Seitron gas safety section built (22 Aug, now a timeline entry)
  'cmumhx66t001dukr05olje2ry', -- First full copy, 436 pages (3 Sep, now a timeline entry)
  'cmumhx66t001hukr0grq12p3g', -- Print and digital draft editions (17 Sep, now a timeline entry)
  'cmumhx66q000pukr07fz91gai', -- RegO extraction and Section A draft (23 Jul, date already logged)
  'cmumhx66s001bukr0o1cdtcce', -- Section A regulators, A3 layout (1 Sep, date already logged)
  'cmumhx66u001pukr05cbjnawz'  -- Master catalogue preview (23 Sep, date already logged)
);
