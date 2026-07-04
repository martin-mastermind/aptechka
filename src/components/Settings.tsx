import { useEffect, useRef, useState } from 'react';
import { exportBackup, importBackup, settings } from '../db';
import { go } from '../route';
import Screen from './Screen';
import { IconBack } from './icons';

export default function Settings({ onChanged }: { onChanged: () => Promise<void> }) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [lead, setLead] = useState(String(settings.leadDays));
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  function saveKey(v: string) {
    setApiKey(v);
    settings.apiKey = v.trim();
  }

  function saveLead(v: string) {
    setLead(v);
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) settings.leadDays = Math.round(n);
  }

  async function doExport() {
    setErr('');
    const blob = await exportBackup();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `аптечка-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Копия сохранена в загрузки.');
  }

  async function doImport(file: File | undefined) {
    if (!file) return;
    setErr('');
    setMsg('');
    try {
      const n = await importBackup(await file.text());
      await onChanged();
      setMsg(`Загружено записей: ${n}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось прочитать файл.');
    }
  }

  async function askPersist() {
    const ok = await navigator.storage?.persist?.();
    setPersisted(ok ?? false);
  }

  return (
    <Screen>
      <header className="topbar">
        <button className="icon-btn" onClick={go.back} aria-label="Назад">
          <IconBack />
        </button>
        <h1>Настройки</h1>
      </header>

      <section className="info">
        <h3>Распознавание по фото</h3>
        <div className="field">
          <label htmlFor="s-key">Ключ Gemini API</label>
          <input
            id="s-key"
            value={apiKey}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="hint">
          Бесплатный ключ:{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            aistudio.google.com/apikey
          </a>
          . Нужен только для распознавания — при нём фото упаковки отправляется в Google. Всё
          остальное хранится на этом устройстве.
        </p>
      </section>

      <section className="info">
        <h3>Срок годности</h3>
        <div className="field">
          <label htmlFor="s-lead">Предупреждать за … дней</label>
          <input
            id="s-lead"
            type="number"
            min="1"
            inputMode="numeric"
            value={lead}
            onChange={(e) => saveLead(e.target.value)}
          />
        </div>
      </section>

      <section className="info">
        <h3>Резервная копия</h3>
        <p className="hint">
          Данные живут в браузере этого устройства. Сохраняйте копию время от времени — она
          выручит при смене устройства или чистке браузера.
        </p>
        <div className="photo-actions">
          <button className="btn ghost small" onClick={doExport}>
            Сохранить копию
          </button>
          <button className="btn ghost small" onClick={() => importRef.current?.click()}>
            Загрузить копию
          </button>
        </div>
        <input
          ref={importRef}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            doImport(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {persisted === false && (
          <p className="hint">
            Браузер может удалить данные при нехватке места.{' '}
            <button className="link-like" onClick={askPersist}>
              Разрешить постоянное хранение
            </button>
          </p>
        )}
        {msg && (
          <p className="ok-msg" role="status">
            {msg}
          </p>
        )}
        {err && (
          <p className="error" role="alert">
            {err}
          </p>
        )}
      </section>
    </Screen>
  );
}
