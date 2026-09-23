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
  const match = path.match(/[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/);
  return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
}

const PATH_TOKEN = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
/** Arguments per command; a command repeats its arguments implicitly. */
const ARITY: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

/**
 * Rewrite an SVG path at `decimals` digits of precision. The Contentful
 * country paths use relative moves with three decimals on a ~1000-unit
 * viewBox, which is far more than renders.
 *
 * Every point is first made absolute and rounded, so error never accumulates
 * along a coastline; lines are then emitted as deltas between those rounded
 * points (short tokens, exactly reproducible), curves and arcs stay absolute.
 */
export function compactSvgPath(d: string, decimals = 1): string {
  const tokens = [...d.matchAll(PATH_TOKEN)].map((m) => m[1] ?? m[2]);
  const round = (n: number) => Number(n.toFixed(decimals));
  const fmt = (n: number) => String(round(n));

  let out = '';
  let lastEmitted = '';
  // Exact current point (for resolving relative input) and the rounded point
  // the output has actually reached (for emitting exact deltas).
  let x = 0;
  let y = 0;
  let rx = 0;
  let ry = 0;
  let startX = 0;
  let startY = 0;
  let rStartX = 0;
  let rStartY = 0;
  let i = 0;
  let cmd = '';

  const emit = (command: string, args: number[]) => {
    if (command !== lastEmitted) {
      out += command;
      lastEmitted = command;
    } else if (args.length > 0) {
      out += ' ';
    }
    out += args.map(fmt).join(' ');
  };
  const moveTo = (nx: number, ny: number) => {
    const tx = round(nx);
    const ty = round(ny);
    emit('m', [tx - rx, ty - ry]);
    rx = tx;
    ry = ty;
    rStartX = tx;
    rStartY = ty;
  };
  const lineTo = (nx: number, ny: number) => {
    const tx = round(nx);
    const ty = round(ny);
    const dx = round(tx - rx);
    const dy = round(ty - ry);
    if (dx === 0 && dy === 0) return;
    if (dy === 0) emit('h', [dx]);
    else if (dx === 0) emit('v', [dy]);
    else emit('l', [dx, dy]);
    rx = tx;
    ry = ty;
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token;
      i++;
      if (cmd.toUpperCase() === 'Z') {
        emit('z', []);
        x = startX;
        y = startY;
        rx = rStartX;
        ry = rStartY;
        continue;
      }
    }
    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    const n = ARITY[upper];
    if (n === undefined || i + n > tokens.length) break;
    const a = tokens.slice(i, i + n).map(Number);
    i += n;

    switch (upper) {
      case 'M':
        x = rel ? x + a[0] : a[0];
        y = rel ? y + a[1] : a[1];
        startX = x;
        startY = y;
        moveTo(x, y);
        cmd = rel ? 'l' : 'L'; // implicit linetos follow a moveto
        break;
      case 'L':
      case 'T':
        x = rel ? x + a[0] : a[0];
        y = rel ? y + a[1] : a[1];
        if (upper === 'T') {
          emit('T', [x, y]);
          rx = round(x);
          ry = round(y);
        } else lineTo(x, y);
        break;
      case 'H':
        x = rel ? x + a[0] : a[0];
        lineTo(x, y);
        break;
      case 'V':
        y = rel ? y + a[0] : a[0];
        lineTo(x, y);
        break;
      case 'C':
      case 'S':
      case 'Q': {
        const abs = a.map((v, k) => (rel ? v + (k % 2 === 0 ? x : y) : v));
        x = abs[abs.length - 2];
        y = abs[abs.length - 1];
        emit(upper, abs);
        rx = round(x);
        ry = round(y);
        break;
      }
      case 'A': {
        x = rel ? x + a[5] : a[5];
        y = rel ? y + a[6] : a[6];
        emit('A', [a[0], a[1], a[2], a[3], a[4], x, y]);
        rx = round(x);
        ry = round(y);
        break;
      }
    }
  }
  return out;
}

/**
 * The vertices of every subpath as absolute points. Curves and arcs
 * contribute only their end points, which is plenty for area and centroid
 * work on country outlines.
 */
export function pathRings(d: string): { x: number; y: number }[][] {
  const tokens = [...d.matchAll(PATH_TOKEN)].map((m) => m[1] ?? m[2]);
  const rings: { x: number; y: number }[][] = [];
  let ring: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;
  let cmd = '';

  const closeRing = () => {
    if (ring.length > 2) rings.push(ring);
    ring = [];
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token;
      i++;
      if (cmd.toUpperCase() === 'Z') {
        closeRing();
        x = startX;
        y = startY;
        continue;
      }
    }
    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    const n = ARITY[upper];
    if (n === undefined || i + n > tokens.length) break;
    const a = tokens.slice(i, i + n).map(Number);
    i += n;

    switch (upper) {
      case 'M':
        closeRing();
        x = rel ? x + a[0] : a[0];
        y = rel ? y + a[1] : a[1];
        startX = x;
        startY = y;
        cmd = rel ? 'l' : 'L';
        break;
      case 'H':
        x = rel ? x + a[0] : a[0];
        break;
      case 'V':
        y = rel ? y + a[0] : a[0];
        break;
      default:
        // L, T, C, S, Q, A all end at their last two arguments.
        x = rel ? x + a[n - 2] : a[n - 2];
        y = rel ? y + a[n - 1] : a[n - 1];
    }
    ring.push({ x, y });
  }
  closeRing();
  return rings;
}

/** Shoelace area (signed) of a polygon. */
function ringArea(ring: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    sum += ring[j].x * ring[i].y - ring[i].x * ring[j].y;
  return sum / 2;
}

/**
 * A point inside a country's outline to anchor a label line on: the
 * centroid of its largest subpath (mainland rather than an outlying island),
 * nudged onto the outline's interior when the shape is concave enough for
 * the centroid to fall outside it (a crescent, an archipelago's main island).
 */
export function pathAnchor(d: string): { x: number; y: number } | null {
  const rings = pathRings(d);
  if (rings.length === 0) return pathStartPoint(d);

  let ring = rings[0];
  let best = 0;
  for (const r of rings) {
    const area = Math.abs(ringArea(r));
    if (area > best) {
      best = area;
      ring = r;
    }
  }
  if (best === 0) return ring[0];

  const area = ringArea(ring);
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j].x * ring[i].y - ring[i].x * ring[j].y;
    cx += (ring[j].x + ring[i].x) * cross;
    cy += (ring[j].y + ring[i].y) * cross;
  }
  cx /= 6 * area;
  cy /= 6 * area;

  // Where the horizontal through the centroid crosses the outline; the
  // spans between consecutive crossings alternate inside/outside.
  const crossings: number[] = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j];
    const b = ring[i];
    if (a.y > cy !== b.y > cy)
      crossings.push(a.x + ((cy - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  crossings.sort((p, q) => p - q);
  let inside = false;
  let span: [number, number] | null = null;
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    const [l, r] = [crossings[i], crossings[i + 1]];
    if (l <= cx && cx <= r) inside = true;
    if (!span || r - l > span[1] - span[0]) span = [l, r];
  }
  if (inside || !span) return { x: cx, y: cy };
  return { x: (span[0] + span[1]) / 2, y: cy };
}
