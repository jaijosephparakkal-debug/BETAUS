-- Jai Joseph Parakkal: rest of the work done 26 Oct - 4 Nov 2026 (personal work left out).
-- New work gets its own task; work on something already on his KPI is added as a log.
-- Adds rows only (fixed ids, safe to re-run); heading progress recomputed like recomputeTaskProgress.


-- ===== NEW: flaretechnical.com rebuild & go-live (Apps & Systems) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05website', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'flaretechnical.com - New Website Rebuild & Go-Live', 'New flaretechnical.com built from scratch in Next.js on Vercel to replace the old PHP/WordPress site, using its content.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Apps & Systems') ORDER BY t."createdAt" LIMIT 1), 'flaretechnical', 'Apps & Systems', 'COMPLETED', 100, '2026-10-28 18:00:00', '2026-10-26 08:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05web01', 'jwn05website', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Old site went down after a WordPress install; WordPress moved to its own folder and the old site restored while the new one was built.', 10, '2026-10-26 08:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05website')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05web02', 'jwn05website', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'New site built in Next.js on Vercel: new blue/orange Flaretech branding and vector logos; Projects (LPG/SNG/NG), Maintenance and Utility pages; Products removed; Flare Technical Services LLC only (Trading LLC removed); full-width layout on large screens.', 50, '2026-10-26 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05website')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05web03', 'jwn05website', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Go-live prep: www redirect, production address, preview links kept out of search; domain and DNS checked with the old hosting firm.', 70, '2026-10-27 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05website')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05web04', 'jwn05website', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Site live on flaretechnical.com with SSL; enquiry form emails delivered through Resend.', 85, '2026-10-28 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05website')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05web05', 'jwn05website', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Team page (directors, management, engineering, support); ISO 9001:2015 badge, current certificate and QHSE note; Shafeeks photo replaced; address corrected to 16 Damascus Street; photo beside Our Principles replaced.', 100, '2026-10-28 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05website')
ON CONFLICT ("id") DO NOTHING;

-- ===== NEW: Flaretech gas billing portal (Apps & Systems) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05billing', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'Flaretech Gas Billing Portal - Customer Login & Meter Reader Dashboard', 'Customer portal on flaretechnical.com for gas meter readings, bills, receipts and deposits, plus a Gas Meter Reader Dashboard for staff.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Apps & Systems') ORDER BY t."createdAt" LIMIT 1), 'flaretechnical', 'Apps & Systems', 'IN_PROGRESS', 80, NULL, '2026-11-02 12:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05bill01', 'jwn05billing', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Planned after Abraham sirs go-ahead: customer login on flaretechnical.com, meter photo readings checked against a QR/serial sticker, security deposit shown on the account, payment gateway options compared.', 20, '2026-11-02 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05billing')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05bill02', 'jwn05billing', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Overview PDF of the software and how it benefits the firm, with illustrations and infographics.', 30, '2026-11-02 17:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05billing')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05bill03', 'jwn05billing', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Billing rules set from the building charges sheet: 5% VAT on charges (none on deposits), bi-monthly and prepaid buildings included, company TRN on bills; portal built on Supabase.', 60, '2026-11-03 14:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05billing')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05bill04', 'jwn05billing', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Portal live: Customer Login on the website, sign-in by emailed code or link (Resend), Gas Meter Reader Dashboard for Jayaprakash and Flexie. Still to switch on: WhatsApp (needs a Meta Business account) and card payments (Stripe).', 80, '2026-11-03 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05billing')
ON CONFLICT ("id") DO NOTHING;

