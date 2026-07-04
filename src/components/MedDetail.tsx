import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import type { Med } from '../types';
import { getMed, removeMed, saveMed, settings } from '../db';
import { expiryState, formatExpiry } from '../expiry';
import { go, vibrate } from '../route';
import Screen from './Screen';
import { IconBack, IconPencil, IconTrash } from './icons';

interface Props {
  med: Med | undefined;
  onChanged: () => Promise<void>;
}

export default function MedDetail({ med, onChanged }: Props) {
  // ponytail: зависимость по id+size, не по ссылке — IndexedDB отдаёт новый Blob на каждый
  // refresh, и URL пересоздавался бы (мигание фото) при каждом тапе по степперу.
  const photoUrl = useMemo(
    () => (med?.photo ? URL.createObjectURL(med.photo) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [med?.id, med?.photo?.size],
  );
  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  const opChain = useRef(Promise.resolve());

  useEffect(() => {
    if (!med) go.list();
  }, [med]);
  if (!med) return null;

  const st = expiryState(med.expiry, settings.leadDays);

  function bump(delta: number) {
    if (!med) return;
    const id = med.id;
    vibrate();
    // Цепочка сериализует быстрые тапы: каждый читает свежее qty из базы,
    // иначе два «+» подряд считались бы от одного устаревшего значения.
    opChain.current = opChain.current.then(async () => {
      const fresh = await getMed(id);
      if (!fresh) return;
      const qty = Math.max(0, fresh.qty + delta);
      if (qty === fresh.qty) return;
      await saveMed({ ...fresh, qty, updatedAt: Date.now() });
      await onChanged();
    });
  }

  async function del() {
    if (!med) return;
    if (!confirm(`Удалить «${med.name}» из аптечки?`)) return;
    await removeMed(med.id);
    await onChanged();
    go.list();
  }

  return (
    <Screen>
      <header className="topbar">
        <button className="icon-btn" onClick={go.back} aria-label="Назад">
          <IconBack />
        </button>
        <div className="topbar-spacer" />
        <button className="icon-btn" onClick={() => go.edit(med.id)} aria-label="Изменить">
          <IconPencil />
        </button>
        <button className="icon-btn danger" onClick={del} aria-label="Удалить">
          <IconTrash />
        </button>
      </header>

      {photoUrl && <img className="photo" src={photoUrl} alt={med.name} />}

      <h1 className="title">{med.name}</h1>
      {med.ingredient && <p className="subtitle">{med.ingredient}</p>}

      {med.tags.length > 0 && (
        <div className="tag-row">
          {med.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="stepper" aria-label="Количество">
        <button onClick={() => bump(-1)} aria-label="Убавить">
          −
        </button>
        <motion.span
          key={med.qty}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          className="stepper-count"
        >
          {med.qty} {med.unit}
        </motion.span>
        <button onClick={() => bump(1)} aria-label="Прибавить">
          +
        </button>
      </div>
      {med.lowStock > 0 && med.qty <= med.lowStock && (
        <p className="hint low-hint">
          {med.qty === 0 ? 'Закончилось — пора купить.' : 'Заканчивается — пора докупить.'}
        </p>
      )}

      <dl className="meta">
        {med.form && (
          <>
            <dt>Форма</dt>
            <dd>{med.form}</dd>
          </>
        )}
        {med.location && (
          <>
            <dt>Где лежит</dt>
            <dd>{med.location}</dd>
          </>
        )}
        {med.expiry && (
          <>
            <dt>Годен до</dt>
            <dd className={`exp-badge ${st}`}>
              {formatExpiry(med.expiry)}
              {st === 'expired' && ' — срок истёк!'}
              {st === 'soon' && ' — скоро истечёт'}
            </dd>
          </>
        )}
      </dl>

      <Section title="Как принимать" text={med.dosage} />
      <Section title="От чего помогает" text={med.indications} />
      <Section title="Противопоказания" text={med.contraindications} />
      <Section title="Заметки" text={med.notes} />
    </Screen>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <section className="info">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}
