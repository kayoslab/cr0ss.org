import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Footer from './footer';

// The real component is an async cached Server Component; render the year inline here.
vi.mock('@/components/current-year', () => ({
  CurrentYear: () => new Date().getFullYear(),
}));

describe('Footer', () => {
  it('shows a minimal copyright with the current year', () => {
    const currentYear = new Date().getFullYear();
    const { getByText } = render(<Footer />);

    expect(getByText(`© ${currentYear} Simon Krüger`)).toBeInTheDocument();
  });

  it('does not render the old link columns or tagline', () => {
    const { queryByText } = render(<Footer />);

    for (const text of [
      'Navigation',
      'Information',
      'Social',
      'All rights reserved',
      'Personal and professional website',
    ]) {
      expect(queryByText(new RegExp(text))).not.toBeInTheDocument();
    }
  });

  it.each([
    ['Instagram', 'https://www.instagram.com/cr0ss.mind/'],
    ['LinkedIn', 'https://www.linkedin.com/in/cr0ss/'],
    ['GitHub', 'https://github.com/kayoslab'],
  ])('links the %s icon to %s', (label, href) => {
    const { getByRole } = render(<Footer />);

    const link = getByRole('link', { name: label });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the imprint reachable next to the copyright', () => {
    const { getByRole } = render(<Footer />);

    expect(getByRole('link', { name: 'Imprint' })).toHaveAttribute(
      'href',
      '/page/imprint'
    );
  });

  it('renders the imprint and three social links and nothing else', () => {
    const { getAllByRole } = render(<Footer />);

    expect(getAllByRole('link')).toHaveLength(4);
  });

  it('lays the copyright and icons out on one row', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('border-t', 'bg-white');
    expect(footer?.firstElementChild).toHaveClass(
      'flex',
      'items-center',
      'justify-between'
    );
  });
});
