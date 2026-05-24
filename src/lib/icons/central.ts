/**
 * Central Icons wrapper.
 *
 * The codebase historically imported every icon from `lucide-react`. We have
 * since adopted Central Icons (https://iconists.co/central) as the project's
 * canonical icon family. This module re-exports the icons we use under the
 * lucide-compatible names that consumers expect, so the migration was a
 * find-and-replace from `lucide-react` -> `@/lib/icons/central`.
 *
 * Variant choice (locked):
 *   - Outlined (line):  @central-icons-react/round-outlined-radius-1-stroke-1.5
 *   - Filled (paired):  @central-icons-react/round-filled-radius-1-stroke-1.5
 *
 * Three buckets live in this file:
 *
 *   1. Direct Central mappings - the bulk. Each Central icon is imported
 *      from its own subpath (`/IconName/`) so Vite/Rollup can tree-shake at
 *      the icon level (the variant package ships ~2k icons).
 *
 *   2. Paired filled twins - icons that have an off/on visual where "on"
 *      should be the filled variant (currently just `Pin`/`PinFilled` for
 *      the DevicesPanel pinned-to-feed toggle).
 *
 *   3. Local fallback glyphs - small SVGs for icons where Central has no
 *      clean equivalent. Keeping them local prevents `lucide-react` from
 *      entering the production icon chunk.
 *
 * Note for shadcn/ui primitives: the files under `src/app/components/ui/*`
 * keep their original `lucide-react` imports unchanged. Forking each shadcn
 * primitive just to swap a chevron is a high-risk change for very little
 * gain, and the visual surface (popover/dropdown chevrons, dialog X) is so
 * small that the mismatch is invisible in practice.
 *
 * Type re-cast: Central's .d.ts files declare each icon as
 * `React.FC<CentralIconBaseProps>`, where `React.FC` is resolved through
 * the package's own peer-dep chain to `@types/react@19`. Our project runs
 * React 18.3 with `@types/react@19` only available via deeper pnpm
 * resolution, so the resulting `FC` type doesn't unify with the
 * `ElementType` slots Radix/shadcn primitives expect. We re-cast every
 * Central re-export to a project-local `IconComponent` so consumers get a
 * single, JSX-friendly type instead of pulling Central's React 19 chain
 * through their site of use.
 */

import { createElement, type ComponentType, type SVGAttributes } from 'react';

