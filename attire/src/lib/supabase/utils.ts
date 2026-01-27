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
    timeoutMs = 15000,
    signal?: AbortSignal
): Promise<T> {
    let lastError: any;

    if (signal?.aborted) {
        throw new Error('Request aborted');
    }

    for (let i = 0; i < retries; i++) {
        if (signal?.aborted) break;

        const attempt = i + 1;
        const localController = new AbortController();

        const onExternalAbort = () => {
            localController.abort('external');
        };
        if (signal) signal.addEventListener('abort', onExternalAbort, { once: true });

        try {
            // Use Promise.race to guarantee the timeout happens even if fn() ignores the signal
            const resultPromise = fn(localController.signal);

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    localController.abort('timeout');
                    reject(new Error('timeout'));
                }, timeoutMs);
            });

            const result = await Promise.race([resultPromise, timeoutPromise]);

            // Success! Remove listener and return
            if (signal) signal.removeEventListener('abort', onExternalAbort);
            return result;

        } catch (err: any) {
            lastError = err;
            const isTimeout = err.message === 'timeout' || localController.signal.reason === 'timeout';
            const isAbort = err.name === 'AbortError' || signal?.aborted || localController.signal.aborted;

            if (isAbort && signal?.aborted) {
                if (signal) signal.removeEventListener('abort', onExternalAbort);
                break;
            }

            // If it's a "standard" error (not timeout/abort), we might want to log it
            if (!isTimeout && !isAbort) {
                console.warn(`[withRetry] Attempt ${attempt} error:`, err.message || err);
            }
        } finally {
            if (signal) signal.removeEventListener('abort', onExternalAbort);
        }

        if (i < retries - 1 && !signal?.aborted) {
            const backoff = delay * Math.pow(2, i);
            await new Promise(r => setTimeout(r, backoff));
        }
    }

    throw lastError || new Error('Request failed after retries');
}
