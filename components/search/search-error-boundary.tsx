'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export class SearchErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-sm text-red-500">
          Search is temporarily unavailable
        </div>
      );
    }
    return this.props.children;
  }
} 