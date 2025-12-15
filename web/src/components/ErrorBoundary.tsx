import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Check for dynamic import errors (chunk loading failures)
        // These typically happen when a new version is deployed and old chunks are 404
        if (
            error.message.includes("Failed to fetch dynamically imported module") ||
            error.message.includes("Failed to load module script") ||
            error.message.includes("Importing a module script failed")
        ) {
            console.log("Chunk load error detected, reloading page...");
            window.location.reload();
            return;
        }
    }

    public render() {
        if (this.state.hasError) {
            // For non-chunk errors, we can just render the children or a fallback
            // Since we're mainly targeting chunk errors which trigger a reload,
            // we can try to render children (though they might be broken) or a generic error UI.
            // For now, let's render a simple fallback if it wasn't a chunk error that triggered reload.
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
