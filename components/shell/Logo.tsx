/* eslint-disable @next/next/no-img-element -- static SVGs from public/brand */

// The PrepPlay logo, light and dark versions swapped by CSS (see .logo-light /
// .logo-dark in globals.css) so it follows the theme without a flash.
// `compact` shows only the mark on phones.
export function Logo({ height = 34, compact = false }: { height?: number; compact?: boolean }) {
  const width = Math.round((height * 257.7) / 68);

  return (
    <>
      <span className={compact ? "hidden sm:inline-flex" : "inline-flex"}>
        <img src="/brand/prepplay-logo.svg" alt="PrepPlay" width={width} height={height} className="logo-light" />
        <img src="/brand/prepplay-logo-dark.svg" alt="PrepPlay" width={width} height={height} className="logo-dark" />
      </span>
      {compact ? (
        <img src="/brand/prepplay-mark.svg" alt="PrepPlay" width={height} height={height} className="sm:hidden" />
      ) : null}
    </>
  );
}
