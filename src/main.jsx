import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './theme.css';
import App from './App.jsx';

{ const v = new URLSearchParams(location.search).get('v'); if (v) document.documentElement.dataset.v = v; }
createRoot(document.getElementById('root')).render(<App />);

// Zoom probe for theme.css (--dpr, --zoomed). devicePixelRatio changes with browser zoom; the matchMedia resolution
// query fires when it does (MDN: "Window.devicePixelRatio", monitoring screen resolution or zoom level changes).
const probe = () => {
  const d = window.devicePixelRatio || 1;
  document.documentElement.style.setProperty('--dpr', d);
  document.getElementById('root').style.setProperty('--zoomed', d > 1 ? 1 : 0);
  matchMedia(`(resolution: ${d}dppx)`).addEventListener('change', probe, { once: true });
};
probe();
