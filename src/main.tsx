import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handlers to catch uncaught errors
window.addEventListener('error', (event) => {
  console.error('[Global Error Handler] Uncaught error:', event.error);
  console.error('[Global Error Handler] Error message:', event.message);
  console.error('[Global Error Handler] Error stack:', event.error?.stack);
  console.error('[Global Error Handler] Error filename:', event.filename);
  console.error('[Global Error Handler] Error lineno:', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Promise Rejection] Unhandled rejection:', event.reason);
  console.error('[Global Promise Rejection] Error message:', event.reason?.message);
  console.error('[Global Promise Rejection] Error stack:', event.reason?.stack);
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
