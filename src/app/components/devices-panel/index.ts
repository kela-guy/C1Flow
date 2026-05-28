/**
 * Public surface of the Devices Panel package.
 *
 * Consumers (Dashboard, Playground, Styleguide, camera DnD drop
 * targets, the i18n catalog) should import from
 * `@/shared/components/DevicesPanel`, which re-exports this barrel.
 */

export { DevicesPanel } from './DevicesPanelImpl';
export { DeviceRow } from './DeviceRow';
export { DevicesIcon } from './icons';

export {
  DEVICE_CAMERA_DRAG_TYPE,
  DEFAULT_TYPE_LABELS,
  DEFAULT_CONNECTION_STATE_LABELS,
  DEFAULT_DEVICE_PANEL_STRINGS,
  DEFAULT_SPEAKER_TRACKS,
} from './constants';

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
} from './types';
