import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { preloadAllSectionCovers } from './lib/preloadImages.ts';
import { initServiceWorker } from './lib/offlineArchiveCache.ts';
import './index.css';

// Mount React safely with fallback
function mount() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err: any) {
    console.error('Fatal mount error in main.tsx:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: white; padding: 24px; text-align: center; font-family: sans-serif;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Display Restored</h1>
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px; max-width: 400px;">Click below to launch the Youth For Change Liberia Platform.</p>
        <button onclick="window.location.reload()" style="background: #059669; color: white; padding: 10px 20px; border-radius: 12px; font-weight: bold; border: none; cursor: pointer;">
          Reload Platform
        </button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// Non-blocking background tasks after initial paint
if (typeof window !== 'undefined') {
  const scheduleIdle = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200));

  scheduleIdle(() => {
    // Register Service Worker for offline resilience
    initServiceWorker();

    // Warm up section covers quietly in the background
    preloadAllSectionCovers();
  });
}

