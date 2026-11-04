-- Hashim works for both Accounts and the Maintenance team: separate the two by function.
-- Renames of his category tasks (same ids, same daily tasks), one new Accounts category for supplier/admin
-- items moved out of the contracts category. Nothing is deleted.

-- New Accounts category for supplier forms, asset register and insurance (copied from the contracts category).
INSERT INTO "Task" ("id", "companyId", "title", "description", "assignedToId", "assignedById", "category", "status", "progress", "createdAt", "updatedAt")
SELECT 'ha_accounts_supplier_admin', p."companyId", 'Accounts — Supplier & Admin',
       'Accounts — Supplier & Admin work.', p."assignedToId", p."assignedById", 'Accounts — Supplier & Admin',
       'IN_PROGRESS', 0, p."createdAt", NOW()
FROM "Task" p WHERE p."id" = 'ha_contracts_portals'
ON CONFLICT ("id") DO NOTHING;

UPDATE "Task" t
SET "parentTaskId" = 'ha_accounts_supplier_admin'
WHERE t."parentTaskId" = 'ha_contracts_portals'
  AND (upper(t."title") LIKE 'KHAN SAHEB%' OR upper(t."title") = 'FULLFILL ASSET REGISTER' OR upper(t."title") = 'WAREHOUSE INSURANCE UPDATION')
  AND EXISTS (SELECT 1 FROM "Task" p WHERE p."id" = 'ha_accounts_supplier_admin');

-- Progress/status/description of the new category follow its tasks.
UPDATE "Task" p
SET "progress" = COALESCE((SELECT round(avg(c."progress"))::int FROM "Task" c WHERE c."parentTaskId" = p."id"), 0),
    "status" = CASE WHEN EXISTS (SELECT 1 FROM "Task" c WHERE c."parentTaskId" = p."id" AND c."status" <> 'COMPLETED') THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
    "description" = 'Accounts — Supplier & Admin work, ' ||
       COALESCE((SELECT to_char(min(c."createdAt"), 'FMDD Mon') || ' – ' || to_char(max(COALESCE(c."completedAt", c."deadline", c."createdAt")), 'FMDD Mon YYYY') FROM "Task" c WHERE c."parentTaskId" = p."id"), '') || '.'
WHERE p."id" = 'ha_accounts_supplier_admin';

-- Rename the rest by function.
UPDATE "Task" SET "title" = 'Accounts — Invoicing & Billing',          "category" = 'Accounts — Invoicing & Billing',          "description" = replace("description", 'Invoicing & Billing work', 'Accounts — Invoicing & Billing work')                   WHERE "id" = 'ha_invoicing_billing';
UPDATE "Task" SET "title" = 'Accounts — Vouchers & Reconciliation',    "category" = 'Accounts — Vouchers & Reconciliation',    "description" = replace("description", 'Vouchers & Reconciliation work', 'Accounts — Vouchers & Reconciliation work')   WHERE "id" = 'ha_vouchers_reconciliation';
UPDATE "Task" SET "title" = 'Accounts — Collections & Follow-ups',     "category" = 'Accounts — Collections & Follow-ups',     "description" = replace("description", 'Collections & Follow-ups work', 'Accounts — Collections & Follow-ups work')     WHERE "id" = 'ha_collections_follow_ups';
UPDATE "Task" SET "title" = 'Maintenance — Gas Reading & Reports',     "category" = 'Maintenance — Gas Reading & Reports',     "description" = replace("description", 'Gas Reading & Reports work', 'Maintenance — Gas Reading & Reports work')       WHERE "id" = 'ha_gas_reading_reports';
UPDATE "Task" SET "title" = 'Maintenance — AMC, Contracts & Portals',  "category" = 'Maintenance — AMC, Contracts & Portals',  "description" = replace("description", 'Contracts & Portals work', 'Maintenance — AMC, Contracts & Portals work')       WHERE "id" = 'ha_contracts_portals';

-- Tags on the daily tasks that still carry the old category name.
UPDATE "Task" SET "category" = 'Accounts — Invoicing & Billing'         WHERE "parentTaskId" = 'ha_invoicing_billing'       AND "category" = 'Invoicing & Billing';
UPDATE "Task" SET "category" = 'Accounts — Vouchers & Reconciliation'   WHERE "parentTaskId" = 'ha_vouchers_reconciliation' AND "category" = 'Vouchers & Reconciliation';
UPDATE "Task" SET "category" = 'Accounts — Collections & Follow-ups'    WHERE "parentTaskId" = 'ha_collections_follow_ups'  AND "category" = 'Collections & Follow-ups';
UPDATE "Task" SET "category" = 'Maintenance — Gas Reading & Reports'    WHERE "parentTaskId" = 'ha_gas_reading_reports'     AND "category" = 'Gas Reading & Reports';
UPDATE "Task" SET "category" = 'Maintenance — AMC, Contracts & Portals' WHERE "parentTaskId" = 'ha_contracts_portals'        AND "category" = 'Contracts & Portals';
UPDATE "Task" SET "category" = 'Accounts — Supplier & Admin'            WHERE "parentTaskId" = 'ha_accounts_supplier_admin' AND ("category" = 'Contracts & Portals' OR "category" IS NULL);

-- KPIs by function, plus one for the maintenance contracts work.
UPDATE "Kpi" SET "name" = 'Accounts — Invoicing & billing completed'      WHERE "id" = 'kpi_acc_ha_0';
UPDATE "Kpi" SET "name" = 'Accounts — Vouchers & reconciliation completed' WHERE "id" = 'kpi_acc_ha_1';
UPDATE "Kpi" SET "name" = 'Accounts — Collections & follow-ups completed'  WHERE "id" = 'kpi_acc_ha_2';
UPDATE "Kpi" SET "name" = 'Maintenance — Gas reading & reports submitted'  WHERE "id" = 'kpi_acc_ha_3';
UPDATE "Kpi" k
SET "name" = 'Accounts — Invoices processed on time'
WHERE k."name" = 'Billing — Invoices processed on time'
  AND k."membershipId" IN (SELECT "assignedToId" FROM "Task" WHERE "id" = 'ha_invoicing_billing');

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT 'kpi_acc_ha_4', p."assignedToId", 'Maintenance — AMC, contracts & portals completed',
       GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM "Task" p
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = 'ha_contracts_portals' AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE p."id" = 'ha_contracts_portals'
ON CONFLICT ("id") DO NOTHING;
