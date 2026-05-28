/**
 * Compatibility facade for the Devices Panel.
 *
 * Implementation lives under `./devices-panel/` — this file exists so
 * existing consumers keep working with their current import paths:
 *
 *   import { DevicesPanel, DeviceRow, DevicesIcon, DEVICE_CAMERA_DRAG_TYPE,
 *     DEFAULT_SPEAKER_TRACKS, type Device, type DeviceCameraDragItem }
 *     from '@/shared/components/DevicesPanel';
 *
 * Add new exports to `./devices-panel/index.ts`, not here.
 */

export {
  DevicesPanel,
  DeviceRow,
  DevicesIcon,
  DEVICE_CAMERA_DRAG_TYPE,
  DEFAULT_TYPE_LABELS,
  DEFAULT_CONNECTION_STATE_LABELS,
  DEFAULT_DEVICE_PANEL_STRINGS,
  DEFAULT_SPEAKER_TRACKS,
} from './devices-panel';

export type {
  CameraCapability,
  ConnectionState,
  Device,
  DeviceCameraDragItem,
  DeviceRowProps,
  DeviceType,
  DevicesPanelProps,
  DevicesPanelStrings,
  OperationalStatus,
  SpeakerTrack,
} from './devices-panel';
