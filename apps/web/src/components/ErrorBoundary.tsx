
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    gap: '1rem',
                    fontFamily: 'Inter, sans-serif',
                    color: '#e2e8f0',
                    background: '#0f1117',
                }}>
                    <div style={{ fontSize: '3rem' }}>⚠️</div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Something went wrong</h1>
                    <p style={{ margin: 0, color: '#94a3b8', maxWidth: '400px', textAlign: 'center' }}>
                        {this.state.error?.message ?? 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: '#5865f2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        Reload page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
