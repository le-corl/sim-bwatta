import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { IS_WEB_PWA } from './platform/runtime';
import './styles.css';

if (IS_WEB_PWA && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
