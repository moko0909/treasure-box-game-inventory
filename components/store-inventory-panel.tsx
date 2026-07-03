'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  GAMES,
  getGameById,
  getPlatformShort,
  type Store,
  type StockStatus,
} from '@/lib/data'
import { StockBadge } from '@/components/stock-badge'

interface StoreInventoryPanelProps {
  store: Store
  onClose: () => void
  onReserve: (gameId: string, storeId: string) => void
  isGuest?: boolean
}

const STATUS_ORDER: StockStatus[] = ['in-stock', 'low-stock', 'sold-out']

const PLATFORM_COLORS: Record<string, string> = {
  PS5: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
  'Nintendo Switch': 'bg-red-500/10 text-red-400 border-red-500/20',
  Xbox: 'bg-green-600/10 text-green-400 border-green-600/20',
}

export function StoreInventoryPanel({
  store,
  onClose,
  onReserve,
  isGuest = false,
}: StoreInventoryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // 마운트 직후 이벤트가 바로 트리거되지 않도록 딜레이
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // 재고 상태별 정렬
  const sortedInventory = [...store.games].sort(
    (a, b) => STATUS_ORDER.indexOf(a.stockStatus) - STATUS_ORDER.indexOf(b.stockStatus),
  )

  const availableCount = store.games.filter(
    (g) => g.stockStatus !== 'sold-out',
  ).length

  return (
    <>
      {/* 딤 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 z-[10000]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${store.name} 재고 정보`}
        className="absolute left-0 right-0 bottom-0 z-[10001] flex flex-col rounded-t-[24px] border-t border-x border-border bg-background"
        style={{
          maxHeight: '78%',
          boxShadow: '0 -8px 40px rgba(98,0,238,0.22), 0 -2px 12px rgba(0,0,0,0.5)',
          animation: 'slideUpPanel 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
        </div>

        {/* 헤더 */}
        <div className="flex-shrink-0 px-5 pt-2 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[17px] font-extrabold text-foreground leading-tight">
                  {store.name}
                </h2>
                {store.tag && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary flex-shrink-0">
                    {store.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {store.address}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    store.isOpen
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {store.isOpen ? '영업 중' : `${store.opensAt} 오픈`}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {store.distance} km
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFD600" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {store.rating}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 transition-transform active:scale-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 재고 요약 칩 */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-bold text-muted-foreground">
              총 {store.games.length}종 ·
            </span>
            <span className="text-xs font-bold text-primary">
              예약 가능 {availableCount}종
            </span>
          </div>
        </div>

        {/* 게임 목록 */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 flex flex-col gap-3">
          {sortedInventory.map((inv) => {
            const game = getGameById(inv.gameId)
            if (!game) return null
            const canReserve = inv.stockStatus !== 'sold-out'
            const platformLabel = getPlatformShort(game.platform)

            return (
              <div
                key={inv.gameId}
                className={cn(
                  'rounded-[16px] border bg-card p-3.5 flex items-center gap-3 transition-all',
                  canReserve ? 'border-border' : 'border-border opacity-55',
                )}
              >
                {/* 커버 이미지 */}
                <div
                  className="w-14 h-14 rounded-[10px] flex-shrink-0 overflow-hidden"
                  style={{ background: game.coverColor }}
                >
                  {game.imagePath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.imagePath}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                        PLATFORM_COLORS[game.platform] ?? 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {platformLabel}
                    </span>
                    <StockBadge status={inv.stockStatus} size="sm" />
                  </div>
                  <p className="text-[13px] font-bold text-foreground leading-tight line-clamp-2">
                    {game.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-bold text-foreground">
                      ₩{Math.round(inv.price * 1320).toLocaleString()}
                    </span>
                    {inv.stockStatus !== 'sold-out' && (
                      <span className="text-[11px] text-muted-foreground">
                        잔여 {inv.stockCount}개
                      </span>
                    )}
                  </div>
                </div>

                {/* 예약 버튼 */}
                <div className="flex-shrink-0">
                  {!canReserve ? (
                    <span className="h-9 px-3 flex items-center text-[11px] font-bold text-muted-foreground bg-muted rounded-[10px]">
                      품절
                    </span>
                  ) : isGuest ? (
                    <Link
                      href="/sign-in"
                      className="h-9 px-3 flex items-center text-[11px] font-bold text-muted-foreground bg-muted rounded-[10px] whitespace-nowrap"
                    >
                      로그인 필요
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReserve(game.id, store.id)}
                      className={cn(
                        'h-9 px-3.5 rounded-[10px] text-[12px] font-bold transition-all active:scale-95',
                        inv.stockStatus === 'low-stock'
                          ? 'bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30'
                          : 'bg-primary text-primary-foreground',
                      )}
                    >
                      예약
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 게스트 안내 배너 */}
        {isGuest && (
          <div className="flex-shrink-0 mx-5 mb-3 rounded-[14px] bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary">예약하려면 로그인이 필요합니다</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">게스트는 재고 조회만 가능합니다</p>
            </div>
            <Link
              href="/sign-in"
              className="flex-shrink-0 text-xs font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-full"
            >
              로그인
            </Link>
          </div>
        )}

        {/* 전화 문의 버튼 */}
        <div className="flex-shrink-0 px-5 pt-3 pb-6 border-t border-border">
          <a
            href={`tel:${store.phone}`}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-[14px] border border-border bg-card text-foreground text-sm font-bold transition-all active:scale-[0.98]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .98h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            {store.phone} 문의
          </a>
        </div>
      </div>
    </>
  )
}
