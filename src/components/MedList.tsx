import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Med } from '../types';
import { settings } from '../db';
import { expiryState, formatExpiry } from '../expiry';
import { go, vibrate } from '../route';
import Screen from './Screen';
import { IconGear, IconPlus, IconSearch } from './icons';

export default function MedList({ meds }: { meds: Med[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null); // тег или '__expiring'
  const leadDays = settings.leadDays;

  const expiring = useMemo(
    () => meds.filter((m) => expiryState(m.expiry, leadDays) !== 'ok'),
    [meds, leadDays],
  );

  const chips = useMemo(() => {
    const count = new Map<string, number>();
    for (const m of meds) for (const t of m.tags) count.set(t, (count.get(t) ?? 0) + 1);
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t);
  }, [meds]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meds
      .filter((m) => {
        if (filter === '__expiring' && expiryState(m.expiry, leadDays) === 'ok') return false;
        if (filter && filter !== '__expiring' && !m.tags.includes(filter)) return false;
        if (!q) return true;
        const hay = [m.name, m.ingredient, m.indications, m.form, m.location, m.tags.join(' ')]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [meds, query, filter, leadDays]);

  return (
    <Screen>
      <header className="topbar">
        <h1>Аптечка</h1>
        <button className="icon-btn" onClick={go.settings} aria-label="Настройки">
          <IconGear />
        </button>
      </header>

      {meds.length > 0 && (
        <>
          <div className="search">
            <IconSearch />
            <input
              type="search"
              aria-label="Поиск по аптечке"
              placeholder="Что болит? Или название…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {chips.length > 0 && (
            <div className="chips">
              {chips.map((t) => (
                <button
                  key={t}
                  className={`chip${filter === t ? ' active' : ''}`}
                  aria-pressed={filter === t}
                  onClick={() => setFilter(filter === t ? null : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {expiring.length > 0 && (
            <motion.button
              className={`banner${filter === '__expiring' ? ' active' : ''}`}
              aria-pressed={filter === '__expiring'}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setFilter(filter === '__expiring' ? null : '__expiring')}
            >
              <span>⏳</span>
              <span>
                {filter === '__expiring'
                  ? 'Показаны лекарства с истекающим сроком'
                  : `Срок годности истекает: ${expiring.length} — показать`}
              </span>
            </motion.button>
          )}
        </>
      )}

      {meds.length === 0 ? (
        <div className="empty">
          <span className="big">💊</span>
          <p>
            Пока пусто. Сфотографируйте упаковку лекарства — карточка заполнится сама.
          </p>
          <button className="btn primary" onClick={go.add}>
            Добавить первое лекарство
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">
          <p>Ничего не нашлось. Попробуйте другое слово или снимите фильтр.</p>
        </div>
      ) : (
        <div className="cards">
          {shown.map((m) => {
            const st = expiryState(m.expiry, leadDays);
            const low = m.lowStock > 0 && m.qty <= m.lowStock;
            return (
              <motion.button
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                onClick={() => go.detail(m.id)}
              >
                <div className="card-main">
                  <span className="card-name">{m.name}</span>
                  {(m.form || m.location) && (
                    <span className="card-sub">
                      {[m.form, m.location].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {m.tags.length > 0 && (
                    <span className="card-tags">{m.tags.slice(0, 3).join(' · ')}</span>
                  )}
                </div>
                <div className="card-side">
                  <span className={`qty-badge${m.qty === 0 ? ' zero' : low ? ' low' : ''}`}>
                    {m.qty} {m.unit}
                  </span>
                  {m.expiry && (
                    <span className={`exp-badge ${st}`}>
                      {st === 'expired' ? 'срок истёк' : `до ${formatExpiry(m.expiry)}`}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <motion.button
        className="fab"
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          vibrate();
          go.add();
        }}
        aria-label="Добавить лекарство"
      >
        <IconPlus />
      </motion.button>
    </Screen>
  );
}
