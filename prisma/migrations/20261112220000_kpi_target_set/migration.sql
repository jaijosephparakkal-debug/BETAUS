-- Until real targets are agreed (planned from January), no KPI target counts: targets already stored are the provisional
-- figures set earlier. "targetSet" turns on percentage-of-target scoring for a KPI once its target is approved.
ALTER TABLE "Kpi" ADD COLUMN "targetSet" BOOLEAN NOT NULL DEFAULT false;
