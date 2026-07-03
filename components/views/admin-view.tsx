'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { STORES, getGameById, type StockStatus, getStockLabel } from '@/lib/data'
import { StockBadge } from '@/components/stock-badge'

type AdminTab = 'inventory' | 'reservations'
type AdminReservationStatus = 'pending' | 'ready' | 'picked-up'

interface InventoryItem {
  gameId: string
  storeId: string
  stockStatus: StockStatus
  stockCount: number
  price: number
}

interface AdminReservation {
  id: string
  code: string
  game: string
  customer: string
  expires: string
  status: AdminReservationStatus
}

const STATUS_OPTIONS: StockStatus[] = ['in-stock', 'low-stock', 'sold-out']

function InventoryRow({
  item,
  onUpdate,
  t,
}: {
  item: InventoryItem
  onUpdate: (gameId: string, storeId: string, status: StockStatus, count: number) => void
  t: ReturnType<typeof useT>
}) {
  const game = getGameById(item.gameId)
  if (!game) return null

  return (
    <div className="bg-card rounded-[14px] border border-border p-3">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: game.coverColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.imagePath} alt={game.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight line-clamp-1">{game.title}</p>
          <p className="text-xs text-muted-foreground">{game.platform} · ₩{Math.round(item.price * 1300).toLocaleString()}</p>
        </div>
        <StockBadge status={item.stockStatus} size="sm" />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={item.stockStatus}
          onChange={(e) => onUpdate(item.gameId, item.storeId, e.target.value as StockStatus, item.stockCount)}
          className="flex-1 h-9 rounded-xl border border-border bg-background text-xs font-semibold text-foreground px-2 outline-none focus:border-primary appearance-none"
          aria-label={`${game.title} 재고 상태`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{getStockLabel(s)}</option>
          ))}
        </select>

        <div className="flex items-center gap-0 bg-background rounded-xl border border-border overflow-hidden h-9">
          <button
            type="button"
            onClick={() => onUpdate(item.gameId, item.storeId, item.stockStatus, Math.max(0, item.stockCount - 1))}
            className="w-9 h-full flex items-center justify-center text-foreground hover:bg-muted transition-colors text-lg font-medium"
            aria-label="수량 감소"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-extrabold text-foreground">{item.stockCount}</span>
          <button
            type="button"
            onClick={() => onUpdate(item.gameId, item.storeId, item.stockStatus, item.stockCount + 1)}
            className="w-9 h-full flex items-center justify-center text-foreground hover:bg-muted transition-colors text-lg font-medium"
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminView({ storeLocation }: { storeLocation?: string | null }) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory')
  const [selectedStoreId, setSelectedStoreId] = useState(STORES[0].id)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [inventory, setInventory] = useState(() =>
    STORES.flatMap((store) =>
      store.games.map((g) => ({
        gameId: g.gameId,
        storeId: store.id,
        stockStatus: g.stockStatus,
        stockCount: g.stockCount,
        price: g.price,
      }))
    )
  )

  const [adminReservations, setAdminReservations] = useState<AdminReservation[]>([
    { id: 'ra1', code: 'TB-4821', game: 'Spider-Man 2',  customer: '김민준', expires: '오늘 오후 6시',   status: 'pending' },
    { id: 'ra2', code: 'TB-9034', game: 'Zelda: TotK',   customer: '이서연', expires: '내일 오전 10시', status: 'pending' },
    { id: 'ra3', code: 'TB-2217', game: 'Mario Kart 8',  customer: '박도현', expires: '오늘 오후 8시',   status: 'ready' },
    { id: 'ra4', code: 'TB-5509', game: 'FF XVI',         customer: '최지우', expires: '1월 14일',      status: 'picked-up' },
  ])

  const storeInventory = inventory.filter((i) => i.storeId === selectedStoreId)
  const totalInStock = storeInventory.filter((i) => i.stockStatus === 'in-stock').reduce((a, b) => a + b.stockCount, 0)
  const lowStockCount = storeInventory.filter((i) => i.stockStatus === 'low-stock').length
  const soldOutCount  = storeInventory.filter((i) => i.stockStatus === 'sold-out').length

  const todayExpiry = adminReservations.filter((r) => r.status !== 'picked-up' && r.expires.includes('오늘')).length

  const updateItem = (gameId: string, storeId: string, status: StockStatus, count: number) => {
    setSaveStatus('idle')
    setInventory((prev) =>
      prev.map((item) =>
        item.gameId === gameId && item.storeId === storeId
          ? { ...item, stockStatus: status, stockCount: count }
          : item
      )
    )
  }

  const handleSave = () => {
    // 실제 환경에서는 Server Action 호출 위치
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2500)
  }

  const advanceReservation = (id: string) => {
    setAdminReservations((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        if (r.status === 'pending') return { ...r, status: 'ready' }
        if (r.status === 'ready') return { ...r, status: 'picked-up' }
        return r
      })
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-background px-4 pt-12 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">{t('admin_eyebrow')}</p>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t('admin_title')}</h1>
            {storeLocation && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {storeLocation}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-[#F59E0B]/15 text-[#F59E0B] rounded-full px-3 py-1.5 border border-[#F59E0B]/20">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-xs font-bold">{t('admin_badge')}</span>
          </div>
        </div>

        {/* 매장 선택 */}
        <div className="relative mb-4">
          <select
            value={selectedStoreId}
            onChange={(e) => { setSelectedStoreId(e.target.value); setSaveStatus('idle') }}
            className="w-full h-11 pl-4 pr-8 bg-card rounded-xl border border-border text-sm font-semibold text-foreground outline-none focus:border-primary appearance-none"
            aria-label={t('admin_store_select')}
          >
            {STORES.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* 빠른 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5 text-center">
            <p className="text-lg font-extrabold text-green-400">{totalInStock}</p>
            <p className="text-[10px] text-green-500 font-bold">{t('admin_stat_in_stock')}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 text-center">
            <p className="text-lg font-extrabold text-yellow-400">{lowStockCount}</p>
            <p className="text-[10px] text-yellow-500 font-bold">{t('admin_stat_low_stock')}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
            <p className="text-lg font-extrabold text-red-400">{soldOutCount}</p>
            <p className="text-[10px] text-red-500 font-bold">{t('admin_stat_sold_out')}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex mt-4 bg-muted rounded-xl border border-border p-1 gap-1">
          {(['inventory', 'reservations'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'inventory' ? t('admin_tab_inventory') : t('admin_tab_reservations')}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 bg-background">
        {activeTab === 'inventory' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                {t('admin_inventory_count')}{storeInventory.length}{t('admin_inventory_count_suffix')}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" className="text-xs text-primary font-bold">{t('admin_add_title')}</button>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {storeInventory.map((item) => (
                <InventoryRow
                  key={`${item.storeId}-${item.gameId}`}
                  item={item}
                  onUpdate={updateItem}
                  t={t}
                />
              ))}
            </div>
            {/* 저장 버튼 */}
            <button
              type="button"
              onClick={handleSave}
              className={cn(
                'w-full h-12 rounded-2xl text-sm font-bold transition-all',
                saveStatus === 'saved'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              )}
            >
              {saveStatus === 'saved' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('admin_save_success')}
                </span>
              ) : t('admin_save_inventory')}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                {t('admin_reservations_count')}{adminReservations.length}{t('admin_reservations_count_suffix')}
              </p>
              {todayExpiry > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[#F59E0B] font-bold">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {t('admin_expiry_alert')} {todayExpiry}{t('admin_expiry_alert_suffix')}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {adminReservations.map((r) => (
                <div key={r.id} className="bg-card rounded-[14px] border border-border p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{r.game}</p>
                      <p className="text-xs text-muted-foreground">{t('admin_customer_label')}: {r.customer}</p>
                    </div>
                    <span className={cn(
                      'text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                      r.status === 'pending'   && 'bg-primary/15 text-primary',
                      r.status === 'ready'     && 'bg-green-500/15 text-green-400',
                      r.status === 'picked-up' && 'bg-muted text-muted-foreground border border-border',
                    )}>
                      {r.status === 'pending' ? t('admin_status_pending') : r.status === 'ready' ? t('admin_status_ready') : t('admin_status_picked_up')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {t('admin_expiry_label')}: {r.expires}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground">{r.code}</span>
                      {r.status !== 'picked-up' && (
                        <button
                          type="button"
                          onClick={() => advanceReservation(r.id)}
                          className="h-7 px-3 rounded-full bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition-opacity"
                        >
                          {r.status === 'pending' ? t('admin_btn_mark_ready') : t('admin_btn_mark_done')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
