"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * ErrorBoundary — captura erros em subárvores React antes de chegarem ao usuário.
 *
 * Uso:
 *   <ErrorBoundary>
 *     <AlbumList />
 *   </ErrorBoundary>
 *
 * Ou com fallback personalizado:
 *   <ErrorBoundary fallback={<p>Algo deu errado.</p>}>
 *     <StickerGrid ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Em produção, envie para um serviço de logging (Sentry, Datadog, etc.)
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-2xl">😕</p>
          <p className="text-slate-600 font-medium">Algo deu errado.</p>
          <p className="text-sm text-slate-400 max-w-sm text-center">
            {this.state.message || "Tente recarregar a página."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-1.5 rounded-full text-sm font-medium
              bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
