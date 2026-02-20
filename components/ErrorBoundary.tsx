"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
                        <div className="rounded-full bg-red-500/10 p-4 text-red-500 mb-4">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white">Terjadi Kesalahan</h2>
                        <p className="mt-2 text-neutral-400 max-w-md">
                            Maaf, terjadi kesalahan saat memuat komponen ini. Silakan coba muat ulang halaman.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black hover:bg-neutral-200 transition"
                        >
                            Coba Lagi
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="mt-8 max-w-full overflow-auto rounded bg-black/50 p-4 text-left text-xs text-red-400">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                )
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
