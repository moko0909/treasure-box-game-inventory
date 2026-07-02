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

// 충전 금액 선택지
const CHARGE_AMOUNTS = [5000, 10000, 30000, 50000, 100000]

// 예약금 충전 모달
function DepositChargeModal({
  balance,
  onClose,
  onCharge,
}: {
  balance: number
  onClose: () => void
  onCharge: (amount: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select')

  const amount = selected ?? (Number(custom.replace(/,/g, '')) || 0)

  const handleConfirm = () => {
    if (amount <= 0) return
    setStep('confirm')
  }

  const handleCharge = () => {
    onCharge(amount)
    setStep('done')
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div
        className="w-full bg-[#0F172A] rounded-t-[28px] border-t border-x border-[#1E293B] p-5 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="w-10 h-1 rounded-full bg-[#334155] mx-auto mb-5" aria-hidden="true" />

        {step === 'done' ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-[#F8FAFC]">충전 완료</p>
              <p className="text-sm text-[#64748B] mt-1">
                {amount.toLocaleString()}원이 충전되었습니다
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-12 rounded-[14px] bg-[#4F46E5] text-white font-bold text-sm mt-2"
            >
              확인
            </button>
          </div>
        ) : step === 'confirm' ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-extrabold text-[#F8FAFC]">충전 확인</h2>
            <div className="bg-[#1E293B] rounded-[16px] border border-[#334155] p-4 flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">충전 금액</span>
              <span className="text-xl font-extrabold text-[#F8FAFC]">{amount.toLocaleString()}원</span>
            </div>
            <div className="bg-[#1E293B] rounded-[16px] border border-[#334155] p-4 flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">충전 후 잔액</span>
              <span className="text-xl font-extrabold text-[#818CF8]">{(balance + amount).toLocaleString()}원</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 h-12 rounded-[14px] border border-[#334155] text-[#CBD5E1] font-bold text-sm"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleCharge}
                className="flex-1 h-12 rounded-[14px] bg-[#4F46E5] text-white font-bold text-sm"
              >
                충전하기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#F8FAFC]">예약금 충전</h2>
              <span className="text-xs text-[#64748B] bg-[#1E293B] border border-[#334155] rounded-full px-3 py-1">
                현재 잔액 <span className="text-[#818CF8] font-bold">{balance.toLocaleString()}원</span>
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
                      ? 'bg-[#4F46E5] border-[#4F46E5] text-white'
                      : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:border-[#4F46E5]/50'
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
                    ? 'bg-[#4F46E5] border-[#4F46E5] text-white'
                    : 'bg-[#1E293B] border-[#334155] text-[#64748B]'
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
                  className="w-full h-12 rounded-[12px] bg-[#1E293B] border border-[#334155] focus:border-[#4F46E5] px-4 pr-10 text-sm font-bold text-[#F8FAFC] placeholder:text-[#475569] outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">원</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={amount <= 0}
              className={cn(
                'w-full h-12 rounded-[14px] font-bold text-sm transition-colors',
                amount > 0 ? 'bg-[#4F46E5] text-white' : 'bg-[#1E293B] text-[#475569] cursor-not-allowed'
              )}
            >
              {amount > 0 ? `${amount.toLocaleString()}원 충전` : '금액을 선택하세요'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
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
  const [showCharge, setShowCharge] = useState(false)
  const [balance, setBalance] = useState(15000) // 더미 잔액
  const favoriteIds = new Set(favoriteStoreIds)

  const favoriteStores = STORES.filter((s) => favoriteIds.has(s.id))
  const pickedUpGames = reservations.filter((r) => r.status === 'picked-up')
  const activeCount = reservations.filter((r) => r.status === 'active').length

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const handleCharge = (amount: number) => {
    setBalance((prev) => prev + amount)
  }

  if (showSettings) {
    return <SettingsPanel role={role} onBack={() => setShowSettings(false)} />
  }

  const MENU_ITEMS: { id: string; label: string; value?: string; badge?: boolean; onClick?: () => void; icon: React.ReactNode }[] = [
    {
      id: 'notifications',
      label: '알림 설정',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      ),
    },
    {
      id: 'help',
      label: '고객 지원',
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
      label: '이용약관 / 개인정보처리방침',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: '설정',
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

      <div className="flex-1 overflow-y-auto pb-24 bg-[#0F172A]">
        {/* Profile hero */}
        <div
          className="px-4 pt-14 pb-6"
          style={{ background: 'linear-gradient(135deg, #312E81 0%, #1E1B4B 60%, #0F172A 100%)' }}
        >
          <div className="flex items-center gap-4">
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
                <span className="text-xs text-[#CBD5E1] font-bold">골드 멤버</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="프로필 편집"
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
              <StatCard label="전체 예약" value={String(reservations.length)} sub="누적" />
              <StatCard label="수령 완료" value={String(pickedUpGames.length)} />
              <StatCard label="관심 매장" value={String(favoriteIds.size)} />
            </div>
          </div>
        </div>

        {/* 예약금 카드 */}
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-br from-[#1E1B4B] to-[#1E293B] rounded-[18px] border border-[#4F46E5]/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-[#94A3B8]">예약금 잔액</span>
              </div>
              {activeCount > 0 && (
                <span className="text-[11px] text-[#64748B]">예약 {activeCount}건 진행 중</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-extrabold text-[#F8FAFC]">
                  {balance.toLocaleString()}<span className="text-base font-bold text-[#94A3B8] ml-1">원</span>
                </p>
                <p className="text-[11px] text-[#475569] mt-0.5">예약 시 자동 차감됩니다</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCharge(true)}
                className="h-10 px-5 rounded-[12px] bg-[#4F46E5] text-white text-sm font-extrabold hover:bg-[#4338CA] transition-colors active:scale-95"
              >
                충전
              </button>
            </div>
          </div>
        </div>

        {/* 관심 매장 */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-[#F8FAFC]">관심 매장</h2>
            <button type="button" className="text-xs text-[#818CF8] font-bold">전체 보기</button>
          </div>
          {favoriteStores.length === 0 ? (
            <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] p-6 text-center">
              <p className="text-xs text-[#64748B]">아직 관심 매장이 없어요. 매장의 하트를 눌러 저장하세요.</p>
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
                        <span className={cn('text-[11px] font-semibold', store.isOpen ? 'text-green-400' : 'text-[#475569]')}>
                          {store.isOpen ? '영업 중' : '영업 종료'}
                        </span>
                        <span className="text-[#334155] text-[11px]">·</span>
                        <span className="text-[11px] text-[#64748B]">{store.distance} km</span>
                        <span className="text-[#334155] text-[11px]">·</span>
                        <span className="text-[11px] text-green-400 font-semibold">재고 {inStockCount}종</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(store.id)}
                      aria-label={`${store.name} 관심 매장에서 삭제`}
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

        {/* 최근 픽업 */}
        <div className="px-4 mt-5">
          <h2 className="text-sm font-extrabold text-[#F8FAFC] mb-3">최근 픽업</h2>
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
                  <div className="w-[90px] h-[126px] rounded-xl overflow-hidden mb-1.5 border border-[#334155]" style={{ background: game.coverColor }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.imagePath} alt={game.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] font-bold text-[#CBD5E1] leading-tight line-clamp-2">{game.title}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 메뉴 */}
        <div className="px-4 mt-5">
          <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] overflow-hidden">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#263347] transition-colors min-h-[52px]',
                  i !== 0 && 'border-t border-[#334155]'
                )}
              >
                <span className="text-[#64748B] flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-semibold text-[#F8FAFC]">{item.label}</span>
                {item.value && (
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', item.badge ? 'bg-[#4F46E5] text-white' : 'text-[#64748B]')}>
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

        {/* 로그아웃 */}
        <div className="px-4 mt-4 mb-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-12 rounded-[14px] border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
