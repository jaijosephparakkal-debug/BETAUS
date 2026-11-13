-- Hashim's security deposit refund entries logged as "Accounts entry / Other" (12-13 Nov) belong with his other refund work
-- under Collections & Follow-ups, not Vouchers & Reconciliation.
UPDATE "Task" t
SET "parentTaskId" = 'ha_collections_follow_ups',
    "category" = 'Accounts — Collections & Follow-ups'
FROM "Task" p
WHERE t."parentTaskId" = p."id"
  AND p."title" = 'Accounts — Vouchers & Reconciliation'
  AND t."assignedToId" IN (
    SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" WHERE lower(u."email") = 'accounts@flaretechnical.com'
  )
  AND t."logKind" IS NOT NULL
  AND (t."description" ILIKE '%security deposit refund%' OR t."details"::text ILIKE '%security deposit refund%')
  AND EXISTS (SELECT 1 FROM "Task" c WHERE c."id" = 'ha_collections_follow_ups');
