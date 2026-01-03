import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <span className="text-5xl">😵</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Oops! Something broke
            </h1>
            <p className="text-gray-600 mb-8">
              Don't worry, it's not your fault. Let's get you back on track.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-8 p-4 bg-white rounded-2xl border border-red-200 shadow-sm">
                <summary className="font-semibold text-red-700 cursor-pointer flex items-center gap-2">
                  <span>🔍</span>
                  Error Details
                </summary>
                <pre className="text-xs text-red-600 mt-3 overflow-auto p-3 bg-red-50 rounded-lg">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>🏠</span>
              <span>Return to Home</span>
            </button>

            <p className="mt-6 text-sm text-gray-400">
              If this keeps happening, try refreshing the page
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
