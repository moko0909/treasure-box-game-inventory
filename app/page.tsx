import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getReservations } from '@/app/actions/reservations'
import { getFavoriteStoreIds } from '@/app/actions/favorites'
import { getRestockAlerts } from '@/app/actions/restock'
import { getBalance } from '@/app/actions/balance'
import { getProfile } from '@/app/actions/profile'
import type { Reservation, RestockAlert } from '@/lib/data'

export default async function TreasureBoxApp() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [rows, favoriteStoreIds, alertRows, balance, profile] = await Promise.all([
    getReservations(),
    getFavoriteStoreIds(),
    getRestockAlerts(),
    getBalance(),
    getProfile(),
  ])

  const reservations: Reservation[] = rows.map((r) => ({
    id: r.id,
    gameId: r.gameId,
    storeId: r.storeId,
    createdAt: r.reservedAt,
    expiresAt: r.expiresAt,
    status: r.status as Reservation['status'],
    confirmationCode: r.code,
    quantity: r.quantity,
    notes: r.notes,
    pickupAt: r.pickupAt,
  }))

  const restockAlerts: RestockAlert[] = alertRows.map((a) => ({
    id: a.id,
    gameId: a.gameId,
    storeId: a.storeId,
    status: a.status,
    createdAt: a.createdAt,
    notifiedAt: a.notifiedAt,
  }))

  const rawRole = (session.user as { role?: string }).role
  const role = rawRole === 'owner' ? 'owner' : 'user'
  const isGuest = rawRole === 'guest'
  const storeLocation = (session.user as { storeLocation?: string }).storeLocation ?? null

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      role={role}
      isGuest={isGuest}
      storeLocation={storeLocation}
      reservations={reservations}
      favoriteStoreIds={favoriteStoreIds}
      restockAlerts={restockAlerts}
      initialBalance={balance}
      initialImage={profile.image}
    />
  )
}
