import { google } from "googleapis";
import type { Tirage } from "../types";

const SHEET_RANGE = "Tirages!A:C";
const SHEET_NAME = "Tirages";

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

async function ensureSheet(): Promise<void> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
  });
  const exists = meta.data.sheets?.some(
    (s) => s.properties?.title === SHEET_NAME,
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId(),
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
      },
    });
  }

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: "Tirages!A1:C1",
  });
  if (!header.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: "Tirages!A1:C1",
      valueInputOption: "RAW",
      requestBody: { values: [["id", "datetime", "quantityMl"]] },
    });
  }
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

export function sheetsConfigured(): boolean {
  return hasSheetsConfig();
}

export async function sheetsList(): Promise<Tirage[]> {
  await ensureSheet();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: SHEET_RANGE,
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
    range: SHEET_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[tirage.id, tirage.datetime, tirage.quantityMl]],
    },
  });
  return tirage;
}

async function findRowIndex(id: string): Promise<number | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: "Tirages!A:A",
  });
  const rows = res.data.values ?? [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === id) return i + 1; // 1-based sheet rows
  }
  return null;
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

  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
  });
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title === SHEET_NAME,
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

export async function sheetsGet(id: string): Promise<Tirage | null> {
  const all = await sheetsList();
  return all.find((t) => t.id === id) ?? null;
}
