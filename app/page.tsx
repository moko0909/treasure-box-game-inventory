import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { getReservations } from '@/app/actions/reservations'
import { getFavoriteStoreIds } from '@/app/actions/favorites'
import type { Reservation } from '@/lib/data'

export default async function TreasureBoxApp() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [rows, favoriteStoreIds] = await Promise.all([
    getReservations(),
    getFavoriteStoreIds(),
  ])

  const reservations: Reservation[] = rows.map((r) => ({
    id: r.id,
    gameId: r.gameId,
    storeId: r.storeId,
    createdAt: r.reservedAt,
    expiresAt: r.expiresAt,
    status: r.status as Reservation['status'],
    confirmationCode: r.code,
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
    />
  )
}
