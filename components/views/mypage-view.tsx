'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STORES, GAMES, getGameById, type Reservation } from '@/lib/data'
import { authClient } from '@/lib/auth-client'
import { SettingsPanel } from '@/components/views/settings-panel'
import { useT } from '@/lib/i18n'

interface MyPageViewProps {
  userName: string
  userEmail: string
  role: 'user' | 'owner'
  reservations: Reservation[]
  favoriteStoreIds: string[]
  balance: number
  onToggleFavorite: (storeId: string) => void
  onCharge: (amount: number) => Promise<void>
  onViewGame: (gameId: string, storeId: string) => void
}

// 충전 금액 선택지
const CHARGE_AMOUNTS = [5000, 10000, 30000, 50000, 100000]

// 동전 파티클 타입
interface Particle {
  id: number
  x: number
  vx: number
  vy: number
  rotate: number
  scale: number
  color: string
}

// 숫자 카운트업 훅 — from → to 범위 지원
function useCountUp(target: number, duration = 900, active = false) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active, target, duration])

  return display
}

// 잔액 카운트업 훅 — balance prop 변화 감지 후 이전값→새값 애니메이션
function useBalanceCountUp(balance: number, duration = 1000) {
  const [display, setDisplay] = useState(balance)
  const prevRef = useRef(balance)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = prevRef.current
    const to = balance
    if (from === to) return

    prevRef.current = to
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [balance, duration])

  return display
}

const PARTICLE_COLORS = ['#BB86FC', '#6200EE', '#00E5FF', '#FFD600', '#CF6679']

