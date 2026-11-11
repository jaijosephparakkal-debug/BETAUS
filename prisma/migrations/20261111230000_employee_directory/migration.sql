-- Employee lists from the Employee ID Directory (5 Nov 2026), by the company on each person's visa:
-- Flare Technical FT001-FT051 and Gas Needs GN001-GN004 (53 people; the "Maintenance Manager" post is not a person and is left out).
-- Replaces the starter list that was copied from the app's staff. Employees added by hand in the form are kept.
DELETE FROM "Employee" WHERE "id" LIKE 'emp\_%';

INSERT INTO "Employee" ("id", "companyId", "name")
SELECT d.id, c."id", d.name
FROM (VALUES
  ('empdir_FT001', 'flaretechnical', 'FT001 · Ramesh Purushothaman'),
  ('empdir_FT002', 'flaretechnical', 'FT002 · Santhosh Kumar'),
  ('empdir_FT003', 'flaretechnical', 'FT003 · Muneshwar Manjhi'),
  ('empdir_FT004', 'flaretechnical', 'FT004 · Javed Ahamad Belal Ahamad'),
  ('empdir_FT005', 'flaretechnical', 'FT005 · Sandip Kumar Nand Lal Vishwakarma'),
  ('empdir_FT006', 'flaretechnical', 'FT006 · Jomon Jacob Kuiriacko Chacko'),
  ('empdir_FT007', 'flaretechnical', 'FT007 · Atif Ali'),
  ('empdir_FT008', 'flaretechnical', 'FT008 · Jaseem Khan'),
  ('empdir_FT009', 'flaretechnical', 'FT009 · Hamid Farooq Anwar'),
  ('empdir_FT010', 'flaretechnical', 'FT010 · Sajan Karunakaran'),
  ('empdir_FT011', 'flaretechnical', 'FT011 · Ganesh Madhusudhanan Pillai'),
  ('empdir_FT012', 'flaretechnical', 'FT012 · Mohd Ikalak Ahmad'),
  ('empdir_FT013', 'flaretechnical', 'FT013 · Ajay Kumar Manjhi'),
  ('empdir_FT014', 'flaretechnical', 'FT014 · Christine Yesudas'),
  ('empdir_FT015', 'flaretechnical', 'FT015 · Mohd Kaif Rashid Khan'),
  ('empdir_FT016', 'flaretechnical', 'FT016 · Brij Narayan Yadav'),
  ('empdir_FT017', 'flaretechnical', 'FT017 · Binu Joseph'),
  ('empdir_FT018', 'flaretechnical', 'FT018 · Vipin Yadav Rambhawan Yadav'),
  ('empdir_FT019', 'flaretechnical', 'FT019 · Jayan Kochu Kochu Cheria'),
  ('empdir_FT020', 'flaretechnical', 'FT020 · Vijayakumar Kuttan Pillai'),
  ('empdir_FT021', 'flaretechnical', 'FT021 · Pradip Prasad Basant Prasad'),
  ('empdir_FT022', 'flaretechnical', 'FT022 · Ajo John John Kalampukattu'),
  ('empdir_FT023', 'flaretechnical', 'FT023 · Binod Palliyude Kizhakkethil'),
  ('empdir_FT024', 'flaretechnical', 'FT024 · Unni Chithrakudam'),
  ('empdir_FT025', 'flaretechnical', 'FT025 · Saikumar'),
  ('empdir_FT026', 'flaretechnical', 'FT026 · Abdul Wahab'),
  ('empdir_FT027', 'flaretechnical', 'FT027 · Imran'),
  ('empdir_FT028', 'flaretechnical', 'FT028 · Sajju Khan'),
  ('empdir_FT029', 'flaretechnical', 'FT029 · Edwin Saji'),
  ('empdir_FT030', 'flaretechnical', 'FT030 · Muhammad Asif Mubarik Ali'),
  ('empdir_FT031', 'flaretechnical', 'FT031 · Juheb Khan'),
  ('empdir_FT032', 'flaretechnical', 'FT032 · Shibu Gopalakrishna'),
  ('empdir_FT033', 'flaretechnical', 'FT033 · Stuvett Jos'),
  ('empdir_FT034', 'flaretechnical', 'FT034 · Ajal Thomas'),
  ('empdir_FT035', 'flaretechnical', 'FT035 · Jibin Joy'),
  ('empdir_FT036', 'flaretechnical', 'FT036 · Sumith Soman'),
  ('empdir_FT037', 'flaretechnical', 'FT037 · Sadab Khan'),
  ('empdir_FT039', 'flaretechnical', 'FT039 · Shafeek'),
  ('empdir_FT040', 'flaretechnical', 'FT040 · Hashim'),
  ('empdir_FT041', 'flaretechnical', 'FT041 · Ram'),
  ('empdir_FT042', 'flaretechnical', 'FT042 · Jiyad'),
  ('empdir_FT043', 'flaretechnical', 'FT043 · Simi'),
  ('empdir_FT044', 'flaretechnical', 'FT044 · Mamidi'),
  ('empdir_FT045', 'flaretechnical', 'FT045 · Saroj'),
  ('empdir_FT046', 'flaretechnical', 'FT046 · Mohammed Jashim'),
  ('empdir_FT048', 'flaretechnical', 'FT048 · Jayaprakash'),
  ('empdir_FT049', 'flaretechnical', 'FT049 · Flexie'),
  ('empdir_FT050', 'flaretechnical', 'FT050 · Antony'),
  ('empdir_FT051', 'flaretechnical', 'FT051 · Manu Johny'),
  ('empdir_GN001', 'gasneeds', 'GN001 · Vishal Kumar'),
  ('empdir_GN002', 'gasneeds', 'GN002 · Jintu Tom'),
  ('empdir_GN003', 'gasneeds', 'GN003 · Jai Joseph Parakkal'),
  ('empdir_GN004', 'gasneeds', 'GN004 · Bhadarudhin')
) AS d(id, slug, name)
JOIN "Company" c ON c."slug" = d.slug
ON CONFLICT DO NOTHING;
