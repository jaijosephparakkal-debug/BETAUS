-- Adds the 36 activities from "Activity of Works.xlsx" that the original 34
-- site tasks didn't already cover, to every existing Flaretech project
-- (type PROJECT). Existing tasks, weights and progress are untouched; a task
-- already on a project under the same name (any case) is skipped. New
-- items go after the original 34 (sortOrder 35-70), weight empty.
INSERT INTO "ProjectSiteTask" ("id", "projectId", "title", "sortOrder", "updatedAt")
SELECT 'st' || md5(p."id" || t.title), p."id", t.title, t.ord, CURRENT_TIMESTAMP
FROM "Project" p
JOIN "Company" c ON c."id" = p."companyId" AND c."slug" = 'flaretechnical'
CROSS JOIN (VALUES
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
WHERE p."type" = 'PROJECT'
  AND NOT EXISTS (
    SELECT 1 FROM "ProjectSiteTask" s
    WHERE s."projectId" = p."id" AND lower(s."title") = lower(t.title)
  );
