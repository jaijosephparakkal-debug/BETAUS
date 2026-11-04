-- Projects and design team (Ram, Jiyad, Mamidi, Jashim, Simi): same structure as the rest of the staff.
--   * each person's tasks regrouped under category tasks (existing tasks become the "daily tasks"),
--   * sectioned KPIs: the existing KPI is kept (renamed), plus one count KPI per main category from real Q4
--     completions (since 1 Oct 2026), target about twice the count (minimum 4); categories with none get no KPI.
--   * Simi's client response time is marked lower-is-better (30 hrs against a 24 hr target was scoring 100%).
--   * Jashim's "Designs delivered on time" read 0% although he completed 24 tasks: it is now computed from his
--     own tasks (share completed within one day of their due date), when he has due dates.
-- Only where each task sits (parentTaskId) and, when empty, its category tag change. Titles, statuses, dates,
-- updates and attendance are not touched. To undo: set parentTaskId back to NULL on their tasks and delete rows
-- whose id starts with 'rm_', 'jd_', 'md_', 'js_', 'sm_' (and KPIs starting 'kpi_pd_').

-- ===== Ram =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'ram@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('%MEETING%', 'Project Meetings'),
         ('%SITE VISIT%', 'Project Meetings'),
         ('SILVER STAR VARIATION%', 'Project Meetings'),
         ('GOC%', 'Inspections & Handover'),
         ('DOCUMENTS SUBMISSION%', 'Inspections & Handover'),
         ('GRANS DOCUMENTS%', 'Inspections & Handover'),
         ('%WIR%', 'Inspections & Handover'),
         ('%PAYMENT%', 'Payments & Invoicing'),
         ('%INVOICE%', 'Payments & Invoicing')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'rm\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'rm_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'ram@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('%MEETING%', 'Project Meetings'),
         ('%SITE VISIT%', 'Project Meetings'),
         ('SILVER STAR VARIATION%', 'Project Meetings'),
         ('GOC%', 'Inspections & Handover'),
         ('DOCUMENTS SUBMISSION%', 'Inspections & Handover'),
         ('GRANS DOCUMENTS%', 'Inspections & Handover'),
         ('%WIR%', 'Inspections & Handover'),
         ('%PAYMENT%', 'Payments & Invoicing'),
         ('%INVOICE%', 'Payments & Invoicing')
)
UPDATE "Task" t
SET "parentTaskId" = 'rm_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'rm\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'rm_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Delivery — Projects delivered on schedule'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'ram@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Projects Delivered On Schedule';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_pd_rm_0', 'Meetings — Project meetings held', 'rm_project_meetings'),
  ('kpi_pd_rm_1', 'Inspections — Inspections & handover completed', 'rm_inspections_handover'),
  ('kpi_pd_rm_2', 'Payments — Payment follow-ups completed', 'rm_payments_invoicing')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;

