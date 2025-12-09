/**
 * Cold-Start Handler - Safe, Non-Breaking Server Wake-Up System
 * 
 * This module provides a reusable fetch wrapper that:
 * - Detects server cold starts (connection timeouts/failures)
 * - Triggers UI notification without breaking existing code
 * - Automatically retries for up to 60 seconds
 * - Fails cleanly if server stays down
 * 
 * IMPORTANT: This is fully backward compatible and non-breaking.
 * Existing code continues to work unchanged.
 */

/**
 * Configuration for cold-start detection and retry behavior
 */
const COLD_START_CONFIG = {
  // Maximum time to attempt retries (60 seconds for typical Render cold start)
  MAX_RETRY_DURATION: 60000,
  
  // Initial retry delay (ms)
  INITIAL_RETRY_DELAY: 1000,
  
  // Maximum retry delay (ms)
  MAX_RETRY_DELAY: 5000,
  
  // Backoff multiplier
  BACKOFF_MULTIPLIER: 1.5,
  
  // Timeout for ping requests to detect cold start (short)
  PING_TIMEOUT: 3000,
  
  // Typical fetch timeout
  FETCH_TIMEOUT: 30000,
};

/**
 * Event emitter for cold-start notifications
 * Uses a simple pub/sub pattern to notify UI components
 */
class ColdStartEmitter {
  private listeners: Map<string, Set<(data?: unknown) => void>> = new Map();

  subscribe(event: string, callback: (data?: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}

// Global event emitter instance
export const coldStartEmitter = new ColdStartEmitter();

/**
 * Detects if a request failure is likely due to cold start
 * Returns true if error appears to be connection/timeout related
 */
function isColdStartError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    // Network/connection errors typically indicate cold start
    return (
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('abort')
    );
  }
  return false;
}

/**
 * Pings the backend to detect if it's waking up
 * Uses a lightweight health check endpoint
 */
async function pingBackend(baseURL: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), COLD_START_CONFIG.PING_TIMEOUT);

    const response = await fetch(`${baseURL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    // Any error means server is still down
    return false;
  }
}

/**
 * Waits for the backend to wake up by pinging it repeatedly
 * Emits events to notify UI components
 */
async function waitForBackendWakeUp(baseURL: string): Promise<void> {
  const startTime = Date.now();
  let retryCount = 0;
  let delay = COLD_START_CONFIG.INITIAL_RETRY_DELAY;

  // Emit event to notify UI that server is waking up
  coldStartEmitter.emit('cold-start-detected');

  while (Date.now() - startTime < COLD_START_CONFIG.MAX_RETRY_DURATION) {
    retryCount++;

    const isAwake = await pingBackend(baseURL);
    if (isAwake) {
      // Server is now awake
      coldStartEmitter.emit('cold-start-resolved');
      return;
    }

    // Emit progress event
    coldStartEmitter.emit('cold-start-retry', {
      attempt: retryCount,
      elapsedMs: Date.now() - startTime,
      nextRetryIn: delay,
    });

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Increase delay for next retry (exponential backoff)
    delay = Math.min(
      delay * COLD_START_CONFIG.BACKOFF_MULTIPLIER,
      COLD_START_CONFIG.MAX_RETRY_DELAY
    );
  }

  // Timeout reached - server is still down
  coldStartEmitter.emit('cold-start-failed');
  throw new Error(
    `Backend server did not respond after ${COLD_START_CONFIG.MAX_RETRY_DURATION / 1000} seconds`
  );
}

/**
 * Enhanced fetch wrapper with cold-start detection and retry logic
 * 
 * This is a drop-in replacement for fetch() that:
 * - Automatically detects cold starts
 * - Shows UI notification
 * - Retries automatically
 * - Maintains full backward compatibility
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns Promise resolving to Response object
 */
export async function fetchWithColdStartHandling(
  url: string,
  options?: RequestInit & { baseURL?: string }
): Promise<Response> {
  const { baseURL, ...fetchOptions } = options || {};
  
  try {
    // First attempt - use standard timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      COLD_START_CONFIG.FETCH_TIMEOUT
    );

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    // Check if this looks like a cold start
    if (!isColdStartError(error)) {
      // Not a cold start error, re-throw
      throw error;
    }

    // Extract base URL if not provided
    const urlObj = new URL(url);
    const serverBaseURL = baseURL || `${urlObj.protocol}//${urlObj.host}`;

    // Wait for server to wake up
    await waitForBackendWakeUp(serverBaseURL);

    // Retry the original request
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      COLD_START_CONFIG.FETCH_TIMEOUT
    );

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  }
}

/**
 * Subscribe to cold-start events in React components
 * 
 * Usage:
 *   useEffect(() => {
 *     return subscribeToColdStart('cold-start-detected', () => {
 *       setShowWakeUpMessage(true);
 *     });
 *   }, []);
 */
export function subscribeToColdStart(
  event: 'cold-start-detected' | 'cold-start-resolved' | 'cold-start-failed' | 'cold-start-retry',
  callback: (data?: unknown) => void
): () => void {
  return coldStartEmitter.subscribe(event, callback);
}

/**
 * Get current cold-start status (for debugging)
 */
export function getColdStartConfig() {
  return {
    ...COLD_START_CONFIG,
    supportedEvents: [
      'cold-start-detected',
      'cold-start-resolved',
      'cold-start-failed',
      'cold-start-retry',
    ],
  };
}
