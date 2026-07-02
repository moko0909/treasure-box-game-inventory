'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getGameById, getStoreById, type Reservation } from '@/lib/data'

type FilterStatus = 'all' | 'active' | 'picked-up' | 'expired'

const STATUS_CONFIG: Record<Reservation['status'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: {
    label: 'Active',
    color: 'text-[#818CF8]',
    bg: 'bg-[#4F46E5]/15',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  'picked-up': {
    label: 'Picked Up',
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  expired: {
    label: 'Expired',
    color: 'text-[#475569]',
    bg: 'bg-[#1E293B]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ReservationCard({
  reservation,
  onViewGame,
}: {
  reservation: Reservation
  onViewGame: (gameId: string, storeId: string) => void
}) {
  const game = getGameById(reservation.gameId)
  const store = getStoreById(reservation.storeId)
  if (!game || !store) return null

  const cfg = STATUS_CONFIG[reservation.status]
  const isActive = reservation.status === 'active'

  return (
    <div className={cn(
      'bg-[#1E293B] rounded-[18px] border p-4',
      isActive ? 'border-[#4F46E5]/40' : 'border-[#334155]'
    )}>
      {/* Game info */}
      <div className="flex gap-3 mb-3">
        <div
          className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background: game.coverColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.imagePath} alt={`${game.title} cover`} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-[#F8FAFC] text-[14px] leading-tight text-balance flex-1">{game.title}</h3>
            <span className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0',
              cfg.bg, cfg.color
            )}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mb-2">{game.platform} · {game.genre}</p>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{store.name}</span>
          </div>
        </div>
      </div>

      {/* Dashed divider */}
      <div className="border-t border-dashed border-[#334155] my-3" aria-hidden="true" />

      {/* Confirmation details */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-0.5 font-semibold">Confirmation</p>
          <p className="text-sm font-bold text-[#F8FAFC] font-mono tracking-wider">{reservation.confirmationCode}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-0.5 font-semibold">
            {isActive ? 'Expires' : 'Date'}
          </p>
          <p className="text-sm font-bold text-[#F8FAFC]">
            {isActive ? formatDate(reservation.expiresAt) : formatDate(reservation.createdAt)}
          </p>
        </div>
      </div>

      {/* Active reservation barcode */}
      {isActive && (
        <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-3 mb-3 flex items-center justify-between">
          <div className="flex gap-[2px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#F8FAFC]/60 rounded-sm"
                style={{
                  width: i % 3 === 0 ? '3px' : '2px',
                  height: i % 5 === 0 ? '28px' : '24px',
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="text-right ml-3">
            <p className="text-[10px] text-[#475569]">Show at store</p>
            <p className="text-xs font-bold text-[#F8FAFC] font-mono">{reservation.confirmationCode}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onViewGame(reservation.gameId, reservation.storeId)}
          className="flex-1 h-10 rounded-xl border border-[#334155] text-sm font-bold text-[#CBD5E1] hover:bg-[#263347] transition-colors"
        >
          View Game
        </button>
        {isActive && (
          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-[#4F46E5] text-white text-sm font-bold hover:bg-[#4338CA] transition-colors"
          >
            Get Directions
          </button>
        )}
      </div>
    </div>
  )
}

interface ReservationsViewProps {
  onViewGame: (gameId: string, storeId: string) => void
  reservations: Reservation[]
}

export function ReservationsView({ onViewGame, reservations }: ReservationsViewProps) {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const allReservations = reservations

  const filtered = allReservations.filter(
    (r) => filter === 'all' || r.status === filter
  )

  const activeCount = allReservations.filter((r) => r.status === 'active').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-[#0F172A] px-4 pt-12 pb-4 border-b border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-widest">Your</p>
            <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Reservations</h1>
          </div>
          {activeCount > 0 && (
            <div className="bg-[#4F46E5] text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
              {activeCount}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['all', 'active', 'picked-up', 'expired'] as FilterStatus[]).map((f) => {
            const count = f === 'all' ? allReservations.length : allReservations.filter((r) => r.status === f).length
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'h-8 px-3.5 rounded-full text-xs font-bold flex-shrink-0 capitalize transition-all',
                  filter === f
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-[#1E293B] text-[#64748B] border border-[#334155] hover:text-[#CBD5E1]'
                )}
              >
                {f === 'all' ? 'All' : f.replace('-', ' ')} ({count})
              </button>
            )
          })}
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 bg-[#0F172A]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#1E293B] border border-[#334155] rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-bold text-[#F8FAFC] mb-1">No reservations yet</p>
            <p className="text-xs text-[#64748B]">Reserve a game at a nearby store to see it here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <ReservationCard key={r.id} reservation={r} onViewGame={onViewGame} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
