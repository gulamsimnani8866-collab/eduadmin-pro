// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuthStore()
  if (loading) return <Spinner fullPage />
  if (!admin)  return <Navigate to="/login" replace />
  return children
}
