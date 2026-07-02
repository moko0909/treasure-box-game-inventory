'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  GAMES,
  STORES,
  getGameById,
  getStoreById,
  getPlatformColor,
  getPlatformShort,
} from '@/lib/data'
import { StockBadge } from '@/components/stock-badge'

interface GameDetailViewProps {
  gameId: string
  storeId: string
  onBack: () => void
  onReserve: (gameId: string, storeId: string) => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < Math.floor(rating) ? '#F59E0B' : 'none'}
          stroke="#F59E0B"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-sm font-bold text-[#F8FAFC] ml-1">{rating}</span>
    </div>
  )
}

export function GameDetailView({ gameId, storeId, onBack, onReserve }: GameDetailViewProps) {
  const [reserving, setReserving] = useState(false)
  const [reserved, setReserved] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'stores'>('info')

  const game = getGameById(gameId)
  const currentStore = getStoreById(storeId)

  if (!game || !currentStore) return null

  const currentInventory = currentStore.games.find((g) => g.gameId === game.id)

  const storesWithGame = STORES.map((store) => {
    const inv = store.games.find((g) => g.gameId === game.id)
    return inv ? { store, inv } : null
  })
    .filter(Boolean)
    .sort((a, b) => a!.store.distance - b!.store.distance) as {
    store: (typeof STORES)[0]
    inv: (typeof STORES)[0]['games'][0]
  }[]

  const handleReserve = async () => {
    if (reserved || currentInventory?.stockStatus === 'sold-out') return
    setReserving(true)
    await new Promise((r) => setTimeout(r, 1200))
    setReserving(false)
    setReserved(true)
    onReserve(gameId, storeId)
  }

  const canReserve = currentInventory && currentInventory.stockStatus !== 'sold-out'

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Hero image */}
      <div className="relative">
        <div
          className="relative w-full h-[300px]"
          style={{ background: `linear-gradient(to bottom, ${game.coverColor}, ${game.coverColor}CC)` }}
        >
          {game.imagePath && (
            <Image
              src={game.imagePath}
              alt={`${game.title} cover art`}
              fill
              className="object-cover"
              priority
            />
          )}
          {/* Dark gradient overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: 'linear-gradient(to top, #0F172A, transparent)' }}
            aria-hidden="true"
          />
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-[#0F172A]/80 backdrop-blur border border-[#334155] flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Platform tag */}
        <div className="absolute top-12 right-4">
          <span
            className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-full',
              getPlatformColor(game.platform)
            )}
          >
            {getPlatformShort(game.platform)}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 -mt-4">
          {/* Title + stock */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-[#F8FAFC] leading-tight flex-1 text-balance tracking-tight">
              {game.title}
            </h1>
            {currentInventory && (
              <div className="flex-shrink-0 mt-1">
                <StockBadge status={currentInventory.stockStatus} count={currentInventory.stockCount} />
              </div>
            )}
          </div>

          {/* Rating + meta */}
          <div className="flex items-center gap-3 mb-1">
            <StarRating rating={game.rating} />
            <span className="text-xs text-[#64748B]">{game.genre}</span>
            <span className="text-xs text-[#64748B]">{game.releaseYear}</span>
          </div>
          <p className="text-xs text-[#475569] mb-4">by {game.developer}</p>

          {/* Price + store card */}
          <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">Price at</p>
                <p className="text-sm font-bold text-[#F8FAFC] truncate">{currentStore.name}</p>
              </div>
              <p className="text-2xl font-extrabold text-[#F8FAFC]">
                ${currentInventory?.price.toFixed(2) ?? game.price.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {currentStore.distance} km away ·{' '}
              {currentStore.isOpen
                ? `Open until ${currentStore.closesAt}`
                : `Opens at ${currentStore.opensAt}`}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#334155] mb-4">
            {(['info', 'stores'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-bold capitalize transition-colors',
                  activeTab === tab
                    ? 'text-[#4F46E5] border-b-2 border-[#4F46E5] -mb-px'
                    : 'text-[#475569]'
                )}
              >
                {tab === 'info' ? 'Game Info' : 'All Stores'}
              </button>
            ))}
          </div>

          {activeTab === 'info' ? (
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC] mb-2">About</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">{game.description}</p>

              <h2 className="text-sm font-bold text-[#F8FAFC] mb-3">Details</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Platform',  value: game.platform },
                  { label: 'Genre',     value: game.genre },
                  { label: 'Developer', value: game.developer },
                  { label: 'Release',   value: String(game.releaseYear) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#1E293B] rounded-xl border border-[#334155] p-3">
                    <p className="text-[11px] text-[#64748B] mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-[#F8FAFC]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC] mb-3">
                {storesWithGame.length} Store{storesWithGame.length !== 1 ? 's' : ''} Carry This Title
              </h2>
              <div className="flex flex-col gap-2">
                {storesWithGame.map(({ store, inv }) => (
                  <div
                    key={store.id}
                    className={cn(
                      'bg-[#1E293B] rounded-[14px] border p-3 flex items-center justify-between gap-3',
                      store.id === storeId
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                        : 'border-[#334155]'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#F8FAFC] truncate">{store.name}</p>
                      <p className="text-xs text-[#64748B]">{store.distance} km · ${inv.price.toFixed(2)}</p>
                    </div>
                    <StockBadge status={inv.stockStatus} count={inv.stockCount} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reserve CTA — fixed */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#1E293B] border-t border-[#334155] px-4 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {reserved ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-[14px] py-4 flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-bold text-green-400">Reserved! Pick up within 48 hours</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleReserve}
            disabled={!canReserve || reserving}
            className={cn(
              'w-full h-[52px] rounded-[14px] text-base font-extrabold tracking-wide transition-all active:scale-[0.98]',
              canReserve
                ? 'bg-[#F59E0B] text-[#0F172A] shadow-lg shadow-[#F59E0B]/20 hover:bg-[#D97706]'
                : 'bg-[#1E293B] text-[#475569] cursor-not-allowed border border-[#334155]'
            )}
          >
            {reserving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3" />
                  <path d="M21 12a9 9 0 00-9-9" />
                </svg>
                Reserving...
              </span>
            ) : !canReserve ? (
              'Out of Stock'
            ) : (
              `Reserve at ${currentStore.name}`
            )}
          </button>
        )}
        <p className="text-[11px] text-center text-[#475569] mt-2">
          Free reservation · Hold for 48 hours · No payment now
        </p>
      </div>
    </div>
  )
}
