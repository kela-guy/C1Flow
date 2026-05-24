import { useState, useEffect, useRef } from "react";
import { Toaster } from "./ui/sonner";
import { accentHex } from "@/primitives/accentHex";

const VIGNETTE_DURATION_MS = 4000;

export function NotificationSystem() {
  const [criticalActive, setCriticalActive] = useState(false);
  const [vignetteColor, setVignetteColor] = useState<string>(accentHex('danger'));
  const vignetteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startVignette = (color: string) => {
      setVignetteColor(color);
      setCriticalActive(true);
      if (vignetteTimerRef.current) clearTimeout(vignetteTimerRef.current);
      vignetteTimerRef.current = setTimeout(() => setCriticalActive(false), VIGNETTE_DURATION_MS);
    };

    const handleCritical = () => startVignette(accentHex('danger'));
    const handleSuspect = () => startVignette(accentHex('warning'));

    window.addEventListener('trigger-critical-alert', handleCritical);
    window.addEventListener('trigger-suspect-alert', handleSuspect);

    return () => {
      window.removeEventListener('trigger-critical-alert', handleCritical);
      window.removeEventListener('trigger-suspect-alert', handleSuspect);
      if (vignetteTimerRef.current) clearTimeout(vignetteTimerRef.current);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className={`notif-vignette fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ease-out ${
          criticalActive ? 'visible' : 'invisible'
        }`}
        style={{
          opacity: criticalActive ? 0.4 : 0,
          boxShadow: `inset 0 0 40px 20px ${vignetteColor}`,
          animation: criticalActive ? 'notif-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        }}
      />

      <style>{`
        @keyframes notif-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .notif-vignette { animation: none !important; }
        }
      `}</style>

      <Toaster />
    </>
  );
}
