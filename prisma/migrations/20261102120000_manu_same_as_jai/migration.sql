-- Manu Johny gets the same structure as Jai's profile:
--   * his tasks are regrouped under six category tasks (his existing tasks become the "daily tasks" under them),
--   * one outcome KPI.
-- Only where each task sits (parentTaskId) and, when empty, its category tag change. Titles, statuses,
-- dates, updates and attendance are not touched. To undo: set parentTaskId back to NULL on his tasks and
-- delete the rows whose id starts with 'mp_'.

-- 1. Category tasks (one per category his work falls into).
WITH manu AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
  WHERE lower(u."email") = 'business@gasneeds.com'
),
mapping(k, cat) AS (
  VALUES ('QUOTATION', 'Quotations'),
         ('PURCHASE ORDERS', 'Purchase Orders'),
         ('MATERIAL ORDER', 'Purchase Orders'),
         ('ENQUIRY', 'Enquiries'),
         ('IMPORT', 'Imports & Deliveries'),
         ('DELIVERY', 'Imports & Deliveries'),
         ('SEITRON%', 'Imports & Deliveries'),
         ('PAYMENTS', 'Payments'),
         ('FOLLOW UP', 'Follow-ups & Calls'),
         ('CALLS', 'Follow-ups & Calls')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t
  JOIN manu ON t."assignedToId" = manu.mid
  JOIN mapping mp ON upper(t."title") LIKE mp.k
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'mp\_%'
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
SELECT 'mp_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')),
       manu.cid,
       agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       manu.mid,
       coalesce(manu.boss, manu.mid),
       agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
       agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END,
       agg.first_at,
       NOW()
FROM agg CROSS JOIN manu
ON CONFLICT ("id") DO NOTHING;

-- 2. Move his existing tasks under their category task.
WITH manu AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
  WHERE lower(u."email") = 'business@gasneeds.com'
),
mapping(k, cat) AS (
  VALUES ('QUOTATION', 'Quotations'),
         ('PURCHASE ORDERS', 'Purchase Orders'),
         ('MATERIAL ORDER', 'Purchase Orders'),
         ('ENQUIRY', 'Enquiries'),
         ('IMPORT', 'Imports & Deliveries'),
         ('DELIVERY', 'Imports & Deliveries'),
         ('SEITRON%', 'Imports & Deliveries'),
         ('PAYMENTS', 'Payments'),
         ('FOLLOW UP', 'Follow-ups & Calls'),
         ('CALLS', 'Follow-ups & Calls')
)
UPDATE "Task" t
SET "parentTaskId" = 'mp_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM manu, mapping mp
WHERE t."assignedToId" = manu.mid
  AND t."parentTaskId" IS NULL
  AND t."id" NOT LIKE 'mp\_%'
  AND upper(t."title") LIKE mp.k
  AND EXISTS (SELECT 1 FROM "Task" p WHERE p."id" = 'mp_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

-- 3. One outcome KPI, like Jai's. Replaces the KPIs added earlier today.
DELETE FROM "Kpi" WHERE "id" IN ('kpi_manu_quotes_oct26', 'kpi_manu_completion_oct26');
UPDATE "Kpi"
SET "name" = 'Quotations Sent This Quarter', "target" = 600, "current" = 201,
    "unit" = NULL, "period" = NULL, "lowerIsBetter" = false
WHERE "name" = 'Purchasing — PO turnaround'
  AND "membershipId" IN (
    SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
    WHERE lower(u."email") = 'business@gasneeds.com'
  );

-- 4. Remove the task-title presets added earlier today (not part of Jai's setup).
DELETE FROM "TaskTitlePreset" WHERE "id" LIKE 'preset\_manu\_%';
