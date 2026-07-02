'use client'

import { cn } from '@/lib/utils'
import type { Store } from '@/lib/data'
import { StockBadge } from './stock-badge'

interface StoreCardProps {
  store: Store
  selected?: boolean
  onClick?: () => void
  onViewInventory?: () => void
  className?: string
}

export function StoreCard({
  store,
  selected,
  onClick,
  onViewInventory,
  className,
}: StoreCardProps) {
  const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
  const lowStockCount = store.games.filter((g) => g.stockStatus === 'low-stock').length
  const totalCount = store.games.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-selected={selected}
      className={cn(
        'bg-[#1E293B] rounded-[18px] p-4 border transition-all duration-200 cursor-pointer active:scale-[0.98]',
        selected
          ? 'border-[#4F46E5] shadow-lg shadow-[#4F46E5]/10'
          : 'border-[#334155] hover:border-[#4F46E5]/50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#F8FAFC] text-[15px] leading-tight">{store.name}</h3>
            {store.tag && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4F46E5]/20 text-[#818CF8] flex-shrink-0">
                {store.tag}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5 truncate">{store.address}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              store.isOpen
                ? 'bg-green-500/15 text-green-400'
                : 'bg-[#263347] text-[#64748B]'
            )}
          >
            {store.isOpen ? 'Open' : `Opens ${store.opensAt}`}
          </span>
          <span className="text-[11px] text-[#475569]">
            Closes {store.closesAt}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 text-xs text-[#64748B]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{store.distance} km away</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#64748B]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-bold text-[#F8FAFC]">{store.rating}</span>
          <span>({store.reviewCount})</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#334155] mb-3" aria-hidden="true" />

      {/* Inventory summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {inStockCount > 0 && (
            <StockBadge status="in-stock" count={inStockCount} size="sm" />
          )}
          {lowStockCount > 0 && (
            <StockBadge status="low-stock" count={lowStockCount} size="sm" />
          )}
          {inStockCount === 0 && lowStockCount === 0 && (
            <span className="text-xs text-[#475569]">{totalCount} titles tracked</span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onViewInventory?.()
          }}
          className="text-xs font-bold text-[#818CF8] hover:text-[#A5B4FC] transition-colors min-h-[44px] flex items-center px-1"
        >
          View Inventory →
        </button>
      </div>
    </div>
  )
}
