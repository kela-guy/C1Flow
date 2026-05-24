import { inject } from '@vercel/analytics';
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

const RUM_ENDPOINT = import.meta.env.VITE_RUM_ENDPOINT as string | undefined;

function sendMetric(metric: Metric) {
  if (!RUM_ENDPOINT) return;

  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    url: window.location.href,
    path: window.location.pathname,
    ts: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(RUM_ENDPOINT, body);
    return;
  }

  void fetch(RUM_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function setupRum() {
  inject();

  onLCP(sendMetric);
  onINP(sendMetric);
  onCLS(sendMetric);
}
