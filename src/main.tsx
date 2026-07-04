import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/rubik';
import './sw';
import './styles.css';
import App from './App';

// Просим браузер не вычищать IndexedDB при нехватке места.
navigator.storage?.persist?.();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