import IconCamera1Raw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconCamera1';
import IconBellRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconBell';
import IconBellOffRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconBellOff';
import IconPinRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconPin';
import IconBatteryFullRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconBatteryFull';
import IconBatteryLowRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconBatteryLow';
import IconRadarRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconRadar';
import IconRadioRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconRadio';
import IconSignalTowerRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconSignalTower';
import IconMapRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconMap';
import IconMapPinRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconMapPin';
import IconCompassRoundRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconCompassRound';
import IconHomeRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconHome';
import IconBulletListRaw from '@central-icons-react/square-filled-radius-0-stroke-2/IconBulletList';
import IconLayoutGrid2Raw from '@central-icons-react/round-filled-radius-0-stroke-2/IconLayoutGrid2';
import IconVideo2Raw from '@central-icons-react/round-filled-radius-0-stroke-2/IconVideo2';
import IconChevronBottomRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconChevronBottom';
import IconChevronTopRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconChevronTop';
import IconChevronLeftRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconChevronLeft';
import IconChevronRightRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconChevronRight';
import IconChevronDoubleLeftRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconChevronDoubleLeft';
import IconChevronDoubleRightRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconChevronDoubleRight';
import IconArrowUpRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconArrowUp';
import IconArrowBottomTopRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconArrowBottomTop';
import IconCircleXRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconCircleX';
import IconPlusMediumRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconPlusMedium';
import IconCheckmark1MediumRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconCheckmark1Medium';
import IconCheckCircle2Raw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconCheckCircle2';
import IconMagnifyingGlassRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconMagnifyingGlass';
import IconLockRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconLock';
import IconUnlockedRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconUnlocked';
import IconHand5FingerRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconHand5Finger';
import IconBlockRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconBlock';
import IconTrashCanSimpleRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconTrashCanSimple';
import IconSendRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconSend';
import IconPhoneRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconPhone';
import IconBookSimpleRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconBookSimple';
import IconTagRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconTag';
import IconArrowRotateCCRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconArrowRotateCounterClockwise';
import IconEyeOpenRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconEyeOpen';
import IconEyeClosedRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconEyeClosed';
import IconPauseRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconPause';
import IconFullscreen2Raw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconFullscreen2';
import IconSplitRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconSplit';
// Off-canon variant pulled from the square-filled-radius-0-stroke-2 family.
// Used by GridblockHeader's settings affordance specifically — that header
// asked for a more geometric, heavier-weight chrome icon to anchor the
// inline-end cluster while the rest of the dashboard stays on the
// canonical round-outlined variant. Bucket 1 (direct Central mapping) per
// the file header convention.
import IconSettingsGear4Raw from '@central-icons-react/square-filled-radius-0-stroke-2/IconSettingsGear4';
import IconColorPaletteRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconColorPalette';
import IconSettingsSliderHorRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconSettingsSliderHor';
import IconSparkles3BoldRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconSparkles3Bold';
import IconListBulletsRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconListBullets';
import IconHistoryRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconHistory';
import IconStopwatchRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconStopwatch';
import IconGaugeRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconGauge';
import IconClockRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconClock';
import IconAirplaneRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconAirplane';
import IconShipRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconShip';
import IconRulerRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconRuler';
import IconWarningSignRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconWarningSign';
import IconShieldRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconShield';
import IconInfoSimpleRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconInfoSimple';
import IconLightningBoltRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconLightningBolt';
import IconSquareArrowOutTopLeftRaw from '@central-icons-react/round-outlined-radius-1-stroke-1.5/IconSquareArrowOutTopLeft';
import IconPinFilledRaw from '@central-icons-react/round-filled-radius-1-stroke-1.5/IconPin';

/**
 * Loose icon component shape that consumers can pass as `ElementType` to
 * Radix/shadcn primitives without dragging Central's React 19 type chain
 * along. Mirrors the props we actually pass at call sites.
 */
export type IconProps = SVGAttributes<SVGSVGElement> & {
  size?: number | string;
  ariaHidden?: boolean;
};
export type IconComponent = ComponentType<IconProps>;

const asIcon = (raw: unknown): IconComponent => raw as IconComponent;

const KELA_LOGO_PATH =
  'M3.33333 6.66539L8.3275 11.6586L8.38062 11.7104C9.30423 12.5845 10.7618 12.5691 11.6667 11.6644L11.6782 11.6526L16.6667 6.66539L20 9.99808L10 19.9962L4.33981e-07 9.99808L3.33333 6.66539ZM12.3335 9.66466C12.2641 9.17696 12.0419 8.70685 11.6667 8.33174C10.7462 7.41144 9.25381 7.41144 8.33333 8.33174C7.95815 8.70685 7.73589 9.17696 7.66651 9.66466L4 5.99885L10 0L16 5.99885L12.3335 9.66466Z';

const IconKelaLogo = ({ size = 20, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'none', width: size, height: size, ...props },
    createElement('path', { fillRule: 'evenodd', clipRule: 'evenodd', d: KELA_LOGO_PATH, fill: 'currentColor' }),
  );

const X_PATH =
  'M4.04289 4.04289C4.43342 3.65237 5.06658 3.65237 5.45711 4.04289L12 10.5858L18.5429 4.04289C18.9334 3.65237 19.5666 3.65237 19.9571 4.04289C20.3476 4.43342 20.3476 5.06658 19.9571 5.45711L13.4142 12L19.9571 18.5429C20.3476 18.9334 20.3476 19.5666 19.9571 19.9571C19.5666 20.3476 18.9334 20.3476 18.5429 19.9571L12 13.4142L5.45711 19.9571C5.06658 20.3476 4.43342 20.3476 4.04289 19.9571C3.65237 19.5666 3.65237 18.9334 4.04289 18.5429L10.5858 12L4.04289 5.45711C3.65237 5.06658 3.65237 4.43342 4.04289 4.04289Z';

const IconXCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', { fillRule: 'evenodd', clipRule: 'evenodd', d: X_PATH, fill: 'currentColor' }),
  );

