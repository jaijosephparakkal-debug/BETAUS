-- One-off data change requested 2026-10-09: permanently delete Sumith (Store
-- Incharge) and Vishal (Store Assistant) at Gas Needs, with all their tasks,
-- KPIs, approvals and attendance. Matched by seed email, or by name + Store
-- title at Gas Needs in case the email was changed later.

CREATE TEMP TABLE "_gone_users" AS
SELECT DISTINCT u."id"
FROM "User" u
JOIN "Membership" m ON m."userId" = u."id"
JOIN "Company" c ON c."id" = m."companyId" AND c."slug" = 'gasneeds'
WHERE m."isDirector" = false
  AND (
    lower(u."email") IN ('sumith@gasneeds.com', 'vishal@gasneeds.com')
    OR ((u."name" ILIKE 'sumith%' OR u."name" ILIKE 'vishal%') AND m."title" ILIKE 'store%')
  );

CREATE TEMP TABLE "_gone" AS
SELECT m."id", m."managerId"
FROM "Membership" m
WHERE m."userId" IN (SELECT "id" FROM "_gone_users");

-- Anyone reporting to them moves up to the nearest remaining manager, so
-- they stay in the org chart. Each pass moves one level up (Vishal reports
-- to Sumith, so two passes reach Sumith's manager; a third for safety).
UPDATE "Membership" r
SET "managerId" = (SELECT g."managerId" FROM "_gone" g WHERE g."id" = r."managerId")
WHERE r."managerId" IN (SELECT "id" FROM "_gone")
  AND r."id" NOT IN (SELECT "id" FROM "_gone");
UPDATE "Membership" r
SET "managerId" = (SELECT g."managerId" FROM "_gone" g WHERE g."id" = r."managerId")
WHERE r."managerId" IN (SELECT "id" FROM "_gone")
  AND r."id" NOT IN (SELECT "id" FROM "_gone");
UPDATE "Membership" r
SET "managerId" = (SELECT g."managerId" FROM "_gone" g WHERE g."id" = r."managerId")
WHERE r."managerId" IN (SELECT "id" FROM "_gone")
  AND r."id" NOT IN (SELECT "id" FROM "_gone");

-- Tasks they assigned to other people stay with those people (self-assigned).
UPDATE "Task" SET "assignedById" = "assignedToId"
WHERE "assignedById" IN (SELECT "id" FROM "_gone")
  AND "assignedToId" NOT IN (SELECT "id" FROM "_gone");

-- Their comments/files/messages on things that belong to other people.
DELETE FROM "TaskComment" WHERE "authorId" IN (SELECT "id" FROM "_gone");
DELETE FROM "ApprovalComment" WHERE "authorId" IN (SELECT "id" FROM "_gone");
DELETE FROM "Attachment" WHERE "uploadedById" IN (SELECT "id" FROM "_gone");
DELETE FROM "DirectorMessage" WHERE "authorId" IN (SELECT "id" FROM "_gone");

-- Deleting the users cascades to their memberships, and from there to their
-- own tasks (and subtasks), KPIs, approvals, attendance, notifications,
-- task-title presets and sign-in codes.
DELETE FROM "User" WHERE "id" IN (SELECT "id" FROM "_gone_users");

DROP TABLE "_gone";
DROP TABLE "_gone_users";
