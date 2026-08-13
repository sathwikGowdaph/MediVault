import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '..', '..', 'data', 'refresh_tokens.json');

const ensureStoreFile = async () => {
  const dir = path.dirname(storePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, '[]', 'utf8');
  }
};

const readAll = async () => {
  await ensureStoreFile();
  const content = await fs.readFile(storePath, 'utf8');
  try {
    const parsed = JSON.parse(content || '[]');
    return parsed.map((token) => ({
      ...token,
      expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
      revoked: typeof token.revoked === 'boolean' ? token.revoked : false
    }));
  } catch {
    return [];
  }
};

const writeAll = async (arr) => {
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(arr, null, 2), 'utf8');
};

export async function createToken(entry) {
  const arr = await readAll();
  arr.push({ ...entry, revoked: false });
  await writeAll(arr);
}

export async function findToken(token) {
  const arr = await readAll();
  return arr.find((t) => t.token === token) || null;
}

export async function revokeToken(token) {
  const arr = await readAll();
  let changed = false;
  const out = arr.map((t) => {
    if (t.token === token) { changed = true; return { ...t, revoked: true }; }
    return t;
  });
  if (changed) await writeAll(out);
}

export async function revokeAllByToken(token) {
  return revokeToken(token);
}

export default { createToken, findToken, revokeToken };
