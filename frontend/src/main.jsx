import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Componente simple para mostrar errores
const ErrorFallback = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full border border-red-200">
      <h2 className="text-2xl font-bold text-red-600 mb-4">¡Algo salió mal! 😱</h2>
      <p className="text-gray-600 mb-4">La aplicación ha encontrado un error crítico.</p>

      <div className="bg-gray-900 text-red-300 p-4 rounded overflow-auto font-mono text-sm mb-6">
        <p className="font-bold mb-2">{error?.message}</p>
        <p className="opacity-70 whitespace-pre-wrap">{error?.stack}</p>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
      >
        Intentar Recargar
      </button>
    </div>
  </div>
);

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }

  componentDidCatch(error, info) {
    console.error("Critical Error:", error, info);
  }

  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
