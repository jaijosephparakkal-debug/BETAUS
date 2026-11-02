-- Saroj (Estimation Engineer) gets the same structure as Jai's profile:
-- his tasks regrouped under six category tasks, assigned by his manager (Ram), with his existing tasks
-- as the "daily tasks" underneath. His KPI (Estimation Accuracy) is already a single KPI and is left as is.
-- Only where each task sits (parentTaskId) and, when empty, its category tag change. Titles, statuses,
-- dates, updates and attendance are not touched. To undo: set parentTaskId back to NULL on his tasks and
-- delete the rows whose id starts with 'sa_'.

-- 1. Category tasks.
WITH saroj AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
  WHERE lower(u."email") = 'saroj@flaretechnical.com'
),
mapping(k, cat) AS (
  VALUES ('QUOTATION', 'Quotations'),
         ('ESTIMATION', 'Estimation & Pricing'),
         ('PRICE UPDATION', 'Estimation & Pricing'),
         ('DRAWINGS REVISION%', 'Estimation & Pricing'),
         ('DRAWING', 'Drawings & Documentation'),
         ('DOCUMENTATION', 'Drawings & Documentation'),
         ('NSHAMA%', 'Drawings & Documentation'),
         ('SITE VISIT', 'Site Visits'),
         ('FOLLOW UP', 'Follow-ups & Emails'),
         ('EMAILS ATTENDED', 'Follow-ups & Emails'),
         ('FOLLOW UP WITH THE AL DHARIS%', 'Follow-ups & Emails'),
         ('IT', 'Systems & Updates'),
         ('PROJECTS UPDATE IN THE APP', 'Systems & Updates')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t
  JOIN saroj ON t."assignedToId" = saroj.mid
  JOIN mapping mp ON upper(t."title") LIKE mp.k
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'sa\_%'
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
SELECT 'sa_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')),
       saroj.cid,
       agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       saroj.mid,
       coalesce(saroj.boss, saroj.mid),
       agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
       agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END,
       agg.first_at,
       NOW()
FROM agg CROSS JOIN saroj
ON CONFLICT ("id") DO NOTHING;

-- 2. Move his existing tasks under their category task.
WITH saroj AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
  WHERE lower(u."email") = 'saroj@flaretechnical.com'
),
mapping(k, cat) AS (
  VALUES ('QUOTATION', 'Quotations'),
         ('ESTIMATION', 'Estimation & Pricing'),
         ('PRICE UPDATION', 'Estimation & Pricing'),
         ('DRAWINGS REVISION%', 'Estimation & Pricing'),
         ('DRAWING', 'Drawings & Documentation'),
         ('DOCUMENTATION', 'Drawings & Documentation'),
         ('NSHAMA%', 'Drawings & Documentation'),
         ('SITE VISIT', 'Site Visits'),
         ('FOLLOW UP', 'Follow-ups & Emails'),
         ('EMAILS ATTENDED', 'Follow-ups & Emails'),
         ('FOLLOW UP WITH THE AL DHARIS%', 'Follow-ups & Emails'),
         ('IT', 'Systems & Updates'),
         ('PROJECTS UPDATE IN THE APP', 'Systems & Updates')
)
UPDATE "Task" t
SET "parentTaskId" = 'sa_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM saroj, mapping mp
WHERE t."assignedToId" = saroj.mid
  AND t."parentTaskId" IS NULL
  AND t."id" NOT LIKE 'sa\_%'
  AND upper(t."title") LIKE mp.k
  AND EXISTS (SELECT 1 FROM "Task" p WHERE p."id" = 'sa_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));
