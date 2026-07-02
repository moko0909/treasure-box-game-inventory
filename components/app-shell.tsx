'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { StoresView } from '@/components/views/stores-view'
import { GameDetailView } from '@/components/views/game-detail-view'
import { ReservationsView } from '@/components/views/reservations-view'
import { MyPageView } from '@/components/views/mypage-view'
import { AdminView } from '@/components/views/admin-view'
import { createReservation, cancelReservation, type CreateReservationInput } from '@/app/actions/reservations'
import { toggleFavorite as toggleFavoriteAction } from '@/app/actions/favorites'
import { requestRestockAlert, cancelRestockAlert } from '@/app/actions/restock'
import type { Reservation, RestockAlert } from '@/lib/data'

type Tab = 'stores' | 'reservations' | 'mypage' | 'admin'

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

  const openGameDetail = useCallback((gameId: string, storeId: string) => {
    setGameDetail({ gameId, storeId })
  }, [])

  const closeGameDetail = useCallback(() => {
    setGameDetail(null)
  }, [])

  const handleReserve = useCallback(async (input: CreateReservationInput) => {
    const result = await createReservation(input)
    startTransition(() => router.refresh())
    return result
  }, [router, startTransition])

  const handleCancelReservation = useCallback((id: string) => {
    startTransition(async () => {
      await cancelReservation(id)
      router.refresh()
    })
  }, [router, startTransition])

  const handleToggleFavorite = useCallback((storeId: string) => {
    startTransition(async () => {
      await toggleFavoriteAction(storeId)
      router.refresh()
    })
  }, [router, startTransition])

  const handleRequestRestock = useCallback(async (gameId: string, storeId: string) => {
    const result = await requestRestockAlert(gameId, storeId)
    startTransition(() => router.refresh())
    return result
  }, [router, startTransition])

  const handleCancelRestock = useCallback((id: string) => {
    startTransition(async () => {
      await cancelRestockAlert(id)
      router.refresh()
    })
  }, [router, startTransition])

  const handleNavigate = useCallback((tab: Tab) => {
    if (tab === 'admin' && !isOwner) return
    setGameDetail(null)
    setActiveTab(tab)
  }, [isOwner])

  return (
    <div className="flex items-start justify-center min-h-dvh bg-[#070D1A]">
      <div className="phone-shell relative" style={{ minHeight: '100dvh', overflow: 'clip' }}>
        <main className="relative h-dvh">
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

          {/* 매장 탭: 전체 화면 — Leaflet canvas가 다른 탭을 가리지 않도록 비활성 시 완전히 unmount */}
          {activeTab === 'stores' && (
            <div className="absolute inset-0">
              <StoresView onViewGame={openGameDetail} />
            </div>
          )}

          {/* 나머지 탭: stores가 아닐 때만 렌더, 상단부터 네비바 위까지 */}
          <div className={`absolute inset-0 bottom-16 flex flex-col overflow-hidden ${activeTab === 'stores' ? 'hidden' : ''}`}>
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

          {/* 네비바: 항상 하단에 고정 */}
          {!gameDetail && (
            <div className="absolute bottom-0 left-0 right-0 z-30">
              <BottomNav active={activeTab} onNavigate={handleNavigate} showAdmin={isOwner} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
