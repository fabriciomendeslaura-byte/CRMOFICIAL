
import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './UIComponents';
import { logger } from '../lib/logger';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component to catch and handle runtime errors gracefully.
 */
// Fix: Use React.Component explicitly and declare state/props properties to ensure visibility for the TypeScript compiler.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declaring state and props properties to resolve access errors in some TypeScript environments.
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initialize component state
    this.state = {
      hasError: false,
      error: null,
    };
    // Ensure props are available
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Return a state object that triggers the error fallback UI on the next render.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log detailed error information using our production-ready logger.
    logger.error('Uncaught error caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    // Provide a simple mechanism for the user to attempt a manual recovery via refresh.
    window.location.reload();
  };

  private handleGoHome = () => {
    // Redirect the user to the application root if they are stuck in an invalid route state.
    window.location.href = '/';
  };

  public render(): React.ReactNode {
    // Check error state to determine whether to render children or the fallback UI.
    // Fix: Access state and props properties which are now explicitly declared in the class.
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-center transition-all animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-50 dark:ring-red-900/10">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
              Ocorreu uma falha inesperada
            </h2>

            <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
              O sistema encontrou um erro crítico e não pôde continuar.
              Tente recarregar ou voltar para a página inicial.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-950/50 rounded-xl text-left border border-zinc-200 dark:border-zinc-800 overflow-auto max-h-40">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Detalhes técnicos</p>
                <code className="text-xs text-red-600 dark:text-red-400 font-mono break-all leading-tight">
                  {this.state.error.name}: {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="gap-2 shadow-lg shadow-indigo-500/10">
                <RefreshCcw className="w-4 h-4" />
                Recarregar Sistema
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Default rendering path when no error is caught.
    return this.props.children;
  }
}
