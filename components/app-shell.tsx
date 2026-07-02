'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { StoresView } from '@/components/views/stores-view'
import { GamesView } from '@/components/views/games-view'
import { GameDetailView } from '@/components/views/game-detail-view'
import { ReservationsView } from '@/components/views/reservations-view'
import { MyPageView } from '@/components/views/mypage-view'
import { AdminView } from '@/components/views/admin-view'
import { createReservation, cancelReservation, type CreateReservationInput } from '@/app/actions/reservations'
import { toggleFavorite as toggleFavoriteAction } from '@/app/actions/favorites'
import { requestRestockAlert, cancelRestockAlert } from '@/app/actions/restock'
import type { Reservation, RestockAlert } from '@/lib/data'

type Tab = 'stores' | 'games' | 'reservations' | 'mypage' | 'admin'

interface GameDetailState {
  gameId: string
  storeId: string
}

export interface AppShellProps {
  userName: string
  userEmail: string
  role: 'user' | 'owner'
  storeLocation: string | null
  reservations: Reservation[]
  favoriteStoreIds: string[]
  restockAlerts: RestockAlert[]
}

export function AppShell({
  userName,
  userEmail,
  role,
  storeLocation,
  reservations,
  favoriteStoreIds,
  restockAlerts,
}: AppShellProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<Tab>('stores')
  const [gameDetail, setGameDetail] = useState<GameDetailState | null>(null)

  const isOwner = role === 'owner'

  const openGameDetail = (gameId: string, storeId: string) => {
    setGameDetail({ gameId, storeId })
  }

  const closeGameDetail = () => {
    setGameDetail(null)
  }

  // 예약 확정 — 수량/픽업일시/요청사항을 함께 저장. 완료까지 await 하여
  // GameDetailView가 완료 화면(바코드)을 보여줄 수 있도록 결과를 반환.
  const handleReserve = async (input: CreateReservationInput) => {
    const result = await createReservation(input)
    startTransition(() => router.refresh())
    return result
  }

  const handleCancelReservation = (id: string) => {
    startTransition(async () => {
      await cancelReservation(id)
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

  const handleNavigate = (tab: Tab) => {
    // 점주만 Admin 탭 접근 가능
    if (tab === 'admin' && !isOwner) return
    setGameDetail(null)
    setActiveTab(tab)
  }

  return (
    <div className="flex items-start justify-center min-h-dvh bg-[#070D1A]">
      <div className="phone-shell relative flex-shrink-0 w-full" style={{ minHeight: '100dvh', overflow: 'clip', width: '100%', maxWidth: 390 }}>
        <main className="h-dvh flex flex-col overflow-hidden">
          {gameDetail && (
            <div className="absolute inset-0 z-40 bg-background overflow-hidden flex flex-col">
              <GameDetailView
                gameId={gameDetail.gameId}
                storeId={gameDetail.storeId}
                onBack={closeGameDetail}
                onReserve={handleReserve}
                onRequestRestock={handleRequestRestock}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden relative">
            <div className={activeTab === 'stores' ? 'relative h-full' : 'hidden'}>
              <StoresView onViewGame={openGameDetail} />
            </div>
            <div className={activeTab === 'games' ? 'flex flex-col h-full' : 'hidden'}>
              <GamesView onViewGame={openGameDetail} />
            </div>
            <div className={activeTab === 'reservations' ? 'flex flex-col h-full' : 'hidden'}>
              <ReservationsView
                reservations={reservations}
                restockAlerts={restockAlerts}
                onCancelReservation={handleCancelReservation}
                onCancelRestock={handleCancelRestock}
                onViewGame={(gId, sId) => {
                  handleNavigate('stores')
                  setTimeout(() => openGameDetail(gId, sId), 50)
                }}
              />
            </div>
            <div className={activeTab === 'mypage' ? 'flex flex-col h-full' : 'hidden'}>
              <MyPageView
                userName={userName}
                userEmail={userEmail}
                role={role}
                reservations={reservations}
                favoriteStoreIds={favoriteStoreIds}
                onToggleFavorite={handleToggleFavorite}
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
            <BottomNav active={activeTab} onNavigate={handleNavigate} showAdmin={isOwner} />
          )}
        </main>
      </div>
    </div>
  )
}
