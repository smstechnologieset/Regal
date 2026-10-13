/**
 * Shared Supabase Utility Functions
 */

/**
 * Utility to retry a promise-returning function with exponential backoff and timeout
 */
export async function withRetry<T>(
    fn: (signal?: AbortSignal) => Promise<T>,
    retries = 3,
    delay = 500,
    timeoutMs = 8000,
    signal?: AbortSignal
): Promise<T> {
    let lastError: any;

    if (signal?.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
    }

    for (let i = 0; i < retries; i++) {
        if (signal?.aborted) {
            throw new DOMException('Request aborted', 'AbortError');
        }

        const attempt = i + 1;
        const localController = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;
        let onExternalAbort: (() => void) | undefined;
        let onLocalAbort: (() => void) | undefined;

        try {
            const resultPromise = fn(localController.signal);

            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    console.warn(`[withRetry] Timeout reached after ${timeoutMs}ms for attempt ${attempt}`);
                    localController.abort('timeout');
                    reject(new Error('timeout'));
                }, timeoutMs);
            });

            const abortPromise = new Promise<never>((_, reject) => {
                const rejectAbort = () => reject(new DOMException('Request aborted', 'AbortError'));
                if (signal?.aborted || localController.signal.aborted) {
                    rejectAbort();
                    return;
                }
                onExternalAbort = () => {
                    localController.abort('external');
                    rejectAbort();
                };
                onLocalAbort = () => {
                    rejectAbort();
                };
                if (signal) signal.addEventListener('abort', onExternalAbort, { once: true });
                localController.signal.addEventListener('abort', onLocalAbort, { once: true });
            });

            const result = await Promise.race([resultPromise, timeoutPromise, abortPromise]);

            // Success! Clear timeout and listeners
            if (timeoutId) clearTimeout(timeoutId);
            if (signal && onExternalAbort) signal.removeEventListener('abort', onExternalAbort);
            if (onLocalAbort) localController.signal.removeEventListener('abort', onLocalAbort);
            return result;

        } catch (err: any) {
            // Clean up timeout and listeners
            if (timeoutId) clearTimeout(timeoutId);
            if (signal && onExternalAbort) signal.removeEventListener('abort', onExternalAbort);
            if (onLocalAbort) localController.signal.removeEventListener('abort', onLocalAbort);

            lastError = err;
            const isTimeout = err.message === 'timeout' || localController.signal.reason === 'timeout';
            const isAbort = isAbortError(err, signal) || localController.signal.aborted;

            if (isAbort) {
                // If externally aborted, break immediately - do NOT retry!
                console.log(`[withRetry] Request aborted during attempt ${attempt}`);
                throw (err instanceof Error ? err : new DOMException('Request aborted', 'AbortError'));
            }

            if (isTimeout) {
                console.warn(`[withRetry] Attempt ${attempt} timed out.`);
            } else {
                console.warn(`[withRetry] Attempt ${attempt} error:`, err?.message || err);
            }
        }

        if (i < retries - 1 && !signal?.aborted) {
            const backoff = delay * Math.pow(2, i);
            await new Promise(r => setTimeout(r, backoff));
        }
    }

    throw lastError || new Error('Request failed after retries');
}

/**
 * Helper to check if an error is an abort error from AbortSignal / AbortController
 */
export function isAbortError(error: any, signal?: AbortSignal): boolean {
    if (signal?.aborted) return true;
    if (!error) return false;
    if (error.name === 'AbortError') return true;
    const msg = String(error.message || error || '').toLowerCase();
    if (msg.includes('abort') || msg.includes('canceled') || msg.includes('cancelled')) return true;
    return false;
}

/**
 * Safely format error messages (handling non-enumerable Supabase error properties)
 */
export function getErrorMessage(error: any): string {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    return error.message || error.details || error.hint || error.code || String(error);
}