-- ===== Jiyad =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'jiyad.m@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('SITE VISIT', 'Site Visits & Meetings'),
         ('SITE MEETING', 'Site Visits & Meetings'),
         ('CONSULTANT MEETING', 'Site Visits & Meetings'),
         ('SITE VISIT & TECHNICAL MEETING', 'Site Visits & Meetings'),
         ('DOCUMENTATION FOR RAISING INSPECTION', 'Inspections & Documentation'),
         ('INSPECTION', 'Inspections & Documentation'),
         ('COLLECT COMPLETION CERTIFICATE%', 'Inspections & Documentation'),
         ('HIGHLIGHTING DRAWINGS', 'Inspections & Documentation'),
         ('DOCUMENTATION FOR HSE INDUCTION', 'HSE & Compliance'),
         ('TRACKER UPDATE', 'Tracker & Reporting'),
         ('EMAIL', 'Calls & Emails'),
         ('CALLS IN', 'Calls & Emails')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'jd\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'jd_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'jiyad.m@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('SITE VISIT', 'Site Visits & Meetings'),
         ('SITE MEETING', 'Site Visits & Meetings'),
         ('CONSULTANT MEETING', 'Site Visits & Meetings'),
         ('SITE VISIT & TECHNICAL MEETING', 'Site Visits & Meetings'),
         ('DOCUMENTATION FOR RAISING INSPECTION', 'Inspections & Documentation'),
         ('INSPECTION', 'Inspections & Documentation'),
         ('COLLECT COMPLETION CERTIFICATE%', 'Inspections & Documentation'),
         ('HIGHLIGHTING DRAWINGS', 'Inspections & Documentation'),
         ('DOCUMENTATION FOR HSE INDUCTION', 'HSE & Compliance'),
         ('TRACKER UPDATE', 'Tracker & Reporting'),
         ('EMAIL', 'Calls & Emails'),
         ('CALLS IN', 'Calls & Emails')
)
UPDATE "Task" t
SET "parentTaskId" = 'jd_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'jd\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'jd_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Delivery — Site milestones hit'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'jiyad.m@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Site Milestones Hit';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_pd_jd_0', 'Site — Site visits & meetings completed', 'jd_site_visits_meetings'),
  ('kpi_pd_jd_1', 'Inspections — Inspections & documentation completed', 'jd_inspections_documentation')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;

-- ===== Mamidi =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'design@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('%DRAWING%', 'Drawings'),
         ('P 1121%', 'Drawings'),
         ('RISK ASSESSMENT%', 'Submittals & Statements'),
         ('METHOD STATEMENT', 'Submittals & Statements'),
         ('MATERIAL SUBMITTAL', 'Submittals & Statements'),
         ('%PRICE ESCALATION%', 'Price Escalation')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'md\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'md_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'design@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('%DRAWING%', 'Drawings'),
         ('P 1121%', 'Drawings'),
         ('RISK ASSESSMENT%', 'Submittals & Statements'),
         ('METHOD STATEMENT', 'Submittals & Statements'),
         ('MATERIAL SUBMITTAL', 'Submittals & Statements'),
         ('%PRICE ESCALATION%', 'Price Escalation')
)
UPDATE "Task" t
SET "parentTaskId" = 'md_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'md\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'md_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Delivery — Designs delivered on time'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'design@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Designs Delivered On Time';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_pd_md_0', 'Drawings — Drawings completed', 'md_drawings'),
  ('kpi_pd_md_1', 'Submittals — Submittals & statements completed', 'md_submittals_statements')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;

-- ===== Jashim =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'jashim@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('DESIGN AND 3D MODELING', 'Design & 3D Modelling'),
         ('DRAWING REVISION', 'Drawing Revisions'),
         ('QUANTITY TAKE OFF', 'Quantities & Quotations'),
         ('QUOTATION FOR RECTIFICATION WORKS', 'Quantities & Quotations'),
         ('SITE COORDINATION', 'Site, Submittals & Meetings'),
         ('PROJECT SUBMITTALS', 'Site, Submittals & Meetings'),
         ('EVENT PRESENTATION', 'Site, Submittals & Meetings'),
         ('WORKSHOP MEETING%', 'Site, Submittals & Meetings')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'js\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'js_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'jashim@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('DESIGN AND 3D MODELING', 'Design & 3D Modelling'),
         ('DRAWING REVISION', 'Drawing Revisions'),
         ('QUANTITY TAKE OFF', 'Quantities & Quotations'),
         ('QUOTATION FOR RECTIFICATION WORKS', 'Quantities & Quotations'),
         ('SITE COORDINATION', 'Site, Submittals & Meetings'),
         ('PROJECT SUBMITTALS', 'Site, Submittals & Meetings'),
         ('EVENT PRESENTATION', 'Site, Submittals & Meetings'),
         ('WORKSHOP MEETING%', 'Site, Submittals & Meetings')
)
UPDATE "Task" t
SET "parentTaskId" = 'js_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'js\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'js_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Delivery — Designs delivered on time'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'jashim@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Designs Delivered On Time';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_pd_js_0', 'Design — Design & 3D modelling completed', 'js_design_d_modelling'),
  ('kpi_pd_js_1', 'Revisions — Drawing revisions completed', 'js_drawing_revisions')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;

