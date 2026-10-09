-- CreateTable
CREATE TABLE "ProjectSiteTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "weight" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSiteTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSiteTask_projectId_title_key" ON "ProjectSiteTask"("projectId", "title");

-- AddForeignKey
ALTER TABLE "ProjectSiteTask" ADD CONSTRAINT "ProjectSiteTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: every existing Flaretech project gets the full standard site-task list
-- (src/lib/siteTasks.ts STANDARD_SITE_TASKS). New projects get it on creation.
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
  (34, 'Final Testing & Commissioning')
) AS t(ord, title);
