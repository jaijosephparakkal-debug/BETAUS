-- Jai: the MOOKEN catalogue redesign was approved and has gone for print. Final log on the merged task,
-- kept on Friday 30 Oct so the task still reads completed that day. Safe to re-run.
INSERT INTO "TaskComment" ("id","taskId","authorId","body","progressAt","createdAt")
SELECT 'jwn06mookprint', 'jwn04mookenredesign', (SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId" JOIN "Company" c ON c."id" = m."companyId" WHERE u."email" = 'jai@gasneeds.com' AND c."slug" = 'gasneeds'), 'Approved and sent for print; design completed.', 100, '2026-10-30 18:30:00'
WHERE EXISTS (SELECT 1 FROM "Task" WHERE "id" = 'jwn04mookenredesign')
ON CONFLICT ("id") DO NOTHING;
