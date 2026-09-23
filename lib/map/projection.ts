/**
 * Geometry of the world map (a Mercator projection with the bounds the
 * Contentful country paths were traced against).
 */
export const MAP_WIDTH = 1009.6727;
export const MAP_HEIGHT = 665.96301;

const MAP_LEFT_LON = -169.110266;
const MAP_RIGHT_LON = 190.486279;
const MAP_BOTTOM_LAT = -58.508473;

/** Project a latitude/longitude onto the map's pixel space. */
export function geoToPixel(lat: number, lon: number): { x: number; y: number } {
  const mapLatBottomRad = (MAP_BOTTOM_LAT * Math.PI) / 180;
  const latitudeRad = (lat * Math.PI) / 180;
  const mapLngDelta = MAP_RIGHT_LON - MAP_LEFT_LON;

  const worldMapWidth = ((MAP_WIDTH / mapLngDelta) * 360) / (2 * Math.PI);
  const mapOffsetY =
    (worldMapWidth / 2) *
    Math.log((1 + Math.sin(mapLatBottomRad)) / (1 - Math.sin(mapLatBottomRad)));

  const x = (lon - MAP_LEFT_LON) * (MAP_WIDTH / mapLngDelta);
  const y =
    MAP_HEIGHT -
    ((worldMapWidth / 2) *
      Math.log((1 + Math.sin(latitudeRad)) / (1 - Math.sin(latitudeRad))) -
      mapOffsetY);

  return { x, y };
}

/** The first point of an SVG path (`M x y`), used to anchor labels. */
export function pathStartPoint(path: string): { x: number; y: number } | null {
  const match = path.match(/M\s*([-\d.]+)[,\s]+([-\d.]+)/);
  return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
}
