// src/components/ui/Spinner.jsx
import { Loader2 } from 'lucide-react'

export default function Spinner({ fullPage, size = 24, className = '' }) {
  const icon = (
    <Loader2
      size={size}
      className={`animate-spin text-blue-500 ${className}`}
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
