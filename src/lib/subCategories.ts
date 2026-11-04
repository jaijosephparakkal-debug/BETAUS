/**
 * Sub dropdowns for the add-task form: per person, each category task (by its title)
 * lists the sub items they can pick. Picking one creates a daily task under that category.
 */
/** Typed sub items are stored as task-title presets named "sub:<category>|<item>". */
export const SUB_PREFIX = "sub:";

export const SUB_CATEGORIES: Record<string, Record<string, string[]>> = {
  // Jai — Marketing & Content Manager
  "jai@gasneeds.com": {
    "Apps & Systems": ["App development", "App testing / fixes", "Store listing / release", "System setup / admin"],
    "Campaigns & SEO": ["Campaign planned", "Campaign launched", "SEO / blog published", "Ranking tracking", "Video upload & SEO"],
    Design: ["Brochure / catalogue", "Brand / identity", "Packaging / print", "Certificate / form / document", "Presentation", "Signage / sticker", "Revision / re-edit"],
    Video: ["Pre-production / storyboard", "Shoot", "Edit", "Final delivery / upload", "Rework / revision"],
    "Digital Marketing": ["Social post", "Website update", "Email campaign", "Product photos", "Content planning"],
    Confidential: ["Agreement / legal document", "Business proposal", "Data report", "Letterhead / formal notice", "Presentation"],
  },
  // Antony — Operations Manager
  "sales@gasneeds.com": {
    "Sales — Quotations": ["Product quotation sent", "Quotation revised", "Price & availability enquiry", "Customer order confirmed"],
    "Sales — Customer Visits": ["Customer visit", "Site / meeting", "Visit report"],
    "Sales — Follow-ups": ["Quotation follow-up", "Payment follow-up", "Supplier / purchase coordination", "Emails Attended", "Calls in", "Calls out"],
    "HR — Staff & Insurance": ["HR work", "Insurance / benefits", "Employee documents", "Recruitment / onboarding", "Leave / attendance"],
    "PRO — Government & Admin": ["PRO work", "RTA work", "Visa / residency", "Emirates ID / medical", "Trade licence / renewal", "Vehicle / branding", "Office admin"],
  },
  // Hashim — Accounts Executive
  "accounts@flaretechnical.com": {
    "Accounts — Invoicing & Billing": ["Invoice generated", "Tax invoice", "PO update", "Pending PO follow-up"],
    "Accounts — Vouchers & Reconciliation": ["Expense voucher", "Receipt voucher", "Bank reconciliation", "Credit card reconciliation", "POS / bank reconcile"],
    "Accounts — Collections & Follow-ups": ["Payment follow-up", "Payment collected", "Security deposit refund", "Rebate calculation / cheque"],
    "Accounts — Supplier & Admin": ["Supplier application form", "Asset register", "Warehouse insurance"],
    "Maintenance — Gas Reading & Reports": ["Gas reading update", "Gas reading notice", "Summary report", "Outstanding report", "PPM report"],
    "Maintenance — AMC, Contracts & Portals": ["AMC renewal contract", "New contract", "Portal updation", "DCD attestation"],
    "Calls & Emails": ["Calls in", "Calls out", "Emails Attended", "Follow Up", "Assist manager"],
  },
  // Shafeek — Accounts Manager
  "finance@flaretechnical.com": {
    "Banking & Cash": ["Bank reconciliation", "Cheque preparation", "Petty cash", "International transfer", "Credit card statement review"],
    "Receivables & Collections": ["Receivable review", "Payment collection", "Security deposit refund"],
    "Payroll & Staff Payments": ["Payroll generation", "Payroll review", "Overtime payment", "Leave salary & air ticket", "Final settlement"],
    "Tax, VAT & Compliance": ["Corporate tax filing", "VAT return filing", "Insurance renewal"],
    "Reports & Adjustments": ["Adjustment entries", "Expense posting & review", "Financial report", "Project P&L", "Import / consolidated report"],
    "Meetings & Admin": ["Meeting with Abraham sir", "Team meeting", "Weekly project meeting", "Vehicle GPS / RFID"],
  },
  // Jintu — Accounts Manager
  "accounts@gasneeds.com": {
    "Payments & Receipts": ["Payment entry", "International payment", "Local payment", "Vendor payment entry", "Receipt entry", "Beneficiary adding", "Payment link"],
    "Cheques, Cash & Banking": ["Cheque collection", "Cheque deposit", "Cash deposit", "Petty cash deposit", "Bank reconciliation"],
    "Bills & Books": ["Bills posting", "Inventory adjustment", "New vendor / customer", "Documentation / records", "Payroll", "Report"],
    "Receivables Follow-up": ["Follow-up (email / phone / WhatsApp)", "Receivables status", "Calls out", "Emails Attended"],
    "Procurement Support": ["Supplier price / offer", "Quotation prepared", "Shipment tracking", "Delivery status"],
  },
  // Manu Johny — Purchase Engineer
  "business@gasneeds.com": {
    Quotations: ["Customer quotation sent", "Revised quotation", "Supplier quotation requested", "Quotation follow-up", "Quotation approved / lost"],
    "Purchase Orders": ["PO raised", "PO sent to supplier", "PO confirmed by supplier", "PO amended", "Material order"],
    Enquiries: ["Customer enquiry received", "Enquiry clarified", "Enquiry converted to quotation", "Enquiry closed"],
    "Imports & Deliveries": ["Shipment booked", "Shipment in transit", "Customs clearance", "Delivery arranged", "Delivered"],
    Payments: ["Payment request sent", "Advance paid", "Balance paid", "Invoice received", "Payment follow-up"],
    "Follow-ups & Calls": ["Calls in", "Calls out", "Emails Attended", "Supplier follow-up", "Customer follow-up"],
  },
  // Saroj — Estimation Engineer
  "saroj@flaretechnical.com": {
    Quotations: ["Quotation prepared", "Quotation revised", "Quotation sent", "Quotation follow-up"],
    "Estimation & Pricing": ["Estimate / BOQ prepared", "Price update", "Price escalation", "Cost comparison"],
    "Drawings & Documentation": ["Drawing prepared", "Drawing revision", "Document prepared", "Submittal / approval follow-up"],
    "Site Visits": ["Site visit", "Measurements taken", "Site report"],
    "Follow-ups & Emails": ["Emails Attended", "Follow Up", "Consultant follow-up", "Supplier follow-up"],
    "Systems & Updates": ["Projects update in the app", "IT / systems", "Updated tasks on OWNIT"],
  },
};
