-- Accounts team (Hashim, Shafeek, Jintu): same structure as Jai's profile.
--   * each person's tasks regrouped under category tasks (their existing tasks become the "daily tasks"),
--   * KPIs in sections: the existing KPI is kept (renamed) and one count KPI per main category is added from
--     real Q4 completions (since 1 Oct 2026); targets about twice the quarter-to-date count, minimum 4.
-- Only where each task sits (parentTaskId) and, when empty, its category tag change. Titles, statuses,
-- dates, updates and attendance are not touched. Tasks whose title is not listed stay where they are.
-- To undo: set parentTaskId back to NULL on their tasks and delete rows with ids starting 'ha_', 'sh_', 'ji_'
-- (and KPIs whose id starts with 'kpi_acc_').

-- ===== Hashim =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'accounts@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('INVOICE GENRATION', 'Invoicing & Billing'),
         ('INVOICE GENERATION', 'Invoicing & Billing'),
         ('INVOICE', 'Invoicing & Billing'),
         ('TAX INVOICE%', 'Invoicing & Billing'),
         ('PO PENDING UPDATION', 'Invoicing & Billing'),
         ('VILLANOVA PENDING PO', 'Invoicing & Billing'),
         ('EXPENSE VOUCHERS', 'Vouchers & Reconciliation'),
         ('RECIPT VOUCHERS', 'Vouchers & Reconciliation'),
         ('BANK RECONCILE', 'Vouchers & Reconciliation'),
         ('CREDIT CARD RECONCILE', 'Vouchers & Reconciliation'),
         ('EIB CREDIT CARD RECONCILE', 'Vouchers & Reconciliation'),
         ('RECONICILE WITH POS%', 'Vouchers & Reconciliation'),
         ('CHEQUE PREPARATION', 'Vouchers & Reconciliation'),
         ('DEWA BILL', 'Vouchers & Reconciliation'),
         ('PAYMENT FOLLOW UP', 'Collections & Follow-ups'),
         ('FOLLOW UP', 'Collections & Follow-ups'),
         ('305-AL AWADHI%', 'Collections & Follow-ups'),
         ('FALAFEL%', 'Collections & Follow-ups'),
         ('SECURITY DEPOSIT REFUND', 'Collections & Follow-ups'),
         ('REBATE CALCULATION', 'Collections & Follow-ups'),
         ('REBATE CHEQUE DEPOSIT', 'Collections & Follow-ups'),
         ('PRIME LINK%', 'Collections & Follow-ups'),
         ('GAS READING%', 'Gas Reading & Reports'),
         ('SUMMURY REPORT%', 'Gas Reading & Reports'),
         ('DETAILED REPORT%', 'Gas Reading & Reports'),
         ('REPORT FOR DETAIL%', 'Gas Reading & Reports'),
         ('PPM REPORTS%', 'Gas Reading & Reports'),
         ('AMC RENEWAL CONTRACT', 'Contracts & Portals'),
         ('NEW CONTRACT PREPARATIONS', 'Contracts & Portals'),
         ('PORTAL UPDATION', 'Contracts & Portals'),
         ('KHAN SAHEB%', 'Contracts & Portals'),
         ('DCD ATTESTAION', 'Contracts & Portals'),
         ('DCD ATTESTATION', 'Contracts & Portals'),
         ('LEARN DCD%', 'Contracts & Portals'),
         ('FULLFILL ASSET REGISTER', 'Contracts & Portals'),
         ('WAREHOUSE INSURANCE UPDATION', 'Contracts & Portals'),
         ('CALLS IN', 'Calls & Emails'),
         ('CALLS OUT', 'Calls & Emails'),
         ('EMAILS ATTENDED', 'Calls & Emails'),
         ('ASSIST WITH SHAFEEK SIR', 'Calls & Emails'),
         ('MARKETING CAMPAIGN%', 'Calls & Emails')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t
  JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'ha\_%'
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
SELECT 'ha_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')),
       who.cid,
       agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid,
       coalesce(who.boss, who.mid),
       agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
       agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END,
       agg.first_at,
       NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'accounts@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('INVOICE GENRATION', 'Invoicing & Billing'),
         ('INVOICE GENERATION', 'Invoicing & Billing'),
         ('INVOICE', 'Invoicing & Billing'),
         ('TAX INVOICE%', 'Invoicing & Billing'),
         ('PO PENDING UPDATION', 'Invoicing & Billing'),
         ('VILLANOVA PENDING PO', 'Invoicing & Billing'),
         ('EXPENSE VOUCHERS', 'Vouchers & Reconciliation'),
         ('RECIPT VOUCHERS', 'Vouchers & Reconciliation'),
         ('BANK RECONCILE', 'Vouchers & Reconciliation'),
         ('CREDIT CARD RECONCILE', 'Vouchers & Reconciliation'),
         ('EIB CREDIT CARD RECONCILE', 'Vouchers & Reconciliation'),
         ('RECONICILE WITH POS%', 'Vouchers & Reconciliation'),
         ('CHEQUE PREPARATION', 'Vouchers & Reconciliation'),
         ('DEWA BILL', 'Vouchers & Reconciliation'),
         ('PAYMENT FOLLOW UP', 'Collections & Follow-ups'),
         ('FOLLOW UP', 'Collections & Follow-ups'),
         ('305-AL AWADHI%', 'Collections & Follow-ups'),
         ('FALAFEL%', 'Collections & Follow-ups'),
         ('SECURITY DEPOSIT REFUND', 'Collections & Follow-ups'),
         ('REBATE CALCULATION', 'Collections & Follow-ups'),
         ('REBATE CHEQUE DEPOSIT', 'Collections & Follow-ups'),
         ('PRIME LINK%', 'Collections & Follow-ups'),
         ('GAS READING%', 'Gas Reading & Reports'),
         ('SUMMURY REPORT%', 'Gas Reading & Reports'),
         ('DETAILED REPORT%', 'Gas Reading & Reports'),
         ('REPORT FOR DETAIL%', 'Gas Reading & Reports'),
         ('PPM REPORTS%', 'Gas Reading & Reports'),
         ('AMC RENEWAL CONTRACT', 'Contracts & Portals'),
         ('NEW CONTRACT PREPARATIONS', 'Contracts & Portals'),
         ('PORTAL UPDATION', 'Contracts & Portals'),
         ('KHAN SAHEB%', 'Contracts & Portals'),
         ('DCD ATTESTAION', 'Contracts & Portals'),
         ('DCD ATTESTATION', 'Contracts & Portals'),
         ('LEARN DCD%', 'Contracts & Portals'),
         ('FULLFILL ASSET REGISTER', 'Contracts & Portals'),
         ('WAREHOUSE INSURANCE UPDATION', 'Contracts & Portals'),
         ('CALLS IN', 'Calls & Emails'),
         ('CALLS OUT', 'Calls & Emails'),
         ('EMAILS ATTENDED', 'Calls & Emails'),
         ('ASSIST WITH SHAFEEK SIR', 'Calls & Emails'),
         ('MARKETING CAMPAIGN%', 'Calls & Emails')
)
UPDATE "Task" t
SET "parentTaskId" = 'ha_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid
  AND t."parentTaskId" IS NULL
  AND t."id" NOT LIKE 'ha\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'ha_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Billing — Invoices processed on time'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'accounts@flaretechnical.com' AND c."slug" = 'flaretechnical'
  AND k."name" = 'Invoices Processed On Time';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, m."id", v.name,
       GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
