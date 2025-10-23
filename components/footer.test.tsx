import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Footer from './footer';

describe('Footer', () => {
  it('should render the brand name', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('cr0ss.org')).toBeInTheDocument();
  });

  it('should render the description', () => {
    const { getByText } = render(<Footer />);

    expect(getByText(/Personal and professional website of Simon Krüger/i)).toBeInTheDocument();
  });

  it('should display the current year in copyright', () => {
    const currentYear = new Date().getFullYear();
    const { getByText } = render(<Footer />);

    expect(getByText(new RegExp(`© ${currentYear} Simon Krüger`))).toBeInTheDocument();
  });

  it('should render Navigation section header', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('Navigation')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    const { getAllByText } = render(<Footer />);

    // Home appears in brand and navigation
    const homeLinks = getAllByText('Home');
    expect(homeLinks.length).toBeGreaterThan(0);

    expect(getAllByText('Blog').length).toBeGreaterThan(0);
    expect(getAllByText('Dashboard').length).toBeGreaterThan(0);
  });

  it('should render Information section header', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('Information')).toBeInTheDocument();
  });

  it('should render information links', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('About')).toBeInTheDocument();
    expect(getByText('Contact')).toBeInTheDocument();
    expect(getByText('Imprint')).toBeInTheDocument();
  });

  it('should render Social section header', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('Social')).toBeInTheDocument();
  });

  it('should render social links', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('LinkedIn')).toBeInTheDocument();
    expect(getByText('GitHub')).toBeInTheDocument();
  });

  it('should render correct href for Home link', () => {
    const { getAllByRole } = render(<Footer />);

    const homeLinks = getAllByRole('link', { name: /Home/i });
    expect(homeLinks[0]).toHaveAttribute('href', '/');
  });

  it('should render correct href for Blog link', () => {
    const { getAllByRole } = render(<Footer />);

    const blogLinks = getAllByRole('link', { name: /Blog/i });
    expect(blogLinks[0]).toHaveAttribute('href', '/blog');
  });

  it('should render correct href for Dashboard link', () => {
    const { getAllByRole } = render(<Footer />);

    const dashboardLinks = getAllByRole('link', { name: /Dashboard/i });
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');
  });

  it('should render correct href for About link', () => {
    const { getByRole } = render(<Footer />);

    const aboutLink = getByRole('link', { name: 'About' });
    expect(aboutLink).toHaveAttribute('href', '/page/about');
  });

  it('should render correct href for Contact link', () => {
    const { getAllByRole } = render(<Footer />);

    const contactLinks = getAllByRole('link', { name: /Contact/i });
    // Filter out the one in Information section
    const contactLink = contactLinks.find(link => link.getAttribute('href') === '/page/contact');
    expect(contactLink).toHaveAttribute('href', '/page/contact');
  });

  it('should render correct href for Imprint link', () => {
    const { getByRole } = render(<Footer />);

    const imprintLink = getByRole('link', { name: 'Imprint' });
    expect(imprintLink).toHaveAttribute('href', '/page/imprint');
  });

  it('should have footer element', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-white');
    expect(footer).toHaveClass('dark:bg-slate-800');
    expect(footer).toHaveClass('border-t');
  });

  it('should use responsive grid layout', () => {
    const { container } = render(<Footer />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-4');
  });
});
