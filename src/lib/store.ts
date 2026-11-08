/**
 * Tiny JSON file store under .data/. Writes go through a per file queue and an
 * atomic rename so two requests never interleave. Swap for a database before production.
 */
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), ".data");
const queues = new Map<string, Promise<unknown>>();

export const newId = () => randomBytes(8).toString("hex");

export async function readRows<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8")) as T[];
  } catch {
    return [];
  }
}

async function writeRows<T>(file: string, rows: T[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const full = path.join(DATA_DIR, file);
  const tmp = `${full}.${newId()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
  await fs.rename(tmp, full);
}

/** Read, change, and write a file as one step. Whatever `fn` returns is passed back. */
export function mutate<T, R>(file: string, fn: (rows: T[]) => R | Promise<R>): Promise<R> {
  const prev = queues.get(file) ?? Promise.resolve();
  const next = prev
    .catch(() => undefined)
    .then(async () => {
      const rows = await readRows<T>(file);
      const out = await fn(rows);
      await writeRows(file, rows);
      return out;
    });
  queues.set(file, next);
  return next;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** YYYY-MM-DD plus whole months, clamped to the month's last day. */
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}