JOIN "Company" c ON c."id" = m."companyId"
CROSS JOIN (VALUES
  ('kpi_acc_ha_0', 'Billing — Invoicing & billing completed', 'ha_invoicing_billing'),
  ('kpi_acc_ha_1', 'Accounts — Vouchers & reconciliation completed', 'ha_vouchers_reconciliation'),
  ('kpi_acc_ha_2', 'Collections — Collections & follow-ups completed', 'ha_collections_follow_ups'),
  ('kpi_acc_ha_3', 'Reports — Gas reading & reports submitted', 'ha_gas_reading_reports')
) AS v(id, name, parent_id)
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE lower(u."email") = 'accounts@flaretechnical.com' AND c."slug" = 'flaretechnical'
ON CONFLICT ("id") DO NOTHING;

-- ===== Shafeek =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'finance@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('BANK RECONCILIATION%', 'Banking & Cash'),
         ('CHEQUE PREPARATION FOR SUPPLIERS', 'Banking & Cash'),
         ('PETTY CASH MANAGEMENT', 'Banking & Cash'),
         ('INTERNATIONAL TRANSFER', 'Banking & Cash'),
         ('CREDIT CARDS STATEMENT%', 'Banking & Cash'),
         ('ACCOUNTS RECEIVABLE%', 'Receivables & Collections'),
         ('FALAFEL%', 'Receivables & Collections'),
         ('PAYMENT COLLECTION%', 'Receivables & Collections'),
         ('SECURITY DEPOSIT REFUND%', 'Receivables & Collections'),
         ('PAYROLL%', 'Payroll & Staff Payments'),
         ('SALARY POSTING%', 'Payroll & Staff Payments'),
         ('OT PREPARATION%', 'Payroll & Staff Payments'),
         ('LEAVE SALARY AND AIR TICKET%', 'Payroll & Staff Payments'),
         ('ADITYA FINAL SETTLEMENT%', 'Payroll & Staff Payments'),
         ('EMPLOYEE PERFORMANCE REPORT%', 'Payroll & Staff Payments'),
         ('CORPORATE TAX RETURN%', 'Tax, VAT & Compliance'),
         ('VAT RETURN%', 'Tax, VAT & Compliance'),
         ('PROFESSIONAL INDEMNITY%', 'Tax, VAT & Compliance'),
         ('ADJUSTMENT ENTRIES%', 'Reports & Adjustments'),
         ('EXPENSE TRANSACTION%', 'Reports & Adjustments'),
         ('PREPARATION AND SUBMISSION OF FINANCIAL REPORT', 'Reports & Adjustments'),
         ('PROJECT P&L PREPARATION', 'Reports & Adjustments'),
         ('IMPORT CONSOLIDATED REPORT%', 'Reports & Adjustments'),
         ('MEETING WITH ABRAHAM SIR', 'Meetings & Admin'),
         ('TEAM MEETING', 'Meetings & Admin'),
         ('WEEKLY MEETING%', 'Meetings & Admin'),
         ('GPS UPDATION%', 'Meetings & Admin'),
         ('RFID%', 'Meetings & Admin')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t
  JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'sh\_%'
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
SELECT 'sh_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')),
       who.cid,
       agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid,
       coalesce(who.boss, who.mid),
       agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
       agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END,
       agg.first_at,
       NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'finance@flaretechnical.com' AND c."slug" = 'flaretechnical'
),
mapping(k, cat) AS (
  VALUES ('BANK RECONCILIATION%', 'Banking & Cash'),
         ('CHEQUE PREPARATION FOR SUPPLIERS', 'Banking & Cash'),
         ('PETTY CASH MANAGEMENT', 'Banking & Cash'),
         ('INTERNATIONAL TRANSFER', 'Banking & Cash'),
         ('CREDIT CARDS STATEMENT%', 'Banking & Cash'),
         ('ACCOUNTS RECEIVABLE%', 'Receivables & Collections'),
         ('FALAFEL%', 'Receivables & Collections'),
         ('PAYMENT COLLECTION%', 'Receivables & Collections'),
         ('SECURITY DEPOSIT REFUND%', 'Receivables & Collections'),
         ('PAYROLL%', 'Payroll & Staff Payments'),
         ('SALARY POSTING%', 'Payroll & Staff Payments'),
         ('OT PREPARATION%', 'Payroll & Staff Payments'),
         ('LEAVE SALARY AND AIR TICKET%', 'Payroll & Staff Payments'),
         ('ADITYA FINAL SETTLEMENT%', 'Payroll & Staff Payments'),
         ('EMPLOYEE PERFORMANCE REPORT%', 'Payroll & Staff Payments'),
         ('CORPORATE TAX RETURN%', 'Tax, VAT & Compliance'),
         ('VAT RETURN%', 'Tax, VAT & Compliance'),
         ('PROFESSIONAL INDEMNITY%', 'Tax, VAT & Compliance'),
         ('ADJUSTMENT ENTRIES%', 'Reports & Adjustments'),
         ('EXPENSE TRANSACTION%', 'Reports & Adjustments'),
         ('PREPARATION AND SUBMISSION OF FINANCIAL REPORT', 'Reports & Adjustments'),
         ('PROJECT P&L PREPARATION', 'Reports & Adjustments'),
         ('IMPORT CONSOLIDATED REPORT%', 'Reports & Adjustments'),
         ('MEETING WITH ABRAHAM SIR', 'Meetings & Admin'),
         ('TEAM MEETING', 'Meetings & Admin'),
         ('WEEKLY MEETING%', 'Meetings & Admin'),
         ('GPS UPDATION%', 'Meetings & Admin'),
         ('RFID%', 'Meetings & Admin')
)
UPDATE "Task" t
SET "parentTaskId" = 'sh_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid
  AND t."parentTaskId" IS NULL
  AND t."id" NOT LIKE 'sh\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'sh_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Accuracy — Invoice accuracy'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'finance@flaretechnical.com' AND c."slug" = 'flaretechnical'
  AND k."name" = 'Invoice Accuracy';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, m."id", v.name,
       GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
