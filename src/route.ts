import { useEffect, useState } from 'react';

export type Route =
  | { view: 'list' }
  | { view: 'detail'; id: string }
  | { view: 'form'; id?: string }
  | { view: 'settings' };

function parse(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (a === 'med' && b) return { view: 'detail', id: b };
  if (a === 'add') return { view: 'form' };
  if (a === 'edit' && b) return { view: 'form', id: b };
  if (a === 'settings') return { view: 'settings' };
  return { view: 'list' };
}

// Хэш-роутер вместо react-router: три экрана, зато системная кнопка «назад» работает.
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = {
  list: () => {
    location.hash = '#/';
  },
  detail: (id: string) => {
    location.hash = `#/med/${id}`;
  },
  add: () => {
    location.hash = '#/add';
  },
  edit: (id: string) => {
    location.hash = `#/edit/${id}`;
  },
  settings: () => {
    location.hash = '#/settings';
  },
  back: () => {
    history.back();
  },
};

export function vibrate(ms = 8): void {
  navigator.vibrate?.(ms);
}
