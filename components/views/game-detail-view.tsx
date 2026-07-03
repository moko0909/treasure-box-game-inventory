'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  STORES,
  getGameById,
  getStoreById,
  getPlatformColor,
  getPlatformShort,
} from '@/lib/data'
import { StockBadge } from '@/components/stock-badge'
import type { CreateReservationInput } from '@/app/actions/reservations'

interface GameDetailViewProps {
  gameId: string
  storeId: string
  onBack: () => void
  onReserve: (input: CreateReservationInput) => Promise<{ code: string; expiresAt: string }>
  onRequestRestock: (gameId: string, storeId: string) => Promise<{ alreadyExists: boolean }>
  isGuest?: boolean
}

// 재고 선점 유지 시간 (초) — 3분
const LOCK_SECONDS = 180

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`평점 5점 만점에 ${rating}점`}>
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
      <span className="text-sm font-bold text-foreground ml-1">{rating}</span>
    </div>
  )
}

// 예약 코드로부터 안정적인 바코드 막대 생성
function Barcode({ code }: { code: string }) {
  const bars = useMemo(() => {
    const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return Array.from({ length: 48 }).map((_, i) => {
      const v = (seed * (i + 3)) % 7
      return v < 2 ? 1 : v < 5 ? 2 : 4
    })
  }, [code])

  return (
    <div className="flex items-end justify-center gap-[2px] h-16" aria-hidden="true">
      {bars.map((w, i) => (
        <div
          key={i}
          className="bg-foreground h-full"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  )
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}. ${pad(d.getUTCMonth() + 1)}. ${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function defaultPickupValue() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Mode = 'detail' | 'reserve' | 'complete'

export function GameDetailView({
  gameId,
  storeId,
  onBack,
  onReserve,
  onRequestRestock,
  isGuest = false,
}: GameDetailViewProps) {
  const [mode, setMode] = useState<Mode>('detail')
  const [activeTab, setActiveTab] = useState<'info' | 'stores'>('info')
  const [selectedStoreId, setSelectedStoreId] = useState(storeId)
  const [showStorePicker, setShowStorePicker] = useState(false)

  // 예약 폼 상태
  const [quantity, setQuantity] = useState(1)
  const [pickupAt, setPickupAt] = useState(defaultPickupValue())
  const [notes, setNotes] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 선점 타이머
  const [secondsLeft, setSecondsLeft] = useState(LOCK_SECONDS)
  const [lockExpired, setLockExpired] = useState(false)

  // 완료 결과
  const [result, setResult] = useState<{ code: string; expiresAt: string } | null>(null)

  // 재입고 알림 상태
  const [restockRequested, setRestockRequested] = useState(false)
  const [restockBusy, setRestockBusy] = useState(false)

  const game = getGameById(gameId)
  const currentStore = getStoreById(selectedStoreId) ?? getStoreById(storeId)
  const currentInventory = currentStore?.games.find((g) => g.gameId === gameId)

  // 선점 카운트다운
  useEffect(() => {
    if (mode !== 'reserve') return
    if (secondsLeft <= 0) {
      setLockExpired(true)
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [mode, secondsLeft])

  if (!game || !currentStore) return null

  const isSoldOut = currentInventory?.stockStatus === 'sold-out'
  const maxQty = Math.max(1, currentInventory?.stockCount ?? 1)

  const storesWithGame = STORES.map((store) => {
    const inv = store.games.find((g) => g.gameId === game.id)
    return inv ? { store, inv } : null
  })
    .filter(Boolean)
    .sort((a, b) => a!.store.distance - b!.store.distance) as {
    store: (typeof STORES)[0]
    inv: (typeof STORES)[0]['games'][0]
  }[]

  const startReserve = () => {
    setSecondsLeft(LOCK_SECONDS)
    setLockExpired(false)
    setMode('reserve')
  }

  const handleConfirm = async () => {
    if (!agreed || lockExpired || submitting) return
    setSubmitting(true)
    try {
      const res = await onReserve({
        gameId,
        storeId: selectedStoreId,
        quantity,
        pickupAt: new Date(pickupAt).toISOString(),
        notes: notes.trim() || null,
      })
      setResult(res)
      setMode('complete')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestock = async () => {
    if (restockBusy || restockRequested) return
    setRestockBusy(true)
    try {
      await onRequestRestock(gameId, storeId)
      setRestockRequested(true)
    } finally {
      setRestockBusy(false)
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // ---------------- 완료 화면 ----------------
  if (mode === 'complete' && result) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 overflow-y-auto px-4 pt-14 pb-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center mb-3" style={{ boxShadow: '0 0 24px rgba(98,0,238,0.3)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">예약이 완료되었어요</h1>
            <p className="text-sm text-muted-foreground mt-1">매장에서 아래 예약 코드를 보여주세요</p>
          </div>

          {/* 바코드 카드 */}
          <div className="rounded-[18px] bg-white dark:bg-card border border-border p-5 mb-4">
            <Barcode code={result.code} />
            <p className="text-center text-2xl font-extrabold tracking-[0.2em] mt-3 text-foreground">
              {result.code}
            </p>
          </div>

          {/* 픽업 기한 */}
          <div className="rounded-[14px] p-4 mb-4 flex items-center gap-3 border border-accent/25 bg-accent/8">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent flex-shrink-0" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
            <div>
              <p className="text-[11px] font-bold text-accent">픽업 기한</p>
              <p className="text-sm font-bold text-foreground" suppressHydrationWarning>{formatDateTime(result.expiresAt)}까지</p>
            </div>
          </div>

          {/* 요약 */}
          <div className="rounded-[18px] border border-border bg-card divide-y divide-border">
            <SummaryRow label="게임" value={game.title} />
            <SummaryRow label="매장" value={currentStore.name} />
            <SummaryRow label="수량" value={`${quantity}개`} />
            {notes.trim() && <SummaryRow label="요청사항" value={notes.trim()} />}
          </div>

          <p className="text-[12px] leading-relaxed mt-4 text-center text-muted-foreground">
            기한 내 미방문 시 예약이 자동 취소되며, 노쇼가 반복되면 예약 이용이 제한될 수 있어요.
          </p>
        </div>

        <div
          className="border-t border-border px-4 py-4 bg-card"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <button
            type="button"
            onClick={onBack}
            className="w-full h-[52px] rounded-[14px] bg-accent text-accent-foreground text-base font-extrabold transition-all active:scale-[0.98] glow-cyan"
          >
            확인
          </button>
        </div>
      </div>
    )
  }

  // ---------------- 예약 폼 (선점) 화면 ----------------
  if (mode === 'reserve') {
    return (
      <div className="flex flex-col h-full" style={{ background: '#121212' }}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-[#2A2A2A]">
          <button
            type="button"
            onClick={() => setMode('detail')}
            aria-label="뒤로"
            className="w-9 h-9 rounded-full border border-[#2A2A2A] flex items-center justify-center"
            style={{ background: '#1E1E1E' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-lg font-extrabold text-white">예약 요청</h1>
        </div>

        {/* 선점 타이머 배너 */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: lockExpired ? 'rgba(207,102,121,0.1)' : 'rgba(98,0,238,0.12)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={lockExpired ? '#CF6679' : '#BB86FC'} strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
            <span className={cn('text-sm font-bold', lockExpired ? 'text-[#CF6679]' : 'text-[#BB86FC]')}>
              {lockExpired ? '선점 시간이 만료됐어요' : '재고를 선점했어요'}
            </span>
          </div>
          {!lockExpired && (
            <span className="text-sm font-extrabold text-white tabular-nums">
              {mm}:{ss}
            </span>
          )}
        </div>

        {lockExpired ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mb-3">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
        <p className="text-base font-bold text-foreground mb-1">선점 시간이 만료됐어요</p>
          <p className="text-sm text-muted-foreground mb-5">다시 시도하면 재고를 새로 선점할 수 있어요.</p>
            <button
              type="button"
              onClick={startReserve}
              className="h-11 px-6 rounded-[14px] bg-[#4F46E5] text-white text-sm font-bold hover:bg-[#4338CA] transition-colors"
            >
              다시 선점하기
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-4">
              {/* 게임 요약 */}
              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: game.coverColor }}>
                  {game.imagePath && (
                    <Image src={game.imagePath} alt={game.title} fill className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{game.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentStore.name}</p>
          </div>
          <p className="ml-auto text-lg font-extrabold text-foreground">
                  ${(currentInventory?.price ?? game.price).toFixed(2)}
                </p>
              </div>

              {/* 수량 */}
              <label className="block text-sm font-bold text-foreground mb-2">수량</label>
              <div className="flex items-center gap-4 mb-5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="수량 감소"
                  className="w-11 h-11 rounded-xl border border-[#2A2A2A] text-white text-xl font-bold disabled:opacity-40"
                  style={{ background: '#1E1E1E' }}
                >
                  −
                </button>
                <span className="text-lg font-extrabold text-white w-8 text-center tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  aria-label="수량 증가"
                  className="w-11 h-11 rounded-xl border border-[#2A2A2A] text-white text-xl font-bold disabled:opacity-40"
                  style={{ background: '#1E1E1E' }}
                >
                  +
                </button>
                <span className="text-xs ml-1" style={{ color: '#6A6A6A' }}>재고 {maxQty}개</span>
              </div>

              {/* 픽업 일시 */}
              <label htmlFor="pickup" className="block text-sm font-bold text-foreground mb-2">픽업 일시</label>
              <input
                id="pickup"
                type="datetime-local"
                value={pickupAt}
                min={defaultPickupValue()}
                onChange={(e) => setPickupAt(e.target.value)}
                className="w-full h-12 rounded-[14px] border border-[#2A2A2A] px-4 text-sm text-white mb-5 [color-scheme:dark]"
                style={{ background: '#1E1E1E' }}
              />

              {/* 요청사항 */}
          <label htmlFor="notes" className="block text-sm font-bold text-foreground mb-2">
            요청사항 <span className="text-muted-foreground font-normal">(선택)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="예: 방문 30분 전에 연락 주세요"
                className="w-full rounded-[14px] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#4A4A4A] mb-5 resize-none"
                style={{ background: '#1E1E1E' }}
              />

              {/* 노쇼 규정 안내 */}
              <div className="rounded-[14px] border border-[#2A2A2A] p-4 mb-4" style={{ background: '#1A1A1A' }}>
                <p className="text-xs font-bold text-white mb-2">노쇼 규정 안내</p>
                <ul className="text-[12px] leading-relaxed list-disc pl-4 space-y-1" style={{ color: '#6A6A6A' }}>
                  <li>픽업 기한 내 미방문 시 예약이 자동 취소됩니다.</li>
                  <li>노쇼가 3회 누적되면 30일��� ���약이 제한됩��다.</li>
                  <li>방문이 어��운 경우 미리 예약을 취소해 주세요.</li>
                </ul>
                <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-[#2A2A2A] accent-[#6200EE]"
                  />
                  <span className="text-sm font-medium text-foreground">위 노쇼 규정에 동의합니다</span>
                </label>
              </div>
            </div>

            {/* 확정 버튼 */}
            <div
              className="border-t border-border px-4 py-4 bg-card"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            >
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!agreed || submitting}
                className={cn(
                  'w-full h-[52px] rounded-[14px] text-base font-extrabold tracking-wide transition-all active:scale-[0.98]',
                  agreed && !submitting
                    ? 'bg-accent text-accent-foreground glow-cyan'
                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                )}
              >
                {submitting ? '예약 처리 중...' : '예약 확정'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ---------------- 상세 화면 ----------------
  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* 매장 선택 바텀시트 */}
      {showStorePicker && (
        <>
          {/* 딤 */}
          <div
            className="absolute inset-0 z-40 bg-black/60"
            onClick={() => setShowStorePicker(false)}
            aria-hidden="true"
          />
          {/* 시트 */}
          <div
            className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-[28px] border-t border-x border-border flex flex-col"
            style={{ maxHeight: '80%', animation: 'slideUpPanel 0.26s cubic-bezier(0.32,0.72,0,1) both' }}
          >
            {/* 핸들 + 헤더 */}
            <div className="px-5 pt-4 pb-3 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">매장 선택</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{game.title} 재고 있는 매장 {storesWithGame.filter(({inv}) => inv.stockStatus !== 'sold-out').length}곳</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStorePicker(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  aria-label="닫기"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 매장 목록 */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-2.5">
              {storesWithGame.map(({ store, inv }) => {
                const isSelected = store.id === selectedStoreId
                const canSelect = inv.stockStatus !== 'sold-out'
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      if (!canSelect) return
                      setSelectedStoreId(store.id)
                      setShowStorePicker(false)
                    }}
                    disabled={!canSelect}
                    className={cn(
                      'w-full rounded-[16px] border p-4 text-left transition-all active:scale-[0.98]',
                      isSelected
                        ? 'border-primary bg-primary/8'
                        : canSelect
                          ? 'border-border bg-background hover:border-primary/40'
                          : 'border-border bg-background opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* 라디오 */}
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      )} aria-hidden="true">
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* 매장명 + 태그 */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-[15px] font-extrabold text-foreground">{store.name}</p>
                          {store.tag && (
                            <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{store.tag}</span>
                          )}
                        </div>
                        {/* 주소 */}
                        <p className="text-[11px] text-muted-foreground truncate mb-2">{store.address}</p>
                        {/* 메타 행 */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" aria-hidden="true">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="text-[11px] text-muted-foreground">{store.distance} km</span>
                          </div>
                          <span className={cn('text-[11px] font-semibold', store.isOpen ? 'text-green-400' : 'text-muted-foreground')}>
                            {store.isOpen ? `영업 중 · ${store.closesAt} 마감` : `영업 종료 · ${store.opensAt ?? ''} 오픈`}
                          </span>
                          <span className="text-[11px] font-bold text-foreground">${inv.price.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 재고 뱃지 */}
                      <div className="flex-shrink-0">
                        <StockBadge status={inv.stockStatus} count={inv.stockCount} size="sm" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 하단 확인 버튼 */}
            <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t border-border">
              <button
                type="button"
                onClick={() => setShowStorePicker(false)}
                className="w-full h-12 rounded-[14px] bg-primary text-primary-foreground font-bold text-sm"
              >
                {currentStore.name} 선택 완료
              </button>
            </div>
          </div>
        </>
      )}
      <div className="relative">
        <div
          className="relative w-full h-[300px]"
          style={{ background: `linear-gradient(to bottom, ${game.coverColor}, ${game.coverColor}CC)` }}
        >
          {game.imagePath && (
            <Image src={game.imagePath} alt={`${game.title} 커버 이미지`} fill className="object-cover" priority />
          )}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: 'linear-gradient(to top, var(--background), transparent)' }}
            aria-hidden="true"
          />
        </div>

        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="absolute top-12 left-4 w-10 h-10 rounded-full backdrop-blur border border-border flex items-center justify-center bg-background/85"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="absolute top-12 right-4">
          <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full', getPlatformColor(game.platform))}>
            {getPlatformShort(game.platform)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 -mt-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-foreground leading-tight flex-1 text-balance tracking-tight">
              {game.title}
            </h1>
            {currentInventory && (
              <div className="flex-shrink-0 mt-1">
                <StockBadge status={currentInventory.stockStatus} count={currentInventory.stockCount} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-1">
            <StarRating rating={game.rating} />
            <span className="text-xs text-muted-foreground">{game.genre}</span>
            <span className="text-xs text-muted-foreground">{game.releaseYear}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">개발사 {game.developer}</p>

          <button
            type="button"
            onClick={() => setShowStorePicker(true)}
            className="w-full rounded-[18px] border border-border bg-card p-4 mb-4 text-left transition-colors active:bg-card/80 hover:border-primary/40"
            aria-label="판매 매장 변경"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">판매 매장</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground truncate">{currentStore.name}</p>
                  <span className="flex-shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">변경</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground ml-3">
                ${currentInventory?.price.toFixed(2) ?? game.price.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {currentStore.distance} km ·{' '}
                {currentStore.isOpen ? `${currentStore.closesAt}까지 영업` : `${currentStore.opensAt} 오픈`}
              </div>
              {currentInventory && (
                <StockBadge status={currentInventory.stockStatus} count={currentInventory.stockCount} size="sm" />
              )}
            </div>
          </button>

          <div className="flex border-b border-border mb-4">
            {(['info', 'stores'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-bold transition-colors',
                  activeTab === tab ? 'text-primary border-b-2 border-primary -mb-px' : 'text-muted-foreground'
                )}
              >
                {tab === 'info' ? '게임 정보' : '판매 매장'}
              </button>
            ))}
          </div>

          {activeTab === 'info' ? (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-2">소개</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{game.description}</p>

              <h2 className="text-sm font-bold text-foreground mb-3">상세 정보</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '플랫폼', value: game.platform },
                  { label: '장르', value: game.genre },
                  { label: '개발사', value: game.developer },
                  { label: '출시연도', value: String(game.releaseYear) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[11px] mb-0.5 text-muted-foreground">{label}</p>
                    <p className="text-xs font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">
                  이 타이틀 보유 매장 {storesWithGame.length}곳
                </h2>
                <span className="text-[11px] text-muted-foreground">탭해서 매장 선택</span>
              </div>
              {storesWithGame.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-card border border-border flex items-center justify-center mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="8" width="18" height="12" rx="2" />
                      <path d="M3 8l3-4h12l3 4M12 12v4" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">현재 등록된 재고 정보가 없습니다.</p>
                </div>
              ) : (
              <div className="flex flex-col gap-2">
                {storesWithGame.map(({ store, inv }) => {
                  const isSelected = store.id === selectedStoreId
                  const canSelect = inv.stockStatus !== 'sold-out'
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => canSelect && setSelectedStoreId(store.id)}
                      disabled={!canSelect}
                      className={cn(
                        'rounded-[14px] border bg-card p-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.98]',
                        isSelected ? 'border-primary bg-primary/5' : canSelect ? 'border-border hover:border-primary/40' : 'border-border opacity-60 cursor-not-allowed'
                      )}
                    >
                      {/* 선택 라디오 */}
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        isSelected ? 'border-primary bg-primary' : 'border-border bg-transparent'
                      )} aria-hidden="true">
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-bold text-foreground truncate">{store.name}</p>
                          {store.tag && (
                            <span className="text-[10px] font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded-full flex-shrink-0">{store.tag}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{store.distance} km</span>
                          <span aria-hidden="true">·</span>
                          <span className={store.isOpen ? 'text-green-400' : ''}>{store.isOpen ? '영업 중' : '영업 종료'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-foreground">${inv.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <StockBadge status={inv.stockStatus} count={inv.stockCount} size="sm" />
                    </button>
                  )
                })}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 하단 CTA */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t border-border px-4 py-4 bg-card"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {isSoldOut ? (
          restockRequested ? (
            <div className="rounded-[14px] py-4 flex items-center justify-center gap-2 border border-[#6200EE]/30" style={{ background: 'rgba(98,0,238,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BB86FC" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="text-sm font-bold text-[#BB86FC]">재입고 알림을 신청했어요</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRestock}
              disabled={restockBusy}
              className="w-full h-[52px] rounded-[14px] text-white text-base font-extrabold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 glow-purple"
              style={{ background: 'linear-gradient(135deg,#6200EE,#9C27B0)' }}
            >
              {restockBusy ? '신청 중...' : '재입고 알림 신청'}
            </button>
          )
        ) : isGuest ? (
          <a
            href="/sign-in"
            className="w-full h-[52px] rounded-[14px] text-base font-extrabold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-muted text-muted-foreground border border-border"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            로그인 후 예약하기
          </a>
        ) : (
          <button
            type="button"
            onClick={startReserve}
            className="w-full h-[52px] rounded-[14px] text-black text-base font-extrabold tracking-wide transition-all active:scale-[0.98] glow-cyan"
            style={{ background: '#00E5FF' }}
          >
            {currentStore.name}에서 예약하기
          </button>
        )}
        <p className="text-[11px] text-center mt-2" style={{ color: '#4A4A4A' }}>
          {isSoldOut
            ? '입고되면 알림으로 알려드려요'
            : isGuest
              ? '예약 기능은 로그인 후 이용할 수 있습니다'
              : '무료 예약 · 결제는 매장 방문 시 · 노쇼 규정 적용'}
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs flex-shrink-0 text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground text-right">{value}</span>
    </div>
  )
}
