-- LOOTAH JVC (P0672-2021): make its site checklist exactly the standard 70 tasks.
--   * delete the two tasks that are not on the standard list ("Podium Network" 5%, "Final dcd inspection" 1%),
--   * add back the standard tasks that had been removed from it (no weight, 0% progress).
-- Weights are not rebalanced: the project's assigned weight drops by the 6% those two held, to be re-shared by hand.
-- Every other project already has exactly the standard 70 and is not touched.
DELETE FROM "ProjectSiteTask"
WHERE "projectId" IN (
    SELECT p."id" FROM "Project" p JOIN "Company" c ON c."id" = p."companyId"
    WHERE c."slug" = 'flaretechnical' AND p."number" = 'P0672-2021' AND p."type" = 'PROJECT'
  )
  AND lower("title") IN ('podium network', 'final dcd inspection');

INSERT INTO "ProjectSiteTask" ("id", "projectId", "title", "sortOrder", "updatedAt")
SELECT 'st' || md5(p."id" || t.title), p."id", t.title, t.ord, CURRENT_TIMESTAMP
FROM "Project" p
JOIN "Company" c ON c."id" = p."companyId" AND c."slug" = 'flaretechnical'
CROSS JOIN (VALUES
  (1, 'Riser/Dropper Installation'),
  (2, 'Branch Out to Kitchen'),
  (3, 'Kitchen PRDP Installation'),
  (4, 'Kitchen Sensor Fixing'),
  (5, 'Kitchen Cabling'),
  (6, 'Main GD Cabling'),
  (7, 'Roof Piping Works'),
  (8, 'Roof PRDP Fixing'),
  (9, 'Tank Installation'),
  (10, 'Vaporizer Installation'),
  (11, 'Basement Piping'),
  (12, 'Pipe in Pipe Installation'),
  (13, 'Kitchen Final valve Fixing'),
  (14, 'Kitchen Hose Connection'),
  (15, 'Filling Line Liq/Vap Installation'),
  (16, 'Filling Box complete Installation'),
  (17, 'Gas Control Panel Fixing'),
  (18, 'Tank Pressure Testing'),
  (19, 'Hydrotesting of Tank'),
  (20, 'Riser/Dropper Pressure Testing'),
  (21, 'Basement Piping Pressure Testing'),
  (22, 'Roof Piping Pressure Testing'),
  (23, 'Termination to Gas Detectors'),
  (24, 'Termination to Gas Panel'),
  (25, 'Testing of Gas Detectors/Panel'),
  (26, 'Consultant Inspection of Work'),
  (27, 'Manifold Installation'),
  (28, 'First Stage PRDP Installation'),
  (29, 'PRMS Installation'),
  (30, 'Connection to Solenoid Valve/Detector'),
  (31, 'Tapping/Hook up from Main Line'),
  (32, 'HDPE Pipe Laying'),
  (33, 'Copper Pipe Works'),
  (34, 'Final Testing & Commissioning'),
  (35, 'Pipe Supports – Installation'),
  (36, 'Pipe Sleeves – Installation'),
  (37, 'Piping – Painting & Identification'),
  (38, 'Kitchen Gas Detector – Termination'),
  (39, 'Kitchen Gas System – Testing'),
  (40, 'LPG Tank – Earthing Connection'),
  (41, 'LPG Tank – Level Gauge Installation'),
  (42, 'LPG Tank – Safety Valve Installation'),
  (43, 'Filling System – Pressure & Leak Testing'),
  (44, 'Vaporizer – Piping Connection'),
  (45, 'Vaporizer – Electrical Connection'),
  (46, 'Vaporizer – Testing'),
  (47, 'PRMS – Piping Connection'),
  (48, 'PRMS – Electrical/Signal Connection'),
  (49, 'PRMS – Testing & Functional Check'),
  (50, 'Manifold – Piping Connection'),
  (51, 'Manifold – Pressure & Leak Testing'),
  (52, 'Fire Alarm Panel – Interface'),
  (53, 'Gas Detection Interlock – Testing'),
  (54, 'Main Gas Line – Final Hook-Up'),
  (55, 'Hook-Up – Leak Testing'),
  (56, 'Complete System – Pressure Testing'),
  (57, 'Complete System – Leak Testing'),
  (58, 'Complete System – Purging'),
  (59, 'Emergency Shut-Off System – Testing'),
  (60, 'Complete System – Interlock Testing'),
  (61, 'System – First Gas Filling / Gas Charging'),
  (62, 'Internal QA/QC Inspection'),
  (63, 'Service Provider Inspection'),
  (64, 'Civil Defense Inspection'),
  (65, 'Snag Rectification & Reinspection'),
  (66, 'Testing & Commissioning Reports'),
  (67, 'As-Built Drawings'),
  (68, 'O&M Manuals'),
  (69, 'Client/Operator Training'),
  (70, 'Final Handover')
) AS t(ord, title)
WHERE p."number" = 'P0672-2021' AND p."type" = 'PROJECT'
  AND NOT EXISTS (
    SELECT 1 FROM "ProjectSiteTask" x WHERE x."projectId" = p."id" AND lower(x."title") = lower(t.title)
  )
ON CONFLICT ("id") DO NOTHING;
