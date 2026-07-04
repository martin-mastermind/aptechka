import { registerSW } from 'virtual:pwa-register';

// registerType: 'prompt' — не перезагружаем страницу сами (autoUpdate стирал бы
// недозаполненную форму), показываем кнопку «обновить» в App.
export const swState = { needRefresh: false };

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    swState.needRefresh = true;
    window.dispatchEvent(new Event('sw-need-refresh'));
  },
  onRegisteredSW(_url, registration) {
    // Вкладка на домашнем планшете может жить неделями — проверяем обновления сами раз в час.
    if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});

export function applyUpdate(): void {
  updateSW(true);
}
