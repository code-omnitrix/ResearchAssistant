import { Component } from 'react';
import type { ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error('ui.runtime_error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#3C3B39] p-8 font-mono text-sm">
          <p className="text-[#E08A78]">⚠ Runtime error — check console for details.</p>
          <pre className="max-w-2xl overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-white/60">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack?.split('\n').slice(1, 6).join('\n')}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-white/15 px-4 py-2 text-white/70 hover:text-white"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
