'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STORES, GAMES, getGameById, type Reservation } from '@/lib/data'
import { authClient } from '@/lib/auth-client'
import { SettingsPanel } from '@/components/views/settings-panel'

interface MyPageViewProps {
  userName: string
  userEmail: string
  role: 'user' | 'owner'
  reservations: Reservation[]
  favoriteStoreIds: string[]
  onToggleFavorite: (storeId: string) => void
  onViewGame: (gameId: string, storeId: string) => void
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 bg-[#0F172A] rounded-[14px] border border-[#334155] p-3 text-center">
      <p className="text-xl font-extrabold text-[#F8FAFC]">{value}</p>
      <p className="text-[11px] text-[#64748B] leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-[#818CF8] font-bold mt-0.5">{sub}</p>}
    </div>
  )
}

const MENU_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    id: 'wishlist',
    label: 'Wishlist',
    value: '12 games',
    badge: false,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6zM5.45 5.11L2 12v3h20v-3l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      </svg>
    ),
    id: 'notifications',
    label: 'Notifications',
    value: '3 new',
    badge: true,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M5.63 5.63a10 10 0 010 12.74M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 010 7.07" />
      </svg>
    ),
    id: 'stock-alerts',
    label: 'Stock Alerts',
    value: '5 active',
    badge: false,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    id: 'help',
    label: 'Help & Support',
    value: '',
    badge: false,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    id: 'settings',
    label: 'Settings',
    value: '',
    badge: false,
  },
]

export function MyPageView({
  userName,
  userEmail,
  role,
  reservations,
  favoriteStoreIds,
  onToggleFavorite,
  onViewGame,
}: MyPageViewProps) {
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const favoriteIds = new Set(favoriteStoreIds)

  const favoriteStores = STORES.filter((s) => favoriteIds.has(s.id))
  const pickedUpGames = reservations.filter((r) => r.status === 'picked-up')
  const totalCount = reservations.length
  const pickedUpCount = pickedUpGames.length

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  if (showSettings) {
    return <SettingsPanel role={role} onBack={() => setShowSettings(false)} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-24 bg-[#0F172A]">
        {/* Profile hero — dark indigo banner */}
        <div
          className="px-4 pt-14 pb-6"
          style={{ background: 'linear-gradient(135deg, #312E81 0%, #1E1B4B 60%, #0F172A 100%)' }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-[#4F46E5]/30 flex items-center justify-center flex-shrink-0 border-2 border-[#818CF8]/40">
              <span className="text-[#F8FAFC] text-2xl font-extrabold" aria-hidden="true">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-[#F8FAFC] tracking-tight truncate">{userName}</h1>
              <p className="text-[#94A3B8] text-sm truncate">{userEmail}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-xs text-[#CBD5E1] font-bold">Gold Member</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Edit profile"
              className="w-9 h-9 rounded-full bg-[#4F46E5]/20 border border-[#4F46E5]/30 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 -mt-3">
          <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] shadow-lg p-4">
            <div className="flex gap-2">
              <StatCard label="Reservations" value={String(totalCount)} sub="Total" />
              <StatCard label="Picked Up" value={String(pickedUpCount)} />
              <StatCard label="Fav Stores" value={String(favoriteIds.size)} />
            </div>
          </div>
        </div>

        {/* Favorite Stores */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-[#F8FAFC]">Favorite Stores</h2>
            <button type="button" className="text-xs text-[#818CF8] font-bold">See all</button>
          </div>
          {favoriteStores.length === 0 ? (
            <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] p-6 text-center">
              <p className="text-xs text-[#64748B]">No favorite stores yet. Tap the heart on a store to save it.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {favoriteStores.map((store) => {
                const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
                return (
                  <div
                    key={store.id}
                    className="bg-[#1E293B] rounded-[14px] border border-[#334155] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#F8FAFC] truncate">{store.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          'text-[11px] font-semibold',
                          store.isOpen ? 'text-green-400' : 'text-[#475569]'
                        )}>
                          {store.isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span className="text-[#334155] text-[11px]">·</span>
                        <span className="text-[11px] text-[#64748B]">{store.distance} km</span>
                        <span className="text-[#334155] text-[11px]">·</span>
                        <span className="text-[11px] text-green-400 font-semibold">{inStockCount} in stock</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(store.id)}
                      aria-label={`Remove ${store.name} from favorites`}
                      className="text-red-400 hover:text-red-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Picks */}
        <div className="px-4 mt-5">
          <h2 className="text-sm font-extrabold text-[#F8FAFC] mb-3">Recent Picks</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {pickedUpGames.slice(0, 4).map((r) => {
              const game = getGameById(r.gameId)
              if (!game) return null
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onViewGame(game.id, r.storeId)}
                  className="flex-shrink-0 w-[90px] text-left active:scale-95 transition-transform"
                >
                  <div
                    className="w-[90px] h-[126px] rounded-xl overflow-hidden mb-1.5 border border-[#334155]"
                    style={{ background: game.coverColor }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.imagePath} alt={game.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] font-bold text-[#CBD5E1] leading-tight line-clamp-2">{game.title}</p>
                </button>
              )
            })}
            {GAMES.slice(0, 4 - pickedUpGames.length).map((game) => (
              <button
                key={`ph-${game.id}`}
                type="button"
                onClick={() => onViewGame(game.id, STORES[0].id)}
                className="flex-shrink-0 w-[90px] text-left active:scale-95 transition-transform"
              >
                <div
                  className="w-[90px] h-[126px] rounded-xl overflow-hidden mb-1.5 border border-[#334155]"
                  style={{ background: game.coverColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={game.imagePath} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-bold text-[#CBD5E1] leading-tight line-clamp-2">{game.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Menu items */}
        <div className="px-4 mt-5">
          <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] overflow-hidden">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={item.id === 'settings' ? () => setShowSettings(true) : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#263347] transition-colors min-h-[52px]',
                  i !== 0 && 'border-t border-[#334155]'
                )}
              >
                <span className="text-[#64748B] flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-semibold text-[#F8FAFC]">{item.label}</span>
                {item.value && (
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    item.badge
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-[#64748B]'
                  )}>
                    {item.value}
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" className="flex-shrink-0" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div className="px-4 mt-4 mb-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-12 rounded-[14px] border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
