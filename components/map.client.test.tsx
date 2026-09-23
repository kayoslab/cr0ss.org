import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MapClient from './map.client';

describe('MapClient', () => {
  it('draws the shared base map and only the highlighted countries', () => {
    const { container } = render(
      <MapClient
        lat={52.52}
        lon={13.405}
        highlighted={[{ id: 'DE', path: 'M 10 10 L 20 10 L 20 20 Z' }]}
      />
    );
    const image = container.querySelector('image');
    expect(image?.getAttribute('href')).toBe('/world-map.svg');
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelector('path#DE')).not.toBeNull();
  });

  it('places the location marker inside the map bounds', () => {
    const { container } = render(
      <MapClient lat={52.52} lon={13.405} highlighted={[]} />
    );
    const marker = container.querySelector('circle#GEO');
    expect(marker).not.toBeNull();
    const cx = Number(marker?.getAttribute('cx'));
    const cy = Number(marker?.getAttribute('cy'));
    expect(cx).toBeGreaterThan(0);
    expect(cx).toBeLessThan(1010);
    expect(cy).toBeGreaterThan(0);
    expect(cy).toBeLessThan(666);
  });

  it('omits the marker when there is no location', () => {
    const { container } = render(
      <MapClient lat={null} lon={null} highlighted={[]} showLocation={false} />
    );
    expect(container.querySelector('circle#GEO')).toBeNull();
  });
});
