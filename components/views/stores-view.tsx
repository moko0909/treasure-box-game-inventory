'use client'

import { useState, useMemo } from 'react'
import { STORES, GAMES, type Platform } from '@/lib/data'
import { PlatformChip } from '@/components/platform-chip'
import { StoreCard } from '@/components/store-card'
import { StoreMap } from '@/components/store-map'

const PLATFORMS: Platform[] = ['PS5', 'Nintendo Switch', 'Xbox']

interface StoresViewProps {
  onViewGame: (gameId: string, storeId: string) => void
}

export function StoresView({ onViewGame }: StoresViewProps) {
  const [search, setSearch] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set())
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id)

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white px-4 pt-12 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Near You</p>
            <h1 className="text-xl font-bold text-foreground leading-tight">Treasure Box</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-xs font-semibold">Shibuya</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search stores or games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-muted rounded-xl text-sm outline-none border border-transparent focus:border-primary focus:bg-white transition-colors"
            aria-label="Search stores"
          />
        </div>

        {/* Platform filters */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide" role="group" aria-label="Filter by platform">
          <button
            type="button"
            onClick={() => setSelectedPlatforms(new Set())}
            className={`h-9 px-4 rounded-full text-sm font-semibold border flex-shrink-0 transition-all ${
              selectedPlatforms.size === 0
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground border-border hover:border-primary'
            }`}
          >
            All
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
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Map */}
        <div className="px-4 pt-4">
          <StoreMap
            stores={filteredStores}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            className="h-[180px]"
          />
        </div>

        {/* Store list */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {filteredStores.length} Store{filteredStores.length !== 1 ? 's' : ''} Found
            </h2>
            <button type="button" className="text-xs text-primary font-medium">
              Sort by distance
            </button>
          </div>

          {filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No stores found</p>
              <button
                type="button"
                className="mt-2 text-sm text-primary font-medium"
                onClick={() => { setSearch(''); setSelectedPlatforms(new Set()) }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={store.id === selectedStoreId}
                  onClick={() => setSelectedStoreId(store.id)}
                  onViewInventory={() => {
                    setSelectedStoreId(store.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Featured games strip */}
        {selectedPlatforms.size === 0 && !search && (
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-sm font-semibold text-foreground mb-3">Popular Titles Near You</h2>
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
                    className="flex-shrink-0 w-[120px] bg-card rounded-[14px] border border-border shadow-sm overflow-hidden active:scale-95 transition-transform text-left"
                  >
                    <div
                      className="h-[100px] relative"
                      style={{ background: game.coverColor }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.imagePath}
                        alt={`${game.title} cover`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 text-balance">
                        {game.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {bestStore
                          ? `${bestStore.store.distance}km · ${bestStore.store.name}`
                          : 'No stock nearby'}
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
  )
}
