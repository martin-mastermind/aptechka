import { openDB, type DBSchema } from 'idb';
import type { Med } from './types';

interface AptechkaDB extends DBSchema {
  meds: { key: string; value: Med };
}

const DB = openDB<AptechkaDB>('aptechka', 1, {
  upgrade(db) {
    db.createObjectStore('meds', { keyPath: 'id' });
  },
});

export async function listMeds(): Promise<Med[]> {
  return (await DB).getAll('meds');
}

export async function getMed(id: string): Promise<Med | undefined> {
  return (await DB).get('meds', id);
}

export async function saveMed(med: Med): Promise<void> {
  await (await DB).put('meds', med);
}

export async function removeMed(id: string): Promise<void> {
  await (await DB).delete('meds', id);
}

export const settings = {
  get apiKey(): string {
    return localStorage.getItem('aptechka.apiKey') ?? '';
  },
  set apiKey(v: string) {
    localStorage.setItem('aptechka.apiKey', v);
  },
  get leadDays(): number {
    const n = Number(localStorage.getItem('aptechka.leadDays'));
    return Number.isFinite(n) && n > 0 ? n : 30;
  },
  set leadDays(v: number) {
    localStorage.setItem('aptechka.leadDays', String(v));
  },
};

// --- резервная копия ---

interface BackupMed extends Omit<Med, 'photo'> {
  photo?: string; // dataURL
}

export async function exportBackup(): Promise<Blob> {
  const meds = await listMeds();
  const plain: BackupMed[] = await Promise.all(
    meds.map(async (m) => ({
      ...m,
      photo: m.photo ? await blobToDataUrl(m.photo) : undefined,
    })),
  );
  const json = JSON.stringify({ app: 'aptechka', version: 1, meds: plain });
  return new Blob([json], { type: 'application/json' });
}

// Файл копии — граница доверия: мог быть отредактирован руками или битым,
// поэтому каждое поле приводим к нужному типу, а не доверяем JSON как есть.
export async function importBackup(text: string): Promise<number> {
  const data = JSON.parse(text) as { app?: string; meds?: unknown[] };
  if (data.app !== 'aptechka' || !Array.isArray(data.meds)) {
    throw new Error('Файл не похож на резервную копию аптечки');
  }
  let imported = 0;
  for (const raw of data.meds) {
    const m = raw as Partial<BackupMed>;
    if (typeof m.id !== 'string' || !m.id || typeof m.name !== 'string' || !m.name) continue;
    const med: Med = {
      id: m.id,
      name: m.name,
      ingredient: str(m.ingredient),
      form: str(m.form),
      dosage: str(m.dosage),
      indications: str(m.indications),
      contraindications: str(m.contraindications),
      tags: Array.isArray(m.tags) ? m.tags.filter((t): t is string => typeof t === 'string') : [],
      qty: num(m.qty),
      unit: str(m.unit) || 'шт',
      lowStock: num(m.lowStock),
      expiry: typeof m.expiry === 'string' && m.expiry ? m.expiry : null,
      location: str(m.location),
      notes: str(m.notes),
      photo: typeof m.photo === 'string' ? dataUrlToBlob(m.photo) : undefined,
      createdAt: num(m.createdAt) || Date.now(),
      updatedAt: num(m.updatedAt) || Date.now(),
    };
    await saveMed(med);
    imported++;
  }
  return imported;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function dataUrlToBlob(url: string): Blob | undefined {
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return undefined;
  const bytes = atob(m[2]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: m[1] });
}
