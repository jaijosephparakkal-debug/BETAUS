-- A second reporting line for people with two roles (shown dashed or as a direct line in the org chart).
-- Hashim: main line Shafeek (Accounts), second line Jayaprakash (Maintenance).
-- Saroj: main line Ram (Projects), direct line to Abraham sir (Estimation).
-- Only the org chart reads this; each person's main manager and task access are unchanged.
ALTER TABLE "Membership" ADD COLUMN "secondManagerId" TEXT;
ALTER TABLE "Membership" ADD COLUMN "secondLabel" TEXT;

UPDATE "Membership" m
SET "secondManagerId" = (
      SELECT jm."id" FROM "Membership" jm JOIN "User" ju ON ju."id" = jm."userId"
      WHERE lower(ju."email") = 'service@flaretechnical.com' AND jm."companyId" = m."companyId"
      LIMIT 1),
    "secondLabel" = 'Maintenance'
FROM "User" u, "Company" c
WHERE u."id" = m."userId" AND c."id" = m."companyId" AND c."slug" = 'flaretechnical'
  AND lower(u."email") = 'accounts@flaretechnical.com';

UPDATE "Membership" m
SET "secondManagerId" = (
      SELECT am."id" FROM "Membership" am JOIN "User" au ON au."id" = am."userId"
      WHERE lower(au."email") = 'abraham@flaretechnical.com' AND am."companyId" = m."companyId"
      LIMIT 1),
    "secondLabel" = 'Estimation'
FROM "User" u, "Company" c
WHERE u."id" = m."userId" AND c."id" = m."companyId" AND c."slug" = 'flaretechnical'
  AND lower(u."email") = 'saroj@flaretechnical.com';