-- ===== NEW: OWN IT update (Apps & Systems) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05ownitupdate', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'OWN IT - Attendance, Database Move & KPI Optimisation', 'Attendance, reconciliation, database and KPI changes to the OWN IT portal (26 Oct - 2 Nov 2026).', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Apps & Systems') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Apps & Systems', 'COMPLETED', 100, '2026-11-02 18:00:00', '2026-10-26 09:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05own01', 'jwn05ownitupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'KPI system review: maintenance team report, outcome-based scoring, targets and task presets planned.', 15, '2026-10-26 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05ownitupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05own02', 'jwn05ownitupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Database moved from Prisma Postgres to Supabase (Mumbai) after the free-plan limit took the portal down; portal back online.', 35, '2026-10-28 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05ownitupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05own03', 'jwn05ownitupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Attendance: 6 pm auto clock-out (directors included), leave days, attendance PDF and full attendance calendar for the director.', 55, '2026-10-29 15:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05ownitupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05own04', 'jwn05ownitupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Reconciliation windows reopened and one common attendance email sent with each persons calendar; alternate Saturdays off, working Saturdays 9 am - 3 pm.', 70, '2026-10-30 15:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05ownitupdate')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05own05', 'jwn05ownitupdate', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'KPIs optimised for Jai, Manu, Saroj and Antony: category tasks with sub dropdowns and "+ Add other", sectioned KPIs; "Assigned by others" removed from profiles.', 100, '2026-11-02 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05ownitupdate')
ON CONFLICT ("id") DO NOTHING;

-- ===== NEW: Civil Defence approval proposal (Confidential) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05civildef', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'Proposal & Quotation - Civil Defence Approval (Margham Conservation)', 'Two-page Flaretech proposal and quotation for Mohammed Siju.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Confidential') ORDER BY t."createdAt" LIMIT 1), 'flaretechnical', 'Confidential', 'COMPLETED', 100, '2026-10-30 17:00:00', '2026-10-30 09:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05cd01', 'jwn05civildef', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Proposal and quotation designed in Canva on Flaretech branding, fitted to two A4 pages (total AED 24,675.00).', 60, '2026-10-30 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05civildef')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05cd02', 'jwn05civildef', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Name corrected to Siju, full company name and address on every page; final PDF and a plain Word version exported.', 100, '2026-10-30 17:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05civildef')
ON CONFLICT ("id") DO NOTHING;

-- ===== NEW: Interactive USB catalogue (Video) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05usb', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'GASNEEDS Interactive USB Catalogue + Motion-Graphic Videos', 'Interactive USB experience for the catalogue with a Start Here intro and section videos.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Video') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Video', 'COMPLETED', 100, '2026-11-04 12:00:00', '2026-11-02 09:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05usb01', 'jwn05usb', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'USB experience planned: Start Here intro followed by the catalogue sections.', 30, '2026-11-02 10:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05usb')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05usb02', 'jwn05usb', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), '35-second motion-graphic intro and section videos with a natural voice-over and soft background music, synced word by word.', 70, '2026-11-02 14:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05usb')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05usb03', 'jwn05usb', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'USB drives formatted and loaded with the catalogue; phone number corrected to +971 600 500 789.', 90, '2026-11-02 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05usb')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05usb04', 'jwn05usb', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'USB catalogue completed and handed over.', 100, '2026-11-04 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05usb')
ON CONFLICT ("id") DO NOTHING;

