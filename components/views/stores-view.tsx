'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { STORES, GAMES, type Platform } from '@/lib/data'
import { PlatformChip } from '@/components/platform-chip'
import { StoreCard } from '@/components/store-card'
import { NaverMap } from '@/components/naver-map'

const PLATFORMS: Platform[] = ['PS5', 'Nintendo Switch', 'Xbox']

// 네비바 높이 (px) — 바텀시트 bottom 기준
const NAV_H = 64

// 스냅 포인트: 지도가 차지하는 비율 (0 = 시트가 최상단, 1 = 지도만 보임)
const SNAP_RATIOS = {
  full: 0.08,   // 시트가 거의 꽉 참 (리스트 집중)
  half: 0.44,   // 반반 (기본)
  peek: 0.78,   // 핸들바만 살짝 올라옴 (지도 넓게)
} as const
type SnapKey = keyof typeof SNAP_RATIOS

interface StoresViewProps {
  onViewGame: (gameId: string, storeId: string) => void
}

export function StoresView({ onViewGame }: StoresViewProps) {
  const [search, setSearch] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set())
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id)
  const [snap, setSnap] = useState<SnapKey>('half')

  // 드래그 추적
  const containerRef = useRef<HTMLDivElement>(null)
  const [liveTop, setLiveTop] = useState<number | null>(null) // null = CSS snap 사용
  // SSR/hydration mismatch 방지: 마운트 전에는 렌더 억제
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const drag = useRef<{ startY: number; startTop: number; live: boolean } | null>(null)

  // 컨테이너 가용 높이 (네비바 제외) — SSR-safe
  const availH = useCallback((): number => {
    const el = containerRef.current
    if (el) return el.clientHeight - NAV_H
    if (typeof window !== 'undefined') return window.innerHeight - NAV_H
    return 700 // SSR 폴백
  }, [])

  const snapToPx = useCallback((k: SnapKey): number =>
    Math.round(availH() * SNAP_RATIOS[k]), [availH])

  const resolveSnap = useCallback((topPx: number): SnapKey => {
    const h = availH()
    const ratio = topPx / h
    return (Object.entries(SNAP_RATIOS) as [SnapKey, number][])
      .map(([k, v]) => ({ k, d: Math.abs(v - ratio) }))
      .sort((a, b) => a.d - b.d)[0].k
  }, [availH])

  // ── 포인터 드래그 ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startTop: liveTop ?? snapToPx(snap), live: true }
    e.preventDefault()
  }, [liveTop, snap, snapToPx])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current?.live) return
    const h = availH()
    const raw = drag.current.startTop + (e.clientY - drag.current.startY)
    setLiveTop(Math.max(h * 0.03, Math.min(h * 0.90, raw)))
  }, [availH])

  const onPointerUp = useCallback(() => {
    if (!drag.current?.live) return
    drag.current.live = false
    const resolved = resolveSnap(liveTop ?? snapToPx(snap))
    setSnap(resolved)
    setLiveTop(null)
  }, [liveTop, snap, snapToPx, resolveSnap])

  // ── 터치 드래그 (모바일) ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]')) return
    drag.current = { startY: e.touches[0].clientY, startTop: liveTop ?? snapToPx(snap), live: true }
  }, [liveTop, snap, snapToPx])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!drag.current?.live) return
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]')) return
    const h = availH()
    const raw = drag.current.startTop + (e.touches[0].clientY - drag.current.startY)
    setLiveTop(Math.max(h * 0.03, Math.min(h * 0.90, raw)))
  }, [availH])

  const onTouchEnd = useCallback(() => {
    if (!drag.current?.live) return
    drag.current.live = false
    const resolved = resolveSnap(liveTop ?? snapToPx(snap))
    setSnap(resolved)
    setLiveTop(null)
  }, [liveTop, snap, snapToPx, resolveSnap])

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const filteredStores = useMemo(() => STORES.filter((store) => {
    const matchSearch = !search ||
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.address.toLowerCase().includes(search.toLowerCase())
    const matchPlatform = selectedPlatforms.size === 0 ||
      store.games.some((sg) => {
        const g = GAMES.find((g) => g.id === sg.gameId)
        return g && selectedPlatforms.has(g.platform)
      })
    return matchSearch && matchPlatform
  }), [search, selectedPlatforms])

  // 시트의 top 값 — 마운트 전에는 CSS 백분율로 SSR/CSR 일치시켜 hydration mismatch 방지
  const sheetTopPx = mounted ? (liveTop !== null ? liveTop : snapToPx(snap)) : null
  const sheetTopStyle = sheetTopPx !== null ? `${sheetTopPx}px` : `${SNAP_RATIOS[snap] * 100}%`
  // CSS transition — 드래그 중엔 off, snap 이동 시엔 on
  const transition = liveTop !== null ? 'none' : 'top 0.3s cubic-bezier(0.32,0.72,0,1)'

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#070D1A]">

      {/* 지도 — absolute로 전체 영역 채움 */}
      <div className="absolute inset-0" style={{ bottom: `${NAV_H}px`, zIndex: 0 }}>
        <NaverMap
          stores={filteredStores}
          selectedStoreId={selectedStoreId}
          onSelectStore={(id) => {
            setSelectedStoreId(id)
            if (snap === 'peek') { setSnap('half'); setLiveTop(null) }
          }}
          className="w-full h-full"
        />
      </div>

      {/* 바텀시트 */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="absolute left-0 right-0 flex flex-col bg-[#0F172A] rounded-t-[22px] shadow-[0_-8px_40px_rgba(0,0,0,0.7)]"
        style={{
          top: sheetTopStyle,
          bottom: `${NAV_H}px`,
          transition,
          touchAction: 'none',
          willChange: 'top',
          zIndex: 1100,
        }}
      >
        {/* 핸들바 */}
        <div
          className="flex-shrink-0 flex justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing"
          aria-label="드래그하여 시트 크기 조절"
        >
          <div className="w-10 h-[5px] rounded-full bg-[#334155]" />
        </div>

        {/* 검색 + 필터 헤더 */}
        <div className="flex-shrink-0 px-4 pb-3 border-b border-[#1E293B]/80">
          {/* 타이틀 행 */}
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h1 className="text-[17px] font-extrabold text-[#F8FAFC] tracking-tight leading-tight">보물상자</h1>
              <p className="text-[11px] text-[#64748B]">내 주변 게임샵</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#4F46E5]/10 border border-[#4F46E5]/25 rounded-full px-3 py-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-[11px] font-bold text-[#818CF8]">서울</span>
            </div>
          </div>

          {/* 검색창 */}
          <div className="relative mb-2.5">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              data-no-drag="true"
              type="search"
              placeholder="매장 또는 게임 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (snap !== 'full') { setSnap('full'); setLiveTop(null) } }}
              className="w-full h-10 pl-9 pr-4 bg-[#1E293B] rounded-xl text-sm text-[#F8FAFC] placeholder-[#475569] outline-none border border-[#334155] focus:border-[#4F46E5] transition-colors"
              aria-label="매장 검색"
            />
          </div>

          {/* 플랫폼 필터 */}
          <div
            data-no-drag="true"
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            role="group"
            aria-label="플랫폼 필터"
          >
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
          data-no-drag="true"
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ touchAction: 'pan-y' }}
        >
          {/* 결과 카운트 */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-xs font-bold text-[#F8FAFC]">매장 {filteredStores.length}곳</p>
            <button type="button" className="text-xs text-[#818CF8] font-semibold">거리순</button>
          </div>

          {filteredStores.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-[#64748B]">검색 결과가 없어요</p>
              <button
                type="button"
                className="mt-2 text-sm text-[#818CF8] font-semibold"
                onClick={() => { setSearch(''); setSelectedPlatforms(new Set()) }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 pb-4">
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
            <div className="px-4 pt-2 pb-6">
              <h2 className="text-sm font-bold text-[#F8FAFC] mb-3">내 주변 인기 타이틀</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {GAMES.slice(0, 6).map((game) => {
                  const best = STORES
                    .flatMap((s) => s.games
                      .filter((sg) => sg.gameId === game.id && sg.stockStatus !== 'sold-out')
                      .map((sg) => ({ store: s, inv: sg }))
                    )
                    .sort((a, b) => a.store.distance - b.store.distance)[0]
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => best && onViewGame(game.id, best.store.id)}
                      className="flex-shrink-0 w-[110px] bg-[#1E293B] rounded-[14px] border border-[#334155] overflow-hidden active:scale-95 transition-transform text-left"
                    >
                      <div className="h-[88px]" style={{ background: game.coverColor }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={game.imagePath} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-[#F8FAFC] leading-tight line-clamp-2">{game.title}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          {best ? `${best.store.distance}km` : '재고 없음'}
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

      {/* 지도 넓히기 FAB — peek 상태가 아닐 때 시트 위에 표시 */}
      {snap !== 'peek' && (
        <button
          type="button"
          onClick={() => { setSnap('peek'); setLiveTop(null) }}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#0F172A]/90 backdrop-blur-sm border border-[#334155] rounded-full px-4 py-2 shadow-lg text-xs font-bold text-[#CBD5E1] active:scale-95 transition-transform"
          style={{
            top: sheetTopPx !== null ? `${sheetTopPx - 44}px` : `calc(${SNAP_RATIOS[snap] * 100}% - 44px)`,
            zIndex: 1200,
            transition,
          }}
          aria-label="지도 넓게 보기"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          지도 보기
        </button>
      )}
    </div>
  )
}
