// src/pages/LoginPage.jsx — Pure Firebase Authentication
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, BookOpen, ShieldCheck,
  CheckCircle2, ArrowRight, Lock, Mail
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/index'

const schema = z.object({
  email: z.string().email('Enter a valid institutional email'),
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

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (admin) navigate('/dashboard', { replace: true })
  }, [admin, navigate])

  async function onSubmit(data) {
    try {
      await login(data.email, data.password)
      toast.success('Signed in successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Incorrect email or password'
          : err.code === 'auth/user-not-found'
            ? 'No administrator found with this email'
            : err.message || 'Authentication failed'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid line backdrop */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"
      />

      <div className="relative max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left branding */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center pr-8 space-y-8">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-accent-500/25">
              <BookOpen size={24} />
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
              EduAdmin Pro <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-indigo-300 to-blue-400">
                Academic Command
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
              Manage your institution's live classrooms, course inventory, curriculum, and student enrollments directly synchronized with Firebase Firestore.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              'Direct connection to Firebase project: jscdatabase',
              'Real-time Firestore listeners for courses, classes & users',
              'Cloudinary storage for images & PDFs; Firebase for videos',
              'Role-based permissions verified via Firebase Auth'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 size={16} className="text-accent-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 text-xs text-slate-500 border-t border-slate-800/80">
            <span>Powered by Google Firebase Infrastructure</span>
          </div>
        </div>

        {/* Right: Modern Sign In Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-accent-500/20">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Admin Portal</h2>
                  <p className="text-xs text-slate-400">Firebase Authentication</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Firebase Live</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
                className="w-full mt-2 font-semibold bg-accent-600 hover:bg-accent-500 text-white border-0 shadow-lg shadow-accent-600/30 transition-all"
              >
                Sign In with Firebase
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Firebase Auth Service</span>
              <span>EduAdmin Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
