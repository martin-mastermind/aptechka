import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Med } from '../types';
import { saveMed, settings } from '../db';
import { analyzeMedPhoto } from '../openrouter';
import { shrinkImage } from '../image';
import { go, vibrate } from '../route';
import Screen from './Screen';
import { IconBack, IconCamera, IconSparkle } from './icons';

interface Props {
  med: Med | undefined;
  meds: Med[];
  onChanged: () => Promise<void>;
}

const UNITS = ['шт', 'табл', 'мл', 'г', 'пак', 'амп', 'доз'];

export default function MedForm({ med, meds, onChanged }: Props) {
  const [draft, setDraft] = useState(() => ({
    name: med?.name ?? '',
    ingredient: med?.ingredient ?? '',
    form: med?.form ?? '',
    dosage: med?.dosage ?? '',
    indications: med?.indications ?? '',
    contraindications: med?.contraindications ?? '',
    tagsText: med?.tags.join(', ') ?? '',
    qty: String(med?.qty ?? 1),
    unit: med?.unit ?? 'шт',
    lowStock: med?.lowStock ? String(med.lowStock) : '',
    expiry: med?.expiry ?? '',
    location: med?.location ?? '',
    notes: med?.notes ?? '',
  }));
  const [photo, setPhoto] = useState<Blob | undefined>(med?.photo);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  const locations = useMemo(
    () => [...new Set(meds.map((m) => m.location).filter(Boolean))],
    [meds],
  );

  const hasKey = Boolean(settings.apiKey);

  function set<K extends keyof typeof draft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      setPhoto(await shrinkImage(file));
    } catch {
      setPhoto(file); // не ужалось — берём как есть
    }
  }

  async function recognize() {
    if (!photo) return;
    if (!hasKey) {
      setError('Для распознавания нужен ключ API — добавьте его в настройках.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await analyzeMedPhoto(photo, settings.apiKey);
      setDraft((d) => ({
        ...d,
        name: r.name ?? d.name,
        ingredient: r.ingredient ?? d.ingredient,
        form: r.form ?? d.form,
        dosage: r.dosage ?? d.dosage,
        indications: r.indications ?? d.indications,
        contraindications: r.contraindications ?? d.contraindications,
        tagsText: r.tags?.length
          ? [...new Set([...splitTags(d.tagsText), ...r.tags])].join(', ')
          : d.tagsText,
      }));
      vibrate(15);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return; // двойной тап по «Сохранить» иначе плодит дубликаты
    const name = draft.name.trim();
    if (!name) {
      setError('Укажите название лекарства.');
      return;
    }
    setSaving(true);
    try {
      await doSave(name);
    } finally {
      setSaving(false);
    }
  }

  async function doSave(name: string) {
    const id = med?.id ?? crypto.randomUUID();
    await saveMed({
      id,
      name,
      ingredient: draft.ingredient.trim(),
      form: draft.form.trim(),
      dosage: draft.dosage.trim(),
      indications: draft.indications.trim(),
      contraindications: draft.contraindications.trim(),
      tags: splitTags(draft.tagsText),
      qty: Math.max(0, Math.round(Number(draft.qty)) || 0),
      unit: draft.unit,
      lowStock: Math.max(0, Math.round(Number(draft.lowStock)) || 0),
      expiry: draft.expiry || null,
      location: draft.location.trim(),
      notes: draft.notes.trim(),
      photo,
      createdAt: med?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    await onChanged();
    if (med) go.back();
    else location.replace(`#/med/${id}`);
  }

  return (
    <Screen>
      <header className="topbar">
        <button className="icon-btn" onClick={go.back} aria-label="Назад">
          <IconBack />
        </button>
        <h1>{med ? 'Изменить' : 'Новое лекарство'}</h1>
      </header>

      <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={onPhoto} />
      <input ref={galleryRef} hidden type="file" accept="image/*" onChange={onPhoto} />

      {photoUrl ? (
        <div className="photo-preview">
          <img className="photo" src={photoUrl} alt="Фото упаковки" />
          <div className="photo-actions">
            <button type="button" className="btn ghost small" onClick={() => cameraRef.current?.click()}>
              Переснять
            </button>
            <button type="button" className="btn ghost small" onClick={() => setPhoto(undefined)}>
              Убрать фото
            </button>
          </div>
        </div>
      ) : (
        <>
          <button type="button" className="photo-cta" onClick={() => cameraRef.current?.click()}>
            <IconCamera />
            <span>Сфотографировать упаковку</span>
          </button>
          <button type="button" className="gallery-link" onClick={() => galleryRef.current?.click()}>
            или выбрать фото из галереи
          </button>
        </>
      )}

      {photo && (
        <button type="button" className="ai-btn" disabled={busy} onClick={recognize}>
          <IconSparkle />
          {busy ? 'Распознаю…' : 'Распознать по фото'}
        </button>
      )}
      {photo && !hasKey && (
        <p className="hint block-hint">
          Для распознавания нужен бесплатный ключ OpenRouter —{' '}
          <a href="#/settings">добавить в настройках</a>.
        </p>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={save} noValidate>
        <div className="field">
          <label htmlFor="f-name">Название*</label>
          <input id="f-name" value={draft.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-ing">Действующее вещество</label>
          <input id="f-ing" value={draft.ingredient} onChange={(e) => set('ingredient', e.target.value)} />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="f-form">Форма</label>
            <input
              id="f-form"
              placeholder="таблетки, сироп…"
              value={draft.form}
              onChange={(e) => set('form', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-exp">Годен до</label>
            <input id="f-exp" type="month" value={draft.expiry} onChange={(e) => set('expiry', e.target.value)} />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="f-qty">Количество</label>
            <input
              id="f-qty"
              type="number"
              min="0"
              inputMode="numeric"
              value={draft.qty}
              onChange={(e) => set('qty', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-unit">Единица</label>
            <select id="f-unit" value={draft.unit} onChange={(e) => set('unit', e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="f-low">Напомнить докупить при…</label>
            <input
              id="f-low"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="напр. 5 — или пусто"
              value={draft.lowStock}
              onChange={(e) => set('lowStock', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-loc">Где лежит</label>
            <input
              id="f-loc"
              list="locations"
              placeholder="полка в ванной…"
              value={draft.location}
              onChange={(e) => set('location', e.target.value)}
            />
            <datalist id="locations">
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-tags">Теги-симптомы (через запятую)</label>
          <input
            id="f-tags"
            placeholder="головная боль, температура"
            value={draft.tagsText}
            onChange={(e) => set('tagsText', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-dos">Как принимать</label>
          <textarea id="f-dos" value={draft.dosage} onChange={(e) => set('dosage', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-ind">От чего помогает</label>
          <textarea id="f-ind" value={draft.indications} onChange={(e) => set('indications', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-contra">Противопоказания</label>
          <textarea
            id="f-contra"
            value={draft.contraindications}
            onChange={(e) => set('contraindications', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-notes">Заметки</label>
          <textarea id="f-notes" value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Сохраняю…' : med ? 'Сохранить' : 'Добавить в аптечку'}
        </button>
      </form>
    </Screen>
  );
}

function splitTags(text: string): string[] {
  return [
    ...new Set(
      text
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
