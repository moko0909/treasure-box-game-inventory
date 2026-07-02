import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getReservations } from '@/app/actions/reservations'
import { getFavoriteStoreIds } from '@/app/actions/favorites'
import { getRestockAlerts } from '@/app/actions/restock'
import type { Reservation, RestockAlert } from '@/lib/data'

export default async function TreasureBoxApp() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [rows, favoriteStoreIds, alertRows] = await Promise.all([
    getReservations(),
    getFavoriteStoreIds(),
    getRestockAlerts(),
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

  const role = (session.user as { role?: string }).role === 'owner' ? 'owner' : 'user'
  const storeLocation = (session.user as { storeLocation?: string }).storeLocation ?? null

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      role={role}
      storeLocation={storeLocation}
      reservations={reservations}
      favoriteStoreIds={favoriteStoreIds}
      restockAlerts={restockAlerts}
    />
  )
}
