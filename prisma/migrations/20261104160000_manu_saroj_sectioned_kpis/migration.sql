-- Manu and Saroj get sectioned KPIs like everyone else. Their existing KPI is kept (renamed into a section);
-- count KPIs are added per main category from real Q4 completions (since 1 Oct 2026), target about twice the
-- count (minimum 4). Categories with no completions this quarter get no KPI. Interim until the new KPI
-- structure is approved. Tasks and logs are not touched.

UPDATE "Kpi" SET "name" = 'Sales — Quotations sent this quarter'
WHERE "name" = 'Quotations Sent This Quarter'
  AND "membershipId" IN (SELECT "assignedToId" FROM "Task" WHERE "id" = 'mp_quotations');

UPDATE "Kpi" SET "name" = 'Accuracy — Estimation accuracy'
WHERE "name" = 'Estimation Accuracy'
  AND "membershipId" IN (SELECT "assignedToId" FROM "Task" WHERE "id" = 'sa_quotations');

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, p."assignedToId", v.name, GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM (VALUES
  ('kpi_manu_c1', 'Sales — Enquiries handled',                'mp_enquiries'),
  ('kpi_manu_c2', 'Purchasing — Purchase orders completed',   'mp_purchase_orders'),
  ('kpi_manu_c3', 'Purchasing — Imports & deliveries completed', 'mp_imports_deliveries'),
  ('kpi_manu_c4', 'Finance — Payments completed',             'mp_payments'),
  ('kpi_saroj_c1', 'Estimating — Estimates & pricing completed', 'sa_estimation_pricing'),
  ('kpi_saroj_c2', 'Quotations — Quotations completed',       'sa_quotations'),
  ('kpi_saroj_c3', 'Documentation — Drawings & documentation completed', 'sa_drawings_documentation'),
  ('kpi_saroj_c4', 'Site — Site visits completed',            'sa_site_visits')
) AS v(id, name, parent_id)
JOIN "Task" p ON p."id" = v.parent_id
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE x.cnt > 0
ON CONFLICT ("id") DO NOTHING;
