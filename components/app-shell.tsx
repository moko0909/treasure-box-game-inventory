'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav, type Tab } from '@/components/bottom-nav'
import { StoresView } from '@/components/views/stores-view'
import { GamesView } from '@/components/views/games-view'
import { GameDetailView } from '@/components/views/game-detail-view'
import { NotificationsView, calcNotificationCount } from '@/components/views/notifications-view'
import { ReservationsView } from '@/components/views/reservations-view'
import { MyPageView } from '@/components/views/mypage-view'
import { AdminView } from '@/components/views/admin-view'
import { createReservation, cancelReservation, deleteReservation, type CreateReservationInput } from '@/app/actions/reservations'
import { toggleFavorite as toggleFavoriteAction } from '@/app/actions/favorites'
import { requestRestockAlert, cancelRestockAlert } from '@/app/actions/restock'
import { chargeBalance } from '@/app/actions/balance'
import { updateProfile } from '@/app/actions/profile'
import type { Reservation, RestockAlert } from '@/lib/data'

interface GameDetailState {
  gameId: string
  storeId: string
}

export interface AppShellProps {
  userName: string
  userEmail: string
  role: 'user' | 'owner'
  isGuest?: boolean
  storeLocation: string | null
  reservations: Reservation[]
  favoriteStoreIds: string[]
  restockAlerts: RestockAlert[]
  initialBalance: number
  initialImage: string | null
}

