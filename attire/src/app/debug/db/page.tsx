'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function DebugDBPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
        console.log(`[DebugDB] ${msg}`);
    };

    const runTest = async () => {
        setStatus('loading');
        setData(null);
        setError(null);
        addLog('Starting test...');

        try {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            addLog(`Initializing client with URL: ${url}`);
            
            const supabase = createBrowserClient(url, key);

            addLog('Querying categories table (raw, no timeout wrapper)...');
            const startTime = Date.now();
            
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .limit(5);

            const duration = Date.now() - startTime;
            addLog(`Query finished in ${duration}ms`);

            if (catError) {
                addLog(`Error: ${catError.message}`);
                setError(catError);
                setStatus('error');
            } else {
                addLog(`Success! Found ${catData?.length || 0} categories.`);
                setData(catData);
                setStatus('success');
            }
        } catch (err: any) {
            addLog(`Critical Error: ${err.message}`);
            setError(err);
            setStatus('error');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Supabase Connectivity Debug</h1>
            
            <div className="mb-6 flex gap-4">
                <button 
                    onClick={runTest}
                    disabled={status === 'loading'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {status === 'loading' ? 'Testing...' : 'Run Connectivity Test'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <section>
                    <h2 className="text-lg font-semibold mb-2">Logs</h2>
                    <div className="bg-slate-900 text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                </section>

                {status === 'success' && data && (
                    <section>
                        <h2 className="text-lg font-semibold mb-2 text-green-600">Response Data</h2>
                        <pre className="bg-slate-100 p-4 rounded overflow-x-auto text-xs">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </section>
                ) as any}

                {status === 'error' && error && (
                    <section>
                        <h2 className="text-lg font-semibold mb-2 text-red-600">Error Details</h2>
                        <pre className="bg-red-50 text-red-800 p-4 rounded overflow-x-auto text-xs">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </section>
                ) as any}
            </div>
        </div>
    );
}
