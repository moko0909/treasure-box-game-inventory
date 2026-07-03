'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getGameById,
  getStoreById,
  getReservationStatusLabel,
  type Reservation,
  type RestockAlert,
} from '@/lib/data'

type FilterStatus = 'all' | 'active' | 'picked-up' | 'cancelled'
type Section = 'reservations' | 'restock'

const STATUS_STYLE: Record<Reservation['status'], { color: string; bg: string; dot: string }> = {
  active:      { color: 'text-[#818CF8]', bg: 'bg-[#4F46E5]/20',  dot: 'bg-[#818CF8]' },
  'picked-up': { color: 'text-green-400', bg: 'bg-green-500/15',   dot: 'bg-green-400' },
  expired:     { color: 'text-[#475569]', bg: 'bg-[#1E293B]',      dot: 'bg-[#475569]' },
  cancelled:   { color: 'text-red-400',   bg: 'bg-red-500/15',     dot: 'bg-red-400' },
}

const STATUS_LABEL_MAP: Record<Reservation['status'], string> = {
  active:      '예약 확정',
  'picked-up': '수령 완료',
  expired:     '기한 만료',
  cancelled:   '예약 취소',
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

// 예약 진행 타임라인 (예약 신청 → 픽업 대기 → 수령 완료)
function StatusTimeline({ status }: { status: Reservation['status'] }) {
  const steps = ['예약 신청', '픽업 대기', '수령 완료']
  // 현재 단계 인덱스
  const activeIndex = status === 'picked-up' ? 2 : 1

  if (status === 'cancelled' || status === 'expired') {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
        <span className="text-xs font-bold text-red-400">
          {status === 'cancelled' ? '예약이 취소되었습니다' : '픽업 기한이 만료되었습니다'}
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
                  reached ? 'bg-[#4F46E5]' : 'bg-[#1E293B] border border-[#334155]'
                )}
              >
                {reached && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={cn('text-[10px] font-semibold whitespace-nowrap', reached ? 'text-[#A5B4FC]' : 'text-[#475569]')}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1 -mt-4', i < activeIndex ? 'bg-[#4F46E5]' : 'bg-[#334155]')} aria-hidden="true" />
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
}: {
  reservation: Reservation
  onViewGame: (gameId: string, storeId: string) => void
  onCancel: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const game = getGameById(reservation.gameId)
  const store = getStoreById(reservation.storeId)
  if (!game || !store) return null

  const style = STATUS_STYLE[reservation.status]
  const isActive = reservation.status === 'active'

  return (
    <div className={cn('bg-[#1E293B] rounded-[18px] border p-4', isActive ? 'border-[#4F46E5]/40' : 'border-[#334155]')}>
      <div className="flex gap-3 mb-3">
        <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: game.coverColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.imagePath} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-[#F8FAFC] text-[14px] leading-tight text-balance flex-1">{game.title}</h3>
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0', style.bg, style.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', style.dot)} aria-hidden="true" />
              {STATUS_LABEL_MAP[reservation.status]}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mb-2">{game.platform} · 수량 {reservation.quantity}개</p>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{store.name}</span>
          </div>
        </div>
      </div>

      {/* 진행 타임라인 */}
      <div className="bg-[#0F172A] rounded-xl border border-[#334155] px-4 py-3 mb-3">
        <StatusTimeline status={reservation.status} />
      </div>

      <div className="border-t border-dashed border-[#334155] my-3" aria-hidden="true" />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-0.5 font-semibold">예약 코드</p>
          <p className="text-sm font-bold text-[#F8FAFC] font-mono tracking-wider">{reservation.confirmationCode}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-0.5 font-semibold">
            {isActive ? '픽업 기한' : '예약일'}
          </p>
          <p className="text-sm font-bold text-[#F8FAFC]" suppressHydrationWarning>
            {isActive ? formatDateTime(reservation.expiresAt) : formatDate(reservation.createdAt)}
          </p>
        </div>
      </div>

      {reservation.notes && (
        <p className="text-xs text-[#94A3B8] bg-[#0F172A] rounded-lg px-3 py-2 mb-3">
          <span className="text-[#64748B]">요청사항 · </span>
          {reservation.notes}
        </p>
      )}

      {isActive && (
        <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-3 mb-3 flex items-center justify-between">
          <div className="flex gap-[2px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#F8FAFC]/60 rounded-sm"
                style={{ width: i % 3 === 0 ? '3px' : '2px', height: i % 5 === 0 ? '28px' : '24px' }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="text-right ml-3">
            <p className="text-[10px] text-[#475569]">매장에서 제시</p>
            <p className="text-xs font-bold text-[#F8FAFC] font-mono">{reservation.confirmationCode}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onViewGame(reservation.gameId, reservation.storeId)}
          className="flex-1 h-10 rounded-xl border border-[#334155] text-sm font-bold text-[#CBD5E1] hover:bg-[#263347] transition-colors"
        >
          게임 보기
        </button>
        {isActive &&
          (confirming ? (
            <>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-10 px-3 rounded-xl border border-[#334155] text-sm font-bold text-[#CBD5E1] hover:bg-[#263347] transition-colors"
              >
                유지
              </button>
              <button
                type="button"
                onClick={() => onCancel(reservation.id)}
                className="h-10 px-4 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
              >
                취소 확정
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-10 px-4 rounded-xl bg-[#1E293B] border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors"
            >
              예약 취소
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
}: {
  alert: RestockAlert
  onViewGame: (gameId: string, storeId: string) => void
  onCancel: (id: string) => void
}) {
  const game = getGameById(alert.gameId)
  const store = getStoreById(alert.storeId)
  if (!game || !store) return null

  return (
    <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] p-4">
      <div className="flex gap-3">
        <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: game.coverColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.imagePath} alt={`${game.title} 커버`} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-[#F8FAFC] text-[14px] leading-tight flex-1">{game.title}</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex-shrink-0">
              감시 중
            </span>
          </div>
          <p className="text-xs text-[#64748B] mb-1 truncate">{store.name}</p>
          <p className="text-[11px] text-[#475569]" suppressHydrationWarning>{formatDate(alert.createdAt)} 신청 · 입고 시 알림</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => onViewGame(alert.gameId, alert.storeId)}
          className="flex-1 h-10 rounded-xl border border-[#334155] text-sm font-bold text-[#CBD5E1] hover:bg-[#263347] transition-colors"
        >
          게임 보기
        </button>
        <button
          type="button"
          onClick={() => onCancel(alert.id)}
          className="h-10 px-4 rounded-xl bg-[#1E293B] border border-[#334155] text-[#94A3B8] text-sm font-bold hover:bg-[#263347] transition-colors"
        >
          알림 해제
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
  onCancelRestock: (id: string) => void
}

export function ReservationsView({
  onViewGame,
  reservations,
  restockAlerts,
  onCancelReservation,
  onCancelRestock,
}: ReservationsViewProps) {
  const [section, setSection] = useState<Section>('reservations')
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filtered = reservations.filter((r) => filter === 'all' || r.status === filter)
  const activeCount = reservations.filter((r) => r.status === 'active').length

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: 'all',       label: '전체' },
    { id: 'active',    label: '예약 확정' },
    { id: 'picked-up', label: '수령 완료' },
    { id: 'cancelled', label: '취소' },
  ]

  return (
    <div className="flex flex-col h-full">
      <header className="bg-[#0F172A] px-4 pt-12 pb-3 border-b border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-widest">나의</p>
            <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">예약</h1>
          </div>
          {activeCount > 0 && (
            <div className="bg-[#4F46E5] text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
              {activeCount}
            </div>
          )}
        </div>

        {/* 섹션 토글 */}
        <div className="flex gap-1 bg-[#1E293B] border border-[#334155] rounded-xl p-1 mb-3">
          {([
            { id: 'reservations', label: `예약 내역 (${reservations.length})` },
            { id: 'restock', label: `재입고 알림 (${restockAlerts.length})` },
          ] as { id: Section; label: string }[]).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                'flex-1 h-9 rounded-lg text-xs font-bold transition-colors',
                section === s.id ? 'bg-[#4F46E5] text-white' : 'text-[#64748B] hover:text-[#CBD5E1]'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 상태 필터 (예약 내역) / 안내 (재입고 알림) — 두 섹션의 헤더 높이를
            동일하게 맞춰 화면비가 바뀌지 않도록 항상 h-8 높이의 행을 렌더링 */}
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
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-[#1E293B] text-[#64748B] border border-[#334155] hover:text-[#CBD5E1]'
                  )}
                >
                  {f.label} ({count})
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 h-8 text-[11px] text-[#64748B]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span>재고가 입고되면 푸시 알림으로 알려드려요</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 bg-[#0F172A]">
        {section === 'reservations' ? (
          filtered.length === 0 ? (
            <EmptyState
              title="아직 예약이 없어요"
              subtitle="가까운 매장에서 게임을 예약하면 여기에 표시됩니다"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <ReservationCard key={r.id} reservation={r} onViewGame={onViewGame} onCancel={onCancelReservation} />
              ))}
            </div>
          )
        ) : restockAlerts.length === 0 ? (
          <EmptyState
            title="재입고 알림이 없어요"
            subtitle="품절 상품에서 재입고 알림을 신청하면 여기에 표시됩니다"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {restockAlerts.map((a) => (
              <RestockCard key={a.id} alert={a} onViewGame={onViewGame} onCancel={onCancelRestock} />
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
      <div className="w-16 h-16 bg-[#1E293B] border border-[#334155] rounded-full flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <p className="text-sm font-bold text-[#F8FAFC] mb-1">{title}</p>
      <p className="text-xs text-[#64748B]">{subtitle}</p>
    </div>
  )
}
