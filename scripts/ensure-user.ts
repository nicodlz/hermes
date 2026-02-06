/**
 * Ensure a user exists with the given email
 * Usage: pnpm tsx scripts/ensure-user.ts <email> [name] [orgName]
 */

import { db } from "@hermes/db";

async function main() {
  const [email, name, orgName] = process.argv.slice(2);
  
  if (!email) {
    console.error("Usage: pnpm tsx scripts/ensure-user.ts <email> [name] [orgName]");
    process.exit(1);
  }

  // Check if user exists
  let user = await db.user.findUnique({ where: { email } });
  
  if (user) {
    console.log(`✓ User ${email} already exists`);
    const org = await db.organization.findUnique({ where: { id: user.orgId } });
    console.log(`  Org: ${org?.name} (${user.orgId})`);
    return;
  }

  // Create user
  console.log(`Creating user ${email}...`);
  
  const result = await db.$transaction(async (tx) => {
    // Create org if name provided, else use default
    let org = await tx.organization.findFirst({ where: { name: "Default Organization" } });
    
    if (!org && orgName) {
      org = await tx.organization.create({
        data: { name: orgName },
      });
    } else if (!org) {
      org = await tx.organization.create({
        data: { name: "Default Organization" },
      });
    }

    const newUser = await tx.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        orgId: org.id,
      },
    });

    return { user: newUser, org };
  });

  console.log(`✓ Created user ${result.user.email}`);
  console.log(`  Name: ${result.user.name}`);
  console.log(`  Org: ${result.org.name} (${result.org.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
