// Build-time render of the page to HTML (see scripts/prerender.mjs), so the
// first paint and search engines don't wait for JavaScript.
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export function render() {
  return renderToString(<App />);
}
