'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { STORES, GAMES, getStoreById, type Platform } from '@/lib/data'
import { PlatformChip } from '@/components/platform-chip'
import { StoreCard } from '@/components/store-card'
import { NaverMap } from '@/components/naver-map'
import { StoreInventoryPanel } from '@/components/store-inventory-panel'

const PLATFORMS: Platform[] = ['PS5', 'Nintendo Switch', 'Xbox']

// 바텀시트 스냅: 화면 상단에서 시트 top까지의 비율 (작을수록 시트가 위로)
const SNAP = {
  collapsed: 0.82, // 지도 위주 — 시트는 살짝만
  half: 0.46,      // 기본 — 지도/목록 반반
  expanded: 0.0,   // 끝까지 — 시트가 지도를 완전히 덮어 매장만 표시
} as const
type SnapKey = keyof typeof SNAP
const SNAP_ORDER: SnapKey[] = ['collapsed', 'half', 'expanded']

interface StoresViewProps {
  onViewGame: (gameId: string, storeId: string) => void
  favoriteStoreIds?: string[]
  onToggleFavorite?: (storeId: string) => void
}

export function StoresView({ onViewGame, favoriteStoreIds = [], onToggleFavorite }: StoresViewProps) {
  const [search, setSearch] = useState('')
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set())
  const [selectedId, setSelectedId] = useState<string>(STORES[0].id)
  const [snap, setSnap] = useState<SnapKey>('half')
  // 재고 패널에서 표시할 매장 id (null이면 패널 닫힘)
  const [inventoryStoreId, setInventoryStoreId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; startTop: number; height: number; active: boolean } | null>(null)
  const [dragTop, setDragTop] = useState<number | null>(null) // px, null이면 CSS 스냅 사용

  // ── 필터링된 매장 목록 ──
  const stores = useMemo(() => {
    const q = search.trim().toLowerCase()
    return STORES.filter((s) => {
      const matchQ =
        !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
      const matchP =
        platforms.size === 0 ||
        s.games.some((sg) => {
          const g = GAMES.find((x) => x.id === sg.gameId)
          return g && platforms.has(g.platform)
        })
      return matchQ && matchP
    })
  }, [search, platforms])

  const togglePlatform = useCallback((p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }, [])

  // ── 스냅 유틸 ──
  const heightOf = () => containerRef.current?.clientHeight ?? window.innerHeight
  const snapToPx = useCallback((k: SnapKey) => Math.round(heightOf() * SNAP[k]), [])
  const nearestSnap = useCallback((topPx: number): SnapKey => {
    const ratio = topPx / heightOf()
    return SNAP_ORDER.reduce((best, k) =>
      Math.abs(SNAP[k] - ratio) < Math.abs(SNAP[best] - ratio) ? k : best
    , SNAP_ORDER[0])
  }, [])

  const goSnap = useCallback((k: SnapKey) => {
    setSnap(k)
    setDragTop(null)
  }, [])

  // ── 드래그 (포인터 + 터치 공통) ──
  const beginDrag = useCallback((clientY: number, target: EventTarget | null) => {
    // 스크롤 영역 안에서 시작하면 드래그 안 함
    if ((target as HTMLElement)?.closest('[data-scroll]')) return false
    const h = heightOf()
    drag.current = { startY: clientY, startTop: dragTop ?? snapToPx(snap), height: h, active: true }
    return true
  }, [dragTop, snap, snapToPx])

  const moveDrag = useCallback((clientY: number) => {
    if (!drag.current?.active) return
    const { startY, startTop, height } = drag.current
    const raw = startTop + (clientY - startY)
    const min = 0
    const max = height * 0.86
    setDragTop(Math.max(min, Math.min(max, raw)))
  }, [])

  const endDrag = useCallback(() => {
    if (!drag.current?.active) return
    drag.current.active = false
    const top = dragTop ?? snapToPx(snap)
    goSnap(nearestSnap(top))
  }, [dragTop, snap, snapToPx, nearestSnap, goSnap])

  // 포인터 이벤트
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (beginDrag(e.clientY, e.target)) {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
  }, [beginDrag])
  const onPointerMove = useCallback((e: React.PointerEvent) => moveDrag(e.clientY), [moveDrag])
  const onPointerUp = useCallback(() => endDrag(), [endDrag])

  // 터치 이벤트
  const onTouchStart = useCallback((e: React.TouchEvent) => beginDrag(e.touches[0].clientY, e.target), [beginDrag])
  const onTouchMove = useCallback((e: React.TouchEvent) => moveDrag(e.touches[0].clientY), [moveDrag])
  const onTouchEnd = useCallback(() => endDrag(), [endDrag])

  // 매장 선택 시 시트가 너무 낮으면 half로 올림
  const selectStore = useCallback((id: string) => {
    setSelectedId(id)
    setSnap((cur) => (cur === 'collapsed' ? 'half' : cur))
    setDragTop(null)
  }, [])

  // 인기 타이틀
  const popular = useMemo(() => {
    return GAMES.slice(0, 6).map((game) => {
      const best = STORES
        .flatMap((s) => s.games
          .filter((sg) => sg.gameId === game.id && sg.stockStatus !== 'sold-out')
          .map((sg) => ({ store: s, sg })))
        .sort((a, b) => a.store.distance - b.store.distance)[0]
      return { game, best }
    })
  }, [])

  const sheetTop = dragTop !== null ? `${dragTop}px` : `${SNAP[snap] * 100}%`
  const isExpanded = snap === 'expanded' && dragTop === null
  // 검색어나 플랫폼 필터가 적용된 상태인지 (빈 상태 문구 분기용)
  const hasFilter = search.trim() !== '' || platforms.size > 0

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background">
      {/* ── 매장 재고 패널 ── */}
      {inventoryStoreId && (() => {
        const panelStore = getStoreById(inventoryStoreId)
        if (!panelStore) return null
        return (
          <StoreInventoryPanel
            store={panelStore}
            onClose={() => setInventoryStoreId(null)}
            onReserve={(gameId, storeId) => {
              setInventoryStoreId(null)
              onViewGame(gameId, storeId)
            }}
          />
        )
      })()}

      {/* ── 지도 (전체 배경) ── */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <NaverMap
          stores={stores}
          selectedStoreId={selectedId}
          onSelectStore={selectStore}
          className="w-full h-full rounded-none"
        />
      </div>

      {/* ── 목록 보기 FAB ── */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => goSnap('expanded')}
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-white rounded-full pl-3.5 pr-4 py-2.5 flex items-center gap-2 text-[13px] font-bold active:scale-95 transition-transform glow-purple"
          style={{
            bottom: `calc(${(1 - SNAP[snap]) * 100}% + 14px)`,
            zIndex: 10000,
            background: 'linear-gradient(135deg, #6200EE, #9C27B0)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          목록 {stores.length}
        </button>
      )}

      {/* ── 바텀시트 ── */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="absolute left-0 right-0 flex flex-col rounded-t-[24px] border-t border-border bg-background"
        style={{
          top: sheetTop,
          bottom: 0,
          boxShadow: '0 -8px 40px rgba(98,0,238,0.18), 0 -2px 12px rgba(0,0,0,0.4)',
          transition: dragTop !== null ? 'none' : 'top 0.34s cubic-bezier(0.32,0.72,0,1)',
          touchAction: 'none',
          willChange: dragTop !== null ? 'top' : 'auto',
          zIndex: 9999,
        }}
      >
        {/* 핸들 + 헤더 */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing select-none">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-5 pt-2 pb-3">
            {/* 타이틀 */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-[17px] font-extrabold text-foreground tracking-tight leading-none">보물상자</h1>
                <p className="text-[11px] text-muted-foreground mt-1">내 주변 게임샵 {stores.length}곳</p>
              </div>
              {isExpanded ? (
                <button
                  type="button"
                  onClick={() => goSnap('half')}
                  className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 text-[12px] font-bold text-primary active:scale-95 transition-transform"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  지도
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-primary/15 text-primary rounded-full px-3 py-1.5 border border-primary/30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-[12px] font-bold">서울</span>
                </div>
              )}
            </div>

            {/* 검색 */}
            <div className="relative mb-2.5">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => goSnap('expanded')}
                placeholder="매장 또는 게임 검색"
                aria-label="매장 검색"
                className="w-full h-11 pl-10 pr-4 rounded-2xl text-sm text-foreground bg-card placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>

            {/* 플랫폼 필터 */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="플랫폼 필터">
              <button
                type="button"
                onClick={() => setPlatforms(new Set())}
                aria-pressed={platforms.size === 0}
                className={`h-9 px-4 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${
                  platforms.size === 0
                    ? 'bg-primary text-primary-foreground glow-purple'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                전체
              </button>
              {PLATFORMS.map((p) => (
                <PlatformChip key={p} platform={p} selected={platforms.has(p)} onClick={() => togglePlatform(p)} />
              ))}
            </div>
          </div>
        </div>

        {/* 매장 목록 */}
        <div data-scroll className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6" style={{ touchAction: 'pan-y' }}>
          <div className="flex items-center justify-between py-3 sticky top-0 z-10 bg-background">
            <p className="text-[13px] font-bold text-foreground">매장 {stores.length}곳</p>
            <span className="text-[12px] text-muted-foreground font-medium">거리순</span>
          </div>

          {stores.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-card border border-border flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              {hasFilter ? (
                <>
                  <p className="text-muted-foreground text-sm font-medium">검색 결과가 없습니다.</p>
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setPlatforms(new Set()) }}
                    className="mt-3 text-sm text-[#BB86FC] font-semibold"
                  >
                    필터 초기화
                  </button>
                </>
              ) : (
                <p className="text-[#6A6A6A] text-sm font-medium">주변에 등록된 매장이 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={store.id === selectedId}
                  isFavorite={favoriteStoreIds.includes(store.id)}
                  onClick={() => selectStore(store.id)}
                  onViewInventory={() => {
                    selectStore(store.id)
                    setInventoryStoreId(store.id)
                  }}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(store.id) : undefined}
                />
              ))}
            </div>
          )}

          {/* 인기 타이틀 */}
          {platforms.size === 0 && !search && stores.length > 0 && (
            <div className="pt-6">
              <h2 className="text-[14px] font-bold text-white mb-3">내 주변 인기 타이틀</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {popular.map(({ game, best }) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => best && onViewGame(game.id, best.store.id)}
                    className="flex-shrink-0 w-[112px] rounded-[14px] border border-border bg-card overflow-hidden active:scale-95 transition-transform text-left"
                  >
                    <div className="h-[92px]" style={{ background: game.coverColor }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={game.imagePath || '/placeholder.svg'} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-foreground leading-tight line-clamp-2">{game.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{best ? `${best.store.distance}km` : '재고 없음'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
