import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraFeedTile } from '@/app/components/camera-v2/CameraFeedTile';
import type { CameraAngle } from '@/app/components/camera-v2/CameraSettingsMenu';
import { useCrosshairBloom } from '@/app/components/camera-v2/useCrosshairBloom';
import type {
  CameraFeed,
  CameraStatus,
  DetectionBox,
  DayNightMode,
  FeedDeviceType,
} from '@/app/components/camera-v2/types';
import {
  RAIL_DESIGN_OPTIONS,
  SandboxSetpointRail,
  type RailDesign,
} from './SandboxSetpointRail';
import { SandboxPassiveTelemetry, type PassiveComposition } from './SandboxPassiveTelemetry';
import { SandboxBottomChrome } from './SandboxBottomChrome';
import { AiDetectionTriangles } from './AiDetectionTriangles';
import { AutoTrackOverlay } from './AutoTrackOverlay';
import { DeviceConnectivityBadge } from './DeviceConnectivityBadge';
import { SandboxCompassControl } from './SandboxCompassControl';

const VIDEO_SRC_DAY = '/videos/target-feed.mov';
const VIDEO_SRC_NIGHT = '/videos/weapon-feed.mp4';
const CAMERA_ID = 'sandbox-drone-1';

export type SandboxAssetType = FeedDeviceType | 'pathfinder';

const ASSET_OPTIONS: { id: SandboxAssetType; label: string }[] = [
  { id: 'drone', label: 'Drone · ALT/SPD + dock chrome' },
  { id: 'camera', label: 'Camera · minimal HUD' },
  { id: 'pathfinder', label: 'Pathfinder · auto-track + angles' },
];

function assetToDeviceType(asset: SandboxAssetType): FeedDeviceType {
  return asset === 'camera' ? 'camera' : 'drone';
}

const COMPOSITION_OPTIONS: { id: PassiveComposition; label: string }[] = [
  { id: 'D', label: 'D · Top strip' },
  { id: 'A', label: 'A · Bottom center' },
  { id: 'B', label: 'B · Top right' },
  { id: 'C', label: 'C · Rail only' },
  { id: 'E', label: 'E · Corners' },
  { id: 'F', label: 'F · Minimal corners' },
];

function baseStatus(
  controlOwner: CameraStatus['controlOwner'],
  deviceType: FeedDeviceType,
  bearingDeg: number,
): CameraStatus {
  return {
    bearingDeg,
    fovDeg: 52,
    controlOwner,
    deviceType,
    altitudeM: 120,
    velocityMps: 8.5,
    batteryPct: 74,
    distanceFromHomeM: 412,
    signalPct: 88,
    areaName: 'Sector 7',
  };
}

const SANDBOX_DETECTIONS: DetectionBox[] = [
  { id: 'det-1', x: 0.34, y: 0.42, w: 0.12, h: 0.18, label: 'Person', confidence: 0.92 },
  { id: 'det-2', x: 0.58, y: 0.36, w: 0.16, h: 0.12, label: 'Vehicle', confidence: 0.78 },
  { id: 'det-3', x: 0.12, y: 0.62, w: 0.1, h: 0.1, label: 'Person', confidence: 0.65 },
];

const noop = () => {};

