// components/map.client.tsx
"use client";

import clsx from "clsx";

export type TravelCountry = {
  id: string;
  path: string;         // SVG path data
  visited: boolean;     // lastVisited != null
};

export default function MapClient({
  lat,
  lon,
  countries,
  className,
}: {
  lat: number;
  lon: number;
  countries: TravelCountry[];
  className?: string;
}) {
  const mapWidth = 1009.6727;
  const mapHeight = 665.96301;

  const { x, y } = calculatePixels(mapWidth, mapHeight, lat, lon);
  const r = 3.75;

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
    >
      {countries.map((c) => (
        <path
          id={c.id}
          key={c.id}
          d={c.path}
          fill={c.visited ? "gray" : "#ececec"}
        />
      ))}
      <circle cx={x + r / 2} cy={y + r / 2} r={r} fill="blue" id="GEO" />
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
  const mapTopLat = 83.600842;
  const mapBottomLat = -58.508473;
  return convertGeoToPixel(lat, lon, mapWidth, mapHeight, mapLeftLon, mapRightLon, mapBottomLat);
}

// Mercator math
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
