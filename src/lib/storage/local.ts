import { promises as fs } from "fs";
import path from "path";
import type { Tirage } from "../types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "tirages.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, "[]", "utf8");
  }
}

export async function localList(): Promise<Tirage[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, "utf8");
  try {
    const data = JSON.parse(raw) as Tirage[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeAll(tirages: Tirage[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(tirages, null, 2), "utf8");
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
