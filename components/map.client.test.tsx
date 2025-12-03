import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapClient, { TravelCountry } from './map.client';

describe('MapClient', () => {
  const mockCountries: TravelCountry[] = [
    { id: 'US', path: 'M10,10 L20,20', visited: true },
    { id: 'DE', path: 'M30,30 L40,40', visited: false },
  ];

  describe('rendering', () => {
    it('should render SVG map with countries', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.tagName).toBe('svg');
    });

    it('should render all countries from props', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(2);
      expect(paths[0]).toHaveAttribute('id', 'US');
      expect(paths[1]).toHaveAttribute('id', 'DE');
    });

    it('should apply different fill colors for visited and unvisited countries', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const paths = container.querySelectorAll('path');
      expect(paths[0]).toHaveAttribute('fill', 'gray'); // visited
      expect(paths[1]).toHaveAttribute('fill', '#ececec'); // not visited
    });
  });

  describe('location marker', () => {
    it('should render location marker when showLocation is true (default)', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('fill', 'oklch(0.646 0.222 41.116)');
      expect(circle).toHaveAttribute('stroke', 'white');
      expect(circle).toHaveAttribute('stroke-width', '2');
    });

    it('should render location marker when showLocation is explicitly true', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
          showLocation={true}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).toBeInTheDocument();
    });

    it('should not render location marker when showLocation is false', () => {
      const { container } = render(
        <MapClient
          lat={0}
          lon={0}
          countries={mockCountries}
          showLocation={false}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).not.toBeInTheDocument();
    });

    it('should handle null lat/lon values', () => {
      const { container } = render(
        <MapClient
          lat={null}
          lon={null}
          countries={mockCountries}
          showLocation={false}
        />
      );

      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();

      // Circle should not be rendered when showLocation is false
      const circle = container.querySelector('#GEO');
      expect(circle).not.toBeInTheDocument();
    });

    it('should handle string coordinates', () => {
      const { container } = render(
        <MapClient
          lat="52.52"
          lon="13.405"
          countries={mockCountries}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).toBeInTheDocument();
    });

    it('should handle invalid string coordinates', () => {
      render(
        <MapClient
          lat="invalid"
          lon="invalid"
          countries={mockCountries}
          showLocation={false}
        />
      );

      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-labelledby');
    });

    it('should have title and description', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const title = container.querySelector('title');
      const desc = container.querySelector('desc');

      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('World map with visited countries');
      expect(desc).toBeInTheDocument();
    });

    it('should have location-specific description when showLocation is true', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
          showLocation={true}
        />
      );

      const desc = container.querySelector('desc');
      expect(desc).toHaveTextContent(/Current location at latitude/);
      expect(desc).toHaveTextContent(/52.520/);
      expect(desc).toHaveTextContent(/13.405/);
    });

    it('should have generic description when showLocation is false', () => {
      const { container } = render(
        <MapClient
          lat={0}
          lon={0}
          countries={mockCountries}
          showLocation={false}
        />
      );

      const desc = container.querySelector('desc');
      expect(desc).toHaveTextContent(/No current location data available/);
    });

    it('should have aria-label on countries with visited status', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const paths = container.querySelectorAll('path');
      expect(paths[0]).toHaveAttribute('aria-label', 'Country US, visited');
      expect(paths[1]).toHaveAttribute('aria-label', 'Country DE');
    });

    it('should have focusable location marker with aria-label', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
          showLocation={true}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).toHaveAttribute('tabindex', '0');
      expect(circle).toHaveAttribute('role', 'img');
      expect(circle).toHaveAttribute('aria-label');
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
          className="custom-map-class"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-map-class');
    });

    it('should have default styling classes', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={mockCountries}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('block');
      expect(svg).toHaveClass('w-full');
      expect(svg).toHaveClass('h-auto');
    });
  });

  describe('edge cases', () => {
    it('should render with empty countries array', () => {
      const { container } = render(
        <MapClient
          lat={52.52}
          lon={13.405}
          countries={[]}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle coordinates at 0,0 (Atlantic Ocean)', () => {
      const { container } = render(
        <MapClient
          lat={0}
          lon={0}
          countries={mockCountries}
          showLocation={false}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle extreme latitude values', () => {
      const { container } = render(
        <MapClient
          lat={90}
          lon={180}
          countries={mockCountries}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).toBeInTheDocument();
    });

    it('should handle negative coordinates', () => {
      const { container } = render(
        <MapClient
          lat={-33.8688}
          lon={151.2093}
          countries={mockCountries}
        />
      );

      const circle = container.querySelector('#GEO');
      expect(circle).toBeInTheDocument();
    });
  });
});
