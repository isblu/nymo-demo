/**
 * Script to create demo users for the Nymo Visual Search internal tool.
 * Since self-registration is disabled, this script is used to create predefined users.
 *
 * Usage:
 *   bun run src/scripts/create-user.ts --email="user@example.com" --password="SecurePass123" --name="Demo User"
 *
 * Or programmatically:
 *   import { createUser } from './create-user';
 *   await createUser('user@example.com', 'password', 'User Name');
 */

import { auth } from "../auth";

type CreateUserOptions = {
  email: string;
  password: string;
  name: string;
};

export async function createUser(options: CreateUserOptions) {
  const { email, password, name } = options;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result) {
      console.error("Failed to create user - no result returned");
      return null;
    }

    console.log("✅ User created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    return result;
  } catch (error) {
    console.error("❌ Failed to create user:", error);
    throw error;
  }
}

// CLI usage
if (import.meta.main) {
  const args = process.argv.slice(2);

  // Parse arguments
  const getArg = (argName: string): string | undefined => {
    const arg = args.find((a) => a.startsWith(`--${argName}=`));
    return arg?.split("=")[1];
  };

  const email = getArg("email");
  const password = getArg("password");
  const name = getArg("name");

  if (!(email && password && name)) {
    console.log(`
Usage: bun run src/scripts/create-user.ts --email="user@example.com" --password="SecurePass123" --name="Demo User"

Required arguments:
  --email     User's email address
  --password  User's password (min 8 characters)
  --name      User's display name
    `);
    process.exit(1);
  }

  createUser({ email, password, name })
    .then(() => {
      console.log("\n🎉 Done!");
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
