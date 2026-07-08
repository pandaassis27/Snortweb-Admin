import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#151619] flex items-center justify-center p-4 font-sans select-none text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-xl text-center">
            <AlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-xl font-bold tracking-widest uppercase mb-2">System Failure</h1>
            <p className="text-slate-400 text-sm mb-8">
              A critical component has crashed. Please reload the console terminal to restore functionality.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reboot Terminal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
