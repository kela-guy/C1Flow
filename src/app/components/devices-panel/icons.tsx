/**
 * SVG glyphs owned by the Devices Panel.
 *
 * `DevicesIcon` is the rail/launcher button used by the dashboard
 * shell. `PlayFilledIcon` is the rounded-corner play triangle used by
 * the speaker Play/Stop button.
 */

export function DevicesIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M4 5C4 4.44772 4.44772 4 5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5Z"
        stroke="currentColor"
        strokeWidth="1.995"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15C4 14.4477 4.44772 14 5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15Z"
        stroke="currentColor"
        strokeWidth="1.995"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 5C14 4.44772 14.4477 4 15 4H19C19.5523 4 20 4.44772 20 5V9C20 9.55228 19.5523 10 19 10H15C14.4477 10 14 9.55228 14 9V5Z"
        stroke="currentColor"
        strokeWidth="1.995"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 17C14 15.3431 15.3431 14 17 14C18.6569 14 20 15.3431 20 17C20 18.6569 18.6569 20 17 20C15.3431 20 14 18.6569 14 17Z"
        stroke="currentColor"
        strokeWidth="1.995"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Solid filled play glyph. Matches the rounded-corner triangle from
 * the design library — used by the speaker Play/Stop button.
 */
export function PlayFilledIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5145 2.14251C6.20556 1.95715 5.82081 1.95229 5.5073 2.1298C5.19379 2.30731 5 2.63973 5 3V21C5 21.3603 5.19379 21.6927 5.5073 21.8702C5.82081 22.0477 6.20556 22.0429 6.5145 21.8575L21.5145 12.8575C21.8157 12.6768 22 12.3513 22 12C22 11.6487 21.8157 11.3232 21.5145 11.1425L6.5145 2.14251Z" />
    </svg>
  );
}
