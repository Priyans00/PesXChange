'use client';

import React, { useEffect, useState } from 'react';
import { subscribeToColdStart } from '@/lib/cold-start-handler';

/**
 * ColdStartNotification Component
 * 
 * Displays a non-intrusive notification when the backend server is waking up.
 * Automatically appears and disappears based on cold-start events.
 * 
 * Features:
 * - Clean, minimal UI
 * - Non-blocking (appears at top)
 * - Auto-hides when server is ready
 * - Shows retry attempts
 * - Graceful error handling
 */
export function ColdStartNotification() {
  const [state, setState] = useState<'hidden' | 'waking' | 'error'>('hidden');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Subscribe to cold-start detected event
    const unsubscribeDetected = subscribeToColdStart('cold-start-detected', () => {
      setState('waking');
      setAttempt(1);
    });

    // Subscribe to retry event
    const unsubscribeRetry = subscribeToColdStart('cold-start-retry', (data: unknown) => {
      if (data && typeof data === 'object' && 'attempt' in data) {
        setAttempt((data as { attempt: number }).attempt);
      }
    });

    // Subscribe to resolved event
    const unsubscribeResolved = subscribeToColdStart('cold-start-resolved', () => {
      setState('hidden');
      setAttempt(0);
    });

    // Subscribe to failed event
    const unsubscribeFailed = subscribeToColdStart('cold-start-failed', () => {
      setState('error');
    });

    return () => {
      unsubscribeDetected();
      unsubscribeRetry();
      unsubscribeResolved();
      unsubscribeFailed();
    };
  }, []);

  // Hidden state - render nothing
  if (state === 'hidden') {
    return null;
  }

  // Waking state - show spinner and message
  if (state === 'waking') {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
          {/* Spinner */}
          <div className="flex-shrink-0">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Server is waking up...
            </p>
            {attempt > 1 && (
              <p className="text-xs text-blue-700 mt-1">
                Attempt {attempt} • Please wait
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state - show error message
  if (state === 'error') {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
          {/* Error icon */}
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Server is taking longer than expected
            </p>
            <p className="text-xs text-red-700 mt-1">
              Please try again in a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
