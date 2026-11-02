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