export function AppShell({
  userName,
  userEmail,
  role,
  isGuest = false,
  storeLocation,
  reservations,
  favoriteStoreIds,
  restockAlerts,
  initialBalance,
  initialImage,
}: AppShellProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<Tab>('stores')
  const [gameDetail, setGameDetail] = useState<GameDetailState | null>(null)
  const [reserveToast, setReserveToast] = useState<string | null>(null)
  const [balance, setBalance] = useState(initialBalance)
  const [localUserName, setLocalUserName] = useState(userName)
  const [localUserImage, setLocalUserImage] = useState<string | null>(initialImage)

  const isOwner = role === 'owner'

  // 뱃지 카운트 — 실제 favoriteStoreIds / restockAlerts 기반 계산
  const NOTIFICATION_COUNT = calcNotificationCount(favoriteStoreIds, restockAlerts)
  const activeReservationCount = reservations.filter((r) => r.status === 'active').length

  const openGameDetail = (gameId: string, storeId: string) => {
    setGameDetail({ gameId, storeId })
  }

  const closeGameDetail = () => {
    setGameDetail(null)
  }

  const handleReserve = async (input: CreateReservationInput) => {
    const result = await createReservation(input)
    startTransition(() => router.refresh())
    // 예약 완료 토스트 표시
    setReserveToast(result.code)
    setTimeout(() => setReserveToast(null), 3500)
    return result
  }

  const handleCancelReservation = (id: string) => {
    startTransition(async () => {
      await cancelReservation(id)
      router.refresh()
    })
  }

  const handleDeleteReservation = (id: string) => {
    startTransition(async () => {
      await deleteReservation(id)
      router.refresh()
    })
  }

  const handleToggleFavorite = (storeId: string) => {
    startTransition(async () => {
      await toggleFavoriteAction(storeId)
      router.refresh()
    })
  }

  const handleRequestRestock = async (gameId: string, storeId: string) => {
    const result = await requestRestockAlert(gameId, storeId)
    startTransition(() => router.refresh())
    return result
  }

  const handleCancelRestock = (id: string) => {
    startTransition(async () => {
      await cancelRestockAlert(id)
      router.refresh()
    })
  }

  const handleCharge = async (amount: number) => {
    const result = await chargeBalance(amount)
    setBalance(result.balance)
  }

  const handleUpdateProfile = async (name: string) => {
    const result = await updateProfile({ name })
    setLocalUserName(result.name)
    if (result.image) setLocalUserImage(result.image)
  }

  const handleUpdateImage = (url: string) => {
    setLocalUserImage(url)
  }

  const handleNavigate = (tab: Tab) => {
    if (tab === 'admin' && !isOwner) return
    setGameDetail(null)
    setActiveTab(tab)
  }

  return (
      <div className="flex items-start justify-center min-h-dvh bg-background">
      <div className="phone-shell relative flex-shrink-0 w-full" style={{ minHeight: '100dvh', overflow: 'clip', width: '100%', maxWidth: 390 }}>
        <main className="h-dvh flex flex-col overflow-hidden">
          {/* 예약 완료 토스트 */}
          {reserveToast && (
            <div
              className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2"
              role="status"
              aria-live="polite"
            >
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-foreground">예약이 완료됐어요</p>
                <p className="text-[11px] text-muted-foreground font-mono">{reserveToast}</p>
              </div>
            </div>
          )}

          {gameDetail && (
            <div className="absolute inset-0 z-40 bg-background overflow-hidden flex flex-col">
              <GameDetailView
                gameId={gameDetail.gameId}
                storeId={gameDetail.storeId}
                onBack={closeGameDetail}
                onReserve={handleReserve}
                onRequestRestock={handleRequestRestock}
                isGuest={isGuest}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden relative">
            {/* gameDetail이 열려있으면 StoresView를 unmount — 바텀시트 z-index가 게임 상세를 뚫지 않도록 */}
            {activeTab === 'stores' && !gameDetail && (
              <div className="relative h-full">
                <StoresView
                  onViewGame={openGameDetail}
                  favoriteStoreIds={favoriteStoreIds}
                  onToggleFavorite={handleToggleFavorite}
                  isGuest={isGuest}
                />
              </div>
            )}
            {activeTab === 'games' && !gameDetail && (
              <div className="flex flex-col h-full">
                <GamesView onViewGame={openGameDetail} />
              </div>
            )}
            <div className={activeTab === 'notifications' ? 'flex flex-col h-full' : 'hidden'}>
              <NotificationsView
                favoriteStoreIds={favoriteStoreIds}
                restockAlerts={restockAlerts}
                onViewGame={(gId, sId) => {
                  handleNavigate('stores')
                  setTimeout(() => openGameDetail(gId, sId), 50)
                }}
              />
            </div>
            <div className={activeTab === 'reservations' ? 'flex flex-col h-full' : 'hidden'}>
              <ReservationsView
                reservations={reservations}
                restockAlerts={restockAlerts}
                onCancelReservation={handleCancelReservation}
                onDeleteReservation={handleDeleteReservation}
                onCancelRestock={handleCancelRestock}
                onViewGame={(gId, sId) => {
                  handleNavigate('stores')
                  setTimeout(() => openGameDetail(gId, sId), 50)
                }}
              />
            </div>
            <div className={activeTab === 'mypage' ? 'flex flex-col h-full' : 'hidden'}>
              <MyPageView
                userName={localUserName}
                userEmail={userEmail}
                userImage={localUserImage}
                onUpdateProfile={handleUpdateProfile}
                onUpdateImage={handleUpdateImage}
                role={role}
                reservations={reservations}
                favoriteStoreIds={favoriteStoreIds}
                balance={balance}
                onToggleFavorite={handleToggleFavorite}
                onCharge={handleCharge}
                onNavigateToStore={(storeId) => {
                  handleNavigate('stores')
                  // StoresView가 마운트된 뒤 해당 매장을 선택 상태로 포커싱
                  setTimeout(() => {
                    const el = document.getElementById(`store-card-${storeId}`)
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }, 80)
                }}
                onViewGame={(gId, sId) => {
                  handleNavigate('stores')
                  setTimeout(() => openGameDetail(gId, sId), 50)
                }}
              />
            </div>
            {isOwner && (
              <div className={activeTab === 'admin' ? 'flex flex-col h-full' : 'hidden'}>
                <AdminView storeLocation={storeLocation} />
              </div>
            )}
          </div>

          {!gameDetail && (
            <BottomNav
              active={activeTab}
              onNavigate={handleNavigate}
              showAdmin={isOwner}
              notificationCount={NOTIFICATION_COUNT}
              activeReservationCount={activeReservationCount}
            />
          )}
        </main>
      </div>
    </div>
  )
}
