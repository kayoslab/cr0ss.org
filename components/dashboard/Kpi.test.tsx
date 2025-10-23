import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Kpi } from './Kpi';

describe('Kpi', () => {
  it('should render label and numeric value', () => {
    const { getByText } = render(<Kpi label="Total Users" value={1234} />);

    expect(getByText('Total Users')).toBeInTheDocument();
    expect(getByText('1234')).toBeInTheDocument();
  });

  it('should render label and string value', () => {
    const { getByText } = render(<Kpi label="Status" value="Active" />);

    expect(getByText('Status')).toBeInTheDocument();
    expect(getByText('Active')).toBeInTheDocument();
  });

  it('should have uppercase styling on label', () => {
    const { getByText } = render(<Kpi label="monthly revenue" value={5000} />);

    const label = getByText('monthly revenue');
    expect(label).toHaveClass('uppercase');
  });

  it('should convert numeric value to string', () => {
    const { getByText } = render(<Kpi label="Count" value={0} />);

    expect(getByText('0')).toBeInTheDocument();
  });

  it('should handle decimal values', () => {
    const { getByText } = render(<Kpi label="Average" value={98.6} />);

    expect(getByText('98.6')).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    const { getByText } = render(<Kpi label="Revenue" value={1000000} />);

    expect(getByText('1000000')).toBeInTheDocument();
  });

  it('should apply correct styling to label', () => {
    const { getByText } = render(<Kpi label="Test Label" value={42} />);

    const label = getByText('Test Label');
    expect(label).toHaveClass('uppercase');
    expect(label).toHaveClass('tracking-wider');
    expect(label).toHaveClass('text-neutral-400');
    expect(label).toHaveClass('text-xs');
  });

  it('should apply correct styling to value', () => {
    const { getByText } = render(<Kpi label="Test" value={42} />);

    const value = getByText('42');
    expect(value).toHaveClass('text-3xl');
    expect(value).toHaveClass('font-semibold');
    expect(value).toHaveClass('mt-2');
  });

  it('should have correct container styling', () => {
    const { container } = render(<Kpi label="Test" value={42} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('rounded-lg');
    expect(wrapper).toHaveClass('border');
    expect(wrapper).toHaveClass('border-neutral-200/60');
    expect(wrapper).toHaveClass('dark:border-neutral-700');
    expect(wrapper).toHaveClass('shadow-sm');
    expect(wrapper).toHaveClass('p-4');
    expect(wrapper).toHaveClass('h-full');
  });

  it('should handle empty string value', () => {
    const { container } = render(<Kpi label="Empty" value="" />);

    const value = container.querySelector('.text-3xl');
    expect(value).toBeInTheDocument();
  });

  it('should handle negative numbers', () => {
    const { getByText } = render(<Kpi label="Loss" value={-500} />);

    expect(getByText('-500')).toBeInTheDocument();
  });

  it('should handle very long labels', () => {
    const longLabel = 'This is a very long label that might wrap';
    const { getByText } = render(<Kpi label={longLabel} value={42} />);

    expect(getByText(longLabel)).toBeInTheDocument();
  });

  it('should handle very long string values', () => {
    const longValue = 'This is a very long string value';
    const { getByText } = render(<Kpi label="Test" value={longValue} />);

    expect(getByText(longValue)).toBeInTheDocument();
  });
});
