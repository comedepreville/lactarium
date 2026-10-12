import type { JournalEntry, Tirage } from "../types";
import * as local from "./local";
import * as sheets from "./sheets";

export type StorageBackend = "sheets" | "local";

export function getBackend(): StorageBackend {
  return sheets.sheetsConfigured() ? "sheets" : "local";
}

export async function listTirages(): Promise<Tirage[]> {
  return getBackend() === "sheets" ? sheets.sheetsList() : local.localList();
}

export async function getTirage(id: string): Promise<Tirage | null> {
  return getBackend() === "sheets" ? sheets.sheetsGet(id) : local.localGet(id);
}

export async function createTirage(
  input: Omit<Tirage, "id"> & { id?: string },
): Promise<Tirage> {
  return getBackend() === "sheets"
    ? sheets.sheetsCreate(input)
    : local.localCreate(input);
}

export async function updateTirage(
  id: string,
  patch: Partial<Omit<Tirage, "id">>,
): Promise<Tirage | null> {
  return getBackend() === "sheets"
    ? sheets.sheetsUpdate(id, patch)
    : local.localUpdate(id, patch);
}

export async function deleteTirage(id: string): Promise<boolean> {
  return getBackend() === "sheets"
    ? sheets.sheetsDelete(id)
    : local.localDelete(id);
}

export async function listJournal(): Promise<JournalEntry[]> {
  return getBackend() === "sheets"
    ? sheets.sheetsListJournal()
    : local.localListJournal();
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  return getBackend() === "sheets"
    ? sheets.sheetsGetJournal(id)
    : local.localGetJournal(id);
}

export async function createJournalEntry(
  input: Omit<JournalEntry, "id"> & { id?: string },
): Promise<JournalEntry> {
  return getBackend() === "sheets"
    ? sheets.sheetsCreateJournal(input)
    : local.localCreateJournal(input);
}

export async function updateJournalEntry(
  id: string,
  patch: Partial<Omit<JournalEntry, "id">>,
): Promise<JournalEntry | null> {
  return getBackend() === "sheets"
    ? sheets.sheetsUpdateJournal(id, patch)
    : local.localUpdateJournal(id, patch);
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  return getBackend() === "sheets"
    ? sheets.sheetsDeleteJournal(id)
    : local.localDeleteJournal(id);
}
