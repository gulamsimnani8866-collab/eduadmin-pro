// src/App.jsx
import { Component } from 'react'
import { Toaster }   from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import AppRouter from './routes/AppRouter'

// ─── Global Error Boundary ─────────────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-500 max-w-sm text-center">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Auth Init ─────────────────────────────────────────────────────────────

function AuthInit({ children }) {
  const init = useAuthStore(s => s.init)
  useEffect(() => {
    const unsub = init()
    return () => typeof unsub === 'function' && unsub()
  }, [init])
  return children
}

// ─── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <AuthInit>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
            style:   { borderRadius: '10px', fontSize: '14px', fontFamily: 'Sora, sans-serif' },
          }}
        />
      </AuthInit>
    </ErrorBoundary>
  )
}
