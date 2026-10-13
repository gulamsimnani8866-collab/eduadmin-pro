// src/pages/LoginPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/index'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, admin } = useAuthStore()
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  // Already logged in → redirect
  useEffect(() => {
    if (admin) navigate('/dashboard', { replace: true })
  }, [admin, navigate])

  async function onSubmit(data) {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Incorrect email or password'
          : err.code === 'auth/user-not-found'
            ? 'No admin account found'
            : err.message
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">EduAdmin Pro</p>
            <p className="text-white/50 text-xs">Educational Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Login</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your admin account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                {...register('email')}
                className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                           placeholder:text-gray-400 transition"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                             placeholder:text-gray-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="mt-2 w-full justify-center"
            >
              Sign In
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-5">
            Admin accounts are managed by the Super Admin only.
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          EduAdmin Pro © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
