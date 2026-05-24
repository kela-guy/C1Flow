import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

// Dev-only perf instrumentation. The dynamic import + DEV gate ensures
// the entire `src/lib/perf` tree is dead-code-eliminated from
// production bundles. The `?perf=1` URL flag (or stored equivalent)
// inside `setupPerf` gates whether anything actually runs.
if (import.meta.env.DEV) {
  void import('./lib/perf/bootstrap').then((m) => m.setupPerf());
}

if (import.meta.env.PROD) {
  void import('./lib/rum').then((m) => m.setupRum());
}

createRoot(document.getElementById('root')!).render(<App />);
