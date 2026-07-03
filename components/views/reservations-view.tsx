'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import {
  getGameById,
  getStoreById,
  type Reservation,
  type RestockAlert,
} from '@/lib/data'

type FilterStatus = 'all' | 'active' | 'picked-up' | 'cancelled'
type Section = 'reservations' | 'restock'

const STATUS_STYLE: Record<Reservation['status'], { color: string; bg: string; dot: string }> = {
  active:      { color: 'text-primary',    bg: 'bg-primary/20',      dot: 'bg-primary' },
  'picked-up': { color: 'text-green-400',  bg: 'bg-green-500/15',    dot: 'bg-green-400' },
  expired:     { color: 'text-muted-foreground', bg: 'bg-muted',     dot: 'bg-muted-foreground' },
  cancelled:   { color: 'text-destructive', bg: 'bg-destructive/15', dot: 'bg-destructive' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}. ${pad(d.getUTCMonth() + 1)}. ${pad(d.getUTCDate())}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCMonth() + 1)}. ${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function StatusTimeline({ status, t }: { status: Reservation['status']; t: (key: Parameters<ReturnType<typeof useT>>[0]) => string }) {
  const steps = [t('reservations_timeline_request'), t('reservations_timeline_waiting'), t('reservations_timeline_done')]
  const activeIndex = status === 'picked-up' ? 2 : 1

  if (status === 'cancelled' || status === 'expired') {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="w-2 h-2 rounded-full bg-destructive" aria-hidden="true" />
        <span className="text-xs font-bold text-destructive">
          {status === 'cancelled' ? t('reservations_timeline_cancelled') : t('reservations_timeline_expired')}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const reached = i <= activeIndex
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  reached ? 'bg-primary' : 'bg-muted border border-border'
                )}
              >
                {reached && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={cn('text-[10px] font-semibold whitespace-nowrap', reached ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1 -mt-4', i < activeIndex ? 'bg-primary' : 'bg-border')} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ReservationCard({
  reservation,
  onViewGame,
  onCancel,
  onDelete,
  t,
}: {
  reservation: Reservation
  onViewGame: (gameId: string, storeId: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  t: ReturnType<typeof useT>
}) {
  const [confirming, setConfirming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const game = getGameById(reservation.gameId)
  const store = getStoreById(reservation.storeId)
  if (!game || !store) return null

  const STATUS_LABEL_MAP: Record<Reservation['status'], string> = {
    active:      t('reservations_status_active'),
    'picked-up': t('reservations_status_picked_up'),
    expired:     t('reservations_status_expired'),
    cancelled:   t('reservations_status_cancelled'),
  }

  const style = STATUS_STYLE[reservation.status]
  const isActive = reservation.status === 'active'

  return (
    <div className={cn('bg-card rounded-[18px] border p-4', isActive ? 'border-primary/40' : 'border-border')}>
      <div className="flex gap-3 mb-3">
        <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: game.coverColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.imagePath} alt={`${game.title}`} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-foreground text-[14px] leading-tight text-balance flex-1">{game.title}</h3>
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0', style.bg, style.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', style.dot)} aria-hidden="true" />
              {STATUS_LABEL_MAP[reservation.status]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{game.platform} · {t('reservations_quantity_prefix')} {reservation.quantity}개</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{store.name}</span>
          </div>
        </div>
      </div>

      {/* 진행 타임라인 */}
      <div className="bg-background rounded-xl border border-border px-4 py-3 mb-3">
        <StatusTimeline status={reservation.status} t={t} />
      </div>

      <div className="border-t border-dashed border-border my-3" aria-hidden="true" />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-semibold">{t('reservations_code')}</p>
          <p className="text-sm font-bold text-foreground font-mono tracking-wider">{reservation.confirmationCode}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-semibold">
            {isActive ? t('reservations_pickup_deadline') : t('reservations_reserved_at')}
          </p>
          <p className="text-sm font-bold text-foreground" suppressHydrationWarning>
            {isActive ? formatDateTime(reservation.expiresAt) : formatDate(reservation.createdAt)}
          </p>
        </div>
      </div>

      {reservation.notes && (
        <p className="text-xs text-muted-foreground bg-background rounded-lg px-3 py-2 mb-3">
          <span className="text-muted-foreground/70">{t('reservations_notes_prefix')} · </span>
          {reservation.notes}
        </p>
      )}

      {isActive && (
        <div className="bg-background rounded-xl border border-border p-3 mb-3 flex items-center justify-between">
          <div className="flex gap-[2px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="bg-foreground/60 rounded-sm"
                style={{ width: i % 3 === 0 ? '3px' : '2px', height: i % 5 === 0 ? '28px' : '24px' }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="text-right ml-3">
            <p className="text-[10px] text-muted-foreground">{t('reservations_barcode_label')}</p>
            <p className="text-xs font-bold text-foreground font-mono">{reservation.confirmationCode}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onViewGame(reservation.gameId, reservation.storeId)}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
        >
          {t('reservations_view_game')}
        </button>

        {/* 활성 예약: 취소 버튼 */}
        {isActive &&
          (confirming ? (
            <>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-10 px-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
              >
                {t('reservations_keep')}
              </button>
              <button
                type="button"
                onClick={() => onCancel(reservation.id)}
                className="h-10 px-4 rounded-xl bg-destructive text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {t('reservations_confirm_cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-10 px-4 rounded-xl bg-card border border-destructive/30 text-destructive text-sm font-bold hover:bg-destructive/10 transition-colors"
            >
              {t('reservations_cancel')}
            </button>
          ))}

        {/* 취소된 예약: 삭제 버튼 */}
        {reservation.status === 'cancelled' &&
          (confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="h-10 px-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
              >
                유지
              </button>
              <button
                type="button"
                onClick={() => onDelete(reservation.id)}
                className="h-10 px-4 rounded-xl bg-destructive text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                삭제
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="h-10 px-3 rounded-xl border border-border text-muted-foreground text-sm font-bold hover:bg-muted/50 transition-colors flex items-center gap-1.5"
              aria-label="예약 삭제"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
              삭제
            </button>
          ))}
      </div>
    </div>
  )
}

function RestockCard({
  alert,
  onViewGame,
  onCancel,
  t,
}: {
  alert: RestockAlert
  onViewGame: (gameId: string, storeId: string) => void
  onCancel: (id: string) => void
  t: ReturnType<typeof useT>
}) {
  const game = getGameById(alert.gameId)
  const store = getStoreById(alert.storeId)
  if (!game || !store) return null

  return (
    <div className="bg-card rounded-[18px] border border-border p-4">
      <div className="flex gap-3">
        <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: game.coverColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.imagePath} alt={`${game.title}`} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-foreground text-[14px] leading-tight flex-1">{game.title}</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex-shrink-0">
              {t('reservations_watching')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 truncate">{store.name}</p>
          <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>
            {formatDate(alert.createdAt)}{t('reservations_restock_date_suffix')}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => onViewGame(alert.gameId, alert.storeId)}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
        >
          {t('reservations_view_game')}
        </button>
        <button
          type="button"
          onClick={() => onCancel(alert.id)}
          className="h-10 px-4 rounded-xl bg-card border border-border text-muted-foreground text-sm font-bold hover:bg-muted/50 transition-colors"
        >
          {t('reservations_cancel_alert')}
        </button>
      </div>
    </div>
  )
}

interface ReservationsViewProps {
  onViewGame: (gameId: string, storeId: string) => void
  reservations: Reservation[]
  restockAlerts: RestockAlert[]
  onCancelReservation: (id: string) => void
  onDeleteReservation: (id: string) => void
  onCancelRestock: (id: string) => void
}

export function ReservationsView({
  onViewGame,
  reservations,
  restockAlerts,
  onCancelReservation,
  onDeleteReservation,
  onCancelRestock,
}: ReservationsViewProps) {
  const t = useT()
  const [section, setSection] = useState<Section>('reservations')
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filtered = reservations.filter((r) => filter === 'all' || r.status === filter)
  const activeCount = reservations.filter((r) => r.status === 'active').length

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: 'all',       label: t('reservations_filter_all') },
    { id: 'active',    label: t('reservations_filter_active') },
    { id: 'picked-up', label: t('reservations_filter_picked_up') },
    { id: 'cancelled', label: t('reservations_filter_cancelled') },
  ]

  return (
    <div className="flex flex-col h-full">
      <header className="bg-background px-4 pt-12 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">{t('reservations_subtitle')}</p>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t('reservations_title')}</h1>
          </div>
          {activeCount > 0 && (
            <div className="bg-primary text-primary-foreground text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
              {activeCount}
            </div>
          )}
        </div>

        {/* 섹션 토글 */}
        <div className="flex gap-1 bg-muted border border-border rounded-xl p-1 mb-3">
          {([
            { id: 'reservations', label: `${t('reservations_section_history')} (${reservations.length})` },
            { id: 'restock', label: `${t('reservations_section_restock')} (${restockAlerts.length})` },
          ] as { id: Section; label: string }[]).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                'flex-1 h-9 rounded-lg text-xs font-bold transition-colors',
                section === s.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === 'reservations' ? (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide h-8">
            {FILTERS.map((f) => {
              const count = f.id === 'all' ? reservations.length : reservations.filter((r) => r.status === f.id).length
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'h-8 px-3.5 rounded-full text-xs font-bold flex-shrink-0 transition-all',
                    filter === f.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                  )}
                >
                  {f.label} ({count})
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 h-8 text-[11px] text-muted-foreground">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span>{t('reservations_restock_hint')}</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 bg-background">
        {section === 'reservations' ? (
          filtered.length === 0 ? (
            <EmptyState
              title={t('reservations_empty_title')}
              subtitle={t('reservations_empty_subtitle')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <ReservationCard key={r.id} reservation={r} onViewGame={onViewGame} onCancel={onCancelReservation} onDelete={onDeleteReservation} t={t} />
              ))}
            </div>
          )
        ) : restockAlerts.length === 0 ? (
          <EmptyState
            title={t('reservations_restock_empty_title')}
            subtitle={t('reservations_restock_empty_subtitle')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {restockAlerts.map((a) => (
              <RestockCard key={a.id} alert={a} onViewGame={onViewGame} onCancel={onCancelRestock} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <p className="text-sm font-bold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}
