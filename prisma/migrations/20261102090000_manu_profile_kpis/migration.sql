-- KPIs where a lower number is better (e.g. turnaround hours).
ALTER TABLE "Kpi" ADD COLUMN IF NOT EXISTS "lowerIsBetter" BOOLEAN NOT NULL DEFAULT false;

-- Manu Johny (Purchase Engineer): sectioned KPI set. His tasks and logs are not touched.
-- The turnaround KPI was scoring upside down (60 hrs against a 48 hr target showed 100%).
UPDATE "Kpi"
SET "lowerIsBetter" = true, "name" = 'Purchasing — PO turnaround'
WHERE "name" = 'Purchase Order Turnaround'
  AND "membershipId" IN (
    SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
    WHERE lower(u."email") = 'business@gasneeds.com'
  );

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT 'kpi_manu_quotes_oct26', m."id", 'Sales support — Quotations sent', 150, 201, NULL, 'Oct 2026', NOW(), NOW()
FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
WHERE lower(u."email") = 'business@gasneeds.com'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT 'kpi_manu_completion_oct26', m."id", 'Delivery — Task completion rate', 90, 89, '%', 'Oct 2026', NOW(), NOW()
FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
WHERE lower(u."email") = 'business@gasneeds.com'
ON CONFLICT ("id") DO NOTHING;

-- Task-title presets for his task form (new tasks only).
INSERT INTO "TaskTitlePreset" ("id", "membershipId", "title", "createdAt")
SELECT 'preset_manu_' || t.n, m."id", t.title, NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
CROSS JOIN (VALUES
  (1, 'Enquiry received'),
  (2, 'Quotation sent'),
  (3, 'Supplier follow-up'),
  (4, 'Purchase order raised'),
  (5, 'Import shipment follow-up'),
  (6, 'Payment follow-up'),
  (7, 'Delivery coordination'),
  (8, 'Material order')
) AS t(n, title)
WHERE lower(u."email") = 'business@gasneeds.com'
ON CONFLICT DO NOTHING;
