import { PRODUCTS } from "@/lib/products";

/** gasneeds.com product types, grouped under the categories shown in the quotation form. */
const TYPE_TO_CATEGORY: Record<string, string> = {
  "First Stage Regulators": "Regulators", "Second Stage Regulators": "Regulators", "OPSO/UPSO Regulators": "Regulators", "Cryogenic Regulators": "Regulators",
  "Back Check Valves": "LPG valves", "Ball Valves": "LPG valves", "Cylinder Valves": "LPG valves", "Excess Flow Valves": "LPG valves", "Gas Master Valves": "LPG valves", "Globe Valves LPG": "LPG valves", "Safety Valves LPG": "LPG valves", "Bypass Valves": "LPG valves",
  "Angle Relief Valves Cryogenic": "Cryogenic equipment", "Cryogenic Valves": "Cryogenic equipment", "Globe Valves Cryogenic": "Cryogenic equipment", "Relief Valves Cryogenic": "Cryogenic equipment", "Repair Kit Cryogenic": "Cryogenic equipment",
  "CS Pipes": "Pipes", "HDPE Pipes": "Pipes", "Copper Pipes": "Pipes",
  "ACME Adaptors": "Fittings and adaptors", "Copper Fittings": "Fittings and adaptors", "CS Fittings": "Fittings and adaptors", "HDPE Fittings": "Fittings and adaptors", "Press Fittings": "Fittings and adaptors", "Brass Connectors": "Fittings and adaptors",
  "LPG Tanks": "Tanks and accessories", "Tank Accessories": "Tanks and accessories", "Tank Monitoring": "Tanks and accessories",
  "LPG Vaporizers": "Vaporizers",
  "Gas Flow Meters": "Measurement", "Pressure Gauges": "Measurement",
  "Gas Detectors": "Gas detection", "Test Gas": "Gas detection",
  "LPG Manifolds": "Manifolds and gas panels", "Gas Panel": "Manifolds and gas panels",
  "Gas Hoses": "Hoses and flow control", "Solenoid Valves": "Hoses and flow control", "Strainers": "Hoses and flow control", "Swivel Joints": "Hoses and flow control", "Clamps": "Hoses and flow control",
  "Accessories": "Parts and accessories", "Fasteners": "Parts and accessories", "Electrical": "Parts and accessories", "Cable": "Parts and accessories", "Pumps": "Parts and accessories",
};

export type CatalogRow = [category: string, title: string];

/** Every product on gasneeds.com as [category, name]. Cached for a day; used for the type-ahead in the quotation form. */
export async function getCatalog(): Promise<CatalogRow[]> {
  const rows: CatalogRow[] = [];
  for (let page = 1; page <= 12; page++) {
    const res = await fetch(`https://www.gasneeds.com/products.json?limit=250&page=${page}`, { next: { revalidate: 86400 } });
    if (!res.ok) break;
    const j = (await res.json()) as { products?: { title: string; product_type: string }[] };
    if (!j.products?.length) break;
    for (const p of j.products) rows.push([TYPE_TO_CATEGORY[p.product_type] ?? "Parts and accessories", p.title]);
  }
  return rows.filter(([c]) => c in PRODUCTS);
}
