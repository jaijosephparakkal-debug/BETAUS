-- Structured work log: customers, contacts, PRO agencies, employees, numbered quotations, and the log fields on tasks.
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Customer_companyId_name_key" ON "Customer"("companyId", "name");

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Contact_customerId_name_key" ON "Contact"("customerId", "name");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProAgency" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProAgency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProAgency_name_key" ON "ProAgency"("name");

CREATE TABLE "Employee" (
    "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Employee_companyId_name_key" ON "Employee"("companyId", "name");

CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "number" TEXT NOT NULL, "year" INTEGER NOT NULL, "seq" INTEGER,
    "customerId" TEXT NOT NULL, "contactName" TEXT, "productCategory" TEXT NOT NULL, "product" TEXT NOT NULL,
    "quantity" TEXT, "value" DOUBLE PRECISION, "status" TEXT NOT NULL DEFAULT 'SENT', "docUrl" TEXT,
    "legacy" BOOLEAN NOT NULL DEFAULT false, "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Quotation_number_key" ON "Quotation"("number");
CREATE UNIQUE INDEX "Quotation_companyId_year_seq_key" ON "Quotation"("companyId", "year", "seq");
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" ADD COLUMN "quotationId" TEXT, ADD COLUMN "customerId" TEXT, ADD COLUMN "logKind" TEXT,
  ADD COLUMN "eventAt" TIMESTAMP(3), ADD COLUMN "enteredLater" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "backdateReason" TEXT, ADD COLUMN "followUpAt" TIMESTAMP(3), ADD COLUMN "details" JSONB;
ALTER TABLE "Task" ADD CONSTRAINT "Task_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Start the employee lists from the people already in the app, per company (the placeholder and Abraham are left out).
INSERT INTO "Employee" ("id", "companyId", "name")
SELECT 'emp_' || md5(m."companyId" || u."name"), m."companyId", u."name"
FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
WHERE lower(u."email") NOT IN ('abraham@flaretechnical.com', 'maintenance@flaretechnical.com')
ON CONFLICT DO NOTHING;
