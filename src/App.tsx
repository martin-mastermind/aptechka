import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import type { Med } from './types';
import { listMeds } from './db';
import { applyUpdate, swState } from './sw';
import { useRoute } from './route';
import MedList from './components/MedList';
import MedDetail from './components/MedDetail';
import MedForm from './components/MedForm';
import Settings from './components/Settings';

export default function App() {
  const route = useRoute();
  const [meds, setMeds] = useState<Med[] | null>(null);

  const refresh = useCallback(async () => {
    setMeds(await listMeds());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!meds) return null;

  const key = route.view + ('id' in route ? ':' + (route.id ?? '') : '');

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        {route.view === 'list' && <MedList key={key} meds={meds} />}
        {route.view === 'detail' && (
          <MedDetail key={key} med={meds.find((m) => m.id === route.id)} onChanged={refresh} />
        )}
        {route.view === 'form' && (
          <MedForm
            key={key}
            med={route.id ? meds.find((m) => m.id === route.id) : undefined}
            meds={meds}
            onChanged={refresh}
          />
        )}
        {route.view === 'settings' && <Settings key={key} onChanged={refresh} />}
      </AnimatePresence>
      <UpdateToast />
    </MotionConfig>
  );
}

function UpdateToast() {
  const [ready, setReady] = useState(swState.needRefresh);
  useEffect(() => {
    const on = () => setReady(true);
    window.addEventListener('sw-need-refresh', on);
    return () => window.removeEventListener('sw-need-refresh', on);
  }, []);
  if (!ready) return null;
  return (
    <button className="update-toast" role="status" onClick={applyUpdate}>
      Вышло обновление — нажмите, чтобы применить
    </button>
  );
}
