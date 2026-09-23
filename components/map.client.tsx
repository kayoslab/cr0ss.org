'use client';

import clsx from 'clsx';
import { MAP_HEIGHT, MAP_WIDTH, geoToPixel } from '@/lib/map/projection';

/** A country to shade on top of the base map. */
export type HighlightedCountry = {
  id: string;
  path: string;
};

/**
 * World map: the base map is one cached asset (/world-map.svg) drawn as an
 * <image>, and only the highlighted countries' paths are sent with the page.
 */
export default function MapClient({
  lat,
  lon,
  highlighted,
  showLocation = true,
  className,
  labelLine,
}: {
  lat: number | string | null | undefined;
  lon: number | string | null | undefined;
  highlighted: HighlightedCountry[];
  showLocation?: boolean;
  className?: string;
  labelLine?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    label: string;
  } | null;
}) {
  const latNumRaw = Number(lat);
  const lonNumRaw = Number(lon);
  const latNum = Number.isFinite(latNumRaw) ? latNumRaw : 0;
  const lonNum = Number.isFinite(lonNumRaw) ? lonNumRaw : 0;

  const { x, y } = geoToPixel(latNum, lonNum);
  const r = 3.75;

  const titleId = 'worldmap-title';
  const descId = 'worldmap-desc';

  return (
    <svg
      className={clsx('block h-auto w-full max-w-full select-none', className)}
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio='xMidYMid meet'
      role='img'
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>World map with highlighted countries</title>
      <desc id={descId}>
        {showLocation
          ? `Current location at latitude ${latNum.toFixed(3)}, longitude ${lonNum.toFixed(3)}. Highlighted countries are shaded darker.`
          : 'World map with highlighted countries shaded darker.'}
      </desc>

      <image
        href='/world-map.svg'
        x={0}
        y={0}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
      />

      <g
        fill='gray'
        stroke='#666666'
        strokeWidth='.1'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        {highlighted.map((c) => (
          <path
            id={c.id}
            key={c.id}
            d={c.path}
            aria-label={`Country ${c.id}, highlighted`}
          />
        ))}
      </g>

      {/* "You are here" marker, only when a valid location exists */}
      {showLocation && (
        <circle
          cx={x + r / 2}
          cy={y + r / 2}
          r={r}
          fill='oklch(0.646 0.222 41.116)'
          stroke='white'
          strokeWidth='2'
          id='GEO'
          tabIndex={0}
          role='img'
          aria-label={`Current location: ${latNum.toFixed(3)}, ${lonNum.toFixed(3)}`}
        >
          <title>Current location</title>
        </circle>
      )}

      {/* Label line for a coffee's origin */}
      {labelLine && (
        <g>
          <line
            x1={labelLine.from.x}
            y1={labelLine.from.y}
            x2={labelLine.to.x}
            y2={labelLine.to.y}
            stroke='#666666'
            strokeWidth='1'
            strokeDasharray='3,3'
          />
          <circle
            cx={labelLine.from.x}
            cy={labelLine.from.y}
            r='3'
            fill='#666666'
          />
        </g>
      )}
    </svg>
  );
}
