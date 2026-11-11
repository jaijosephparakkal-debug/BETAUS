-- Quotation numbers carry the month (GN-Q-2026-NOV-0001) and the sequence restarts each month.
ALTER TABLE "Quotation" ADD COLUMN "month" INTEGER NOT NULL DEFAULT 0;
DROP INDEX "Quotation_companyId_year_seq_key";
CREATE UNIQUE INDEX "Quotation_companyId_year_month_seq_key" ON "Quotation"("companyId", "year", "month", "seq");
