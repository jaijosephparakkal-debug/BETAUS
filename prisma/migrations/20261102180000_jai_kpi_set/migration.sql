-- Jai (Marketing & Content Manager, Gasneeds): a sectioned KPI set built from his real Q4 numbers
-- (Oct 2026, from his completed tasks): 12 designs, 7 videos, 3 campaigns, 2 digital marketing deliverables;
-- 51 of 60 daily tasks completed. Targets use the same ratio as his existing KPI (about 2x October's pace).
-- His tasks and logs are not touched.
UPDATE "Kpi" k
SET "name" = 'Campaigns — Campaigns shipped this quarter'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'
  AND k."name" = 'Campaigns Shipped This Quarter';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, m."id", v.name, v.target, v.current, v.unit, v.period, NOW(), NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
JOIN "Company" c ON c."id" = m."companyId"
CROSS JOIN (VALUES
  ('kpi_jai_designs_q4', 'Content — Designs delivered this quarter', 24, 12, NULL, 'Q4 2026'),
  ('kpi_jai_videos_q4', 'Content — Videos produced this quarter', 14, 7, NULL, 'Q4 2026'),
  ('kpi_jai_digital_q4', 'Campaigns — Digital marketing deliverables', 4, 2, NULL, 'Q4 2026'),
  ('kpi_jai_completion', 'Delivery — Task completion rate', 90, 85, '%', 'Since 29 Jun 2026')
) AS v(id, name, target, current, unit, period)
WHERE lower(u."email") = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'
ON CONFLICT ("id") DO NOTHING;
