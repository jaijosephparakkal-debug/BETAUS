-- Jai's title is "Creative Content Manager" everywhere (it showed "Marketing & Content Manager" and "Admin").
UPDATE "Membership" m
SET "title" = 'Creative Content Manager'
FROM "User" u
WHERE u."id" = m."userId" AND lower(u."email") = 'jai@gasneeds.com';
