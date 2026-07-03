'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getGameById, getStoreById, STORES, GAMES, type RestockAlert } from '@/lib/data'

type NotiTab = 'stock' | 'restock'

// 위시리스트 매장의 게임별 입고 알림 아이템
interface StoreStockItem {
  storeId: string
  gameId: string
  stockCount: number
  stockStatus: 'in-stock' | 'low-stock'
  updatedAt: string // ISO
}

// 찜한 게임 재고 알림 아이템
interface GameWishlistItem {
  gameId: string
  storeId: string
  stockCount: number
  stockStatus: 'in-stock' | 'low-stock'
  updatedAt: string
}

// 더미 알림 데이터 — 위시리스트 매장(s1, s3)의 입고 이벤트
const STORE_STOCK_NOTIFICATIONS: StoreStockItem[] = [
  { storeId: 's1', gameId: 'g4', stockCount: 2, stockStatus: 'low-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { storeId: 's1', gameId: 'g2', stockCount: 5, stockStatus: 'in-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { storeId: 's3', gameId: 'g7', stockCount: 3, stockStatus: 'in-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { storeId: 's3', gameId: 'g1', stockCount: 1, stockStatus: 'low-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
]

// 더미 알림 데이터 — 찜한 게임(g1, g4) 재고
const GAME_WISHLIST_NOTIFICATIONS: GameWishlistItem[] = [
  { gameId: 'g1', storeId: 's2', stockCount: 2, stockStatus: 'low-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { gameId: 'g4', storeId: 's3', stockCount: 2, stockStatus: 'low-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { gameId: 'g1', storeId: 's1', stockCount: 3, stockStatus: 'in-stock', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function StockBadge({ status, count }: { status: 'in-stock' | 'low-stock'; count: number }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full',
      status === 'in-stock' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'in-stock' ? 'bg-green-400' : 'bg-amber-400')} aria-hidden="true" />
      {status === 'in-stock' ? '입고' : '소량 입고'} {count}개
    </span>
  )
}

function StoreStockCard({ item, onViewGame }: { item: StoreStockItem; onViewGame: (gId: string, sId: string) => void }) {
  const game = getGameById(item.gameId)
  const store = getStoreById(item.storeId)
  if (!game || !store) return null

  return (
    <button
      type="button"
      onClick={() => onViewGame(item.gameId, item.storeId)}
      className="w-full bg-card rounded-[16px] border border-border p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      {/* 게임 커버 */}
      <div className="w-12 h-[68px] rounded-xl overflow-hidden flex-shrink-0 border border-border" style={{ background: game.coverColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={game.imagePath} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-tight truncate">{game.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{store.name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground flex-shrink-0">{relativeTime(item.updatedAt)}</p>
        </div>
        <StockBadge status={item.stockStatus} count={item.stockCount} />
      </div>
    </button>
  )
}

function GameWishlistCard({ item, onViewGame }: { item: GameWishlistItem; onViewGame: (gId: string, sId: string) => void }) {
  const game = getGameById(item.gameId)
  const store = getStoreById(item.storeId)
  if (!game || !store) return null

  // 해당 게임의 전체 재고 합산 (모든 매장)
  const totalStock = STORES.reduce((acc, s) => {
    const inv = s.games.find((g) => g.gameId === item.gameId)
    return acc + (inv && inv.stockStatus !== 'sold-out' ? inv.stockCount : 0)
  }, 0)

  return (
    <button
      type="button"
      onClick={() => onViewGame(item.gameId, item.storeId)}
      className="w-full bg-card rounded-[16px] border border-border p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="w-12 h-[68px] rounded-xl overflow-hidden flex-shrink-0 border border-border" style={{ background: game.coverColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={game.imagePath} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-tight truncate">{game.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{store.name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground flex-shrink-0">{relativeTime(item.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StockBadge status={item.stockStatus} count={item.stockCount} />
          <span className="text-[10px] text-muted-foreground">전체 잔여 {totalStock}개</span>
        </div>
      </div>
    </button>
  )
}

interface NotificationsViewProps {
  favoriteStoreIds: string[]
  restockAlerts: RestockAlert[]
  onViewGame: (gameId: string, storeId: string) => void
}

export function NotificationsView({ favoriteStoreIds, restockAlerts, onViewGame }: NotificationsViewProps) {
  const [tab, setTab] = useState<NotiTab>('stock')

  // 위시리스트 매장 입고 알림 — favoriteStoreIds에 해당하는 매장만 필터
  const storeItems = STORE_STOCK_NOTIFICATIONS.filter((n) => favoriteStoreIds.includes(n.storeId))

  // 찜한 게임 재고 알림 (restockAlerts의 gameId 기준 + 더미 데이터)
  const wishlistGameIds = new Set(restockAlerts.map((a) => a.gameId))
  // 더미 데이터도 표시 (실제에서는 restockAlerts 연동)
  const DEMO_WISHLIST_IDS = new Set(['g1', 'g4'])
  const gameItems = GAME_WISHLIST_NOTIFICATIONS.filter(
    (n) => wishlistGameIds.has(n.gameId) || DEMO_WISHLIST_IDS.has(n.gameId)
  )

  const totalCount = storeItems.length + gameItems.length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 pt-14 pb-3 bg-background border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">새 소식</p>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">알림</h1>
          </div>
          {totalCount > 0 && (
            <span className="bg-destructive text-white text-xs font-extrabold min-w-[26px] h-[26px] rounded-full flex items-center justify-center px-1.5">
              {totalCount}
            </span>
          )}
        </div>

        {/* 탭 전환 */}
        <div className="flex gap-1 bg-muted border border-border rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTab('stock')}
            className={cn(
              'flex-1 h-9 rounded-lg text-xs font-bold transition-colors',
              tab === 'stock' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            관심 매장 입고 ({storeItems.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('restock')}
            className={cn(
              'flex-1 h-9 rounded-lg text-xs font-bold transition-colors',
              tab === 'restock' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            찜한 게임 재고 ({gameItems.length})
          </button>
        </div>
      </header>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {tab === 'stock' ? (
          storeItems.length === 0 ? (
            <EmptyState
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
              title="관심 매장 입고 알림이 없어요"
              subtitle="매장을 위시리스트에 추가하면 새 입고 소식을 알려드려요"
            />
          ) : (
            storeItems.map((item, i) => (
              <StoreStockCard key={`ss-${i}`} item={item} onViewGame={onViewGame} />
            ))
          )
        ) : (
          gameItems.length === 0 ? (
            <EmptyState
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" aria-hidden="true">
                  <line x1="6" y1="11" x2="10" y2="11" />
                  <line x1="8" y1="9" x2="8" y2="13" />
                  <line x1="15" y1="12" x2="15.01" y2="12" />
                  <line x1="18" y1="10" x2="18.01" y2="10" />
                  <rect x="2" y="6" width="20" height="12" rx="6" />
                </svg>
              }
              title="찜한 게임 재고 알림이 없어요"
              subtitle="게임에서 재입고 알림을 신청하면 남은 재고 수를 알려드려요"
            />
          ) : (
            gameItems.map((item, i) => (
              <GameWishlistCard key={`gw-${i}`} item={item} onViewGame={onViewGame} />
            ))
          )
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm font-bold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">{subtitle}</p>
    </div>
  )
}
