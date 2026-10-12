import { promises as fs } from "fs";
import path from "path";
import type { JournalEntry, Tirage } from "../types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const TIRAGES_PATH = path.join(DATA_DIR, "tirages.json");
const JOURNAL_PATH = path.join(DATA_DIR, "journal.json");

async function ensureFile(filePath: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const data = JSON.parse(raw) as T[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeJsonArray<T>(filePath: string, data: T[]): Promise<void> {
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function localList(): Promise<Tirage[]> {
  return readJsonArray<Tirage>(TIRAGES_PATH);
}

async function writeAll(tirages: Tirage[]): Promise<void> {
  await writeJsonArray(TIRAGES_PATH, tirages);
}

export async function localCreate(
  input: Omit<Tirage, "id"> & { id?: string },
): Promise<Tirage> {
  const tirages = await localList();
  const tirage: Tirage = {
    id: input.id ?? crypto.randomUUID(),
    datetime: input.datetime,
    quantityMl: input.quantityMl,
  };
  tirages.push(tirage);
  await writeAll(tirages);
  return tirage;
}

export async function localUpdate(
  id: string,
  patch: Partial<Omit<Tirage, "id">>,
): Promise<Tirage | null> {
  const tirages = await localList();
  const idx = tirages.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tirages[idx] = { ...tirages[idx], ...patch };
  await writeAll(tirages);
  return tirages[idx];
}

export async function localDelete(id: string): Promise<boolean> {
  const tirages = await localList();
  const next = tirages.filter((t) => t.id !== id);
  if (next.length === tirages.length) return false;
  await writeAll(next);
  return true;
}

export async function localGet(id: string): Promise<Tirage | null> {
  const tirages = await localList();
  return tirages.find((t) => t.id === id) ?? null;
}

export async function localListJournal(): Promise<JournalEntry[]> {
  return readJsonArray<JournalEntry>(JOURNAL_PATH);
}

async function writeAllJournal(entries: JournalEntry[]): Promise<void> {
  await writeJsonArray(JOURNAL_PATH, entries);
}

export async function localCreateJournal(
  input: Omit<JournalEntry, "id"> & { id?: string },
): Promise<JournalEntry> {
  const entries = await localListJournal();
  const entry: JournalEntry = {
    id: input.id ?? crypto.randomUUID(),
    datetime: input.datetime,
    text: input.text,
  };
  entries.push(entry);
  await writeAllJournal(entries);
  return entry;
}

export async function localUpdateJournal(
  id: string,
  patch: Partial<Omit<JournalEntry, "id">>,
): Promise<JournalEntry | null> {
  const entries = await localListJournal();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...patch };
  await writeAllJournal(entries);
  return entries[idx];
}

export async function localDeleteJournal(id: string): Promise<boolean> {
  const entries = await localListJournal();
  const next = entries.filter((e) => e.id !== id);
  if (next.length === entries.length) return false;
  await writeAllJournal(next);
  return true;
}

export async function localGetJournal(id: string): Promise<JournalEntry | null> {
  const entries = await localListJournal();
  return entries.find((e) => e.id === id) ?? null;
}