JOIN "Company" c ON c."id" = m."companyId"
CROSS JOIN (VALUES
  ('kpi_acc_sh_0', 'Banking — Banking & cash tasks completed', 'sh_banking_cash'),
  ('kpi_acc_sh_1', 'Payroll — Payroll & staff payments completed', 'sh_payroll_staff_payments'),
  ('kpi_acc_sh_2', 'Compliance — Tax, VAT & filings completed', 'sh_tax_vat_compliance'),
  ('kpi_acc_sh_3', 'Reports — Reports & adjustments completed', 'sh_reports_adjustments')
) AS v(id, name, parent_id)
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE lower(u."email") = 'finance@flaretechnical.com' AND c."slug" = 'flaretechnical'
ON CONFLICT ("id") DO NOTHING;

-- ===== Jintu =====

WITH who AS (
  SELECT m."id" AS mid, m."companyId" AS cid, m."managerId" AS boss
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'accounts@gasneeds.com' AND c."slug" = 'gasneeds'
),
mapping(k, cat) AS (
  VALUES ('PAYMENT ENTRIES%', 'Payments & Receipts'),
         ('PAYMENTS%INTERNATIONAL & LOCAL', 'Payments & Receipts'),
         ('INTERNATIONAL PAYMENTS', 'Payments & Receipts'),
         ('LOCAL PAYMENTS', 'Payments & Receipts'),
         ('VENDOR PAYMENTS MADE ENTRY', 'Payments & Receipts'),
         ('INVOICE PAYMENT RECEIVED%', 'Payments & Receipts'),
         ('PAYMENT RECEIVED%', 'Payments & Receipts'),
         ('BENEFICIARY ADDING', 'Payments & Receipts'),
         ('PAYMENT LINK CREATED', 'Payments & Receipts'),
         ('FTS SECURITY REFUND%', 'Payments & Receipts'),
         ('CHEQUE%CASH COLLECTION', 'Cheques, Cash & Banking'),
         ('CHEQUE COLLECTION', 'Cheques, Cash & Banking'),
         ('CHEQUE DEPOSIT', 'Cheques, Cash & Banking'),
         ('CHEQUE DEPOSITS', 'Cheques, Cash & Banking'),
         ('CASH DEPOSIT', 'Cheques, Cash & Banking'),
         ('PETTY CASH DEPOSIT', 'Cheques, Cash & Banking'),
         ('BANK RECONCILIATION%', 'Cheques, Cash & Banking'),
         ('GEIDEA POS%', 'Cheques, Cash & Banking'),
         ('BILLS POSTING', 'Bills & Books'),
         ('INVENTORY ADJUSTMENTS', 'Bills & Books'),
         ('NEW VENDOR & CUSTOMER CREATION', 'Bills & Books'),
         ('NEW VENDOR CREATION', 'Bills & Books'),
         ('SHOPIFY PRODUCT CREATION', 'Bills & Books'),
         ('DOCUMENTATION', 'Bills & Books'),
         ('DOCUMENTATION & RECORD MAINTENANCE', 'Bills & Books'),
         ('REPORTS', 'Bills & Books'),
         ('PAYROLL', 'Bills & Books'),
         ('FOLLOW-UP%', 'Receivables Follow-up'),
         ('CUSTOMER RECEIVABLES FOLLOW UP STATUS', 'Receivables Follow-up'),
         ('EMAIL FOLLOW UP%', 'Receivables Follow-up'),
         ('CALLS OUT', 'Receivables Follow-up'),
         ('EMAILS ATTENDED', 'Receivables Follow-up'),
         ('EMAILS', 'Receivables Follow-up'),
         ('MATERIAL PRICE TAKEN%', 'Procurement Support'),
         ('OFFER TAKEN%', 'Procurement Support'),
         ('QUOTATION PREPARED', 'Procurement Support'),
         ('TRACKING MATERIAL%', 'Procurement Support'),
         ('DELIVERY STATUS FOR DOGUMAK%', 'Procurement Support')
),
work AS (
  SELECT t."createdAt", t."status", t."progress", t."completedAt", t."deadline", mp.cat
  FROM "Task" t
  JOIN who ON t."assignedToId" = who.mid
  JOIN mapping mp ON upper(t."title") LIKE upper(mp.k)
  WHERE t."parentTaskId" IS NULL AND t."id" NOT LIKE 'ji\_%'
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
SELECT 'ji_' || lower(regexp_replace(agg.cat, '[^a-zA-Z]+', '_', 'g')),
       who.cid,
       agg.cat,
       agg.cat || ' work, ' || to_char(agg.first_at, 'FMDD Mon') || ' – ' || to_char(agg.last_at, 'FMDD Mon YYYY') || '.',
       who.mid,
       coalesce(who.boss, who.mid),
       agg.cat,
       CASE WHEN agg.open_n > 0 THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
       agg.prog,
       CASE WHEN agg.open_n = 0 THEN agg.done_at END,
       agg.first_at,
       NOW()
FROM agg CROSS JOIN who
ON CONFLICT ("id") DO NOTHING;

WITH who AS (
  SELECT m."id" AS mid
  FROM "Membership" m
  JOIN "User" u ON u."id" = m."userId"
  JOIN "Company" c ON c."id" = m."companyId"
  WHERE lower(u."email") = 'accounts@gasneeds.com' AND c."slug" = 'gasneeds'
),
mapping(k, cat) AS (
  VALUES ('PAYMENT ENTRIES%', 'Payments & Receipts'),
         ('PAYMENTS%INTERNATIONAL & LOCAL', 'Payments & Receipts'),
         ('INTERNATIONAL PAYMENTS', 'Payments & Receipts'),
         ('LOCAL PAYMENTS', 'Payments & Receipts'),
         ('VENDOR PAYMENTS MADE ENTRY', 'Payments & Receipts'),
         ('INVOICE PAYMENT RECEIVED%', 'Payments & Receipts'),
         ('PAYMENT RECEIVED%', 'Payments & Receipts'),
         ('BENEFICIARY ADDING', 'Payments & Receipts'),
         ('PAYMENT LINK CREATED', 'Payments & Receipts'),
         ('FTS SECURITY REFUND%', 'Payments & Receipts'),
         ('CHEQUE%CASH COLLECTION', 'Cheques, Cash & Banking'),
         ('CHEQUE COLLECTION', 'Cheques, Cash & Banking'),
         ('CHEQUE DEPOSIT', 'Cheques, Cash & Banking'),
         ('CHEQUE DEPOSITS', 'Cheques, Cash & Banking'),
         ('CASH DEPOSIT', 'Cheques, Cash & Banking'),
         ('PETTY CASH DEPOSIT', 'Cheques, Cash & Banking'),
         ('BANK RECONCILIATION%', 'Cheques, Cash & Banking'),
         ('GEIDEA POS%', 'Cheques, Cash & Banking'),
         ('BILLS POSTING', 'Bills & Books'),
         ('INVENTORY ADJUSTMENTS', 'Bills & Books'),
         ('NEW VENDOR & CUSTOMER CREATION', 'Bills & Books'),
         ('NEW VENDOR CREATION', 'Bills & Books'),
         ('SHOPIFY PRODUCT CREATION', 'Bills & Books'),
         ('DOCUMENTATION', 'Bills & Books'),
         ('DOCUMENTATION & RECORD MAINTENANCE', 'Bills & Books'),
         ('REPORTS', 'Bills & Books'),
         ('PAYROLL', 'Bills & Books'),
         ('FOLLOW-UP%', 'Receivables Follow-up'),
         ('CUSTOMER RECEIVABLES FOLLOW UP STATUS', 'Receivables Follow-up'),
         ('EMAIL FOLLOW UP%', 'Receivables Follow-up'),
         ('CALLS OUT', 'Receivables Follow-up'),
         ('EMAILS ATTENDED', 'Receivables Follow-up'),
         ('EMAILS', 'Receivables Follow-up'),
         ('MATERIAL PRICE TAKEN%', 'Procurement Support'),
         ('OFFER TAKEN%', 'Procurement Support'),
         ('QUOTATION PREPARED', 'Procurement Support'),
         ('TRACKING MATERIAL%', 'Procurement Support'),
         ('DELIVERY STATUS FOR DOGUMAK%', 'Procurement Support')
)
UPDATE "Task" t
SET "parentTaskId" = 'ji_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')),
    "category" = coalesce(t."category", mp.cat)
