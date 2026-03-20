import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-200">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Đã xảy ra lỗi</h2>
            <p className="text-zinc-600 mb-6">
              Đã có lỗi xảy ra trong quá trình chạy ứng dụng. Vui lòng thử tải lại trang.
            </p>
            <div className="bg-zinc-100 rounded-lg p-4 mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-600">
                {this.state.error?.message || 'Lỗi không xác định'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
