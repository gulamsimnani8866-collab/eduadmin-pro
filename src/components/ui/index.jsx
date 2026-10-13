// src/components/ui/index.jsx — All reusable base components

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2, X, AlertTriangle } from 'lucide-react'
import { useState, forwardRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

// ─── cn utility ───────────────────────────────────────────────────────────────

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export default function Spinner({ fullPage, size = 24, className }) {
  const icon = (
    <Loader2
      size={size}
      className={cn('animate-spin text-accent-500', className)}
    />
  )
  if (fullPage)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        {icon}
      </div>
    )
  return icon
}

// ─── Button ───────────────────────────────────────────────────────────────────

const variantMap = {
  primary:   'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
  ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variantMap[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input = forwardRef(function Input(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'px-3 py-2 rounded-lg border text-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
          'placeholder:text-gray-400 transition',
          error ? 'border-danger-500' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
})

// ─── Textarea ─────────────────────────────────────────────────────────────────

export const Textarea = forwardRef(function Textarea(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={cn(
          'px-3 py-2 rounded-lg border text-sm bg-white resize-y',
          'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
          'placeholder:text-gray-400 transition',
          error ? 'border-danger-500' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
})

// ─── Badge ────────────────────────────────────────────────────────────────────

const badgeVariants = {
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-green-100 text-green-700',
  red:     'bg-red-100 text-red-700',
  yellow:  'bg-yellow-100 text-yellow-700',
  gray:    'bg-gray-100 text-gray-600',
  purple:  'bg-purple-100 text-purple-700',
}

export function Badge({ children, variant = 'gray', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        badgeVariants[variant] || badgeVariants.gray,
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn('bg-white rounded-xl shadow-card border border-gray-100 p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Modal (Radix Dialog) ─────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-in fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'z-50 bg-white rounded-2xl shadow-modal w-full mx-4',
            'max-h-[90vh] flex flex-col',
            sizeMap[size]
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle className="text-warning-500 mt-0.5 flex-shrink-0" size={20} />
        <p className="text-sm text-gray-600">{message || 'Are you sure? This action cannot be undone.'}</p>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }) {
  return (
    <div className={cn('bg-gray-100 animate-pulse rounded-lg', className)} />
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors',
          checked ? 'bg-accent-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </div>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </label>
  )
}

// ─── SlideOver / Drawer ───────────────────────────────────────────────────────

export function SlideOver({ open, onClose, title, children, width = 'sm:w-[420px]' }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-white shadow-modal z-50',
          'transition-transform duration-300 flex flex-col',
          'w-full',
          width,
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

export const Select = forwardRef(function Select(
  { label, error, options = [], className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'px-3 py-2 rounded-lg border text-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-accent-500',
          'transition cursor-pointer',
          error ? 'border-danger-500' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
})

// ─── FileUpload ───────────────────────────────────────────────────────────────

export function FileUpload({ accept, label, onFile, progress, error }) {
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition',
          dragging ? 'border-accent-500 bg-accent-50' : 'border-gray-300 hover:border-accent-400',
          error && 'border-danger-500'
        )}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          id="fileInput"
          onChange={e => e.target.files[0] && onFile(e.target.files[0])}
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <p className="text-sm text-gray-500">
            Drag & drop or{' '}
            <span className="text-accent-500 font-medium">browse</span>
          </p>
          {accept && <p className="text-xs text-gray-400 mt-1">{accept}</p>}
        </label>
        {typeof progress === 'number' && progress > 0 && progress < 100 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

export function KpiCard({ title, value, delta, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <Card className="flex items-center gap-4">
      <div className={cn('p-3 rounded-xl', colorMap[color])}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {delta !== undefined && (
          <p className={cn('text-xs mt-0.5', delta >= 0 ? 'text-green-600' : 'text-red-500')}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs last month
          </p>
        )}
      </div>
    </Card>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({ title, count, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {count !== undefined && (
          <Badge variant="blue">{count}</Badge>
        )}
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={40} className="text-gray-300 mb-3" />}
      <p className="font-medium text-gray-600">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { default as Spinner } from './Spinner'
