import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonCard } from './Skeleton';

describe('Skeleton', () => {
  it('should render with default styling', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-neutral-200/70');
    expect(skeleton).toHaveClass('dark:bg-neutral-700/60');
  });

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="w-32 h-8" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('w-32');
    expect(skeleton).toHaveClass('h-8');
    // Should still have base classes
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('should merge multiple custom classes', () => {
    const { container } = render(<Skeleton className="w-full h-24 mb-4" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('w-full');
    expect(skeleton).toHaveClass('h-24');
    expect(skeleton).toHaveClass('mb-4');
  });

  it('should render as a div element', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});

describe('SkeletonCard', () => {
  it('should render with default styling', () => {
    const { container } = render(<SkeletonCard />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-neutral-200/60');
    expect(card).toHaveClass('dark:border-neutral-700');
    expect(card).toHaveClass('shadow-sm');
    expect(card).toHaveClass('p-4');
  });

  it('should render children', () => {
    const { getByText } = render(
      <SkeletonCard>
        <div>Child content</div>
      </SkeletonCard>
    );

    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonCard className="w-64 h-32" />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('w-64');
    expect(card).toHaveClass('h-32');
    // Should still have base classes
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
  });

  it('should render multiple children', () => {
    const { getByText } = render(
      <SkeletonCard>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </SkeletonCard>
    );

    expect(getByText('First child')).toBeInTheDocument();
    expect(getByText('Second child')).toBeInTheDocument();
    expect(getByText('Third child')).toBeInTheDocument();
  });

  it('should render nested Skeleton components', () => {
    const { container } = render(
      <SkeletonCard>
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-3/4 h-4 mb-2" />
        <Skeleton className="w-1/2 h-4" />
      </SkeletonCard>
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('should render without children', () => {
    const { container } = render(<SkeletonCard />);

    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.childNodes.length).toBe(0);
  });

  it('should render as a div element', () => {
    const { container } = render(<SkeletonCard />);

    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('should handle complex nested content', () => {
    const { container } = render(
      <SkeletonCard className="p-6">
        <Skeleton className="w-20 h-20 rounded-full mb-4" />
        <div>
          <Skeleton className="w-full h-6 mb-2" />
          <Skeleton className="w-2/3 h-4" />
        </div>
      </SkeletonCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-6');

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });
});
