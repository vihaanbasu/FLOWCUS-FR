import { Component } from 'react';
import { Button } from '@/components/ui/Button.jsx';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('FlexFlow error boundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="max-w-md rounded-2xl glass border border-white/15 p-8 text-center">
            <p className="font-display text-lg font-semibold text-white">
              Something went wrong
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Reload the page to continue. If this keeps happening, check that
              the API server is running.
            </p>
            <Button
              className="mt-6"
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
