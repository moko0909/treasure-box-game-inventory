'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  GAMES,
  getAllGenres,
  getGameStockSummary,
  getPlatformColor,
  getPlatformShort,
  type Platform,
  type Game,
} from '@/lib/data'

const PLATFORMS: Platform[] = ['PS5', 'Nintendo Switch', 'Xbox']
const PLATFORM_LABELS: Record<Platform, string> = {
  PS5: 'PS5',
  'Nintendo Switch': 'Switch',
  Xbox: 'Xbox',
}

type SortKey = 'stock' | 'newest' | 'rating'
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'stock', label: '재고 우선' },
  { id: 'newest', label: '최신순' },
  { id: 'rating', label: '평점순' },
]

interface GamesViewProps {
  onViewGame: (gameId: string, storeId: string) => void
}

function GameCard({
  game,
  onViewGame,
}: {
  game: Game
  onViewGame: (gameId: string, storeId: string) => void
}) {
  const summary = getGameStockSummary(game.id)
  const hasStock = summary.availableStoreCount > 0

  const handleClick = () => {
    if (summary.nearestStore) onViewGame(game.id, summary.nearestStore.id)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex gap-3.5 bg-[#162032] rounded-2xl p-3.5 text-left active:scale-[0.98] transition-transform"
    >
      {/* 커버 이미지 */}
      <div
        className="w-[72px] h-[100px] rounded-xl overflow-hidden flex-shrink-0"
        style={{ background: game.coverColor }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.imagePath || '/placeholder.svg'}
          alt={`${game.title} 커버`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        {/* 제목 + 플랫폼 뱃지 */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-[15px] font-bold text-[#F8FAFC] leading-snug flex-1 line-clamp-2">
            {game.title}
          </h3>
          <span
            className={cn(
              'text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0',
              getPlatformColor(game.platform)
            )}
          >
            {getPlatformShort(game.platform)}
          </span>
        </div>

        {/* 평점 · 장르 · 연도 */}
        <div className="flex items-center gap-1.5 text-[12px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-bold text-[#CBD5E1]">{game.rating}</span>
          <span className="text-[#334155]">·</span>
          <span className="text-[#64748B]">{game.genre}</span>
          <span className="text-[#334155]">·</span>
          <span className="text-[#64748B]">{game.releaseYear}</span>
        </div>

        {/* 재고 + 가격 */}
        <div className="flex items-center justify-between mt-auto pt-2.5">
          {hasStock ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4ADE80]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" aria-hidden="true" />
              {summary.availableStoreCount}개 매장 재고
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#475569]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" aria-hidden="true" />
              전 매장 품절
            </span>
          )}
          <span className="text-[14px] font-extrabold text-[#F8FAFC]">
            ${summary.lowestPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  )
}

export function GamesView({ onViewGame }: GamesViewProps) {
  const [search, setSearch] = useState('')
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set())
  const [genre, setGenre] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('stock')

  const genres = useMemo(() => getAllGenres(), [])

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = GAMES.filter((g) => {
      const matchQ = !q || g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q)
      const matchP = platforms.size === 0 || platforms.has(g.platform)
      const matchG = !genre || g.genre === genre
      return matchQ && matchP && matchG
    })

    return filtered
      .map((g) => ({ g, summary: getGameStockSummary(g.id) }))
      .sort((a, b) => {
        if (sort === 'stock') {
          if (b.summary.availableStoreCount !== a.summary.availableStoreCount)
            return b.summary.availableStoreCount - a.summary.availableStoreCount
          return b.g.rating - a.g.rating
        }
        if (sort === 'newest') return b.g.releaseYear - a.g.releaseYear
        return b.g.rating - a.g.rating
      })
      .map((x) => x.g)
  }, [search, platforms, genre, sort])

  const hasActiveFilter = platforms.size > 0 || genre !== null || search.trim() !== ''

  const clearAll = () => {
    setSearch('')
    setPlatforms(new Set())
    setGenre(null)
  }

  return (
    <div className="flex flex-col h-full bg-[#0F172A] overflow-hidden">
      {/* 헤더 영역 */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-[11px] text-[#475569] font-semibold mb-0.5">게임 찾기</p>
        <h1 className="text-[28px] font-extrabold text-[#F8FAFC] leading-tight mb-4">
          게임 검색
        </h1>

        {/* 검색창 */}
        <div className="relative mb-4">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="게임명 또는 개발사 검색"
            aria-label="게임 검색"
            className="w-full h-12 pl-11 pr-4 bg-[#162032] rounded-full text-[14px] text-[#F8FAFC] placeholder-[#475569] outline-none border border-transparent focus:border-[#4F46E5] transition-colors"
          />
        </div>

        {/* 플랫폼 필터 */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide mb-3"
          role="group"
          aria-label="플랫폼 필터"
        >
          <button
            type="button"
            onClick={() => setPlatforms(new Set())}
            aria-pressed={platforms.size === 0}
            className={cn(
              'h-9 px-5 rounded-full text-[14px] font-bold flex-shrink-0 transition-all',
              platforms.size === 0
                ? 'bg-[#4F46E5] text-white'
                : 'bg-[#162032] text-[#94A3B8]'
            )}
          >
            전체
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              aria-pressed={platforms.has(p)}
              className={cn(
                'h-9 px-5 rounded-full text-[14px] font-bold flex-shrink-0 transition-all',
                platforms.has(p)
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-[#1E2D3D] text-[#94A3B8]'
              )}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        {/* 장르 필터 */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          role="group"
          aria-label="장르 필터"
        >
          <button
            type="button"
            onClick={() => setGenre(null)}
            aria-pressed={genre === null}
            className={cn(
              'h-8 px-4 rounded-full text-[12px] font-semibold flex-shrink-0 whitespace-nowrap transition-all',
              genre === null
                ? 'bg-[#253347] text-[#F8FAFC]'
                : 'bg-[#162032] text-[#64748B]'
            )}
          >
            모든 장르
          </button>
          {genres.map((gn) => (
            <button
              key={gn}
              type="button"
              onClick={() => setGenre((cur) => (cur === gn ? null : gn))}
              aria-pressed={genre === gn}
              className={cn(
                'h-8 px-4 rounded-full text-[12px] font-semibold flex-shrink-0 whitespace-nowrap transition-all',
                genre === gn
                  ? 'bg-[#253347] text-[#F8FAFC]'
                  : 'bg-[#162032] text-[#64748B]'
              )}
            >
              {gn}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 수 + 정렬 */}
      <div className="flex items-center justify-between px-5 pb-3">
        <p className="text-[14px] font-bold text-[#F8FAFC]">{results.length}개 게임</p>
        <div
          className="flex items-center gap-0.5 bg-[#162032] rounded-full p-1"
          role="group"
          aria-label="정렬"
        >
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={cn(
                'h-7 px-3 rounded-full text-[12px] font-bold transition-all whitespace-nowrap',
                sort === s.id ? 'bg-[#4F46E5] text-white' : 'text-[#64748B]'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 게임 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#162032] rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-[15px] font-bold text-[#F8FAFC] mb-1">검색 결과가 없어요</p>
            <p className="text-[13px] text-[#64748B] mb-5">다른 검색어나 필터를 사용해 보세요</p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="h-9 px-5 rounded-full bg-[#1E293B] border border-[#334155] text-[13px] font-bold text-[#818CF8]"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((g) => (
              <GameCard key={g.id} game={g} onViewGame={onViewGame} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
