import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '..', '..', 'data', 'users.json');

const ensureStoreFile = async () => {
  const dir = path.dirname(storePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, '[]', 'utf8');
  }
};

const readUsers = async () => {
  await ensureStoreFile();
  const content = await fs.readFile(storePath, 'utf8');
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
};

const writeUsers = async (users) => {
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(users, null, 2), 'utf8');
};

export const findUserByEmail = async (email) => {
  const users = await readUsers();
  return users.find((user) => user.email === email) || null;
};

export const findUserById = async (id) => {
  const users = await readUsers();
  return users.find((user) => user._id === id) || null;
};

export const createFallbackUser = async ({ name, email, password, role }) => {
  const users = await readUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = users.find((user) => user.email === normalizedEmail);
  if (existing) {
    const error = new Error('Account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    _id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: role || 'patient',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(user);
  await writeUsers(users);
  return user;
};

export const validateFallbackUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);
  if (!user || !user.isActive) return null;
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  return user;
};
