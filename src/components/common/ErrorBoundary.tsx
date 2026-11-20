import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render errors in a page so the header/footer stay usable. */
interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes (e.g. the pathname) a previous error is cleared. */
  resetKey?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) this.setState({ hasError: false });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook for an error-reporting service (Sentry, etc.). Only log the message, never user data.
    console.error('Page crashed:', error.message, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="max-w-[1440px] mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl font-semibold uppercase">Something went wrong</h2>
        <p className="text-xs text-[#7E7C77] font-mono">This page failed to load. Try again or head back home.</p>
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-full bg-[#526457] text-white px-6 py-3 font-extrabold uppercase text-[10px] tracking-wider"
          >
            Try again
          </button>
          <a href="/" className="bg-[#F0EBE2] text-[#2E2D2B] px-6 py-3 font-bold uppercase text-xs border border-[#7E7C77]/25">
            Go home
          </a>
        </div>
      </div>
    );
  }
}
