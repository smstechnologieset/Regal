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
    timeoutMs = 30000,
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
        let timeoutId: NodeJS.Timeout | undefined;

        const onExternalAbort = () => {
            localController.abort('external');
        };

        if (signal) signal.addEventListener('abort', onExternalAbort, { once: true });

        try {
            const resultPromise = fn(localController.signal);

            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    console.error(`[withRetry] Timeout reached after ${timeoutMs}ms for attempt ${attempt}`);
                    localController.abort('timeout');
                    reject(new Error('timeout'));
                }, timeoutMs);
            });

            const result = await Promise.race([resultPromise, timeoutPromise]);

            // Success! Clear timeout and remove listener
            if (timeoutId) clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onExternalAbort);
            return result;

        } catch (err: any) {
            // Error occurred! Clear timeout and remove listener
            if (timeoutId) clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onExternalAbort);

            lastError = err;
            const isTimeout = err.message === 'timeout' || localController.signal.reason === 'timeout';
            const isAbort = err.name === 'AbortError' || signal?.aborted || localController.signal.aborted;

            if (isAbort && signal?.aborted) {
                console.log(`[withRetry] Request aborted externally during attempt ${attempt}`);
                break;
            }

            if (isTimeout) {
                console.warn(`[withRetry] Attempt ${attempt} timed out.`);
            } else if (!isAbort) {
                console.warn(`[withRetry] Attempt ${attempt} error:`, err.message || err);
            }
        }

        if (i < retries - 1 && !signal?.aborted) {
            const backoff = delay * Math.pow(2, i);
            await new Promise(r => setTimeout(r, backoff));
        }
    }

    throw lastError || new Error('Request failed after retries');
}
