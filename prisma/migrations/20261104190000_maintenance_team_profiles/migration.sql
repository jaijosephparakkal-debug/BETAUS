-- Maintenance team (Jayaprakash, Flexie): same structure as the rest of the staff.
--   * each person's tasks regrouped under category tasks (existing tasks become the "daily tasks"),
--   * sectioned KPIs: the existing KPI is kept (renamed), plus one count KPI per main category from real Q4
--     completions (since 1 Oct 2026), target about twice the count (minimum 4); categories with none get no KPI.
--   * Jayaprakash's response-time KPI is marked lower-is-better (6 hrs against a 4 hr target was scoring 100%).
-- Only where each task sits (parentTaskId) and, when empty, its category tag change. Titles, statuses, dates,
-- updates and attendance are not touched. To undo: set parentTaskId back to NULL on their tasks and delete rows
-- whose id starts with 'jp_' / 'fx_' (and KPIs starting 'kpi_mt_').

-- ===== Jayaprakash =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'service@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('NEW CONNECTION REQUESTS', 'Connections & Disconnections'),
         ('GAS DISCONNECTION REQUEST', 'Connections & Disconnections'),
         ('ENQUIRY RECEIVED', 'Enquiries & Quotations'),
         ('PHONE IN', 'Enquiries & Quotations'),
         ('QUOTATION SENT', 'Enquiries & Quotations'),
         ('DAILY WORK SCHEDULE TO BE UPDATED ON FSM', 'Scheduling (FSM)'),
         ('SHEDULE ADDING IN FSM', 'Scheduling (FSM)'),
         ('INVOICES GENERATION', 'Billing & Payments'),
         ('PAYMENT LINK CREATED FOR NEW GAS CONNECTION%', 'Billing & Payments')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'jp\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'jp_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'service@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('NEW CONNECTION REQUESTS', 'Connections & Disconnections'),
         ('GAS DISCONNECTION REQUEST', 'Connections & Disconnections'),
         ('ENQUIRY RECEIVED', 'Enquiries & Quotations'),
         ('PHONE IN', 'Enquiries & Quotations'),
         ('QUOTATION SENT', 'Enquiries & Quotations'),
         ('DAILY WORK SCHEDULE TO BE UPDATED ON FSM', 'Scheduling (FSM)'),
         ('SHEDULE ADDING IN FSM', 'Scheduling (FSM)'),
         ('INVOICES GENERATION', 'Billing & Payments'),
         ('PAYMENT LINK CREATED FOR NEW GAS CONNECTION%', 'Billing & Payments')
)
UPDATE "Task" t
SET "parentTaskId" = 'jp_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'jp\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'jp_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Response — Maintenance response time', "lowerIsBetter" = true
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'service@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Maintenance Response Time';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_mt_jp_0', 'Service — Connections & disconnections completed', 'jp_connections_disconnections'),
  ('kpi_mt_jp_1', 'Sales — Enquiries & quotations completed', 'jp_enquiries_quotations'),
  ('kpi_mt_jp_2', 'Scheduling — FSM scheduling updates completed', 'jp_scheduling_fsm_'),
  ('kpi_mt_jp_3', 'Billing — Billing & payments completed', 'jp_billing_payments')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;

