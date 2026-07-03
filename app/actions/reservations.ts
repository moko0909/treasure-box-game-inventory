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
  quantity: number
  notes: string | null
  reservedAt: string
  pickupAt: string | null
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
    quantity: r.quantity,
    notes: r.notes,
    reservedAt: r.reservedAt.toISOString(),
    pickupAt: r.pickupAt ? r.pickupAt.toISOString() : null,
    expiresAt: r.expiresAt.toISOString(),
  }))
}

export type CreateReservationInput = {
  gameId: string
  storeId: string
  quantity?: number
  pickupAt?: string | null
  notes?: string | null
}

export async function createReservation(input: CreateReservationInput) {
  const userId = await getUserId()
  const now = new Date()
  // 픽업 기한: 지정한 픽업 일시가 있으면 그 시각, 없으면 48시간 후
  const pickup = input.pickupAt ? new Date(input.pickupAt) : null
  const expires = pickup ?? new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const code = `TB-${Math.floor(1000 + Math.random() * 9000)}`

  await db.insert(reservations).values({
    id: crypto.randomUUID(),
    userId,
    gameId: input.gameId,
    storeId: input.storeId,
    status: 'active',
    code,
    quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
    notes: input.notes ?? null,
    reservedAt: now,
    pickupAt: pickup,
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

/** 취소된 예약을 완전히 삭제합니다 */
export async function deleteReservation(id: string) {
  const userId = await getUserId()
  await db
    .delete(reservations)
    .where(
      and(
        eq(reservations.id, id),
        eq(reservations.userId, userId),
        eq(reservations.status, 'cancelled'),
      ),
    )
  revalidatePath('/')
}
