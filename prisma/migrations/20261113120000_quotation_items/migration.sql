-- A quotation can list several products across several categories.
ALTER TABLE "Quotation" ADD COLUMN "items" JSONB;