FROM who, mapping mp
WHERE t."assignedToId" = who.mid
  AND t."parentTaskId" IS NULL
  AND t."id" NOT LIKE 'ji\_%'
  AND upper(t."title") LIKE upper(mp.k)
  AND EXISTS (SELECT 1 FROM "Task" x WHERE x."id" = 'ji_' || lower(regexp_replace(mp.cat, '[^a-zA-Z]+', '_', 'g')));

UPDATE "Kpi" k
SET "name" = 'Accuracy — Invoice accuracy'
FROM "Membership" m, "User" u, "Company" c
WHERE k."membershipId" = m."id" AND u."id" = m."userId" AND c."id" = m."companyId"
  AND lower(u."email") = 'accounts@gasneeds.com' AND c."slug" = 'gasneeds'
  AND k."name" = 'Invoice Accuracy';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT v.id, m."id", v.name,
       GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
JOIN "Company" c ON c."id" = m."companyId"
CROSS JOIN (VALUES
  ('kpi_acc_ji_0', 'Payments — Payments & receipts completed', 'ji_payments_receipts'),
  ('kpi_acc_ji_1', 'Banking — Cheques, cash & banking completed', 'ji_cheques_cash_banking'),
  ('kpi_acc_ji_2', 'Books — Bills & records completed', 'ji_bills_books'),
  ('kpi_acc_ji_3', 'Receivables — Follow-ups completed', 'ji_receivables_follow_up')
) AS v(id, name, parent_id)
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."parentTaskId" = v.parent_id AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
) x
WHERE lower(u."email") = 'accounts@gasneeds.com' AND c."slug" = 'gasneeds'
ON CONFLICT ("id") DO NOTHING;
