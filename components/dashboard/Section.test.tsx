import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Section from './Section';

describe('Section', () => {
  describe('rendering', () => {
    it('should render title and children', () => {
      render(
        <Section title="Test Section">
          <p>Test content paragraph</p>
        </Section>
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('Test content paragraph')).toBeInTheDocument();
    });

    it('should render as a semantic section element', () => {
      render(
        <Section title="Test Section">
          <p>Content</p>
        </Section>
      );

      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
      expect(section.tagName).toBe('SECTION');
    });

    it('should render title as h2 heading', () => {
      render(
        <Section title="Test Section">
          <p>Content</p>
        </Section>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Section');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes when id is provided', () => {
      render(
        <Section title="Test Section" id="test-section">
          <p>Content</p>
        </Section>
      );

      const section = screen.getByRole('region');
      const heading = screen.getByRole('heading', { level: 2 });

      expect(section).toHaveAttribute('id', 'test-section');
      expect(section).toHaveAttribute('aria-labelledby', 'test-section-heading');
      expect(heading).toHaveAttribute('id', 'test-section-heading');
    });

    it('should not have aria-labelledby when id is not provided', () => {
      render(
        <Section title="Test Section">
          <p>Content</p>
        </Section>
      );

      const section = screen.getByRole('region');

      expect(section).not.toHaveAttribute('aria-labelledby');
      expect(section).not.toHaveAttribute('id');
    });
  });

  describe('styling', () => {
    it('should apply custom className to section element', () => {
      const { container } = render(
        <Section title="Test Section" className="custom-class">
          <p>Content</p>
        </Section>
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('should have base heading styles', () => {
      render(
        <Section title="Test Section">
          <p>Content</p>
        </Section>
      );

      const heading = screen.getByRole('heading', { level: 2 });

      // Check for expected Tailwind classes
      expect(heading).toHaveClass('mb-4');
      expect(heading).toHaveClass('text-base');
      expect(heading).toHaveClass('font-semibold');
    });
  });

  describe('content rendering', () => {
    it('should render multiple children', () => {
      render(
        <Section title="Test Section">
          <p>First paragraph</p>
          <p>Second paragraph</p>
          <div>Third element</div>
        </Section>
      );

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
      expect(screen.getByText('Third element')).toBeInTheDocument();
    });

    it('should render complex nested content', () => {
      render(
        <Section title="Complex Section">
          <div>
            <h3>Subsection</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Section>
      );

      expect(screen.getByText('Subsection')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
});
