'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { STORES, GAMES, type Platform } from '@/lib/data'
import { PlatformChip } from '@/components/platform-chip'
import { StoreCard } from '@/components/store-card'
import { NaverMap } from '@/components/naver-map'

const PLATFORMS: Platform[] = ['PS5', 'Nintendo Switch', 'Xbox']

// 바텀시트 스냅 포지션 (화면 상단에서 시트 top까지의 비율)
// 'full' = 거의 전체 (헤더만 지도에 남음), 'half' = 절반, 'peek' = 핸들바만
const SNAPS = {
  peek: 0.80,   // 지도 80% → 시트 20% (지도 넓게)
  half: 0.45,   // 지도 45% → 시트 55% (기본)
  full: 0.0,    // 지도 0%  → 시트 100% (끝까지 올리면 매장 목록만)
} as const

type SnapKey = keyof typeof SNAPS

interface StoresViewProps {
  onViewGame: (gameId: string, storeId: string) => void
}

export function StoresView({ onViewGame }: StoresViewProps) {
  const [search, setSearch] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set())
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id)
  const [snap, setSnap] = useState<SnapKey>('half')

  // 드래그 상태
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{
    startY: number
    startTop: number        // px
    containerH: number
    dragging: boolean
  } | null>(null)
  const [dragTop, setDragTop] = useState<number | null>(null) // null = snap 사용

  const containerRef = useRef<HTMLDivElement>(null)

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const filteredStores = useMemo(() => {
    return STORES.filter((store) => {
      const matchesSearch =
        !search ||
        store.name.toLowerCase().includes(search.toLowerCase()) ||
        store.address.toLowerCase().includes(search.toLowerCase())
      const matchesPlatform =
        selectedPlatforms.size === 0 ||
        store.games.some((sg) => {
          const game = GAMES.find((g) => g.id === sg.gameId)
          return game && selectedPlatforms.has(game.platform)
        })
      return matchesSearch && matchesPlatform
    })
  }, [search, selectedPlatforms])

  // 현재 스냅 비율 → px
  const snapToPx = useCallback((key: SnapKey): number => {
    const h = containerRef.current?.clientHeight ?? window.innerHeight
    return Math.round(h * SNAPS[key])
  }, [])

  // 드래그 종료 시 가장 가까운 스냅 선택
  const resolveSnap = useCallback((topPx: number): SnapKey => {
    const h = containerRef.current?.clientHeight ?? window.innerHeight
    const ratio = topPx / h
    const distances = (Object.entries(SNAPS) as [SnapKey, number][]).map(
      ([k, v]) => ({ k, d: Math.abs(v - ratio) })
    )
    distances.sort((a, b) => a.d - b.d)
    return distances[0].k
  }, [])

  // ── 포인터 드래그 핸들러 ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // 시트 내부 스크롤 영역에서는 드래그 시작하지 않음
    const target = e.target as HTMLElement
    if (target.closest('[data-sheet-scroll]')) return

    const h = containerRef.current?.clientHeight ?? window.innerHeight
    const currentTop = dragTop ?? snapToPx(snap)

    dragState.current = {
      startY: e.clientY,
      startTop: currentTop,
      containerH: h,
      dragging: true,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [snap, dragTop, snapToPx])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current?.dragging) return
    const { startY, startTop, containerH } = dragState.current
    const dy = e.clientY - startY
    const raw = startTop + dy
    const MIN = containerH * 0.04
    const MAX = containerH * 0.88
    setDragTop(Math.max(MIN, Math.min(MAX, raw)))
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current?.dragging) return
    dragState.current.dragging = false
    const currentTop = dragTop ?? snapToPx(snap)
    const resolved = resolveSnap(currentTop)
    setSnap(resolved)
    setDragTop(null)
  }, [dragTop, snap, snapToPx, resolveSnap])

  // 터치 핸들러 (모바일 패스스루)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-sheet-scroll]')) return
    const h = containerRef.current?.clientHeight ?? window.innerHeight
    const currentTop = dragTop ?? snapToPx(snap)
    dragState.current = {
      startY: e.touches[0].clientY,
      startTop: currentTop,
      containerH: h,
      dragging: true,
    }
  }, [snap, dragTop, snapToPx])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.current?.dragging) return
    const target = e.target as HTMLElement
    if (target.closest('[data-sheet-scroll]')) return
    const { startY, startTop, containerH } = dragState.current
    const dy = e.touches[0].clientY - startY
    const raw = startTop + dy
    const MIN = containerH * 0.04
    const MAX = containerH * 0.88
    setDragTop(Math.max(MIN, Math.min(MAX, raw)))
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!dragState.current?.dragging) return
    dragState.current.dragging = false
    const currentTop = dragTop ?? snapToPx(snap)
    const resolved = resolveSnap(currentTop)
    setSnap(resolved)
    setDragTop(null)
  }, [dragTop, snap, snapToPx, resolveSnap])

  // 시트 top 계산
  const sheetTop = dragTop !== null ? dragTop : null // null → CSS transition으로 snap

  const snapTopPct = `${SNAPS[snap] * 100}%`

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#070D1A]">

      {/* ── 지도 (전체 배경) ── */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      >
        <NaverMap
          stores={filteredStores}
          selectedStoreId={selectedStoreId}
          onSelectStore={(id) => {
            setSelectedStoreId(id)
            // 매장 선택 시 half로 올라옴
            if (snap === 'peek') { setSnap('half'); setDragTop(null) }
          }}
          className="w-full h-full rounded-none"
        />
      </div>

      {/* ── 바텀시트 ── */}
      <div
        ref={sheetRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="absolute left-0 right-0 bottom-0 flex flex-col bg-[#0F172A] rounded-t-[24px] shadow-[0_-4px_30px_rgba(0,0,0,0.6)]"
        style={{
          top: sheetTop !== null ? `${sheetTop}px` : snapTopPct,
          transition: sheetTop !== null ? 'none' : 'top 0.32s cubic-bezier(0.32,0.72,0,1)',
          touchAction: 'none',
          willChange: 'top',
          zIndex: 9999,
        }}
      >
        {/* 핸들바 */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-9 h-1 rounded-full bg-[#475569]" />
        </div>

        {/* 검색 + 필터 헤더 */}
        <div className="px-4 pb-3 flex-shrink-0 border-b border-[#1E293B]">
          {/* 타이틀 행 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[#F8FAFC] tracking-tight">보물상자</h1>
              <span className="text-[11px] text-[#64748B] font-medium">내 주변 게임샵</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#4F46E5]/15 text-[#818CF8] rounded-full px-2.5 py-1 border border-[#4F46E5]/20">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-[11px] font-bold">서울</span>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative mb-2.5">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              placeholder="매장 또는 게임 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (snap !== 'full') { setSnap('full'); setDragTop(null) } }}
              className="w-full h-10 pl-9 pr-4 bg-[#1E293B] rounded-xl text-sm text-[#F8FAFC] placeholder-[#475569] outline-none border border-[#334155] focus:border-[#4F46E5] transition-colors"
              aria-label="매장 검색"
            />
          </div>

          {/* 플랫폼 필터 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="플랫폼 필터">
            <button
              type="button"
              onClick={() => setSelectedPlatforms(new Set())}
              className={`h-8 px-3.5 rounded-full text-xs font-bold border flex-shrink-0 transition-all ${
                selectedPlatforms.size === 0
                  ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-[#334155]'
              }`}
            >
              전체
            </button>
            {PLATFORMS.map((p) => (
              <PlatformChip
                key={p}
                platform={p}
                selected={selectedPlatforms.has(p)}
                onClick={() => togglePlatform(p)}
              />
            ))}
          </div>
        </div>

        {/* 매장 목록 (스크롤) */}
        <div
          data-sheet-scroll="true"
          className="flex-1 overflow-y-auto overscroll-contain pb-24"
          style={{ touchAction: 'pan-y' }}
        >
          {/* 결과 헤더 */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-xs font-bold text-[#F8FAFC]">매장 {filteredStores.length}곳</p>
            <button type="button" className="text-xs text-[#818CF8] font-semibold">거리순</button>
          </div>

          {filteredStores.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#64748B] text-sm">검색 결과가 없어요</p>
              <button
                type="button"
                className="mt-2 text-sm text-[#818CF8] font-semibold"
                onClick={() => { setSearch(''); setSelectedPlatforms(new Set()) }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 pb-2">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={store.id === selectedStoreId}
                  onClick={() => setSelectedStoreId(store.id)}
                  onViewInventory={() => setSelectedStoreId(store.id)}
                />
              ))}
            </div>
          )}

          {/* 인기 타이틀 스트립 */}
          {selectedPlatforms.size === 0 && !search && (
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-bold text-[#F8FAFC] mb-3">내 주변 인기 타이틀</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {GAMES.slice(0, 6).map((game) => {
                  const storeInventory = STORES.flatMap((s) =>
                    s.games
                      .filter((sg) => sg.gameId === game.id && sg.stockStatus !== 'sold-out')
                      .map((sg) => ({ store: s, inv: sg }))
                  )
                  const bestStore = storeInventory.sort((a, b) => a.store.distance - b.store.distance)[0]
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => bestStore && onViewGame(game.id, bestStore.store.id)}
                      className="flex-shrink-0 w-[110px] bg-[#1E293B] rounded-[14px] border border-[#334155] overflow-hidden active:scale-95 transition-transform text-left"
                    >
                      <div className="h-[88px]" style={{ background: game.coverColor }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={game.imagePath} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-[#F8FAFC] leading-tight line-clamp-2">{game.title}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          {bestStore ? `${bestStore.store.distance}km` : '재고 없음'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 스냅 힌트 버튼 (지도 위 우측 하단 FAB) ── */}
      {snap !== 'full' && (
        <button
          type="button"
          onClick={() => { setSnap('full'); setDragTop(null) }}
          className="absolute right-4 z-20 bg-[#0F172A]/90 backdrop-blur-sm border border-[#334155] rounded-full px-3 py-2 flex items-center gap-1.5 shadow-lg text-xs font-bold text-[#CBD5E1] active:scale-95 transition-transform"
          style={{ bottom: `calc(${(1 - SNAPS[snap]) * 100}% + 12px)` }}
          aria-label="매장 목록 펼치기"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" aria-hidden="true">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
          목록 보기
        </button>
      )}

      {/* ── 지도 확대 버튼 (시트 full 상태일 때) ── */}
      {snap === 'full' && (
        <button
          type="button"
          onClick={() => { setSnap('peek'); setDragTop(null) }}
          className="absolute right-4 top-14 z-20 bg-[#0F172A]/90 backdrop-blur-sm border border-[#334155] rounded-full px-3 py-2 flex items-center gap-1.5 shadow-lg text-xs font-bold text-[#CBD5E1] active:scale-95 transition-transform"
          aria-label="지도 넓게 보기"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          지도 보기
        </button>
      )}
    </div>
  )
}
