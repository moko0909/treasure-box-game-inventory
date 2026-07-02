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
  type StockStatus,
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
          fill={i < Math.floor(rating) ? '#FACC15' : 'none'}
          stroke="#FACC15"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-sm font-semibold text-foreground ml-1">{rating}</span>
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

  // All stores that carry this game
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
    <div className="flex flex-col h-full bg-background">
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
          {/* Gradient overlay at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24"
            style={{ background: `linear-gradient(to top, var(--background), transparent)` }}
            aria-hidden="true"
          />
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Platform tag */}
        <div className="absolute top-12 right-4">
          <span
            className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-full shadow-md',
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
            <h1 className="text-xl font-bold text-foreground leading-tight flex-1 text-balance">
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
            <span className="text-xs text-muted-foreground">{game.genre}</span>
            <span className="text-xs text-muted-foreground">{game.releaseYear}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">by {game.developer}</p>

          {/* Price + store */}
          <div className="bg-card rounded-[18px] border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Price at</p>
                <p className="text-sm font-semibold text-foreground truncate">{currentStore.name}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">${currentInventory?.price.toFixed(2) ?? game.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {currentStore.distance} km away · {currentStore.isOpen ? `Open until ${currentStore.closesAt}` : `Opens at ${currentStore.opensAt}`}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            {(['info', 'stores'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold capitalize transition-colors',
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary -mb-px'
                    : 'text-muted-foreground'
                )}
              >
                {tab === 'info' ? 'Game Info' : 'All Stores'}
              </button>
            ))}
          </div>

          {activeTab === 'info' ? (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{game.description}</p>

              <h2 className="text-sm font-semibold text-foreground mb-3">Details</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Platform', value: game.platform },
                  { label: 'Genre', value: game.genre },
                  { label: 'Developer', value: game.developer },
                  { label: 'Release', value: String(game.releaseYear) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-xl p-3">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                {storesWithGame.length} Store{storesWithGame.length !== 1 ? 's' : ''} Carry This Title
              </h2>
              <div className="flex flex-col gap-2">
                {storesWithGame.map(({ store, inv }) => (
                  <div
                    key={store.id}
                    className={cn(
                      'bg-card rounded-[14px] border p-3 flex items-center justify-between gap-3',
                      store.id === storeId ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.distance} km · ${inv.price.toFixed(2)}</p>
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
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        {reserved ? (
          <div className="bg-green-50 border border-green-200 rounded-[14px] py-4 flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-semibold text-green-700">Reserved! Pick up within 48 hours</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleReserve}
            disabled={!canReserve || reserving}
            className={cn(
              'w-full h-14 rounded-[14px] text-base font-bold transition-all active:scale-[0.98]',
              canReserve
                ? 'bg-[#F97316] text-white shadow-md shadow-orange-200 hover:bg-orange-500'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
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
        <p className="text-[11px] text-center text-muted-foreground mt-2">
          Free reservation · Hold for 48 hours · No payment now
        </p>
      </div>
    </div>
  )
}
