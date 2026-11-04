-- Jai Joseph Parakkal: work done with Claude, 25 Oct - 4 Nov 2026, not yet on his KPI.
-- Adds rows only (fixed ids, safe to re-run); heading progress recomputed like recomputeTaskProgress.

-- ===== ZERO.1 Remote Tank Level Monitoring (Campaigns & SEO) =====
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04zero1guidebrand', 'jw3e672e774efa9a1a6ae1602', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Remote Tank Level Monitoring guide rebranded to GASNEEDS (red, black & white) with a new tank photo.', 100, '2026-10-28 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw3e672e774efa9a1a6ae1602')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04zero1guideblog', 'jw3e672e774efa9a1a6ae1602', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Video and guide PDF linked from the blog for download; Shopify SEO updated; blog comments and notifications switched on.', 100, '2026-10-30 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw3e672e774efa9a1a6ae1602')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04zero1videoseo', 'jw368272aa0bd923f2c2a7eb5', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Added to the automatic SEO run; blog submitted for Google indexing (site verified via Shopify).', 100, '2026-10-28 14:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw368272aa0bd923f2c2a7eb5')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn04zero1weeklyseo', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'ZERO.1 Weekly SEO & Ranking Tracking', 'Remote Tank Level Monitoring (ZERO.1): SEO run for the video, blog and guide; a weekly SEO/ranking update is logged here every week.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Campaigns & SEO') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Campaigns & SEO', 'IN_PROGRESS', 10, NULL, '2026-10-28 14:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04zero1weekly01', 'jwn04zero1weeklyseo', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'SEO run started for the ZERO.1 video, blog and guide PDF; weekly updates will be logged here.', 10, '2026-10-28 14:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04zero1weeklyseo')
ON CONFLICT ("id") DO NOTHING;

-- ===== ON TIME Attendance App: Oct-Nov update (Apps & Systems) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn04ontimeupdate', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'ON TIME App - Admin, Payroll & Store Update', 'Admin, approvals, calendars, transport, payroll and store changes to the ON TIME attendance app (26 Oct - 3 Nov 2026).', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Apps & Systems') ORDER BY t."createdAt" LIMIT 1), 'flaretechnical', 'Apps & Systems', 'COMPLETED', 100, '2026-11-03 12:00:00', '2026-10-26 09:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04ontime01', 'jwn04ontimeupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Store admin side for Jintu (store staff and store site only); approvals show recorded and reconciled times, editable by the approver; super admins approve across all sides.', 30, '2026-10-26 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04ontimeupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04ontime02', 'jwn04ontimeupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Staff Clock screen: month calendar with times per day and monthly totals (hours worked, travel, overtime); days that need attention flagged.', 45, '2026-10-26 13:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04ontimeupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04ontime03', 'jwn04ontimeupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Admin "Needs attention" page; per-driver transport calendar; trip fixes with Show/Delete; (SS) tag for site supervisors.', 60, '2026-10-26 17:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04ontimeupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04ontime04', 'jwn04ontimeupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Monthly payroll workbook (.xlsx) sent by email.', 80, '2026-11-02 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04ontimeupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04ontime05', 'jwn04ontimeupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Team Z (Store) created for store staff; October hours email sent to all staff.', 100, '2026-11-03 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04ontimeupdate')
ON CONFLICT ("id") DO NOTHING;

-- ===== MOOKEN Product Catalogue redesign (Design) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn04mookenredesign', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'MOOKEN Product Catalogue - Complete Redesign (Black & Yellow, A4)', 'Brand-new A4 MOOKEN product catalogue in black and yellow (modern, corporate, Dubai industry standard), with three new products added.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Design', 'COMPLETED', 100, '2026-11-04 09:00:00', '2026-10-29 10:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04mooken01', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'New A4 black & yellow catalogue designed in Canva with the MOOKEN product images; brand fonts kept.', 25, '2026-10-29 10:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04mooken02', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Detail pages alternate black and yellow after the certification section; 3 new products added on 3 new pages (hanging clamps, gas hoses, gas stoves).', 55, '2026-10-30 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04mooken03', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Product details made consistent with technical drawings; stove part numbers recoded (VH-2B-211 SS to MT-2BSS-211, VH-1B-103 SS to MT-1BSS-103, VH-2B-201 GT to MT-2BGT-201); three hose types rearranged.', 80, '2026-10-31 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04mooken04', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'All information reconfirmed, broken images fixed, design optimised; final PDF exported.', 100, '2026-11-04 09:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;

-- ===== GASNEEDS Manifold PDFs (Design) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn04manifolds', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'GASNEEDS Manifold PDFs (2-, 3- & 4-Way) + Range Overview', 'Product PDFs for the 2-way, 3-way and 4-way manifolds in a dark design, plus a one-page range overview.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Design', 'COMPLETED', 100, '2026-11-04 10:00:00', '2026-11-03 09:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04manifold01', 'jwn04manifolds', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Manifold product PDFs designed (2-, 3- and 4-way) with background-free photos and full specifications.', 80, '2026-11-03 15:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04manifolds')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn04manifold02', 'jwn04manifolds', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Fifth PDF: one-page range overview of all three manifolds with a side-by-side specification table.', 100, '2026-11-04 10:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04manifolds')
ON CONFLICT ("id") DO NOTHING;

-- ===== Heading progress =====
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Campaigns & SEO') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Apps & Systems') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
