// src/components/ui/index.jsx — Comprehensive, high-performance enterprise UI components
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Loader2, X, AlertTriangle, Search, ChevronDown, Check,
  ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react'
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
      className={cn('animate-spin text-accent-600', className)}
    />
  )
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
          {icon}
          <p className="text-xs font-semibold text-slate-600 tracking-wide">Loading workspace…</p>
        </div>
      </div>
    )
  }
  return icon
}

// ─── Button ───────────────────────────────────────────────────────────────────
const buttonVariants = {
  primary:
    'bg-accent-600 hover:bg-accent-700 text-white shadow-sm shadow-accent-600/20 active:translate-y-[1px] border border-accent-500/30',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs active:bg-slate-100',
  outline:
    'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 active:bg-slate-200',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 border border-rose-500/30',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 border border-emerald-500/30',
  dark:
    'bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:bg-slate-950',
}

const buttonSizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md gap-1.5',
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  type = 'button',
  icon: Icon,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || buttonSizes.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'xs' ? 12 : 15} className="animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon size={size === 'xs' ? 12 : 16} className="flex-shrink-0" />
      ) : null}
      {children}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeVariants = {
  blue:    'bg-blue-50 text-blue-700 border-blue-200/80',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  green:   'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  red:     'bg-rose-50 text-rose-700 border-rose-200/80',
  yellow:  'bg-amber-50 text-amber-700 border-amber-200/80',
  amber:   'bg-amber-50 text-amber-700 border-amber-200/80',
  gray:    'bg-slate-100 text-slate-700 border-slate-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200/80',
  sky:     'bg-sky-50 text-sky-700 border-sky-200/80',
}

const dotColors = {
  blue:    'bg-blue-500',
  indigo:  'bg-indigo-500',
  green:   'bg-emerald-500',
  red:     'bg-rose-500',
  yellow:  'bg-amber-500',
  amber:   'bg-amber-500',
  gray:    'bg-slate-400',
  purple:  'bg-purple-500',
  sky:     'bg-sky-500',
}

export function Badge({
  children,
  variant = 'gray',
  dot = false,
  className,
  size = 'sm'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        badgeVariants[variant] || badgeVariants.gray,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0',
            dotColors[variant] || 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-card p-5 transition-all duration-200',
        hover && 'hover:border-slate-300 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── KPI / Stat Card ──────────────────────────────────────────────────────────
const kpiColorMap = {
  blue: {
    bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  green: {
    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  indigo: {
    bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    dot: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    dot: 'bg-orange-500',
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    dot: 'bg-rose-500',
  },
}

export function KpiCard({
  title,
  value,
  delta,
  deltaText = 'vs last month',
  icon: Icon,
  color = 'blue',
  subtitle,
  className
}) {
  const config = kpiColorMap[color] || kpiColorMap.blue
  const isPositive = typeof delta === 'number' && delta >= 0

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:border-slate-300 hover:shadow-card-hover transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value ?? '—'}
            </h3>
          </div>
        </div>

        {Icon && (
          <div className={cn('p-2.5 rounded-xl border flex-shrink-0', config.bg)}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-semibold text-[11px]',
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(delta)}%
            </span>
          )}
          <span className="text-slate-400 truncate">
            {subtitle || deltaText}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  count,
  action,
  breadcrumbs,
  className
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div className="space-y-1">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-2">
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-600 font-semibold' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {count !== undefined && (
            <Badge variant="indigo" size="sm" className="font-semibold">
              {count}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">{action}</div>}
    </div>
  )
}

// ─── Modal (Radix Dialog) ─────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer
}) {
  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-5xl',
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 animate-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-[calc(100%-2rem)] max-h-[90vh] flex flex-col',
            'modal-content-in focus:outline-none',
            sizeMap[size]
          )}
        >
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 flex-shrink-0">
            <div>
              <Dialog.Title className="text-base sm:text-lg font-bold text-slate-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin">{children}</div>

          {footer && (
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-2.5 flex-shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be reversed.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3.5 pt-1 mb-6">
        <div className={cn(
          'p-2.5 rounded-xl flex-shrink-0',
          danger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
        )}>
          <AlertTriangle size={22} />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{message}</p>
      </div>
      <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

// ─── SlideOver / Drawer ───────────────────────────────────────────────────────
export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'sm:max-w-md'
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={cn(
            'w-screen bg-white shadow-2xl border-l border-slate-200 flex flex-col',
            'transform transition ease-in-out duration-300',
            width
          )}
        >
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Form Inputs ──────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input(
  { label, error, helperText, icon: Icon, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full py-2 text-sm bg-white rounded-lg border shadow-xs transition-all',
            'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500',
            'placeholder:text-slate-400 text-slate-900',
            Icon ? 'pl-9 pr-3' : 'px-3',
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/20' : 'border-slate-200',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, helperText, className, rows = 3, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-700">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full px-3 py-2 text-sm bg-white rounded-lg border shadow-xs transition-all resize-y',
          'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500',
          'placeholder:text-slate-400 text-slate-900',
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/20' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, options = [], className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-700">{label}</label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white rounded-lg border shadow-xs transition-all appearance-none cursor-pointer pr-9',
            'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 text-slate-900',
            error ? 'border-rose-400' : 'border-slate-200',
            className
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  )
})

// ─── Toggle Switch ────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5',
          checked ? 'bg-accent-600' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </div>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-slate-900 group-hover:text-slate-800">{label}</p>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  )
}

// ─── File Upload ──────────────────────────────────────────────────────────────
export function FileUpload({ accept, label, onFile, progress, error, hint }) {
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all',
          dragging
            ? 'border-accent-500 bg-accent-50/50 scale-[1.01]'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50',
          error && 'border-rose-400 bg-rose-50/20'
        )}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          id="fileUploadInput"
          onChange={e => e.target.files[0] && onFile(e.target.files[0])}
        />
        <label htmlFor="fileUploadInput" className="cursor-pointer block">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Drag & drop document or{' '}
            <span className="text-accent-600 hover:underline">browse files</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {hint || (accept ? `Accepted formats: ${accept}` : 'PDF, images, DOCX up to 25MB')}
          </p>
        </label>
        {typeof progress === 'number' && progress > 0 && progress < 100 && (
          <div className="mt-3 max-w-xs mx-auto">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{progress}% uploaded</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  )
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return (
    <div className={cn('bg-slate-100 animate-pulse rounded-lg', className)} />
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex gap-4 mb-2">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 px-4 text-center max-w-md mx-auto', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3.5 shadow-xs">
          <Icon size={24} />
        </div>
      )}
      <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
      {description && <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Filter Tabs Bar ──────────────────────────────────────────────────────────
export function Tabs({ tabs = [], activeTab, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto scrollbar-hide', className)}>
      {tabs.map(tab => {
        const id = typeof tab === 'string' ? tab : tab.id
        const label = typeof tab === 'string' ? tab : tab.label
        const count = typeof tab === 'object' ? tab.count : undefined
        const isActive = activeTab === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
              isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-500'
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { default as Spinner } from './Spinner'