-- ===== NEW: small design deliverables (Design) =====
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05brochure', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'GASNEEDS Four-Page Brochure - High-Res Redesign', 'Four-page brochure rebuilt with high-resolution product photos.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Design', 'COMPLETED', 100, '2026-11-02 12:00:00', '2026-11-02 09:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05bro01', 'jwn05brochure', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'All photos replaced with high-resolution sources at the same scale, nothing cut off; sharp QR code and redrawn quality badge.', 100, '2026-11-02 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05brochure')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05poster', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'PRMS 500 Views Story Poster', 'WhatsApp Status and Instagram Story poster marking 500 views on the PRMS video.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Design', 'COMPLETED', 100, '2026-10-30 15:00:00', '2026-10-30 12:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05pos01', 'jwn05poster', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Poster made with the skid photo and brand background; JPG for WhatsApp and PNG for Instagram.', 100, '2026-10-30 15:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05poster')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Task" ("id","companyId","title","description","assignedToId","assignedById","parentTaskId","workedForCompany","category","status","progress","completedAt","createdAt","updatedAt")
SELECT 'jwn05structure', (SELECT "companyId" FROM "Membership" WHERE "id" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), 'Company Structure Chart - Flare Technical & GASNEEDS', 'Company structure of Flare Technical and GASNEEDS laid out as a clean chart.', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), COALESCE((SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'abraham@flaretechnical.com' AND c."slug" = 'gasneeds'), (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds')), (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Design') ORDER BY t."createdAt" LIMIT 1), 'gasneeds', 'Design', 'COMPLETED', 100, '2026-10-29 12:00:00', '2026-10-29 10:00:00', CURRENT_TIMESTAMP
WHERE (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05str01', 'jwn05structure', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Structure chart redesigned and laid out.', 100, '2026-10-29 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn05structure')
ON CONFLICT ("id") DO NOTHING;

-- ===== LOGS on tasks already on the KPI =====
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05gncat01', 'cmumhx66u001xukr0e3t2df03', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Print edition prepared: low-resolution images replaced with 300 PPI sources, QR code replaced, inside covers and index colours fixed; print folder with bleed and cut marks.', 100, '2026-10-31 15:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'cmumhx66u001xukr0e3t2df03')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05gncat02', 'cmumhx66u001xukr0e3t2df03', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Second image pass: photos under 300 PPI replaced from the brands own sites, no image cut off.', 100, '2026-11-02 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'cmumhx66u001xukr0e3t2df03')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05profile01', 'jwc09e89f6462936b327ff191', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'End credits added (QHSE commitment, then the group photo); typography and a black line fixed at 2:56-2:57; 2K version exported.', 100, '2026-10-26 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwc09e89f6462936b327ff191')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05z1video01', 'jwe149d03201c7a3488e460d6', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), '1080p and 2K versions updated (battery life "8 years max", ZERO.1 naming) and uploaded to YouTube with title and thumbnail.', 100, '2026-10-28 12:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwe149d03201c7a3488e460d6')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05z1guide01', 'jw5f84f01705a82556817d4a8', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Canva storyboard redone with the actual images; How It Works guide branded, tank and cover redesigned, exported as PDF.', 100, '2026-10-27 18:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw5f84f01705a82556817d4a8')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05mookuk01', 'jw5314b0c8b9f1bb8a2253de1', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Follow-ups sent to Thames Cryogenics, Wessington Cryogenics and Cryotanks; Gas and Cryogenics, Gas and Liquid Controls and Pro Gases UK still to follow up.', 100, '2026-10-28 11:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw5314b0c8b9f1bb8a2253de1')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn05agency01', 'jw3a94af1190f35b6f02f0a78', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Mueller-Flaretech Sole Agency Agreement: directors changes reviewed and answers drafted.', 100, '2026-11-04 10:00:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jw3a94af1190f35b6f02f0a78')
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
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Video') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Digital Marketing') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Apps & Systems') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
UPDATE "Task" p SET
  "progress" = (SELECT round(avg(s."progress"))::int FROM "Task" s WHERE s."parentTaskId" = p."id"),
  "status" = CASE
    WHEN (SELECT bool_and(s."status" = 'COMPLETED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'COMPLETED'
    WHEN (SELECT bool_or(s."status" <> 'NOT_STARTED') FROM "Task" s WHERE s."parentTaskId" = p."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED' END,
  "updatedAt" = now()
WHERE p."id" = (SELECT t."id" FROM "Task" t WHERE t."assignedToId" = (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds') AND t."parentTaskId" IS NULL AND lower(t."title") = lower('Confidential') ORDER BY t."createdAt" LIMIT 1) AND EXISTS (SELECT 1 FROM "Task" s WHERE s."parentTaskId" = p."id");
