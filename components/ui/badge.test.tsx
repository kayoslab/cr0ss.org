import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render children text', () => {
      const { getByText } = render(<Badge>New</Badge>);
      expect(getByText('New')).toBeInTheDocument();
    });

    it('should render with default variant and size', () => {
      const { getByText } = render(<Badge>Default</Badge>);
      const badge = getByText('Default');

      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-700');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-1');
    });
  });

  describe('variants', () => {
    it('should render primary variant', () => {
      const { getByText } = render(<Badge variant="primary">Primary</Badge>);
      const badge = getByText('Primary');

      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('should render secondary variant', () => {
      const { getByText } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = getByText('Secondary');

      expect(badge).toHaveClass('bg-gray-600');
      expect(badge).toHaveClass('text-white');
    });

    it('should render success variant', () => {
      const { getByText } = render(<Badge variant="success">Success</Badge>);
      const badge = getByText('Success');

      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('should render warning variant', () => {
      const { getByText } = render(<Badge variant="warning">Warning</Badge>);
      const badge = getByText('Warning');

      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-700');
    });

    it('should render danger variant', () => {
      const { getByText } = render(<Badge variant="danger">Danger</Badge>);
      const badge = getByText('Danger');

      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });

    it('should render outline variant', () => {
      const { getByText } = render(<Badge variant="outline">Outline</Badge>);
      const badge = getByText('Outline');

      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('border-gray-300');
      expect(badge).toHaveClass('bg-transparent');
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { getByText } = render(<Badge size="sm">Small</Badge>);
      const badge = getByText('Small');

      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render medium size (default)', () => {
      const { getByText } = render(<Badge size="md">Medium</Badge>);
      const badge = getByText('Medium');

      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render large size', () => {
      const { getByText } = render(<Badge size="lg">Large</Badge>);
      const badge = getByText('Large');

      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('styling', () => {
    it('should have rounded-full styling', () => {
      const { getByText } = render(<Badge>Rounded</Badge>);
      expect(getByText('Rounded')).toHaveClass('rounded-full');
    });

    it('should have inline-flex display', () => {
      const { getByText } = render(<Badge>Inline</Badge>);
      expect(getByText('Inline')).toHaveClass('inline-flex');
    });

    it('should have transition-colors', () => {
      const { getByText } = render(<Badge>Transition</Badge>);
      expect(getByText('Transition')).toHaveClass('transition-colors');
    });

    it('should merge custom className', () => {
      const { getByText } = render(
        <Badge className="custom-class">Custom</Badge>
      );
      const badge = getByText('Custom');

      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('inline-flex'); // base style still applied
    });
  });

  describe('HTML attributes', () => {
    it('should render as span element', () => {
      const { container } = render(<Badge>Span</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should pass through HTML attributes', () => {
      const { getByText } = render(
        <Badge data-testid="test-badge" title="Tooltip text">
          Attributes
        </Badge>
      );

      const badge = getByText('Attributes');
      expect(badge).toHaveAttribute('data-testid', 'test-badge');
      expect(badge).toHaveAttribute('title', 'Tooltip text');
    });

    it('should support aria attributes', () => {
      const { getByText } = render(
        <Badge aria-label="Status indicator">Active</Badge>
      );

      expect(getByText('Active')).toHaveAttribute('aria-label', 'Status indicator');
    });
  });

  describe('combinations', () => {
    it('should support all variant and size combinations', () => {
      const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'outline'] as const;
      const sizes = ['sm', 'md', 'lg'] as const;

      variants.forEach(variant => {
        sizes.forEach(size => {
          const { getByText } = render(
            <Badge variant={variant} size={size}>
              {variant}-{size}
            </Badge>
          );
          expect(getByText(`${variant}-${size}`)).toBeInTheDocument();
        });
      });
    });
  });
});
