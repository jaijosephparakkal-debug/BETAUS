-- Antony (Operations Manager, Gasneeds): same structure as Jai's profile.
--   * his 130 tasks regrouped under five category tasks (his existing tasks become the "daily tasks"),
--   * a sectioned KPI set from his real Q4 numbers.
-- Only where each task sits (parentTaskId) and, when empty, its category tag change. Titles, statuses,
-- dates, updates and attendance are not touched. To undo: set parentTaskId back to NULL on his tasks and
-- delete the rows whose id starts with 'an_' (and the KPIs whose id starts with 'kpi_ant_').

-- 1. Category tasks.
WITH ant AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'sales@gasneeds.com' AND c."slug" = 'gasneeds'
),
mapping(k, cat) AS (
  VALUES ('PRODUCT QUOTATIONS', 'Quotations & Sales'),
         ('20K TANK PRICE%', 'Quotations & Sales'),
         ('CUSTOMER VISIT', 'Customer Visits'),
         ('PRO WORK', 'PRO & Government Work'),
         ('RTA WORK', 'PRO & Government Work'),
         ('COORDINATE VAHAB ANSARI EID%', 'PRO & Government Work'),
         ('FABRICATED NEW RESIDENCY%', 'PRO & Government Work'),
         ('HR WORK', 'HR & Admin'),
         ('MEDICAL INSURANCE RENEWAL', 'HR & Admin'),
         ('COORDINATE MAXUS VAN BRANDING%', 'HR & Admin'),
         ('PAYMENT F/UP QUGAS KSA', 'Follow-ups & Coordination'),
         ('QUOTE F/UP LAHEJ GAS', 'Follow-ups & Coordination'),
         ('QUOTE F/UP LAHEJ GAS-PAYMENT%', 'Follow-ups & Coordination'),
         ('DETAILED MALE FORWARD TO HEMAYAH%', 'Follow-ups & Coordination')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t
  JOIN ant ON t."assignedToId" = ant.mid
  JOIN mapping mp ON upper(t."title") LIKE mp.k
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'an\_%'
),
agg AS (
  SELECT cat,
         min("createdAt") AS first_at,
         max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n,
         round(avg("progress"))::int AS prog,
         max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'an_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')),
       ant.cid,
       agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       ant.mid,
       coalesce(ant.boss, ant.mid),
       agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
       agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END,
       agg.first_at,
       NOW()
FROM agg CROSS JOIN ant
ON CONFLICT ("id") DO NOTHING;

-- 2. Move his existing tasks under their category task.
WITH ant AS (
  SELECT m."id" AS mid
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'sales@gasneeds.com' AND c."slug" = 'gasneeds'
),
mapping(k, cat) AS (
  VALUES ('PRODUCT QUOTATIONS', 'Quotations & Sales'),
         ('20K TANK PRICE%', 'Quotations & Sales'),
         ('CUSTOMER VISIT', 'Customer Visits'),
         ('PRO WORK', 'PRO & Government Work'),
         ('RTA WORK', 'PRO & Government Work'),
         ('COORDINATE VAHAB ANSARI EID%', 'PRO & Government Work'),
         ('FABRICATED NEW RESIDENCY%', 'PRO & Government Work'),
         ('HR WORK', 'HR & Admin'),
         ('MEDICAL INSURANCE RENEWAL', 'HR & Admin'),
         ('COORDINATE MAXUS VAN BRANDING%', 'HR & Admin'),
         ('PAYMENT F/UP QUGAS KSA', 'Follow-ups & Coordination'),
         ('QUOTE F/UP LAHEJ GAS', 'Follow-ups & Coordination'),
         ('QUOTE F/UP LAHEJ GAS-PAYMENT%', 'Follow-ups & Coordination'),
         ('DETAILED MALE FORWARD TO HEMAYAH%', 'Follow-ups & Coordination')
)
UPDATE "Task" t
SET "parentTaskId" = 'an_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM ant, mapping mp
WHERE t."assignedToId" = ant.mid
  AND t."parentTaskId" IS NULL
  AND t."id" NOT LIKE 'an\_%'
  AND upper(t."title") LIKE mp.k
  AND EXISTS (SELECT 1 FROM "Task" p WHERE p."id" = 'an_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

-- 3. KPIs: his existing one is kept (renamed into a section); three more from his Q4 completions.
--    Targets use the same ratio as Jai's set: about twice the quarter-to-date count (minimum 4).
UPDATE "Kpi" k
SET "name" = 'Operations — Order fulfilment rate'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'sales@gasneeds.com' AND c."slug" = 'gasneeds'
  AND k."name" = 'Order Fulfilment Rate';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, m."id", v.name, GREATEST(2 * v.cnt, 4), v.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
JOIN "Company" c ON c."id" = m."companyId"
CROSS JOIN LATERAL (VALUES
  ('kpi_ant_quotes_q4', 'Sales — Quotations sent this quarter',
     (SELECT count(*) FROM "Task" t WHERE t."assignedToId" = m."id" AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
        AND (upper(t."title") = 'PRODUCT QUOTATIONS' OR upper(t."title") LIKE 'QUOTE F/UP%' OR upper(t."title") LIKE '20K TANK%'))),
  ('kpi_ant_visits_q4', 'Sales — Customer visits this quarter',
     (SELECT count(*) FROM "Task" t WHERE t."assignedToId" = m."id" AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
        AND upper(t."title") = 'CUSTOMER VISIT')),
  ('kpi_ant_pro_q4', 'Operations — PRO and government work completed',
     (SELECT count(*) FROM "Task" t WHERE t."assignedToId" = m."id" AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
        AND (upper(t."title") IN ('PRO WORK', 'RTA WORK') OR upper(t."title") LIKE 'COORDINATE VAHAB ANSARI EID%' OR upper(t."title") LIKE 'FABRICATED NEW RESIDENCY%')))
) AS v(id, name, cnt)
WHERE lower(u."email") = 'sales@gasneeds.com' AND c."slug" = 'gasneeds'
ON CONFLICT ("id") DO NOTHING;
