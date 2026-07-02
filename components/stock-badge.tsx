'use client'

import { cn } from '@/lib/utils'
import type { StockStatus } from '@/lib/data'
import { getStockLabel } from '@/lib/data'

interface StockBadgeProps {
  status: StockStatus
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

export function StockBadge({ status, count, size = 'md', className }: StockBadgeProps) {
  const base = 'inline-flex items-center gap-1 font-semibold rounded-full'
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }
  const colors = {
    'in-stock': 'bg-green-50 text-green-700',
    'low-stock': 'bg-yellow-50 text-yellow-700',
    'sold-out': 'bg-red-50 text-red-600',
  }
  const dots = {
    'in-stock': 'bg-green-500',
    'low-stock': 'bg-yellow-500',
    'sold-out': 'bg-red-500',
  }

  return (
    <span className={cn(base, sizes[size], colors[status], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[status])} aria-hidden="true" />
      {getStockLabel(status)}
      {count !== undefined && status !== 'sold-out' && (
        <span className="opacity-70">({count})</span>
      )}
    </span>
  )
}
