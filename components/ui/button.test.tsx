import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render children text', () => {
      const { getByText } = render(<Button>Click me</Button>);
      expect(getByText('Click me')).toBeInTheDocument();
    });

    it('should render with default variant (primary) and size (md)', () => {
      const { getByRole } = render(<Button>Default</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('should render with secondary variant', () => {
      const { getByRole } = render(<Button variant="secondary">Secondary</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('bg-gray-600');
    });

    it('should render with outline variant', () => {
      const { getByRole } = render(<Button variant="outline">Outline</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-gray-300');
    });

    it('should render with ghost variant', () => {
      const { getByRole } = render(<Button variant="ghost">Ghost</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('bg-transparent');
    });

    it('should render with danger variant', () => {
      const { getByRole } = render(<Button variant="danger">Delete</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('bg-red-600');
    });

    it('should render with small size', () => {
      const { getByRole } = render(<Button size="sm">Small</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('should render with large size', () => {
      const { getByRole } = render(<Button size="lg">Large</Button>);
      const button = getByRole('button');

      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-lg');
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const { getByTestId } = render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          With Icon
        </Button>
      );

      expect(getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const { getByTestId } = render(
        <Button rightIcon={<span data-testid="right-icon">→</span>}>
          With Icon
        </Button>
      );

      expect(getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should hide icons when loading', () => {
      const { queryByTestId, container } = render(
        <Button
          isLoading
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Loading
        </Button>
      );

      expect(queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(queryByTestId('right-icon')).not.toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show spinner when loading', () => {
      const { container } = render(<Button isLoading>Loading</Button>);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      const { getByRole } = render(<Button isLoading>Loading</Button>);

      expect(getByRole('button')).toBeDisabled();
    });

    it('should not call onClick when loading', () => {
      const onClick = vi.fn();
      const { getByRole } = render(
        <Button isLoading onClick={onClick}>
          Loading
        </Button>
      );

      fireEvent.click(getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should render disabled button', () => {
      const { getByRole } = render(<Button disabled>Disabled</Button>);

      expect(getByRole('button')).toBeDisabled();
    });

    it('should apply disabled opacity', () => {
      const { getByRole } = render(<Button disabled>Disabled</Button>);

      expect(getByRole('button')).toHaveClass('disabled:opacity-50');
    });

    it('should not call onClick when disabled', () => {
      const onClick = vi.fn();
      const { getByRole } = render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
      );

      fireEvent.click(getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      const { getByRole } = render(<Button onClick={onClick}>Click</Button>);

      fireEvent.click(getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should have type="button" by default', () => {
      const { getByRole } = render(<Button>Button</Button>);

      expect(getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should support custom type', () => {
      const { getByRole } = render(<Button type="submit">Submit</Button>);

      expect(getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('accessibility', () => {
    it('should have focus-visible styles', () => {
      const { getByRole } = render(<Button>Accessible</Button>);

      expect(getByRole('button')).toHaveClass('focus-visible:outline-none');
      expect(getByRole('button')).toHaveClass('focus-visible:ring-2');
    });

    it('should forward ref', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>With Ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should pass through aria attributes', () => {
      const { getByRole } = render(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      );

      expect(getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
      expect(getByRole('button')).toHaveAttribute('aria-describedby', 'description');
    });
  });

  describe('custom className', () => {
    it('should merge custom className with base styles', () => {
      const { getByRole } = render(
        <Button className="custom-class">Custom</Button>
      );

      const button = getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex'); // base style
    });
  });
});
