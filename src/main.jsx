import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// In production the HTML is pre-rendered at build time: attach to it.
// In development the root is empty: render from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

// Count the visit once the page has settled (live site only; see lib/visitor.js)
import('./lib/visitor.js').then(({ trackVisit }) => {
  const go = () => trackVisit();
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 5000 });
  else setTimeout(go, 2000);
});
