import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_FILE = join(__dirname, 'data', 'store.json');

function empty() {
  return {
    users: {},
    schedule_blocks: [],
    reminders: [],
    sleep_data: [],
    block_activity_log: [],
  };
}

export function readStore() {
  if (!existsSync(STORE_FILE)) return empty();
  try {
    const raw = JSON.parse(readFileSync(STORE_FILE, 'utf8'));
    return { ...empty(), ...raw };
  } catch {
    return empty();
  }
}

export function writeStore(data) {
  mkdirSync(dirname(STORE_FILE), { recursive: true });
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function mutate(fn) {
  const data = readStore();
  fn(data);
  writeStore(data);
}
