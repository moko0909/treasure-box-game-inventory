'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { STORES, GAMES, type Platform } from '@/lib/data'
import { PlatformChip } from '@/components/platform-chip'
import { StoreCard } from '@/components/store-card'
import { NaverMap } from '@/components/naver-map'

const PLATFORMS: Platform[] = ['PS5', 'Nintendo Switch', 'Xbox']

/**
 * 바텀시트 스냅 포인트 — 시트 자체 높이(=컨테이너 높이) 대비 아래로 밀어낸 비율.
 *  full: 0    → 시트가 화면 전체를 덮음 (지도 숨김, 매장만 보임)
 *  half: 0.5  → 절반은 지도, 절반은 시트
 *  peek: 0.82 → 대부분 지도, 시트는 핸들 + 검색 헤더만 노출
 */
const SNAP = {
  full: 0,
  half: 0.5,
  peek: 0.82,
} as const

type SnapKey = keyof typeof SNAP
const SNAP_ORDER: SnapKey[] = ['full', 'half', 'peek']

interface StoresViewProps {
  onViewGame: (gameId: string, storeId: string) => void
}

export function StoresView({ onViewGame }: StoresViewProps) {
  const [search, setSearch] = useState('')
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set())
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id)
  const [snap, setSnap] = useState<SnapKey>('half')

  const containerRef = useRef<HTMLDivElement>(null)

  // 드래그 중 시트 오프셋(px). null이면 스냅 값(CSS transition) 사용
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const drag = useRef<{
    startY: number
    startOffset: number
    height: number
    currentOffset: number // 최신 오프셋 (stale closure 방지용)
  } | null>(null)

  // ── 매장 필터링 ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return STORES.filter((store) => {
      const matchQuery =
        !q ||
        store.name.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q) ||
        store.games.some((sg) => {
          const g = GAMES.find((x) => x.id === sg.gameId)
          return g?.title.toLowerCase().includes(q)
        })
      const matchPlatform =
        platforms.size === 0 ||
        store.games.some((sg) => {
          const g = GAMES.find((x) => x.id === sg.gameId)
          return g && platforms.has(g.platform)
        })
      return matchQuery && matchPlatform
    })
  }, [search, platforms])

  const togglePlatform = useCallback((p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }, [])

  // ── 시트 translateY 계산 ──
  const containerH = () => containerRef.current?.clientHeight ?? 0
  const translateY =
    dragOffset !== null ? `${dragOffset}px` : `${SNAP[snap] * 100}%`

  // 가장 가까운 스냅 포인트로 정렬
  const nearestSnap = useCallback((offsetPx: number): SnapKey => {
    const h = containerH() || 1
    const ratio = offsetPx / h
    let best: SnapKey = 'half'
    let min = Infinity
    for (const key of SNAP_ORDER) {
      const d = Math.abs(SNAP[key] - ratio)
      if (d < min) {
        min = d
        best = key
      }
    }
    return best
  }, [])

  // ── 드래그 핸들러 (핸들바 + 헤더 영역에서만) ──
  const onDragStart = useCallback(
    (clientY: number) => {
      const h = containerH()
      const currentOffset = dragOffset ?? SNAP[snap] * h
      drag.current = { startY: clientY, startOffset: currentOffset, height: h, currentOffset }
    },
    [dragOffset, snap],
  )

  const onDragMove = useCallback((clientY: number) => {
    const d = drag.current
    if (!d) return
    const delta = clientY - d.startY
    const next = Math.max(0, Math.min(d.height * 0.85, d.startOffset + delta))
    d.currentOffset = next
    setDragOffset(next)
  }, [])

  const onDragEnd = useCallback(() => {
    const d = drag.current
    if (!d) return
    setSnap(nearestSnap(d.currentOffset))
    setDragOffset(null)
    drag.current = null
  }, [nearestSnap])

  // 포인터 이벤트
  const handlePointerDown = (e: React.PointerEvent) => {
    onDragStart(e.clientY)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* 합성 이벤트 등에서 pointerId가 없을 수 있음 — 무시 */
    }
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (drag.current) onDragMove(e.clientY)
  }
  const handlePointerUp = () => onDragEnd()

  // 매장 선택 시 시트가 너무 낮으면 half까지 올림
  const selectStore = useCallback(
    (id: string) => {
      setSelectedStoreId(id)
      setSnap((s) => (s === 'peek' ? 'half' : s))
    },
    [],
  )

  // 검색 포커스 시 시트 최대로
  const focusSearch = useCallback(() => {
    setDragOffset(null)
    setSnap('full')
  }, [])

  const isFull = snap === 'full' && dragOffset === null

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#070D1A]">
      {/* ── 지도 (전체 배경) ── */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <NaverMap
          stores={filtered}
          selectedStoreId={selectedStoreId}
          onSelectStore={selectStore}
          className="w-full h-full rounded-none"
        />
      </div>

      {/* ── 지도 보기 버튼 (시트가 전체를 덮을 때) ── */}
      {isFull && (
        <button
          type="button"
          onClick={() => setSnap('peek')}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] bg-[#4F46E5] text-white rounded-full px-4 py-2 flex items-center gap-1.5 shadow-lg text-xs font-bold active:scale-95 transition-transform"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          지도 보기
        </button>
      )}

      {/* ── 바텀시트 ── */}
      <div
        className="absolute inset-0 flex flex-col bg-[#0F172A] rounded-t-[24px] shadow-[0_-4px_30px_rgba(0,0,0,0.6)]"
        style={{
          transform: `translateY(${translateY})`,
          transition: dragOffset !== null ? 'none' : 'transform 0.34s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
          zIndex: 9999,
        }}
      >
        {/* 드래그 존: 핸들 + 헤더 */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
        >
          {/* 핸들바 */}
          <div className="flex justify-center pt-3 pb-2.5">
            <div className="w-10 h-1.5 rounded-full bg-[#475569]" />
          </div>

          {/* 헤더 */}
          <div className="px-4 pb-3 border-b border-[#1E293B]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <h1 className="text-base font-extrabold text-[#F8FAFC] tracking-tight">보물상자</h1>
                <span className="text-[11px] text-[#64748B] font-medium">내 주변 게임샵</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#4F46E5]/15 text-[#818CF8] rounded-full px-2.5 py-1 border border-[#4F46E5]/20">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-[11px] font-bold">서울</span>
              </div>
            </div>

            {/* 검색 */}
            <div className="relative mb-2.5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                inputMode="search"
                placeholder="매장 또는 게임 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={focusSearch}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-10 pl-9 pr-4 bg-[#1E293B] rounded-xl text-sm text-[#F8FAFC] placeholder-[#475569] outline-none border border-[#334155] focus:border-[#4F46E5] transition-colors"
                aria-label="매장 검색"
              />
            </div>

            {/* 플랫폼 필터 */}
            <div
              className="flex gap-2 overflow-x-auto scrollbar-hide"
              role="group"
              aria-label="플랫폼 필터"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPlatforms(new Set())}
                className={`h-8 px-3.5 rounded-full text-xs font-bold border flex-shrink-0 transition-all ${
                  platforms.size === 0
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
                  selected={platforms.has(p)}
                  onClick={() => togglePlatform(p)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 매장 목록 (스크롤) */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-xs font-bold text-[#F8FAFC]">매장 {filtered.length}곳</p>
            <span className="text-xs text-[#64748B] font-semibold">거리순</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#64748B] text-sm">검색 결과가 없어요</p>
              <button
                type="button"
                className="mt-2 text-sm text-[#818CF8] font-semibold"
                onClick={() => {
                  setSearch('')
                  setPlatforms(new Set())
                }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {filtered.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={store.id === selectedStoreId}
                  onClick={() => selectStore(store.id)}
                  onViewInventory={() => selectStore(store.id)}
                />
              ))}
            </div>
          )}

          {/* 인기 타이틀 */}
          {platforms.size === 0 && !search && (
            <div className="px-4 pt-5 pb-6">
              <h2 className="text-sm font-bold text-[#F8FAFC] mb-3">내 주변 인기 타이틀</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {GAMES.slice(0, 6).map((game) => {
                  const best = STORES.flatMap((s) =>
                    s.games
                      .filter((sg) => sg.gameId === game.id && sg.stockStatus !== 'sold-out')
                      .map((sg) => ({ store: s, inv: sg })),
                  ).sort((a, b) => a.store.distance - b.store.distance)[0]
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => best && onViewGame(game.id, best.store.id)}
                      className="flex-shrink-0 w-[110px] bg-[#1E293B] rounded-[14px] border border-[#334155] overflow-hidden active:scale-95 transition-transform text-left"
                    >
                      <div className="h-[88px]" style={{ background: game.coverColor }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={game.imagePath || '/placeholder.svg'} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-[#F8FAFC] leading-tight line-clamp-2">{game.title}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{best ? `${best.store.distance}km` : '재고 없음'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