const SKIP_FORWARD_PATH = 'M4 4V20L12 14V20L22.6667 12L12 4V10L4 4Z';

const IconSkipForwardCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', { d: SKIP_FORWARD_PATH, fill: 'currentColor' }),
  );

const IconSkipBackCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', { d: SKIP_FORWARD_PATH, fill: 'currentColor', transform: 'scale(-1,1) translate(-24,0)' }),
  );

const PLAY_PATH =
  'M6.5145 2.14251C6.20556 1.95715 5.82081 1.95229 5.5073 2.1298C5.19379 2.30731 5 2.63973 5 3V21C5 21.3603 5.19379 21.6927 5.5073 21.8702C5.82081 22.0477 6.20556 22.0429 6.5145 21.8575L21.5145 12.8575C21.8157 12.6768 22 12.3513 22 12C22 11.6487 21.8157 11.3232 21.5145 11.1425L6.5145 2.14251Z';

const IconPlayCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', { d: PLAY_PATH, fill: 'currentColor' }),
  );

const SETTINGS_GEAR_PATH =
  'M14.0977 2.57178C14.4108 2.22782 14.9267 2.1429 15.3369 2.3794L18.6631 4.29932C19.1006 4.55201 19.2806 5.09216 19.083 5.55713L18.3896 7.18604C18.7451 7.65711 19.0502 8.16971 19.2959 8.71436C19.3193 8.76631 19.34 8.82002 19.3623 8.87256L21.1211 9.08741C21.6226 9.14862 21.9997 9.57438 22 10.0796V13.9194C22 14.4249 21.6228 14.8514 21.1211 14.9126L19.3623 15.1265C19.1058 15.7299 18.7779 16.2949 18.3887 16.811L19.083 18.4429C19.2806 18.9077 19.1003 19.4469 18.6631 19.6997L15.3369 21.6196C14.8992 21.8723 14.3419 21.7589 14.0381 21.355L12.9727 19.938C12.6534 19.9768 12.329 20.0005 12 20.0005C11.671 20.0005 11.3466 19.9768 11.0273 19.938L9.96191 21.355C9.65814 21.7588 9.10079 21.8731 8.66309 21.6206L5.33691 19.6997C4.89975 19.4468 4.71938 18.9077 4.91699 18.4429L5.61035 16.811C5.22126 16.2949 4.89319 15.7299 4.63672 15.1265L2.87891 14.9126C2.37719 14.8514 2 14.4249 2 13.9194V10.0796C2.00026 9.57438 2.37738 9.14862 2.87891 9.08741L4.6377 8.87159C4.89418 8.26875 5.22147 7.70366 5.61035 7.18799L4.91699 5.55713C4.71941 5.09218 4.89945 4.55204 5.33691 4.29932L8.66309 2.3794L8.74609 2.33643C9.16895 2.14227 9.67698 2.26578 9.96191 2.64405L11.0273 4.06104C11.3465 4.02229 11.671 4.0005 12 4.00049C12.3286 4.00049 12.6528 4.02238 12.9717 4.06104L14.0381 2.64405L14.0977 2.57178ZM12 9.00049C10.3433 9.00056 9.00016 10.3438 9 12.0005C9.00015 13.6572 10.3433 15.0004 12 15.0005C13.6568 15.0005 14.9999 13.6572 15 12.0005C14.9998 10.3438 13.6568 9.00049 12 9.00049Z';

const IconSettingsCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: SETTINGS_GEAR_PATH,
      fill: 'currentColor',
    }),
  );

const SUN_PATHS = [
  'M13 1H11V4H13V1Z',
  'M13 20H11V23H13V20Z',
  'M20.4841 4.93005L18.3598 7.05427L16.9456 5.64005L19.0698 3.51584L20.4841 4.93005Z',
  'M7.05437 18.36L5.64016 16.9458L3.51594 19.07L4.93016 20.4842L7.05437 18.36Z',
  'M20 11H23V13H20V11Z',
  'M1 11V13H4V11H1Z',
  'M18.3598 16.9458L20.4841 19.07L19.0698 20.4842L16.9456 18.36L18.3598 16.9458Z',
  'M4.93016 3.51584L3.51594 4.93005L5.64016 7.05427L7.05437 5.64005L4.93016 3.51584Z',
  'M7.75736 7.75736C10.1005 5.41421 13.8995 5.41421 16.2426 7.75736C18.5858 10.1005 18.5858 13.8995 16.2426 16.2426C13.8995 18.5858 10.1005 18.5858 7.75736 16.2426C5.41421 13.8995 5.41421 10.1005 7.75736 7.75736Z',
] as const;

