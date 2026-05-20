import { useCallback, useMemo, useState } from 'react';
import { CameraFeedTile } from '@/app/components/camera-v2/CameraFeedTile';
import type { CameraFeed, CameraStatus, DayNightMode } from '@/app/components/camera-v2/types';
import { SandboxSetpointRail } from './SandboxSetpointRail';
import { SandboxPassiveTelemetry, type PassiveComposition } from './SandboxPassiveTelemetry';
import { SandboxBottomChrome } from './SandboxBottomChrome';

const VIDEO_SRC_DAY = '/videos/target-feed.mov';
const VIDEO_SRC_NIGHT = '/videos/weapon-feed.mp4';
const CAMERA_ID = 'sandbox-drone-1';

const COMPOSITION_OPTIONS: { id: PassiveComposition; label: string }[] = [
  { id: 'D', label: 'D · Top strip' },
  { id: 'A', label: 'A · Bottom center' },
  { id: 'B', label: 'B · Top right' },
  { id: 'C', label: 'C · Right stack' },
  { id: 'E', label: 'E · Corners' },
  { id: 'F', label: 'F · Minimal corners' },
];

function baseStatus(controlOwner: CameraStatus['controlOwner']): CameraStatus {
  return {
    bearingDeg: 245,
    fovDeg: 52,
    controlOwner,
    deviceType: 'drone',
    altitudeM: 120,
    velocityMps: 8.5,
    batteryPct: 74,
    distanceFromHomeM: 412,
    signalPct: 88,
    areaName: 'Sector 7',
  };
}

export default function VideoHudSandbox() {
  const [locked, setLocked] = useState(false);
  const [showBottomChrome, setShowBottomChrome] = useState(true);
  const [composition, setComposition] = useState<PassiveComposition>('C');
  const [targetAltitudeM, setTargetAltitudeM] = useState(140);
  const [targetVelocityMps, setTargetVelocityMps] = useState(10);
  const [zoomLevel, setZoomLevel] = useState(2.4);
  const [mode, setMode] = useState<DayNightMode>('day');

  const controlOwner = locked ? 'other' : 'self';

  const status = useMemo<CameraStatus>(
    () => ({
      ...baseStatus(controlOwner),
      altitudeM: 120,
      velocityMps: 8.5,
    }),
    [controlOwner],
  );

  const feed = useMemo<CameraFeed>(
    () => ({
      cameraId: CAMERA_ID,
      mode,
      showDetections: false,
    }),
    [mode],
  );

  const handleModeToggle = useCallback(
    () => setMode((m) => (m === 'day' ? 'night' : 'day')),
    [],
  );

  const handleTakeControl = useCallback(() => setLocked(false), []);
  const handleReleaseControl = useCallback(() => setLocked(true), []);

  return (
    <div className="min-h-screen w-full bg-surface-1 text-slate-12 flex flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-2.5 text-[12px] shrink-0">
        <span className="font-mono text-slate-9">/video-hud-sandbox</span>
        <span className="text-slate-11">Drone HUD — hover ALT/SPD scrub</span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-slate-10 cursor-pointer">
            <input
              type="checkbox"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
              className="rounded border-border-default"
            />
            Foreign locked
          </label>
          <label className="flex items-center gap-1.5 text-slate-10 cursor-pointer">
            <input
              type="checkbox"
              checked={showBottomChrome}
              onChange={(e) => setShowBottomChrome(e.target.checked)}
              className="rounded border-border-default"
            />
            Bottom chrome
          </label>
          <select
            value={composition}
            onChange={(e) => setComposition(e.target.value as PassiveComposition)}
            className="bg-surface-2 border border-border-default rounded px-2 py-1 text-[11px] text-slate-11"
          >
            {COMPOSITION_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="w-full max-w-5xl">
          <p className="text-[11px] text-slate-9 mb-3 text-center">
            Paper baseline: ALT/SPD on the left, passive telemetry on the right, bottom chrome locked to 4SB.
          </p>
          <div className="relative aspect-video w-full bg-black ring-1 ring-inset ring-border-default">
            <CameraFeedTile
              feed={feed}
              cameraLabel="DRN-01 · Sandbox"
              status={status}
              detections={[]}
              videoSrcDay={VIDEO_SRC_DAY}
              videoSrcNight={VIDEO_SRC_NIGHT}
              isFullscreen={false}
              tileVariant="fill"
              suppressDroneHud
              suppressTelemetryStrip
              suppressControlBar
              showAssetPicker={false}
              onTakeControl={handleTakeControl}
              onReleaseControl={handleReleaseControl}
              onModeToggle={handleModeToggle}
              onDetectionsToggle={() => {}}
              onDesignateModeToggle={() => {}}
              onPlaybackToggle={() => {}}
              onPlaybackChange={() => {}}
              onZoomChange={setZoomLevel}
              onFullscreenToggle={() => {}}
            />
            <SandboxSetpointRail
              altitudeM={status.altitudeM ?? 0}
              velocityMps={status.velocityMps ?? 0}
              targetAltitudeM={targetAltitudeM}
              targetVelocityMps={targetVelocityMps}
              disabled={locked}
              onTargetAltitudeChange={setTargetAltitudeM}
              onTargetVelocityChange={setTargetVelocityMps}
            />
            <SandboxPassiveTelemetry status={status} composition={composition} />
            {showBottomChrome && (
              <SandboxBottomChrome
                mode={mode}
                onModeToggle={handleModeToggle}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
