import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './card';

describe('Card', () => {
  describe('rendering', () => {
    it('should render children', () => {
      const { getByText } = render(<Card>Card content</Card>);
      expect(getByText('Card content')).toBeInTheDocument();
    });

    it('should render with default variant and padding', () => {
      const { container } = render(<Card>Default</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('p-6');
    });

    it('should render as div element', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });
  });

  describe('variants', () => {
    it('should render bordered variant', () => {
      const { container } = render(<Card variant="bordered">Bordered</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-gray-300');
    });

    it('should render elevated variant', () => {
      const { container } = render(<Card variant="elevated">Elevated</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('shadow-lg');
      expect(card).toHaveClass('border-gray-100');
    });
  });

  describe('padding', () => {
    it('should render with no padding', () => {
      const { container } = render(<Card padding="none">No padding</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).not.toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
      expect(card).not.toHaveClass('p-8');
    });

    it('should render with small padding', () => {
      const { container } = render(<Card padding="sm">Small</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('should render with large padding', () => {
      const { container } = render(<Card padding="lg">Large</Card>);
      expect(container.firstChild).toHaveClass('p-8');
    });
  });

  describe('hoverable', () => {
    it('should apply hover styles when hoverable is true', () => {
      const { container } = render(<Card hoverable>Hoverable</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('should not apply hover styles by default', () => {
      const { container } = render(<Card>Not hoverable</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveClass('hover:shadow-md');
    });

    it('should call onClick when hoverable card is clicked', () => {
      const onClick = vi.fn();
      const { container } = render(
        <Card hoverable onClick={onClick}>
          Clickable
        </Card>
      );

      fireEvent.click(container.firstChild as HTMLElement);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('should have rounded corners', () => {
      const { container } = render(<Card>Rounded</Card>);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('should have white background', () => {
      const { container } = render(<Card>White</Card>);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('should have transition', () => {
      const { container } = render(<Card>Transition</Card>);
      expect(container.firstChild).toHaveClass('transition-all');
    });

    it('should merge custom className', () => {
      const { container } = render(
        <Card className="custom-class">Custom</Card>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-lg'); // base style
    });
  });

  describe('accessibility', () => {
    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Ref</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should pass through HTML attributes', () => {
      const { container } = render(
        <Card data-testid="test-card" aria-label="Test card">
          Attributes
        </Card>
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-testid', 'test-card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    const { getByText } = render(<CardHeader>Header content</CardHeader>);
    expect(getByText('Header content')).toBeInTheDocument();
  });

  it('should have bottom margin', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.firstChild).toHaveClass('mb-4');
  });

  it('should merge custom className', () => {
    const { container } = render(
      <CardHeader className="custom-header">Header</CardHeader>
    );
    const header = container.firstChild as HTMLElement;

    expect(header).toHaveClass('custom-header');
    expect(header).toHaveClass('mb-4');
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<CardHeader ref={ref}>Header</CardHeader>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    const { getByText } = render(<CardContent>Body content</CardContent>);
    expect(getByText('Body content')).toBeInTheDocument();
  });

  it('should merge custom className', () => {
    const { container } = render(
      <CardContent className="custom-body">Body</CardContent>
    );

    expect(container.firstChild).toHaveClass('custom-body');
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<CardContent ref={ref}>Body</CardContent>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    const { getByText } = render(<CardFooter>Footer content</CardFooter>);
    expect(getByText('Footer content')).toBeInTheDocument();
  });

  it('should have top margin and flex layout', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;

    expect(footer).toHaveClass('mt-4');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
  });

  it('should merge custom className', () => {
    const { container } = render(
      <CardFooter className="custom-footer">Footer</CardFooter>
    );
    const footer = container.firstChild as HTMLElement;

    expect(footer).toHaveClass('custom-footer');
    expect(footer).toHaveClass('mt-4');
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<CardFooter ref={ref}>Footer</CardFooter>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Card composition', () => {
  it('should render complete card with all sections', () => {
    const { getByText } = render(
      <Card>
        <CardHeader>
          <h3>Title</h3>
        </CardHeader>
        <CardContent>
          <p>Content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(getByText('Title')).toBeInTheDocument();
    expect(getByText('Content')).toBeInTheDocument();
    expect(getByText('Action')).toBeInTheDocument();
  });

  it('should work with partial sections', () => {
    const { getByText, queryByText } = render(
      <Card>
        <CardHeader>Header only</CardHeader>
      </Card>
    );

    expect(getByText('Header only')).toBeInTheDocument();
  });
});
