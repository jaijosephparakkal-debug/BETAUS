import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FLARETECHNICAL_PROJECTS: { number: string; name: string }[] = [
  { number: "P672-2021", name: "LOOTAH JVC" },
  { number: "P866-2023", name: "AL QANDEEL VILLA" },
  { number: "P885-2023", name: "GOLDEN WOODS JVC Var.=PRMS" },
  { number: "P935-2023", name: "JASS METAL" },
  { number: "P969-2023", name: "ARABLAND 6 VILLAS" },
  { number: "P971-2023", name: "CONVERSION" },
  { number: "P977-2023", name: "RING BUILDING" },
  { number: "P999-2024", name: "DATCO" },
  { number: "P1002-2024", name: "GRANS JVC" },
  { number: "P1028-2024", name: "ROYAL AVENUE 3 VILLAS" },
  { number: "P1033-2024", name: "AL SHIRAWI PDLM" },
  { number: "1049-2025", name: "G+1 VILLA ZABEEL2, ARABLAND" },
  { number: "P1060-2025", name: "LUXE DESIGN" },
  { number: "P1062-2025", name: "SILVER STAR JVC" },
  { number: "P1071-2025", name: "ROYAL AVENUE-PIER8" },
  { number: "P1077-2025", name: "GREEN OASIS MBR CITY" },
  { number: "P1080-2025", name: "DAR ALWD" },
  { number: "P1081-2025", name: "AL MOFTAH F53" },
  { number: "P1083-2025", name: "MEPCO PRMS/REG." },
  { number: "P1088-2025", name: "GMP G+20 PRMS" },
  { number: "P1089-2025", name: "GAMMA CONTRACTING" },
  { number: "P1090-2025", name: "AL REHAB G+10 PRMS" },
  { number: "P1091-2025", name: "AL REHAB G+12 PRMS" },
  { number: "P1092-2025", name: "LUXE DESIGN VILLA D-12-01" },
  { number: "P1093-2025", name: "LUXE DESIGN VILLA D-12-02" },
  { number: "1096-2025", name: "ARADA-EMT ARMANI PRMS" },
  { number: "1097-2025", name: "REHAB SCHOOL - NSHAMA PRMS" },
  { number: "1099-2026", name: "MISTER SHADES" },
  { number: "1100-2026", name: "LUXE DESIGN-AL FURJAN VILLA" },
  { number: "1102-2026", name: "DAMAC CASA TOWER" },
  { number: "1103-2026", name: "DAMAC CANAL CROWN2 TOWER" },
  { number: "1104-2026", name: "DAMAC VOLTA TOWER" },
  { number: "1105-2026", name: "BK GULF- ZABEEL HOUSE" },
  { number: "1106-2026", name: "LUXE DESIGN-PRIVATE VILLA EMIRATES HILLS V6" },
  { number: "1107-2026", name: "LTS-CASA CANAL" },
  { number: "1108-2026", name: "EMT DIP LABOR CAMP" },
  { number: "1110-2026", name: "EMT -STAFF ACCOMMADATION" },
  { number: "1111-2026", name: "BABA ROMA BAKERY" },
  { number: "1113-2026", name: "ASBCITY CONSTRUCTION L.L.C." },
  { number: "1114-2026", name: "ROYAL AVENUE-CROWN RESIDENCE" },
  { number: "1119-2026", name: "WESTBROOK INTERIORS-DMCC LOUNGE" },
  { number: "1120-2026", name: "FATAYER ALA AL TAYER CAFETERIA" },
  { number: "1121-2026", name: "EXTENSION OF LPG PIPE LINE-ADVANCED BAKING CONCEPT" },
  { number: "1122-2026", name: "TANK TESTING @ VILLANOVA- DUBAI HOLDINGS" },
];

async function main() {
  const company = await prisma.company.findUnique({ where: { slug: "flaretechnical" } });
  if (!company) throw new Error("Flare Technical company not found");

  let created = 0;
  for (const p of FLARETECHNICAL_PROJECTS) {
    const existing = await prisma.project.findFirst({
      where: { companyId: company.id, number: p.number },
    });
    if (existing) continue;
    await prisma.project.create({
      data: { companyId: company.id, number: p.number, name: p.name, status: "ACTIVE" },
    });
    created++;
  }

  console.log(`Created ${created} projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
