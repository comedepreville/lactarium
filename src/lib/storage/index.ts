import { createClient } from "@/lib/supabase/server";
import type { JournalEntry, Tirage } from "../types";

const TIRAGE_SELECT = "id, datetime, quantity_ml, notes";

function mapTirage(row: {
  id: string;
  datetime: string;
  quantity_ml: number;
  notes: string | null;
}): Tirage {
  return {
    id: row.id,
    datetime: row.datetime,
    quantityMl: row.quantity_ml,
    notes: row.notes?.trim() ? row.notes.trim() : null,
  };
}

function mapJournal(row: {
  id: string;
  datetime: string;
  text: string;
}): JournalEntry {
  return {
    id: row.id,
    datetime: row.datetime,
    text: row.text,
  };
}

/** Normalise une note : trim, vide → null, max 500 caractères. */
export function normalizeTirageNotes(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

export async function listTirages(): Promise<Tirage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tirages")
    .select(TIRAGE_SELECT)
    .order("datetime", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTirage);
}

export async function getTirage(id: string): Promise<Tirage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tirages")
    .select(TIRAGE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTirage(data) : null;
}

export async function createTirage(
  input: Omit<Tirage, "id" | "notes"> & {
    id?: string;
    notes?: string | null;
  },
): Promise<Tirage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tirages")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      datetime: input.datetime,
      quantity_ml: input.quantityMl,
      notes: normalizeTirageNotes(input.notes),
    })
    .select(TIRAGE_SELECT)
    .single();

  if (error) throw error;
  return mapTirage(data);
}

export async function updateTirage(
  id: string,
  patch: Partial<Omit<Tirage, "id">>,
): Promise<Tirage | null> {
  const payload: {
    datetime?: string;
    quantity_ml?: number;
    notes?: string | null;
  } = {};
  if (patch.datetime !== undefined) payload.datetime = patch.datetime;
  if (patch.quantityMl !== undefined) payload.quantity_ml = patch.quantityMl;
  if (patch.notes !== undefined) {
    payload.notes = normalizeTirageNotes(patch.notes);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tirages")
    .update(payload)
    .eq("id", id)
    .select(TIRAGE_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTirage(data) : null;
}

export async function deleteTirage(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tirages")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function listJournal(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, datetime, text")
    .order("datetime", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapJournal);
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, datetime, text")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapJournal(data) : null;
}

export async function createJournalEntry(
  input: Omit<JournalEntry, "id"> & { id?: string },
): Promise<JournalEntry> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      datetime: input.datetime,
      text: input.text,
    })
    .select("id, datetime, text")
    .single();

  if (error) throw error;
  return mapJournal(data);
}

export async function updateJournalEntry(
  id: string,
  patch: Partial<Omit<JournalEntry, "id">>,
): Promise<JournalEntry | null> {
  const payload: { datetime?: string; text?: string } = {};
  if (patch.datetime !== undefined) payload.datetime = patch.datetime;
  if (patch.text !== undefined) payload.text = patch.text;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .update(payload)
    .eq("id", id)
    .select("id, datetime, text")
    .maybeSingle();

  if (error) throw error;
  return data ? mapJournal(data) : null;
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
