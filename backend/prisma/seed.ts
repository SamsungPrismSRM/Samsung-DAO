import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HQS = [
  { id: "INDIA",         name: "India HQ (Noida / Gurgaon)",              region: "APAC" },
  { id: "USA",           name: "North America HQ (New Jersey / Texas)",    region: "AMERICAS" },
  { id: "KOREA",         name: "Korea HQ (Suwon – Global HQ)",            region: "KOREA" },
  { id: "EUROPE",        name: "Europe HQ (UK / Germany – Munich)",        region: "EMEA" },
  { id: "UAE",           name: "Middle East HQ (UAE – Dubai)",             region: "EMEA" },
  { id: "AFRICA",        name: "Africa HQ (South Africa – Johannesburg)",  region: "EMEA" },
  { id: "CHINA",         name: "China HQ (Beijing)",                       region: "GREATER_CHINA" },
  { id: "HONG_KONG",     name: "Hong Kong HQ",                            region: "GREATER_CHINA" },
  { id: "TAIWAN",        name: "Taiwan HQ (Taipei)",                      region: "GREATER_CHINA" },
  { id: "SINGAPORE",     name: "Southeast Asia HQ (Singapore)",           region: "APAC" },
  { id: "AUSTRALIA",     name: "Oceania HQ (Australia – Sydney)",          region: "APAC" },
  { id: "CANADA",        name: "Canada HQ (Toronto)",                     region: "AMERICAS" },
  { id: "BRAZIL",        name: "Latin America HQ (Brazil – São Paulo)",    region: "AMERICAS" },
  { id: "SEMICONDUCTOR", name: "Global Device Solutions HQ (Semiconductor)", region: "KOREA" },
  { id: "DIGITAL_CITY",  name: "Samsung Digital City (Strategic HQ / R&D)", region: "KOREA" },
  { id: "GLOBAL",        name: "Global Fallback HQ",                      region: "GLOBAL" },
];

async function main() {
  console.log("Seeding HQ master table...");

  for (const hq of HQS) {
    await prisma.hQ.upsert({
      where: { id: hq.id },
      update: { name: hq.name, region: hq.region },
      create: hq,
    });
  }

  console.log(`Seeded ${HQS.length} HQ records successfully.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