const MOON_PATH =
  'M22.0333 11.7226C20.8934 12.5273 19.5024 13 18.001 13C14.135 13 11.001 9.86598 11.001 5.99999C11.001 4.49859 11.4737 3.1076 12.2783 1.9677C12.1868 1.96523 12.095 1.96399 12.0029 1.96399C6.46119 1.96399 1.96875 6.45643 1.96875 11.9981C1.96875 17.5398 6.46119 22.0323 12.0029 22.0323C17.5446 22.0323 22.037 17.5398 22.037 11.9981C22.037 11.906 22.0358 11.8141 22.0333 11.7226Z';

const IconSunCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    ...SUN_PATHS.map((d) => createElement('path', { d, fill: 'currentColor' })),
  );

const IconMoonCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', { d: MOON_PATH, fill: 'currentColor' }),
  );

const DESIGNATE_TARGET_PATHS = [
  'M3 3H9V5H5V9H3V3Z',
  'M15 3H21V9H19V5H15V3Z',
  'M5 15V19H9V21H3V15H5Z',
  'M21 15V21H15V19H19V15H21Z',
  'M12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z',
] as const;

const IconDesignateTargetCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    ...DESIGNATE_TARGET_PATHS.map((d) => createElement('path', { d, fill: 'currentColor' })),
  );

const TAKE_CONTROL_PATH =
  'M12 2C9.23858 2 7 4.23858 7 7V9H4V22H20V9H17V7C17 4.23858 14.7614 2 12 2ZM15 9V7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7V9H15ZM13 13V18H11V13H13Z';

const IconTakeControlCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: TAKE_CONTROL_PATH,
      fill: 'currentColor',
    }),
  );

const ZOOM_CIRCLE_PATH =
  'M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z';
const ZOOM_HANDLE_PATH = 'M20 20L16.05 16.05';

const IconZoomCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', {
      d: ZOOM_CIRCLE_PATH,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'square',
    }),
    createElement('path', {
      d: ZOOM_HANDLE_PATH,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'square',
    }),
  );

const EXPAND_PATH =
  'M13 3H21V11H19V6.41421L14 11.4142L12.5858 10L17.5858 5H13V3ZM11.4142 14L6.41421 19H11V21H3V13H5V17.5858L10 12.5858L11.4142 14Z';

const IconExpandCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', width: size, height: size, ...props },
    createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: EXPAND_PATH,
      fill: 'currentColor',
    }),
  );

const strokeAttrs = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const IconCrosshairCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('circle', { cx: 12, cy: 12, r: 6, ...strokeAttrs }),
    createElement('path', { d: 'M12 2v4M12 18v4M2 12h4M18 12h4', ...strokeAttrs }),
  );

const IconLoaderCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M21 12a9 9 0 1 1-6.2-8.6', ...strokeAttrs }),
  );

const IconScanLineCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M7 12h10', ...strokeAttrs }),
  );

const IconScanSearchCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M4 7V4h3M17 4h3v3M7 20H4v-3', ...strokeAttrs }),
    createElement('circle', { cx: 14, cy: 14, r: 4, ...strokeAttrs }),
    createElement('path', { d: 'm17 17 3 3', ...strokeAttrs }),
  );

const IconWrenchCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M14.7 6.3a4 4 0 0 0 5 5L11 20a2.8 2.8 0 0 1-4-4l8.7-8.7Z', ...strokeAttrs }),
  );

const IconCopyCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('rect', { x: 8, y: 8, width: 11, height: 11, rx: 2, ...strokeAttrs }),
    createElement('path', { d: 'M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1', ...strokeAttrs }),
  );

const IconDownloadCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M12 3v12M7 10l5 5 5-5M5 21h14', ...strokeAttrs }),
  );

const IconNavigationCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'm3 11 18-8-8 18-2-8-8-2Z', ...strokeAttrs }),
  );

const IconHelpCircleCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('circle', { cx: 12, cy: 12, r: 9, ...strokeAttrs }),
    createElement('path', { d: 'M9.5 9a2.7 2.7 0 1 1 4.4 2.1c-1 .7-1.9 1.3-1.9 2.9M12 17h.01', ...strokeAttrs }),
  );

const IconActivityCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M3 12h4l3-8 4 16 3-8h4', ...strokeAttrs }),
  );

const IconBirdCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M16 7c2.5.5 4 2 5 4-3 0-5.2.8-7 2.5L9 18l1.5-5C8 11.8 6 10 4 7c3.5.2 6.3 1.2 8.3 3C13 8.2 14.2 7.2 16 7Z', ...strokeAttrs }),
  );

const IconPinOffCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'm3 3 18 18M14 4l6 6-4 1-2 5-2-2M8 8 4 10l6 6-1 4 4-4', ...strokeAttrs }),
  );

const IconMessageSquareCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z', ...strokeAttrs }),
  );

const IconImageCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('rect', { x: 3, y: 5, width: 18, height: 14, rx: 2, ...strokeAttrs }),
    createElement('circle', { cx: 8, cy: 10, r: 1.5, ...strokeAttrs }),
    createElement('path', { d: 'm21 16-5-5L5 19', ...strokeAttrs }),
  );

const IconTimerResetCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M10 2h4M12 14l3-3M19 5l-2 2M6.5 7A7 7 0 1 0 19 11', ...strokeAttrs }),
    createElement('path', { d: 'M3 7h3V4', ...strokeAttrs }),
  );

const IconScanCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M4 12h16', ...strokeAttrs }),
  );

const IconMountainCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('path', { d: 'm3 20 7-12 4 6 2-3 5 9H3Z', ...strokeAttrs }),
  );

const IconRouteCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props },
    createElement('circle', { cx: 6, cy: 19, r: 2, ...strokeAttrs }),
    createElement('circle', { cx: 18, cy: 5, r: 2, ...strokeAttrs }),
    createElement('path', { d: 'M8 19h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h5', ...strokeAttrs }),
  );

const IconSquareCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('rect', { x: 5, y: 5, width: 14, height: 14, rx: 2, ...strokeAttrs }));

const IconRows2Custom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('rect', { x: 4, y: 5, width: 16, height: 5, rx: 1, ...strokeAttrs }), createElement('rect', { x: 4, y: 14, width: 16, height: 5, rx: 1, ...strokeAttrs }));

const IconGrid2x2Custom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('rect', { x: 4, y: 4, width: 6, height: 6, rx: 1, ...strokeAttrs }), createElement('rect', { x: 14, y: 4, width: 6, height: 6, rx: 1, ...strokeAttrs }), createElement('rect', { x: 4, y: 14, width: 6, height: 6, rx: 1, ...strokeAttrs }), createElement('rect', { x: 14, y: 14, width: 6, height: 6, rx: 1, ...strokeAttrs }));

const IconLayoutPanelTopCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('rect', { x: 4, y: 4, width: 16, height: 9, rx: 1, ...strokeAttrs }), createElement('path', { d: 'M4 17h4M10 17h4M16 17h4', ...strokeAttrs }));

const IconMoreHorizontalCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('path', { d: 'M5 12h.01M12 12h.01M19 12h.01', ...strokeAttrs }));

const IconCircleCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('circle', { cx: 12, cy: 12, r: 7, ...strokeAttrs }));

const IconPanelLeftCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('rect', { x: 4, y: 4, width: 16, height: 16, rx: 2, ...strokeAttrs }), createElement('path', { d: 'M10 4v16', ...strokeAttrs }));

const IconGripVerticalCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('path', { d: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01', ...strokeAttrs }));

const IconStarCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('path', { d: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z', ...strokeAttrs }));

const IconTriangleCustom = ({ size = 24, ...props }: SVGAttributes<SVGSVGElement> & { size?: number | string }) =>
  createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, ...props }, createElement('path', { d: 'M12 4 21 20H3L12 4Z', ...strokeAttrs }));

// =====================================================================
// 1. Direct Central mappings (outlined / line variant)
// =====================================================================

// --- Devices & status ---
export const LayoutGrid2 = asIcon(IconLayoutGrid2Raw);
export const Camera = asIcon(IconCamera1Raw);
export const Bell = asIcon(IconBellRaw);
export const BellOff = asIcon(IconBellOffRaw);
export const Pin = asIcon(IconPinRaw);
export const Battery = asIcon(IconBatteryFullRaw);
export const BatteryLow = asIcon(IconBatteryLowRaw);
export const Radar = asIcon(IconRadarRaw);
export const Radio = asIcon(IconRadioRaw);
export const Video = asIcon(IconVideo2Raw);
export const SignalHigh = asIcon(IconSignalTowerRaw);
// Central has no SignalLow variant; we re-use the same tower icon. The
// drone HUD already differentiates by colour + numeric bars, so the icon
// shape stays constant.
export const SignalLow = asIcon(IconSignalTowerRaw);

// --- Map & geo ---
export const Map = asIcon(IconMapRaw);
export const MapPin = asIcon(IconMapPinRaw);
export const Compass = asIcon(IconCompassRoundRaw);
export const Home = asIcon(IconHomeRaw);
export const Target = asIcon(IconBulletListRaw);

// --- Navigation: chevrons & arrows ---
export const ChevronDown = asIcon(IconChevronBottomRaw);
export const ChevronUp = asIcon(IconChevronTopRaw);
export const ChevronLeft = asIcon(IconChevronLeftRaw);
export const ChevronRight = asIcon(IconChevronRightRaw);
export const ChevronsLeft = asIcon(IconChevronDoubleLeftRaw);
export const ChevronsRight = asIcon(IconChevronDoubleRightRaw);
export const SkipBack = asIcon(IconSkipBackCustom);
export const SkipForward = asIcon(IconSkipForwardCustom);
export const ArrowUp = asIcon(IconArrowUpRaw);
export const ArrowUpDown = asIcon(IconArrowBottomTopRaw);

// --- Actions & form controls ---
export const X = asIcon(IconXCustom);
export const CircleX = asIcon(IconCircleXRaw);
export const Plus = asIcon(IconPlusMediumRaw);
export const Check = asIcon(IconCheckmark1MediumRaw);
export const CheckCircle2 = asIcon(IconCheckCircle2Raw);
export const Search = asIcon(IconMagnifyingGlassRaw);
export const Zoom = asIcon(IconZoomCustom);
export const Lock = asIcon(IconLockRaw);
export const LockOpen = asIcon(IconUnlockedRaw);
export const TakeControl = asIcon(IconTakeControlCustom);
export const Hand = asIcon(IconHand5FingerRaw);
export const Ban = asIcon(IconBlockRaw);
export const Trash2 = asIcon(IconTrashCanSimpleRaw);
export const Send = asIcon(IconSendRaw);
export const Phone = asIcon(IconPhoneRaw);
export const BookOpen = asIcon(IconBookSimpleRaw);
export const Tag = asIcon(IconTagRaw);
export const RotateCcw = asIcon(IconArrowRotateCCRaw);

// --- Eyes / visibility ---
export const Eye = asIcon(IconEyeOpenRaw);
export const EyeOff = asIcon(IconEyeClosedRaw);

// --- Media playback ---
export const Play = asIcon(IconPlayCustom);
export const Pause = asIcon(IconPauseRaw);
export const Maximize2 = asIcon(IconExpandCustom);
export const Minimize2 = asIcon(IconFullscreen2Raw);
export const SplitSquareHorizontal = asIcon(IconSplitRaw);

// --- Theme / settings ---
export const Sun = asIcon(IconSunCustom);
export const Moon = asIcon(IconMoonCustom);
export const DesignateTarget = asIcon(IconDesignateTargetCustom);
export const Settings = asIcon(IconSettingsCustom);
// Variant-suffixed: `SettingsGear4` is the square-filled Central variant
// reserved for chrome surfaces that want a heavier, more geometric glyph
// than the default. Mirrors the `LayoutGrid2` precedent — when a Central
// icon ships in multiple visual flavours and we want both available,
// keep the original mapped to its lucide name and expose the alternative
// under its Central identifier.
export const SettingsGear4 = asIcon(IconSettingsGear4Raw);
export const Palette = asIcon(IconColorPaletteRaw);
export const SlidersHorizontal = asIcon(IconSettingsSliderHorRaw);
export const Sparkles = asIcon(IconSparkles3BoldRaw);

// --- Layout / lists ---
export const List = asIcon(IconListBulletsRaw);

// --- Time ---
export const History = asIcon(IconHistoryRaw);
export const Timer = asIcon(IconStopwatchRaw);
export const Gauge = asIcon(IconGaugeRaw);
export const Clock = asIcon(IconClockRaw);

// --- Vehicles / domain glyphs ---
export const Plane = asIcon(IconAirplaneRaw);
export const Ship = asIcon(IconShipRaw);
export const Ruler = asIcon(IconRulerRaw);

// --- Status / alerts ---
export const AlertTriangle = asIcon(IconWarningSignRaw);
export const Shield = asIcon(IconShieldRaw);
// ShieldAlert in lucide is a shield with a "!" inside. Central has no
// matching combo glyph; the plain shield is the closest visual.
export const ShieldAlert = asIcon(IconShieldRaw);
export const Info = asIcon(IconInfoSimpleRaw);
export const Zap = asIcon(IconLightningBoltRaw);

// --- Misc ---
export const ExternalLink = asIcon(IconSquareArrowOutTopLeftRaw);

// =====================================================================
// 2. Paired filled twins (used by toggle / on-off states)
// =====================================================================

// `Pin` (line) <-> `PinFilled` for the DevicesPanel pinned-to-feed toggle.
// The off state uses the line `Pin` exported above; the on state uses
// `PinFilled` below. No more inline `fill="currentColor" strokeWidth={0}`
// hacks needed.
export const PinFilled = asIcon(IconPinFilledRaw);

// =====================================================================
// 3. Local fallback glyphs (no clean Central equivalent)
// =====================================================================

export const Crosshair = asIcon(IconCrosshairCustom);
export const Loader2 = asIcon(IconLoaderCustom);
export const ScanLine = asIcon(IconScanLineCustom);
export const ScanSearch = asIcon(IconScanSearchCustom);
export const Wrench = asIcon(IconWrenchCustom);
export const Copy = asIcon(IconCopyCustom);
export const Download = asIcon(IconDownloadCustom);
export const Navigation = asIcon(IconNavigationCustom);
export const HelpCircle = asIcon(IconHelpCircleCustom);
export const Activity = asIcon(IconActivityCustom);
export const Bird = asIcon(IconBirdCustom);
export const PinOff = asIcon(IconPinOffCustom);
export const MessageSquare = asIcon(IconMessageSquareCustom);
export const Image = asIcon(IconImageCustom);
export const TimerReset = asIcon(IconTimerResetCustom);
export const Scan = asIcon(IconScanCustom);
export const Mountain = asIcon(IconMountainCustom);
export const Route = asIcon(IconRouteCustom);
export const Square = asIcon(IconSquareCustom);
export const Rows2 = asIcon(IconRows2Custom);
export const Grid2x2 = asIcon(IconGrid2x2Custom);
export const LayoutPanelTop = asIcon(IconLayoutPanelTopCustom);
export const MoreHorizontal = asIcon(IconMoreHorizontalCustom);
export const Circle = asIcon(IconCircleCustom);
export const PanelLeft = asIcon(IconPanelLeftCustom);
export const GripVertical = asIcon(IconGripVerticalCustom);
export const Star = asIcon(IconStarCustom);
export const Triangle = asIcon(IconTriangleCustom);

export const CheckIcon = Check;
export const ChevronDownIcon = ChevronDown;
export const ChevronUpIcon = ChevronUp;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const CircleIcon = Circle;
export const XIcon = X;
export const SearchIcon = Search;
export const PanelLeftIcon = PanelLeft;
export const GripVerticalIcon = GripVertical;
export const MoreHorizontalIcon = MoreHorizontal;
export const ChevronsUpDown = ArrowUpDown;

// --- Brand / product logos ---
export const KelaLogo = asIcon(IconKelaLogo);
