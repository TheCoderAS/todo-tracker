import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the crash for diagnostics. Replace with a real error reporter
    // (e.g. Sentry) when one is wired up.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-100"
      >
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-slate-400">
          An unexpected error interrupted the app. Reloading usually fixes it. If
          the problem continues, please report it.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Reload app
        </button>
      </div>
    );
  }
}
