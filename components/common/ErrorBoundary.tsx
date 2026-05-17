'use client';
import { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface ErrorBoundaryProps {
  children?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicit declarations satisfy TS when @types/react is not locally available
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps & { children?: ReactNode };
  declare setState: (state: Partial<ErrorBoundaryState>) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-gray-200 dark:border-gray-800">
            <div className="flex justify-center mb-4">
              <span className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <FiAlertTriangle className="text-red-500" size={28} />
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We encountered an unexpected error.</p>
            {this.state.error && (
              <p className="text-xs text-gray-400 font-mono mb-4 break-all">{this.state.error.message}</p>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset} className="btn-secondary flex items-center gap-2">
                <FiRefreshCw size={14} /> Try Again
              </button>
              <button onClick={() => window.location.reload()} className="btn-primary">Reload Page</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
