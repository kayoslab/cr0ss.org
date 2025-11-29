import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      const { getByRole } = render(<Input />);
      expect(getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" />
      );
      expect(getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with default size and variant', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('textbox');

      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-2');
      expect(input).toHaveClass('border-gray-300');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const { getByText, getByLabelText } = render(
        <Input label="Email" />
      );

      expect(getByText('Email')).toBeInTheDocument();
      expect(getByLabelText('Email')).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      const { getByText } = render(
        <Input label="Email" required />
      );

      const asterisk = getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('should associate label with input', () => {
      const { getByLabelText } = render(
        <Input label="Username" id="username" />
      );

      const input = getByLabelText('Username');
      expect(input).toHaveAttribute('id', 'username');
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { getByRole } = render(<Input inputSize="sm" />);
      const input = getByRole('textbox');

      expect(input).toHaveClass('px-3');
      expect(input).toHaveClass('py-1.5');
      expect(input).toHaveClass('text-sm');
    });

    it('should render large size', () => {
      const { getByRole } = render(<Input inputSize="lg" />);
      const input = getByRole('textbox');

      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-3');
      expect(input).toHaveClass('text-lg');
    });
  });

  describe('variants', () => {
    it('should render error variant', () => {
      const { getByRole } = render(<Input variant="error" />);
      const input = getByRole('textbox');

      expect(input).toHaveClass('border-red-300');
    });

    it('should apply error variant when error prop is provided', () => {
      const { getByRole } = render(
        <Input error="This field is required" />
      );
      const input = getByRole('textbox');

      expect(input).toHaveClass('border-red-300');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('error handling', () => {
    it('should display error message', () => {
      const { getByText } = render(
        <Input error="Invalid email address" />
      );

      const errorMsg = getByText('Invalid email address');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass('text-red-600');
    });

    it('should have role="alert" on error message', () => {
      const { getByRole } = render(
        <Input error="Error message" />
      );

      expect(getByRole('alert')).toHaveTextContent('Error message');
    });

    it('should associate error with input via aria-describedby', () => {
      const { getByRole } = render(
        <Input id="test-input" error="Error" />
      );

      const input = getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('test-input-error');
    });
  });

  describe('helper text', () => {
    it('should display helper text', () => {
      const { getByText } = render(
        <Input helperText="Must be at least 8 characters" />
      );

      expect(getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should not show helper text when error is present', () => {
      const { queryByText } = render(
        <Input
          helperText="Helper text"
          error="Error message"
        />
      );

      expect(queryByText('Helper text')).not.toBeInTheDocument();
      expect(queryByText('Error message')).toBeInTheDocument();
    });

    it('should associate helper text with input via aria-describedby', () => {
      const { getByRole } = render(
        <Input id="test-input" helperText="Helper" />
      );

      const input = getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('test-input-helper');
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const { getByTestId } = render(
        <Input leftIcon={<span data-testid="left-icon">🔍</span>} />
      );

      expect(getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const { getByTestId } = render(
        <Input rightIcon={<span data-testid="right-icon">✓</span>} />
      );

      expect(getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should add left padding when left icon is present', () => {
      const { getByRole } = render(
        <Input leftIcon={<span>🔍</span>} inputSize="md" />
      );

      expect(getByRole('textbox')).toHaveClass('pl-10');
    });

    it('should add right padding when right icon is present', () => {
      const { getByRole } = render(
        <Input rightIcon={<span>✓</span>} inputSize="md" />
      );

      expect(getByRole('textbox')).toHaveClass('pr-10');
    });

    it('should render both icons simultaneously', () => {
      const { getByTestId } = render(
        <Input
          leftIcon={<span data-testid="left">L</span>}
          rightIcon={<span data-testid="right">R</span>}
        />
      );

      expect(getByTestId('left')).toBeInTheDocument();
      expect(getByTestId('right')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should render disabled input', () => {
      const { getByRole } = render(<Input disabled />);
      expect(getByRole('textbox')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      const { getByRole } = render(<Input disabled />);
      const input = getByRole('textbox');

      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('interactions', () => {
    it('should call onChange when value changes', () => {
      const onChange = vi.fn();
      const { getByRole } = render(<Input onChange={onChange} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus when focused', () => {
      const onFocus = vi.fn();
      const { getByRole } = render(<Input onFocus={onFocus} />);

      fireEvent.focus(getByRole('textbox'));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', () => {
      const onBlur = vi.fn();
      const { getByRole } = render(<Input onBlur={onBlur} />);

      const input = getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('input types', () => {
    it('should support email type', () => {
      const { getByRole } = render(<Input type="email" />);
      expect(getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should support password type', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should support number type', () => {
      const { container } = render(<Input type="number" />);
      const input = container.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have focus ring styles', () => {
      const { getByRole } = render(<Input />);
      expect(getByRole('textbox')).toHaveClass('focus:ring-2');
    });

    it('should forward ref', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should support custom id', () => {
      const { getByRole } = render(<Input id="custom-id" />);
      expect(getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    });

    it('should auto-generate id if not provided', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('textbox');
      expect(input).toHaveAttribute('id');
      // React's useId generates IDs like ':r0:' or similar
      expect(input.getAttribute('id')).toBeTruthy();
      expect(input.getAttribute('id')?.length).toBeGreaterThan(0);
    });
  });

  describe('custom className', () => {
    it('should merge custom className with base styles', () => {
      const { getByRole } = render(
        <Input className="custom-class" />
      );

      const input = getByRole('textbox');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('w-full'); // base style
    });
  });
});