// 예약금 충전 모달
function DepositChargeModal({
  balance,
  onClose,
  onCharge,
}: {
  balance: number
  onClose: () => void
  onCharge: (amount: number) => Promise<void>
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [step, setStep] = useState<'select' | 'confirm' | 'charging' | 'done'>('select')
  const [particles, setParticles] = useState<Particle[]>([])
  const [checkVisible, setCheckVisible] = useState(false)
  const [amount] = [selected ?? (Number(custom.replace(/,/g, '')) || 0)]

  const finalAmount = selected ?? (Number(custom.replace(/,/g, '')) || 0)
  const countedAmount = useCountUp(finalAmount, 900, step === 'done')

  const handleConfirm = () => {
    if (finalAmount <= 0) return
    setStep('confirm')
  }

  const spawnParticles = () => {
    const list: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 40 + Math.random() * 20,  // 중앙 부근에서 시작 (%)
      vx: (Math.random() - 0.5) * 120,
      vy: -(60 + Math.random() * 80),
      rotate: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.8,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    }))
    setParticles(list)
    setTimeout(() => setParticles([]), 1200)
  }

  const handleCharge = async () => {
    setStep('charging')
    await onCharge(finalAmount)
    spawnParticles()
    setStep('done')
    setTimeout(() => setCheckVisible(true), 100)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/70" onClick={step === 'done' || step === 'select' ? onClose : undefined}>
      <div
        className="w-full bg-card rounded-t-[28px] border-t border-x border-border p-5 pb-10 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 파티클 레이어 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${p.x}%`,
                top: '40%',
                backgroundColor: p.color,
                transform: `scale(${p.scale}) rotate(${p.rotate}deg)`,
                animation: `particleFly 1.1s ease-out forwards`,
                // CSS 변수로 방향 전달
                ['--vx' as string]: `${p.vx}px`,
                ['--vy' as string]: `${p.vy}px`,
              }}
            />
          ))}
        </div>

        {/* 핸들 */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" aria-hidden="true" />

        {/* === 완료 화면 === */}
        {step === 'done' ? (
          <div className="flex flex-col items-center py-4 gap-3">
            {/* 체크 아이콘 — 팡 스케일 */}
            <div
              className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
              style={{
                transform: checkVisible ? 'scale(1)' : 'scale(0)',
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: checkVisible ? '0 0 32px rgba(98,0,238,0.35)' : 'none',
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: checkVisible ? 0 : 30,
                  transition: 'stroke-dashoffset 0.4s ease 0.2s',
                }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* 충전 금액 카운트업 */}
            <div className="text-center">
              <p
                className="text-3xl font-extrabold text-primary tabular-nums"
                style={{
                  opacity: checkVisible ? 1 : 0,
                  transform: checkVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s',
                }}
              >
                +{countedAmount.toLocaleString()}원
              </p>
              <p
                className="text-sm text-muted-foreground mt-1"
                style={{
                  opacity: checkVisible ? 1 : 0,
                  transition: 'opacity 0.4s ease 0.5s',
                }}
              >
                충전이 완료됐어요
              </p>
            </div>

            {/* 충전 후 잔액 */}
            <div
              className="w-full bg-muted rounded-[16px] border border-border p-3 flex items-center justify-between"
              style={{
                opacity: checkVisible ? 1 : 0,
                transform: checkVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.4s ease 0.6s, transform 0.4s ease 0.6s',
              }}
            >
              <span className="text-xs text-muted-foreground">새 잔액</span>
              <span className="text-base font-extrabold text-foreground tabular-nums">
                {(balance + finalAmount).toLocaleString()}원
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-12 rounded-[14px] bg-primary text-primary-foreground font-bold text-sm mt-1"
              style={{
                opacity: checkVisible ? 1 : 0,
                transition: 'opacity 0.3s ease 0.8s',
              }}
            >
              확인
            </button>
          </div>

        ) : step === 'charging' ? (
          /* === 처리 중 화면 === */
          <div className="flex flex-col items-center py-10 gap-5">
            {/* 스피너 링 */}
            <div className="relative w-20 h-20">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" className="text-muted" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="213"
                  strokeDashoffset="53"
                  style={{ animation: 'spin 0.9s linear infinite' }}
                />
              </svg>
              {/* 동전 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v1m0 6v1M9.5 10.5c0-.83.67-1.5 2.5-1.5s2.5.67 2.5 1.5c0 1.5-2.5 2-2.5 3.5" />
                </svg>
              </div>
            </div>
            <p className="text-base font-bold text-foreground">충전 처리 중...</p>
            <p className="text-sm text-muted-foreground">{finalAmount.toLocaleString()}원</p>
          </div>

        ) : step === 'confirm' ? (
          /* === 확인 화면 === */
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-extrabold text-foreground">충전 확인</h2>
            <div className="bg-muted rounded-[16px] border border-border p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">충전 금액</span>
              <span className="text-xl font-extrabold text-foreground">{finalAmount.toLocaleString()}원</span>
            </div>
            <div className="bg-muted rounded-[16px] border border-border p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">충전 후 잔액</span>
              <span className="text-xl font-extrabold text-primary">{(balance + finalAmount).toLocaleString()}원</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 h-12 rounded-[14px] border border-border text-foreground font-bold text-sm"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleCharge}
                className="flex-1 h-12 rounded-[14px] bg-primary text-primary-foreground font-bold text-sm"
              >
                충전하기
              </button>
            </div>
          </div>

        ) : (
          /* === 금액 선택 화면 === */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-foreground">예약금 충전</h2>
              <span className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-3 py-1">
                현재 잔액 <span className="text-primary font-bold">{balance.toLocaleString()}원</span>
              </span>
            </div>

            {/* 금액 선택 칩 */}
            <div className="grid grid-cols-3 gap-2">
              {CHARGE_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setSelected(amt); setCustom('') }}
                  className={cn(
                    'h-11 rounded-[12px] text-sm font-bold border transition-colors',
                    selected === amt
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-border text-foreground hover:border-primary/50'
                  )}
                >
                  {amt >= 10000 ? `${amt / 10000}만원` : `${amt.toLocaleString()}원`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={cn(
                  'h-11 rounded-[12px] text-sm font-bold border transition-colors',
                  selected === null && custom
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-border text-muted-foreground'
                )}
              >
                직접 입력
              </button>
            </div>

            {/* 직접 입력 */}
            {selected === null && (
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="금액 입력"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-full h-12 rounded-[12px] bg-muted border border-border focus:border-primary px-4 pr-10 text-sm font-bold text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">원</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={finalAmount <= 0}
              className={cn(
                'w-full h-12 rounded-[14px] font-bold text-sm transition-colors',
                finalAmount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {finalAmount > 0 ? `${finalAmount.toLocaleString()}원 충전` : '금액을 선택하세요'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 bg-background rounded-[14px] border border-border p-3 text-center">
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-primary font-bold mt-0.5">{sub}</p>}
    </div>
  )
}

export function MyPageView({
  userName,
  userEmail,
  role,
  reservations,
  favoriteStoreIds,
  balance,
  onToggleFavorite,
  onCharge,
  onViewGame,
}: MyPageViewProps) {
  const router = useRouter()
  const t = useT()
  const [showSettings, setShowSettings] = useState(false)
  const [showCharge, setShowCharge] = useState(false)
  const favoriteIds = new Set(favoriteStoreIds)

  const favoriteStores = STORES.filter((s) => favoriteIds.has(s.id))
  const pickedUpGames = reservations.filter((r) => r.status === 'picked-up')
  const activeCount = reservations.filter((r) => r.status === 'active').length

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const handleCharge = async (amount: number) => {
    await onCharge(amount)
  }

  const displayBalance = useBalanceCountUp(balance)

  if (showSettings) {
    return <SettingsPanel role={role} onBack={() => setShowSettings(false)} />
  }

  const MENU_ITEMS: { id: string; label: string; value?: string; badge?: boolean; onClick?: () => void; icon: React.ReactNode }[] = [
    {
      id: 'notifications',
      label: t('mypage_notification_settings'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      ),
    },
    {
      id: 'help',
      label: t('mypage_customer_support'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      id: 'terms',
      label: t('mypage_terms'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: t('mypage_settings'),
      onClick: () => setShowSettings(true),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="relative flex flex-col h-full">
      {/* 충전 모달 */}
      {showCharge && (
        <DepositChargeModal
          balance={balance}
          onClose={() => setShowCharge(false)}
          onCharge={handleCharge}
        />
      )}

      <div className="flex-1 overflow-y-auto pb-24 bg-background">
        {/* Profile hero */}
        <div
          className="px-4 pt-14 pb-6"
          style={{ background: 'linear-gradient(135deg, #3A0080 0%, #1A0040 60%, var(--background) 100%)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0 border-2 border-primary/40">
              <span className="text-foreground text-2xl font-extrabold" aria-hidden="true">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-foreground tracking-tight truncate">{userName}</h1>
              <p className="text-muted-foreground text-sm truncate">{userEmail}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD600" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-xs text-foreground/70 font-bold">{t('mypage_gold_member')}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="프로필 편집"
              className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 -mt-3">
          <div className="bg-card rounded-[18px] border border-border shadow-lg p-4">
            <div className="flex gap-2">
              <StatCard label={t('mypage_total_reservations')} value={String(reservations.length)} sub={t('mypage_accumulated')} />
              <StatCard label={t('mypage_picked_up')} value={String(pickedUpGames.length)} />
              <StatCard label={t('mypage_favorite_stores')} value={String(favoriteIds.size)} />
            </div>
          </div>
        </div>

        {/* 예약금 카드 */}
        <div className="px-4 mt-4">
          <div className="bg-card rounded-[18px] border border-primary/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{t('mypage_deposit_balance')}</span>
              </div>
              {activeCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {t('mypage_active_reservations').includes('건')
                    ? `예약 ${activeCount}${t('mypage_active_reservations')}`
                    : `${activeCount} ${t('mypage_active_reservations')}`}
                </span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p
                  key={balance}
                  className="text-2xl font-extrabold tabular-nums"
                  style={{
                    color: displayBalance !== balance ? 'var(--primary)' : 'var(--foreground)',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {displayBalance.toLocaleString()}<span className="text-base font-bold text-muted-foreground ml-1">원</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('mypage_deposit_auto_deduct')}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCharge(true)}
                className="h-10 px-5 rounded-[12px] bg-primary text-primary-foreground text-sm font-extrabold transition-colors active:scale-95"
              >
                {t('mypage_deposit_charge')}
              </button>
            </div>
          </div>
        </div>

        {/* 관심 매장 */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-foreground">{t('mypage_favorite_stores_section')}</h2>
            <button type="button" className="text-xs text-primary font-bold">{t('mypage_view_all')}</button>
          </div>
          {favoriteStores.length === 0 ? (
            <div className="bg-card rounded-[18px] border border-border p-6 text-center">
              <p className="text-xs text-muted-foreground">{t('mypage_no_favorites')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {favoriteStores.map((store) => {
                const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
                return (
                  <div
                    key={store.id}
                    className="bg-card rounded-[14px] border border-border p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{store.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-[11px] font-semibold', store.isOpen ? 'text-[#BB86FC]' : 'text-muted-foreground')}>
                          {store.isOpen ? '영업 중' : '영업 종료'}
                        </span>
                        <span className="text-border text-[11px]">·</span>
                        <span className="text-[11px] text-muted-foreground">{store.distance} km</span>
                        <span className="text-border text-[11px]">·</span>
                        <span className="text-[11px] text-[#BB86FC] font-semibold">재고 {inStockCount}종</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(store.id)}
                      aria-label={`${store.name} 관심 매장에서 삭제`}
                      className="text-destructive hover:opacity-80 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
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

        {/* 최근 픽업 */}
        <div className="px-4 mt-5">
          <h2 className="text-sm font-extrabold text-foreground mb-3">{t('mypage_recent_pickup')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(pickedUpGames.length > 0 ? pickedUpGames.slice(0, 4) : GAMES.slice(0, 4)).map((item) => {
              const isReservation = 'gameId' in item
              const game = isReservation ? getGameById((item as Reservation).gameId) : item as typeof GAMES[number]
              const storeId = isReservation ? (item as Reservation).storeId : STORES[0].id
              if (!game) return null
              return (
                <button
                  key={isReservation ? (item as Reservation).id : `ph-${game.id}`}
                  type="button"
                  onClick={() => onViewGame(game.id, storeId)}
                  className="flex-shrink-0 w-[90px] text-left active:scale-95 transition-transform"
                >
                  <div className="w-[90px] h-[126px] rounded-xl overflow-hidden mb-1.5 border border-border" style={{ background: game.coverColor }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.imagePath} alt={game.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] font-bold text-foreground/70 leading-tight line-clamp-2">{game.title}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 메뉴 */}
        <div className="px-4 mt-5">
          <div className="bg-card rounded-[18px] border border-border overflow-hidden">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors min-h-[52px]',
                  i !== 0 && 'border-t border-border'
                )}
              >
                <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">{item.label}</span>
                {item.value && (
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', item.badge ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                    {item.value}
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-border flex-shrink-0" strokeWidth="2" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="px-4 mt-4 mb-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-12 rounded-[14px] border border-destructive/20 text-destructive text-sm font-bold hover:bg-destructive/10 transition-colors"
          >
            {t('mypage_logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
