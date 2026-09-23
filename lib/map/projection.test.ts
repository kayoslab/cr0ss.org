import { describe, it, expect } from 'vitest';
import {
  compactSvgPath,
  geoToPixel,
  pathStartPoint,
  MAP_WIDTH,
  MAP_HEIGHT,
} from './projection';

describe('compactSvgPath', () => {
  it('converts relative commands to absolute and rounds', () => {
    expect(compactSvgPath('m 10.123,20.456 5.111,-0.049 z')).toBe(
      'm10.1 20.5l5.1 -0.1z'
    );
  });

  it('keeps implicit linetos after a moveto and does not accumulate rounding drift', () => {
    // 100 relative steps of 0.049 each: rounding each step would give 0; absolute gives 4.9.
    const d = 'm 0,0 ' + Array.from({ length: 100 }, () => '0.049,0').join(' ');
    const out = compactSvgPath(d);
    // Every step is horizontal, so after the move the output is only `h` deltas
    // (with implicit repeats). Their sum is the exact rounded end point, 4.9.
    expect(out.startsWith('m0 0h')).toBe(true);
    const deltas = out.slice('m0 0h'.length).split(' ').map(Number);
    const total = deltas.reduce((sum, n) => sum + n, 0);
    expect(Number(total.toFixed(1))).toBe(4.9);
    expect(deltas.every((n) => n > 0)).toBe(true);
  });

  it('handles absolute commands, H/V, curves and arcs', () => {
    expect(compactSvgPath('M1 1 H 5.04 V 7.06 L 2 2')).toBe(
      'm1 1h4v6.1l-3 -5.1'
    );
    expect(compactSvgPath('M0 0 c 1,1 2,2 3,3')).toBe('m0 0C1 1 2 2 3 3');
    expect(compactSvgPath('M0 0 a 5 5 0 0 1 10.04 0')).toBe(
      'm0 0A5 5 0 0 1 10 0'
    );
  });

  it('closes subpaths correctly: a relative move after Z starts from the subpath start', () => {
    expect(compactSvgPath('m 10,10 5,0 0,5 z m 1,1 1,0')).toBe(
      'm10 10h5v5zm1 1h1'
    );
  });

  it('leaves the start point readable for pathStartPoint', () => {
    const out = compactSvgPath('m 479.68275,331.6274 -0.077,0.025');
    expect(pathStartPoint(out)).toEqual({ x: 479.7, y: 331.6 });
  });

  it('is idempotent', () => {
    const once = compactSvgPath('m 10.123,20.456 5.111,-0.049 c 1,1 2,2 3,3 z');
    expect(compactSvgPath(once)).toBe(once);
  });
});

describe('geoToPixel', () => {
  it('maps Berlin inside the map bounds', () => {
    const { x, y } = geoToPixel(52.52, 13.405);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(MAP_WIDTH);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(MAP_HEIGHT);
  });
});