-- ===== Simi =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'simi@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('MATERIAL COST%', 'Material & Site Costs'),
         ('MATERIAL PURCHASE', 'Material & Site Costs'),
         ('LABOUR COUNT AT SITE', 'Material & Site Costs'),
         ('ZOHO ENTRIES', 'Accounts Entries & Invoices'),
         ('INVOICE', 'Accounts Entries & Invoices'),
         ('PROJECT INVOICE SUMMARY', 'Accounts Entries & Invoices'),
         ('SECURITY CHEQUE', 'Accounts Entries & Invoices'),
         ('DOCUMENTATION', 'Documentation & Reports'),
         ('REPORT', 'Documentation & Reports'),
         ('MISCALLANEOUS', 'Documentation & Reports'),
         ('FOLLOW UP', 'Calls & Emails'),
         ('EMAILS ATTENDED', 'Calls & Emails'),
         ('EMP TIME SHEET', 'Timesheets')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'sm\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'sm_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'simi@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('MATERIAL COST%', 'Material & Site Costs'),
         ('MATERIAL PURCHASE', 'Material & Site Costs'),
         ('LABOUR COUNT AT SITE', 'Material & Site Costs'),
         ('ZOHO ENTRIES', 'Accounts Entries & Invoices'),
         ('INVOICE', 'Accounts Entries & Invoices'),
         ('PROJECT INVOICE SUMMARY', 'Accounts Entries & Invoices'),
         ('SECURITY CHEQUE', 'Accounts Entries & Invoices'),
         ('DOCUMENTATION', 'Documentation & Reports'),
         ('REPORT', 'Documentation & Reports'),
         ('MISCALLANEOUS', 'Documentation & Reports'),
         ('FOLLOW UP', 'Calls & Emails'),
         ('EMAILS ATTENDED', 'Calls & Emails'),
         ('EMP TIME SHEET', 'Timesheets')
)
UPDATE "Task" t
SET "parentTaskId" = 'sm_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'sm\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'sm_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Response — Client response time', "lowerIsBetter" = true
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'simi@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Client Response Time';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_pd_sm_0', 'Accounts — Entries & invoices completed', 'sm_accounts_entries_invoices'),
  ('kpi_pd_sm_1', 'Costs — Material & site costs completed', 'sm_material_site_costs'),
  ('kpi_pd_sm_2', 'Reports — Documentation & reports completed', 'sm_documentation_reports')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;

-- Jashim: compute "Designs delivered on time" from his own tasks (completed within one day of the due date),
-- only when he has tasks with due dates.
UPDATE "Kpi" k
SET "current" = s.pct, "period" = 'From due dates (1-day grace)'
FROM (
  SELECT t."assignedToId" AS mid,
         round(100.0 * count(*) FILTER (WHERE t."completedAt" <= t."deadline" + interval '1 day') / count(*))::float AS pct
  FROM "Task" t
  WHERE t."status" = 'COMPLETED' AND t."deadline" IS NOT NULL AND t."completedAt" IS NOT NULL
    AND t."parentTaskId" LIKE 'js\_%'
  GROUP BY t."assignedToId"
) s
WHERE k."membershipId" = s.mid AND k."name" = 'Delivery — Designs delivered on time'
  AND k."id" IN (SELECT k2."id" FROM "Kpi" k2 JOIN "Membership" m ON m."id" = k2."membershipId" JOIN "User" u ON u."id" = m."userId" WHERE lower(u."email") = 'jashim@flaretechnical.com');
