'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { StoresView } from '@/components/views/stores-view'
import { GameDetailView } from '@/components/views/game-detail-view'
import { ReservationsView } from '@/components/views/reservations-view'
import { MyPageView } from '@/components/views/mypage-view'
import { AdminView } from '@/components/views/admin-view'
import { createReservation } from '@/app/actions/reservations'
import { toggleFavorite as toggleFavoriteAction } from '@/app/actions/favorites'
import type { Reservation } from '@/lib/data'

type Tab = 'stores' | 'reservations' | 'mypage' | 'admin'

interface GameDetailState {
  gameId: string
  storeId: string
}

export interface AppShellProps {
  userName: string
  userEmail: string
  reservations: Reservation[]
  favoriteStoreIds: string[]
}

export function AppShell({
  userName,
  userEmail,
  reservations,
  favoriteStoreIds,
}: AppShellProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<Tab>('stores')
  const [gameDetail, setGameDetail] = useState<GameDetailState | null>(null)

  const openGameDetail = (gameId: string, storeId: string) => {
    setGameDetail({ gameId, storeId })
  }

  const closeGameDetail = () => {
    setGameDetail(null)
  }

  const handleReserve = (gameId: string, storeId: string) => {
    startTransition(async () => {
      await createReservation(gameId, storeId)
      router.refresh()
    })
  }

  const handleToggleFavorite = (storeId: string) => {
    startTransition(async () => {
      await toggleFavoriteAction(storeId)
      router.refresh()
    })
  }

  const handleNavigate = (tab: Tab) => {
    setGameDetail(null)
    setActiveTab(tab)
  }

  return (
    <div className="flex items-start justify-center min-h-dvh bg-[#070D1A]">
      <div className="phone-shell relative overflow-hidden" style={{ minHeight: '100dvh' }}>
        <main className="h-dvh flex flex-col overflow-hidden">
          {gameDetail && (
            <div className="absolute inset-0 z-40 bg-background overflow-hidden flex flex-col">
              <GameDetailView
                gameId={gameDetail.gameId}
                storeId={gameDetail.storeId}
                onBack={closeGameDetail}
                onReserve={handleReserve}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden relative">
            <div className={activeTab === 'stores' ? 'flex flex-col h-full' : 'hidden'}>
              <StoresView onViewGame={openGameDetail} />
            </div>
            <div className={activeTab === 'reservations' ? 'flex flex-col h-full' : 'hidden'}>
              <ReservationsView
                reservations={reservations}
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
                reservations={reservations}
                favoriteStoreIds={favoriteStoreIds}
                onToggleFavorite={handleToggleFavorite}
                onViewGame={(gId, sId) => {
                  handleNavigate('stores')
                  setTimeout(() => openGameDetail(gId, sId), 50)
                }}
              />
            </div>
            <div className={activeTab === 'admin' ? 'flex flex-col h-full' : 'hidden'}>
              <AdminView />
            </div>
          </div>

          {!gameDetail && <BottomNav active={activeTab} onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  )
}
