'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reservations } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type ReservationRow = {
  id: string
  gameId: string
  storeId: string
  status: string
  code: string
  reservedAt: string
  expiresAt: string
}

export async function getReservations(): Promise<ReservationRow[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.userId, userId))
    .orderBy(desc(reservations.reservedAt))

  return rows.map((r) => ({
    id: r.id,
    gameId: r.gameId,
    storeId: r.storeId,
    status: r.status,
    code: r.code,
    reservedAt: r.reservedAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  }))
}

export async function createReservation(gameId: string, storeId: string) {
  const userId = await getUserId()
  const now = new Date()
  const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const code = `TB-${Math.floor(1000 + Math.random() * 9000)}`

  await db.insert(reservations).values({
    id: crypto.randomUUID(),
    userId,
    gameId,
    storeId,
    status: 'active',
    code,
    reservedAt: now,
    expiresAt: expires,
  })

  revalidatePath('/')
  return { code, expiresAt: expires.toISOString() }
}

export async function cancelReservation(id: string) {
  const userId = await getUserId()
  await db
    .update(reservations)
    .set({ status: 'cancelled' })
    .where(and(eq(reservations.id, id), eq(reservations.userId, userId)))
  revalidatePath('/')
}

export async function markPickedUp(id: string) {
  const userId = await getUserId()
  await db
    .update(reservations)
    .set({ status: 'picked-up' })
    .where(and(eq(reservations.id, id), eq(reservations.userId, userId)))
  revalidatePath('/')
}
