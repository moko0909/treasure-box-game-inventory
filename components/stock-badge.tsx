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
  const base = 'inline-flex items-center gap-1 font-bold rounded-full tracking-wide'
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }
  const colors = {
    'in-stock':  'bg-[#BB86FC]/15 text-[#BB86FC] border border-[#BB86FC]/25',
    'low-stock': 'bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/25',
    'sold-out':  'bg-[#CF6679]/15 text-[#CF6679] border border-[#CF6679]/25',
  }
  const dots = {
    'in-stock':  'bg-[#BB86FC]',
    'low-stock': 'bg-[#FFD600]',
    'sold-out':  'bg-[#CF6679]',
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
