/**
 * Migration script to add authentication support
 * 
 * This script:
 * 1. Creates a default organization
 * 2. Creates a default admin user (magic link auth - no password)
 * 3. Updates existing leads to belong to the default org
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ORG_NAME = "Default Organization";
const DEFAULT_USER_EMAIL = "admin@hermes.local";

async function main() {
  console.log("Starting authentication migration...");

  // Check if migration already done
  const existingOrg = await prisma.organization.findFirst();
  if (existingOrg) {
    console.log("Migration already completed. Organizations exist.");
    return;
  }

  console.log("Creating default organization...");
  const org = await prisma.organization.create({
    data: { name: DEFAULT_ORG_NAME },
  });
  console.log(`Created organization: ${org.id}`);

  console.log("Creating default admin user...");
  const user = await prisma.user.create({
    data: {
      email: DEFAULT_USER_EMAIL,
      name: "Admin",
      orgId: org.id,
    },
  });
  console.log(`Created user: ${user.email}`);

  console.log("Updating existing leads...");
  const result = await prisma.lead.updateMany({
    where: { orgId: "" }, // SQLite will have empty string for new required field
    data: { orgId: org.id },
  });
  console.log(`Updated ${result.count} leads`);

  console.log("\n✅ Migration complete!");
  console.log(`\nDefault user: ${DEFAULT_USER_EMAIL}`);
  console.log(`To sign in, request a magic link for this email.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