-- ===== Flexie =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'alerts@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('GAS METER READING PAPER%', 'Meter Reading'),
         ('GAS MATER READING PAPER%', 'Meter Reading'),
         ('GAS READING METER PAPER%', 'Meter Reading'),
         ('GAS READING PAPER%', 'Meter Reading'),
         ('GAS READING INVOIC%', 'Gas Billing & Invoicing'),
         ('GAS READING BILLING INVOICES%', 'Gas Billing & Invoicing'),
         ('GENERATE GAS BILL%', 'Gas Billing & Invoicing'),
         ('INVOICES%', 'Gas Billing & Invoicing'),
         ('INVOICING%', 'Gas Billing & Invoicing'),
         ('MEDIA PRO/GAS BILL INVOICES', 'Gas Billing & Invoicing'),
         ('RANDOM GAS INVOICING', 'Gas Billing & Invoicing'),
         ('PRINTING OUT INVOICE%', 'Gas Billing & Invoicing'),
         ('COLLECTION PAPER FOR MEDIA PRO%', 'Collections & Payments'),
         ('PAPER PAYMENT EXCEL%', 'Collections & Payments'),
         ('PAYMENT LINK UPDATED%', 'Collections & Payments'),
         ('POSTDATED PAYMENT LINK%', 'Collections & Payments'),
         ('POSTING PAYMENT LINK%', 'Collections & Payments'),
         ('UPDATING PAYMENT FROM PAYMENT LINK%', 'Collections & Payments'),
         ('REPORT FOR ALL OUTSTANDING%', 'Collections & Payments'),
         ('SEND EMAIL TO MEDIA PRO%', 'Collections & Payments'),
         ('ANOTHER DISCONNECTIONS REFUND%', 'Disconnections & Refunds'),
         ('DISCONNECTION PROCESSING%', 'Disconnections & Refunds'),
         ('DISCONNECTIONS REFUND FOLLOW UP%', 'Disconnections & Refunds'),
         ('SORTING FOR MEDIA PRO BLDG-DISCONNECTIONS', 'Disconnections & Refunds'),
         ('UPDATING DISCONNECTION%', 'Disconnections & Refunds'),
         ('UPDATING SECURITY REFUND%', 'Disconnections & Refunds')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'fx\_%'
),
agg AS (
  SELECT cat, min("createdAt") AS first_at, max(coalesce("completedAt", "deadline", "createdAt")) AS last_at,
         count(*) FILTER (WHERE "status" <> 'COMPLETED') AS open_n, round(avg("progress"))::int AS prog, max("completedAt") AS done_at
  FROM work GROUP BY cat
)
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "completedAt", "createdAt", "updatedAt")
SELECT 'fx_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')), who.cid, agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid, coalesce(who.boss, who.mid), agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END, agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END, agg.first_at, NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'alerts@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('GAS METER READING PAPER%', 'Meter Reading'),
         ('GAS MATER READING PAPER%', 'Meter Reading'),
         ('GAS READING METER PAPER%', 'Meter Reading'),
         ('GAS READING PAPER%', 'Meter Reading'),
         ('GAS READING INVOIC%', 'Gas Billing & Invoicing'),
         ('GAS READING BILLING INVOICES%', 'Gas Billing & Invoicing'),
         ('GENERATE GAS BILL%', 'Gas Billing & Invoicing'),
         ('INVOICES%', 'Gas Billing & Invoicing'),
         ('INVOICING%', 'Gas Billing & Invoicing'),
         ('MEDIA PRO/GAS BILL INVOICES', 'Gas Billing & Invoicing'),
         ('RANDOM GAS INVOICING', 'Gas Billing & Invoicing'),
         ('PRINTING OUT INVOICE%', 'Gas Billing & Invoicing'),
         ('COLLECTION PAPER FOR MEDIA PRO%', 'Collections & Payments'),
         ('PAPER PAYMENT EXCEL%', 'Collections & Payments'),
         ('PAYMENT LINK UPDATED%', 'Collections & Payments'),
         ('POSTDATED PAYMENT LINK%', 'Collections & Payments'),
         ('POSTING PAYMENT LINK%', 'Collections & Payments'),
         ('UPDATING PAYMENT FROM PAYMENT LINK%', 'Collections & Payments'),
         ('REPORT FOR ALL OUTSTANDING%', 'Collections & Payments'),
         ('SEND EMAIL TO MEDIA PRO%', 'Collections & Payments'),
         ('ANOTHER DISCONNECTIONS REFUND%', 'Disconnections & Refunds'),
         ('DISCONNECTION PROCESSING%', 'Disconnections & Refunds'),
         ('DISCONNECTIONS REFUND FOLLOW UP%', 'Disconnections & Refunds'),
         ('SORTING FOR MEDIA PRO BLDG-DISCONNECTIONS', 'Disconnections & Refunds'),
         ('UPDATING DISCONNECTION%', 'Disconnections & Refunds'),
         ('UPDATING SECURITY REFUND%', 'Disconnections & Refunds')
)
UPDATE "Task" t
SET "parentTaskId" = 'fx_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid AND t."parentTaskId" IS NULL AND t."id" NOT LIKE 'fx\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'fx_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Readings — Readings completed on schedule'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'alerts@flaretechnical.com' AND c."slug" = 'flaretechnical' AND k."name" = 'Readings Completed On Schedule';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, pr."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_mt_fx_0', 'Readings — Meter reading papers completed', 'fx_meter_reading'),
  ('kpi_mt_fx_1', 'Billing — Gas billing & invoicing completed', 'fx_gas_billing_invoicing'),
  ('kpi_mt_fx_2', 'Collections — Collections & payments completed', 'fx_collections_payments'),
  ('kpi_mt_fx_3', 'Disconnections — Disconnections & refunds completed', 'fx_disconnections_refunds')
) AS v(id, name, parent_id)
JOIN "Task" pr ON pr."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;
