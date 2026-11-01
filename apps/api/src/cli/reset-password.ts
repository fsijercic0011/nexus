import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../infrastructure/config.js";
import { createDatabase, type Database } from "../infrastructure/db/client.js";
import { loadEnvFileIfPresent } from "../infrastructure/env-file.js";
import { normalizeEmail } from "../modules/auth/allowlist.js";
import { type Auth, createAuth } from "../modules/auth/auth.js";
import { writeAudit } from "../modules/households/audit.js";

// Unambiguous characters: no 0/O, 1/l/I.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomPassword(length = 20): string {
  return Array.from(
    { length },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");
}

/**
 * Sets a new random password for the account with `email`, signs out all of
 * its sessions and audits the reset. Returns the new password. Used until
 * NEXUS can send reset emails.
 */
export async function resetPassword(
  database: Database,
  auth: Auth,
  email: string,
): Promise<string> {
  const context = await auth.$context;
  const found = await context.internalAdapter.findUserByEmail(
    normalizeEmail(email),
    { includeAccounts: true },
  );
  if (!found) throw new Error("No account with that email");
  const { user, accounts } = found;

  const password = randomPassword();
  const hash = await context.password.hash(password);
  if (accounts.some((account) => account.providerId === "credential")) {
    await context.internalAdapter.updatePassword(user.id, hash);
  } else {
    // A Google-only account gets a password sign-in too.
    await context.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hash,
    });
  }
  await context.internalAdapter.deleteUserSessions(user.id);
  await writeAudit(database.db, {
    actorUserId: null,
    action: "password.reset_by_cli",
    targetEntityType: "user",
    targetId: user.id,
  });
  return password;
}

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm --filter @nexus/api reset-password <email>");
    process.exit(2);
  }
  loadEnvFileIfPresent(
    fileURLToPath(new URL("../../../../.env.local", import.meta.url)),
  );
  const config = loadConfig(process.env);
  const database = createDatabase(config.databaseUrl);
  try {
    const password = await resetPassword(
      database,
      createAuth(database, config),
      email,
    );
    console.log(`New password for ${normalizeEmail(email)}: ${password}`);
    console.log("All sessions for this account were signed out.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
