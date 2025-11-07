import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlDir = path.resolve(__dirname, '../sql');

const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES || '30', 10);
const RETRY_DELAY_MS = parseInt(process.env.DB_RETRY_DELAY_MS || '2000', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabase() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const client = await pool.connect();
      client.release();
      if (attempt > 1) {
        console.log(`[migrate] Database became available after ${attempt} attempts.`);
      } else {
        console.log('[migrate] Database connection successful.');
      }
      return;
    } catch (error) {
      console.log(`[migrate] Database connection failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
      if (attempt === MAX_RETRIES) {
        throw new Error('[migrate] Could not connect to the database. Giving up.');
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function getSqlFiles() {
  try {
    const entries = await fs.readdir(sqlDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[migrate] No SQL directory found. Skipping migrations.');
      return [];
    }
    throw error;
  }
}

async function runSqlFile(client, filename) {
  const filepath = path.join(sqlDir, filename);
  const sql = await fs.readFile(filepath, 'utf-8');
  if (!sql.trim()) {
    console.log(`[migrate] Skipping empty SQL file: ${filename}`);
    return;
  }

  console.log(`[migrate] Running ${filename}...`);
  await client.query(sql);
  console.log(`[migrate] Completed ${filename}`);
}

async function migrate() {
  await waitForDatabase();

  const sqlFiles = await getSqlFiles();
  if (sqlFiles.length === 0) {
    console.log('[migrate] No SQL files to execute.');
    return;
  }

  const client = await pool.connect();
  try {
    for (const file of sqlFiles) {
      await runSqlFile(client, file);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('[migrate] Migration process finished successfully.');
  })
  .catch((error) => {
    console.error('[migrate] Migration failed:', error);
    process.exit(1);
  });

