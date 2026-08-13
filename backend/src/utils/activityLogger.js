import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';
import { isDbConnected } from './dbStatus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '..', '..', 'data', 'activity_logs.json');

const ensureStoreFile = async () => {
  const dir = path.dirname(storePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, '[]', 'utf8');
  }
};

export async function logActivity(entry) {
  // If Mongo is connected, try writing to the ActivityLog collection first
  if (isDbConnected() && mongoose.connection.readyState === 1) {
    try {
      await ActivityLog.create(entry);
      return;
    } catch (err) {
      console.warn('[ActivityLogger] Mongo write failed, falling back to file store:', err.message);
    }
  }

  // Fallback: append to JSON file
  try {
    await ensureStoreFile();
    const content = await fs.readFile(storePath, 'utf8');
    const arr = JSON.parse(content || '[]');
    arr.push({ ...entry, createdAt: new Date().toISOString() });
    await fs.writeFile(storePath, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.error('[ActivityLogger] Fallback write failed:', err.message);
  }
}

export default { logActivity };
