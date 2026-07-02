'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { StoresView } from '@/components/views/stores-view'
import { GameDetailView } from '@/components/views/game-detail-view'
import { ReservationsView } from '@/components/views/reservations-view'
import { MyPageView } from '@/components/views/mypage-view'
import { AdminView } from '@/components/views/admin-view'
import type { Reservation } from '@/lib/data'

type Tab = 'stores' | 'reservations' | 'mypage' | 'admin'

interface GameDetailState {
  gameId: string
  storeId: string
}

export default function TreasureBoxApp() {
  const [activeTab, setActiveTab] = useState<Tab>('stores')
  const [gameDetail, setGameDetail] = useState<GameDetailState | null>(null)
  const [newReservations, setNewReservations] = useState<Reservation[]>([])

  const openGameDetail = (gameId: string, storeId: string) => {
    setGameDetail({ gameId, storeId })
  }

  const closeGameDetail = () => {
    setGameDetail(null)
  }

  const handleReserve = (gameId: string, storeId: string) => {
    const reservation: Reservation = {
      id: `r-new-${Date.now()}`,
      gameId,
      storeId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      confirmationCode: `TB-${Math.floor(1000 + Math.random() * 9000)}`,
    }
    setNewReservations((prev) => [reservation, ...prev])
  }

  const handleNavigate = (tab: Tab) => {
    setGameDetail(null)
    setActiveTab(tab)
  }

  return (
    <div className="flex items-start justify-center min-h-dvh bg-[#070D1A]">
      {/* Phone shell wrapper */}
      <div
        className="phone-shell relative overflow-hidden"
        style={{ minHeight: '100dvh' }}
      >
        {/* Main content area */}
        <main className="h-dvh flex flex-col overflow-hidden">
          {/* Game detail overlay */}
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

          {/* Tab views */}
          <div className="flex-1 overflow-hidden relative">
            <div className={activeTab === 'stores' ? 'flex flex-col h-full' : 'hidden'}>
              <StoresView onViewGame={openGameDetail} />
            </div>
            <div className={activeTab === 'reservations' ? 'flex flex-col h-full' : 'hidden'}>
              <ReservationsView
                onViewGame={(gId, sId) => {
                  handleNavigate('stores')
                  setTimeout(() => openGameDetail(gId, sId), 50)
                }}
                extraReservations={newReservations}
              />
            </div>
            <div className={activeTab === 'mypage' ? 'flex flex-col h-full' : 'hidden'}>
              <MyPageView
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

          {/* Bottom nav — hidden when game detail is open */}
          {!gameDetail && (
            <BottomNav active={activeTab} onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  )
}
