'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('UI Crashed:', error);
  }, [error]);
  

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-50 mb-3">Something went wrong</h2>
        <p className="text-zinc-400 mb-8 text-sm">
          A critical error occurred while rendering this page. The engineering team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center justify-center w-full py-3 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 rounded-xl font-medium transition-colors"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Recover Session
        </button>
      </div>
    </div>
  );
}
