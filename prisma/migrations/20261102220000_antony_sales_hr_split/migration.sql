-- Antony handles Sales, HR and PRO work: separate them by function. Pure renames of his category tasks
-- (same ids and same daily tasks underneath) plus one task moved. Nothing is deleted.

-- The van-branding coordination task is admin/PRO, not HR: move it under the PRO category first.
UPDATE "Task" t
SET "parentTaskId" = 'an_pro_government_work'
WHERE t."parentTaskId" = 'an_hr_admin'
  AND upper(t."title") LIKE 'COORDINATE MAXUS VAN BRANDING%'
  AND EXISTS (SELECT 1 FROM "Task" p WHERE p."id" = 'an_pro_government_work');

-- Rename the category tasks (title, category tag, description) and the tag on their daily tasks.
UPDATE "Task" SET "title" = 'Sales — Quotations',        "category" = 'Sales — Quotations',        "description" = replace("description", 'Quotations & Sales work', 'Sales — Quotations work')              WHERE "id" = 'an_quotations_sales';
UPDATE "Task" SET "title" = 'Sales — Customer Visits',   "category" = 'Sales — Customer Visits',   "description" = replace("description", 'Customer Visits work', 'Sales — Customer Visits work')            WHERE "id" = 'an_customer_visits';
UPDATE "Task" SET "title" = 'Sales — Follow-ups',        "category" = 'Sales — Follow-ups',        "description" = replace("description", 'Follow-ups & Coordination work', 'Sales — Follow-ups work')       WHERE "id" = 'an_follow_ups_coordination';
UPDATE "Task" SET "title" = 'HR — Staff & Insurance',    "category" = 'HR — Staff & Insurance',    "description" = replace("description", 'HR & Admin work', 'HR — Staff & Insurance work')                  WHERE "id" = 'an_hr_admin';
UPDATE "Task" SET "title" = 'PRO — Government & Admin',  "category" = 'PRO — Government & Admin',  "description" = replace("description", 'PRO & Government Work work', 'PRO — Government & Admin work')      WHERE "id" = 'an_pro_government_work';

UPDATE "Task" SET "category" = 'Sales — Quotations'       WHERE "parentTaskId" = 'an_quotations_sales'        AND "category" IN ('Quotations & Sales');
UPDATE "Task" SET "category" = 'Sales — Customer Visits'  WHERE "parentTaskId" = 'an_customer_visits'        AND "category" IN ('Customer Visits');
UPDATE "Task" SET "category" = 'Sales — Follow-ups'       WHERE "parentTaskId" = 'an_follow_ups_coordination' AND "category" IN ('Follow-ups & Coordination');
UPDATE "Task" SET "category" = 'HR — Staff & Insurance'   WHERE "parentTaskId" = 'an_hr_admin'               AND "category" IN ('HR & Admin');
UPDATE "Task" SET "category" = 'PRO — Government & Admin' WHERE "parentTaskId" = 'an_pro_government_work'    AND "category" IN ('PRO & Government Work', 'HR & Admin');

-- KPIs: PRO gets its own section and HR gets one (completions since 1 Oct, target about twice that, minimum 4).
UPDATE "Kpi" SET "name" = 'PRO — Government work completed' WHERE "id" = 'kpi_ant_pro_q4';

INSERT INTO "Kpi" ("id", "membershipId", "name", "target", "current", "unit", "period", "createdAt", "updatedAt")
SELECT 'kpi_ant_hr_q4', m."id", 'HR — HR tasks completed this quarter',
       GREATEST(2 * x.cnt, 4), x.cnt, NULL, 'Q4 2026', NOW(), NOW()
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
JOIN "Company" c ON c."id" = m."companyId"
CROSS JOIN LATERAL (
  SELECT count(*) AS cnt FROM "Task" t
  WHERE t."assignedToId" = m."id" AND t."status" = 'COMPLETED' AND t."completedAt" >= '2026-10-01'
    AND (upper(t."title") = 'HR WORK' OR upper(t."title") = 'MEDICAL INSURANCE RENEWAL')
) x
WHERE lower(u."email") = 'sales@gasneeds.com' AND c."slug" = 'gasneeds'
ON CONFLICT ("id") DO NOTHING;
