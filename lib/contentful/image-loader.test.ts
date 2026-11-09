import { describe, it, expect } from 'vitest';
import {
  CONTENTFUL_WIDTHS,
  contentfulLoader,
  contentfulSrcSet,
} from './image-loader';

const ASSET = 'https://images.ctfassets.net/space/id/hash/photo.png';

describe('contentfulLoader', () => {
  it('requests WebP at the candidate width', () => {
    const url = new URL(contentfulLoader({ src: ASSET, width: 800 }));
    expect(url.searchParams.get('w')).toBe('800');
    expect(url.searchParams.get('fm')).toBe('webp');
    expect(url.searchParams.get('q')).toBe('75');
  });

  it('scales a preset height to keep the crop aspect ratio', () => {
    const url = new URL(
      contentfulLoader({ src: `${ASSET}?w=600&h=450&fit=fill`, width: 1200 })
    );
    expect(url.searchParams.get('h')).toBe('900');
    expect(url.searchParams.get('fit')).toBe('fill');
  });

  it('keeps the preset quality unless one is passed', () => {
    const src = `${ASSET}?w=1200&q=85`;
    expect(
      new URL(contentfulLoader({ src, width: 480 })).searchParams.get('q')
    ).toBe('85');
    expect(
      new URL(
        contentfulLoader({ src, width: 480, quality: 60 })
      ).searchParams.get('q')
    ).toBe('60');
  });

  it('accepts protocol-relative URLs', () => {
    expect(
      contentfulLoader({ src: '//images.ctfassets.net/x.png', width: 480 })
    ).toMatch(/^https:\/\//);
  });
});

describe('contentfulSrcSet', () => {
  it('lists exactly the width ladder and uses the largest as src', () => {
    const { src, srcSet } = contentfulSrcSet(`${ASSET}?w=600&h=450&fit=fill`);
    const widths = srcSet
      .split(', ')
      .map((c) => Number(c.split(' ')[1].slice(0, -1)));
    expect(widths).toEqual([...CONTENTFUL_WIDTHS]);
    expect(new URL(src).searchParams.get('w')).toBe(
      String(CONTENTFUL_WIDTHS[CONTENTFUL_WIDTHS.length - 1])
    );
  });
});
