'use client'

import { cn } from '@/lib/utils'
import type { Store } from '@/lib/data'
import { StockBadge } from './stock-badge'

interface StoreCardProps {
  store: Store
  selected?: boolean
  isFavorite?: boolean
  onClick?: () => void
  onViewInventory?: () => void
  onToggleFavorite?: () => void
  className?: string
}

export function StoreCard({
  store,
  selected,
  isFavorite = false,
  onClick,
  onViewInventory,
  onToggleFavorite,
  className,
}: StoreCardProps) {
  const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
  const lowStockCount = store.games.filter((g) => g.stockStatus === 'low-stock').length
  const totalCount = store.games.length

  return (
    <div
      id={`store-card-${store.id}`}
      role="button"
      tabIndex={0}
      onClick={() => { onClick?.(); onViewInventory?.() }}
      onKeyDown={(e) => { if (e.key === 'Enter') { onClick?.(); onViewInventory?.() } }}
      aria-selected={selected}
      className={cn(
        'rounded-[18px] p-4 border bg-card transition-all duration-200 cursor-pointer active:scale-[0.98]',
        selected
          ? 'border-primary'
          : 'border-border hover:border-primary/50',
        className
      )}
      style={{
        boxShadow: selected ? '0 0 20px rgba(98,0,238,0.2)' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-[15px] leading-tight">{store.name}</h3>
            {store.tag && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary flex-shrink-0">
                {store.tag}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate text-muted-foreground">{store.address}</p>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
              aria-label={isFavorite ? '관심 매장 해제' : '관심 매장 추가'}
              aria-pressed={isFavorite}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-muted/60"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorite ? '#CF6679' : 'none'}
                stroke={isFavorite ? '#CF6679' : 'currentColor'}
                strokeWidth="2"
                className={isFavorite ? '' : 'text-muted-foreground'}
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          )}
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full',
                store.isOpen
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {store.isOpen ? '영업 중' : `${store.opensAt} 오픈`}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {store.closesAt} 마감
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{store.distance} km 거리</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD600" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-bold text-foreground">{store.rating}</span>
          <span>({store.reviewCount})</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mb-3 bg-border" aria-hidden="true" />

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
            <span className="text-xs text-muted-foreground">타이틀 {totalCount}종 관리 중</span>
          )}
        </div>
        <span className="text-xs font-bold text-primary flex items-center gap-0.5">
          재고 보기
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </div>
  )
}
