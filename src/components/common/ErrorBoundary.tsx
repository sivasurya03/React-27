import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, ErrorState } from '@/components/ui';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-app p-6">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-4 shadow-card">
          <ErrorState title="The app hit an unexpected error" message={this.state.error.message} />
          <div className="flex justify-center pb-6">
            <Button onClick={() => window.location.assign('/')}>Reload application</Button>
          </div>
        </div>
      </div>
    );
  }
}
