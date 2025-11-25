"use client";

import clsx from "clsx";

export type TravelCountry = {
  id: string;
  path: string;
  visited: boolean;
};

export default function MapClient({
  lat,
  lon,
  countries,
  showLocation = true,
  className,
  labelLine,
}: {
  lat: number | string | null | undefined;
  lon: number | string | null | undefined;
  countries: TravelCountry[];
  showLocation?: boolean;
  className?: string;
  labelLine?: { from: { x: number; y: number }; to: { x: number; y: number }; label: string } | null;
}) {
  // --- Normalize inputs ------------------------------------------------------
  const latNumRaw = Number(lat);
  const lonNumRaw = Number(lon);
  const latNum = Number.isFinite(latNumRaw) ? latNumRaw : 0;
  const lonNum = Number.isFinite(lonNumRaw) ? lonNumRaw : 0;

  const mapWidth = 1009.6727;
  const mapHeight = 665.96301;

  const { x, y } = calculatePixels(mapWidth, mapHeight, latNum, lonNum);
  const r = 3.75;

  const titleId = "worldmap-title";
  const descId = "worldmap-desc";

  return (
    <svg
      className={clsx("block w-full h-auto max-w-full select-none", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${mapWidth} ${mapHeight}`}
      preserveAspectRatio="xMidYMid meet"
      fill="#ececec"
      stroke="#666666"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth=".1"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>World map with visited countries</title>
      <desc id={descId}>
        {showLocation
          ? `Current location at latitude ${latNum.toFixed(3)}, longitude ${lonNum.toFixed(3)}. Visited countries are shaded darker.`
          : `World map showing visited countries (shaded darker). No current location data available.`}
      </desc>

      {countries.map((c) => (
        <path
          id={c.id}
          key={c.id}
          d={c.path}
          fill={c.visited ? "gray" : "#ececec"}
          aria-label={`Country ${c.id}${c.visited ? ", visited" : ""}`}
        />
      ))}

      {/* Focusable "you are here" marker - only shown when valid location exists */}
      {showLocation && (
        <circle
          cx={x + r / 2}
          cy={y + r / 2}
          r={r}
          fill="blue"
          id="GEO"
          tabIndex={0}
          role="img"
          aria-label={`Current location: ${latNum.toFixed(3)}, ${lonNum.toFixed(3)}`}
        >
          <title>Current location</title>
        </circle>
      )}

      {/* Label line for coffee origin */}
      {labelLine && (
        <g>
          <line
            x1={labelLine.from.x}
            y1={labelLine.from.y}
            x2={labelLine.to.x}
            y2={labelLine.to.y}
            stroke="#666666"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <circle
            cx={labelLine.from.x}
            cy={labelLine.from.y}
            r="3"
            fill="#666666"
          />
        </g>
      )}
    </svg>
  );
}

function calculatePixels(
  mapWidth: number,
  mapHeight: number,
  lat: number,
  lon: number
) {
  const mapLeftLon = -169.110266;
  const mapRightLon = 190.486279;
  // const mapTopLat = 83.600842; // Not used in Mercator projection calculation
  const mapBottomLat = -58.508473;
  return convertGeoToPixel(lat, lon, mapWidth, mapHeight, mapLeftLon, mapRightLon, mapBottomLat);
}

function convertGeoToPixel(
  latitude: number,
  longitude: number,
  mapWidth: number,
  mapHeight: number,
  mapLngLeft: number,
  mapLngRight: number,
  mapLatBottom: number
) {
  const mapLatBottomRad = (mapLatBottom * Math.PI) / 180;
  const latitudeRad = (latitude * Math.PI) / 180;
  const mapLngDelta = mapLngRight - mapLngLeft;

  const worldMapWidth = ((mapWidth / mapLngDelta) * 360) / (2 * Math.PI);
  const mapOffsetY =
    (worldMapWidth / 2) * Math.log((1 + Math.sin(mapLatBottomRad)) / (1 - Math.sin(mapLatBottomRad)));

  const x = (longitude - mapLngLeft) * (mapWidth / mapLngDelta);
  const y =
    mapHeight -
    ((worldMapWidth / 2) *
      Math.log((1 + Math.sin(latitudeRad)) / (1 - Math.sin(latitudeRad))) -
      mapOffsetY);

  return { x, y };
}
