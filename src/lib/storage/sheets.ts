import { google } from "googleapis";
import type { JournalEntry, Tirage } from "../types";

const TIRAGES_SHEET = "Tirages";
const JOURNAL_SHEET = "Journal";
const TIRAGES_RANGE = "Tirages!A:C";
const JOURNAL_RANGE = "Journal!A:C";

function hasSheetsConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

function getAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function spreadsheetId(): string {
  return process.env.GOOGLE_SHEETS_ID!;
}

async function ensureNamedSheet(
  sheetName: string,
  headerRange: string,
  headers: string[],
): Promise<void> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
  });
  const exists = meta.data.sheets?.some(
    (s) => s.properties?.title === sheetName,
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId(),
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
  }

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: headerRange,
  });
  if (!header.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

async function ensureSheet(): Promise<void> {
  await ensureNamedSheet(TIRAGES_SHEET, "Tirages!A1:C1", [
    "id",
    "datetime",
    "quantityMl",
  ]);
}

async function ensureJournalSheet(): Promise<void> {
  await ensureNamedSheet(JOURNAL_SHEET, "Journal!A1:C1", [
    "id",
    "datetime",
    "text",
  ]);
}

async function findRowIndexInColumn(
  columnRange: string,
  id: string,
): Promise<number | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: columnRange,
  });
  const rows = res.data.values ?? [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === id) return i + 1; // 1-based sheet rows
  }
  return null;
}

async function deleteSheetRow(
  sheetName: string,
  rowIndex: number,
): Promise<boolean> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
  });
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title === sheetName,
  );
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
  return true;
}

function rowToTirage(row: string[]): Tirage | null {
  if (!row[0] || !row[1]) return null;
  const quantityMl = Number(row[2]);
  if (!Number.isFinite(quantityMl)) return null;
  return {
    id: row[0],
    datetime: row[1],
    quantityMl,
  };
}

function rowToJournal(row: string[]): JournalEntry | null {
  if (!row[0] || !row[1] || row[2] === undefined || row[2] === "") return null;
  return {
    id: row[0],
    datetime: row[1],
    text: row[2],
  };
}

export function sheetsConfigured(): boolean {
  return hasSheetsConfig();
}

export async function sheetsList(): Promise<Tirage[]> {
  await ensureSheet();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: TIRAGES_RANGE,
  });
  const rows = res.data.values ?? [];
  return rows
    .slice(1)
    .map(rowToTirage)
    .filter((t): t is Tirage => t !== null);
}

export async function sheetsCreate(
  input: Omit<Tirage, "id"> & { id?: string },
): Promise<Tirage> {
  await ensureSheet();
  const tirage: Tirage = {
    id: input.id ?? crypto.randomUUID(),
    datetime: input.datetime,
    quantityMl: input.quantityMl,
  };
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: TIRAGES_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[tirage.id, tirage.datetime, tirage.quantityMl]],
    },
  });
  return tirage;
}

async function findRowIndex(id: string): Promise<number | null> {
  return findRowIndexInColumn("Tirages!A:A", id);
}

export async function sheetsUpdate(
  id: string,
  patch: Partial<Omit<Tirage, "id">>,
): Promise<Tirage | null> {
  await ensureSheet();
  const rowIndex = await findRowIndex(id);
  if (rowIndex === null) return null;

  const existing = (await sheetsList()).find((t) => t.id === id);
  if (!existing) return null;

  const updated: Tirage = { ...existing, ...patch };
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `Tirages!A${rowIndex}:C${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[updated.id, updated.datetime, updated.quantityMl]],
    },
  });
  return updated;
}

export async function sheetsDelete(id: string): Promise<boolean> {
  await ensureSheet();
  const rowIndex = await findRowIndex(id);
  if (rowIndex === null) return false;
  return deleteSheetRow(TIRAGES_SHEET, rowIndex);
}

export async function sheetsGet(id: string): Promise<Tirage | null> {
  const all = await sheetsList();
  return all.find((t) => t.id === id) ?? null;
}

export async function sheetsListJournal(): Promise<JournalEntry[]> {
  await ensureJournalSheet();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: JOURNAL_RANGE,
  });
  const rows = res.data.values ?? [];
  return rows
    .slice(1)
    .map(rowToJournal)
    .filter((e): e is JournalEntry => e !== null);
}

export async function sheetsCreateJournal(
  input: Omit<JournalEntry, "id"> & { id?: string },
): Promise<JournalEntry> {
  await ensureJournalSheet();
  const entry: JournalEntry = {
    id: input.id ?? crypto.randomUUID(),
    datetime: input.datetime,
    text: input.text,
  };
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: JOURNAL_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[entry.id, entry.datetime, entry.text]],
    },
  });
  return entry;
}

async function findJournalRowIndex(id: string): Promise<number | null> {
  return findRowIndexInColumn("Journal!A:A", id);
}

export async function sheetsUpdateJournal(
  id: string,
  patch: Partial<Omit<JournalEntry, "id">>,
): Promise<JournalEntry | null> {
  await ensureJournalSheet();
  const rowIndex = await findJournalRowIndex(id);
  if (rowIndex === null) return null;

  const existing = (await sheetsListJournal()).find((e) => e.id === id);
  if (!existing) return null;

  const updated: JournalEntry = { ...existing, ...patch };
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `Journal!A${rowIndex}:C${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[updated.id, updated.datetime, updated.text]],
    },
  });
  return updated;
}

export async function sheetsDeleteJournal(id: string): Promise<boolean> {
  await ensureJournalSheet();
  const rowIndex = await findJournalRowIndex(id);
  if (rowIndex === null) return false;
  return deleteSheetRow(JOURNAL_SHEET, rowIndex);
}

export async function sheetsGetJournal(id: string): Promise<JournalEntry | null> {
  const all = await sheetsListJournal();
  return all.find((e) => e.id === id) ?? null;
}
