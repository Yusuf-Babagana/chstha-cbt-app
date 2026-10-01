import { compare, hash } from 'bcryptjs';

const ROUNDS = 8;

export const hashPassword = (plain: string) => hash(plain, ROUNDS);

/**
 * Verifies a password. Accounts created by older versions of the app stored
 * plain-text passwords; those are accepted once and flagged for re-hashing.
 */
export async function verifyPassword(plain: string, stored: string): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (/^\$2[aby]\$/.test(stored)) return { ok: await compare(plain, stored), needsRehash: false };
  return { ok: plain === stored, needsRehash: plain === stored };
}