export default function VideoHudSandbox() {
  const [assetType, setAssetType] = useState<SandboxAssetType>('pathfinder');
  const [foreignLocked, setForeignLocked] = useState(false);
  const [showBottomChrome, setShowBottomChrome] = useState(true);
  const [composition, setComposition] = useState<PassiveComposition>('C');
  const [railDesign, setRailDesign] = useState<RailDesign>('tube-chips');
  const [targetAltitudeM, setTargetAltitudeM] = useState(140);
  const [targetVelocityMps, setTargetVelocityMps] = useState(10);
  const [zoomLevel, setZoomLevel] = useState(2.4);
  const [mode, setMode] = useState<DayNightMode>('day');
  const [detectionsOn, setDetectionsOn] = useState(false);
  const [playbackOn, setPlaybackOn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dockArmed, setDockArmed] = useState(false);
  const [stopArmed, setStopArmed] = useState(false);
  const [railAlwaysOpen, setRailAlwaysOpen] = useState(false);
  const [holdMotion, setHoldMotion] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [videoHovered, setVideoHovered] = useState(false);
  const [mutedAlerts, setMutedAlerts] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('straight');
  const [autoTrackArmed, setAutoTrackArmed] = useState(false);
  const [bearingDeg, setBearingDeg] = useState(245);
  const pulseTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (pulseTimerRef.current != null) window.clearTimeout(pulseTimerRef.current);
    },
    [],
  );

  const handlePulse = useCallback(() => {
    setPulsing(true);
    if (pulseTimerRef.current != null) window.clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = window.setTimeout(() => {
      setPulsing(false);
      pulseTimerRef.current = null;
    }, 350);
  }, []);

  const crosshairBloom = useCrosshairBloom(holdMotion || pulsing);

  const isAirborne = assetType !== 'camera';
  const controlOwner: CameraStatus['controlOwner'] = foreignLocked ? 'other' : 'self';
  const writeDisabled = controlOwner === 'other';

  const status = useMemo<CameraStatus>(
    () => baseStatus(controlOwner, assetToDeviceType(assetType), bearingDeg),
    [controlOwner, assetType, bearingDeg],
  );

  const feed = useMemo<CameraFeed>(
    () => ({
      cameraId: CAMERA_ID,
      mode,
      showDetections: detectionsOn,
    }),
    [mode, detectionsOn],
  );

  const handleModeToggle = useCallback(
    () => setMode((m) => (m === 'day' ? 'night' : 'day')),
    [],
  );

  const handleDetectionsToggle = useCallback(() => setDetectionsOn((v) => !v), []);
  const handlePlaybackToggle = useCallback(() => setPlaybackOn((v) => !v), []);
  const handleFullscreenToggle = useCallback(() => setIsFullscreen((v) => !v), []);
  const handleDockToggle = useCallback(() => setDockArmed((v) => !v), []);
  const handleStopToggle = useCallback(() => setStopArmed((v) => !v), []);
  const handleMutedAlertsToggle = useCallback(() => setMutedAlerts((v) => !v), []);
  const handleAutoTrackStart = useCallback(() => setAutoTrackArmed(true), []);
  const handleAutoTrackReleased = useCallback(() => setAutoTrackArmed(false), []);
  const handleVideoEnter = useCallback(() => setVideoHovered(true), []);
  const handleVideoLeave = useCallback(() => setVideoHovered(false), []);

  useEffect(() => {
    if (assetType !== 'pathfinder') setAutoTrackArmed(false);
  }, [assetType]);

  const shellClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-surface-void'
    : 'relative aspect-video w-full bg-black ring-1 ring-inset ring-border-default';

  return (
    <div className="min-h-screen w-full bg-surface-1 text-slate-12 flex flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-2.5 text-[12px] shrink-0">
        <span className="font-mono text-slate-9">/video-hud-sandbox</span>
        <span className="text-slate-11">
          {assetType === 'camera'
            ? 'Camera HUD — minimal corners'
            : assetType === 'pathfinder'
              ? 'Pathfinder HUD — auto-track + angles'
              : 'Drone HUD — hover ALT/SPD scrub'}
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-slate-10 cursor-pointer">
            <input
              type="checkbox"
              checked={foreignLocked}
              onChange={(e) => setForeignLocked(e.target.checked)}
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
          {isAirborne && (
            <label className="flex items-center gap-1.5 text-slate-10 cursor-pointer">
              <input
                type="checkbox"
                checked={railAlwaysOpen}
                onChange={(e) => setRailAlwaysOpen(e.target.checked)}
                className="rounded border-border-default"
              />
              Rail always open
            </label>
          )}
          <label className="flex items-center gap-1.5 text-slate-10 cursor-pointer">
            <input
              type="checkbox"
              checked={holdMotion}
              onChange={(e) => setHoldMotion(e.target.checked)}
              className="rounded border-border-default"
            />
            Simulate camera motion
          </label>
          <button
            type="button"
            onClick={handlePulse}
            className="bg-surface-2 border border-border-default rounded px-2 py-1 text-[11px] text-slate-11 hover:border-border-strong"
          >
            Pulse
          </button>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as SandboxAssetType)}
            className="bg-surface-2 border border-border-default rounded px-2 py-1 text-[11px] text-slate-11"
            aria-label="Asset type"
          >
            {ASSET_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {isAirborne && (
            <select
              value={composition}
              onChange={(e) => setComposition(e.target.value as PassiveComposition)}
              className="bg-surface-2 border border-border-default rounded px-2 py-1 text-[11px] text-slate-11"
              aria-label="Passive telemetry composition"
            >
              {COMPOSITION_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          {isAirborne && (
            <select
              value={railDesign}
              onChange={(e) => setRailDesign(e.target.value as RailDesign)}
              className="bg-surface-2 border border-border-default rounded px-2 py-1 text-[11px] text-slate-11"
              aria-label="Setpoint rail design"
            >
              {RAIL_DESIGN_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <SandboxCompassControl
            bearingDeg={bearingDeg}
            onBearingChange={setBearingDeg}
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="w-full max-w-5xl">
          <p className="text-[11px] text-slate-9 mb-3 text-center">
            Paper baseline: ALT/SPD on the left, passive telemetry on the right, bottom chrome locked to 4SB.
          </p>
          <div
            className={shellClass}
            onPointerEnter={handleVideoEnter}
            onPointerLeave={handleVideoLeave}
          >
            <CameraFeedTile
              feed={feed}
              cameraLabel={
                assetType === 'camera'
                  ? 'CAM-01 · Sandbox'
                  : assetType === 'pathfinder'
                    ? 'PTH-01 · Sandbox'
                    : 'DRN-01 · Sandbox'
              }
              status={status}
              detections={[]}
              videoSrcDay={VIDEO_SRC_DAY}
              videoSrcNight={VIDEO_SRC_NIGHT}
              isFullscreen={isFullscreen}
              tileVariant="fill"
              suppressDroneHud
              suppressTelemetryStrip
              suppressControlBar
              showAssetPicker={false}
              crosshairBloom={crosshairBloom}
              onTakeControl={noop}
              onReleaseControl={noop}
              onModeToggle={handleModeToggle}
              onDetectionsToggle={handleDetectionsToggle}
              onDesignateModeToggle={noop}
              onPlaybackToggle={handlePlaybackToggle}
              onPlaybackChange={noop}
              onZoomChange={setZoomLevel}
              onFullscreenToggle={handleFullscreenToggle}
              onDropDevice={noop}
            />
            {detectionsOn && (
              <AiDetectionTriangles detections={SANDBOX_DETECTIONS} />
            )}
            {assetType === 'pathfinder' && (
              <AutoTrackOverlay
                armed={autoTrackArmed}
                onReleased={handleAutoTrackReleased}
              />
            )}
            {isAirborne && (
              <SandboxSetpointRail
                altitudeM={status.altitudeM ?? 0}
                velocityMps={status.velocityMps ?? 0}
                batteryPct={status.batteryPct ?? undefined}
                targetAltitudeM={targetAltitudeM}
                targetVelocityMps={targetVelocityMps}
                disabled={writeDisabled}
                forceExpanded={railAlwaysOpen}
                design={railDesign}
                onTargetAltitudeChange={setTargetAltitudeM}
                onTargetVelocityChange={setTargetVelocityMps}
              />
            )}
            <SandboxPassiveTelemetry
              status={status}
              composition={composition}
              deviceType={assetToDeviceType(assetType)}
              topRightOffset
            />
            <DeviceConnectivityBadge />
            {showBottomChrome && (
              <SandboxBottomChrome
                mode={mode}
                onModeToggle={handleModeToggle}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                deviceType={assetToDeviceType(assetType)}
                controlOwner={controlOwner}
                onTakeRelease={noop}
                detectionsOn={detectionsOn}
                playbackOn={playbackOn}
                onDetectionsToggle={handleDetectionsToggle}
                onPlaybackToggle={handlePlaybackToggle}
                settingsOpen={settingsOpen}
                onSettingsOpenChange={setSettingsOpen}
                isFullscreen={isFullscreen}
                onFullscreenToggle={handleFullscreenToggle}
                dockArmed={dockArmed}
                stopArmed={stopArmed}
                onDockToggle={handleDockToggle}
                onStopToggle={handleStopToggle}
                videoHovered={videoHovered}
                mutedAlerts={mutedAlerts}
                onMutedAlertsToggle={handleMutedAlertsToggle}
                deviceKind={assetType}
                cameraAngle={cameraAngle}
                onCameraAngleChange={setCameraAngle}
                onAutoTrackStart={handleAutoTrackStart}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
