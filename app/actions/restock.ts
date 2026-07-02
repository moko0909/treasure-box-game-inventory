'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { restockAlerts } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type RestockAlertRow = {
  id: string
  gameId: string
  storeId: string
  status: string
  createdAt: string
  notifiedAt: string | null
}

export async function getRestockAlerts(): Promise<RestockAlertRow[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(restockAlerts)
    .where(eq(restockAlerts.userId, userId))
    .orderBy(desc(restockAlerts.createdAt))

  return rows.map((r) => ({
    id: r.id,
    gameId: r.gameId,
    storeId: r.storeId,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
  }))
}

export async function requestRestockAlert(gameId: string, storeId: string) {
  const userId = await getUserId()

  // 중복 신청 방지: 이미 감시 중인 알림이 있으면 재사용
  const existing = await db
    .select()
    .from(restockAlerts)
    .where(
      and(
        eq(restockAlerts.userId, userId),
        eq(restockAlerts.gameId, gameId),
        eq(restockAlerts.storeId, storeId),
        eq(restockAlerts.status, 'watching'),
      ),
    )

  if (existing.length > 0) {
    return { alreadyExists: true }
  }

  await db.insert(restockAlerts).values({
    id: crypto.randomUUID(),
    userId,
    gameId,
    storeId,
    status: 'watching',
    createdAt: new Date(),
  })

  revalidatePath('/')
  return { alreadyExists: false }
}

export async function cancelRestockAlert(id: string) {
  const userId = await getUserId()
  await db
    .delete(restockAlerts)
    .where(and(eq(restockAlerts.id, id), eq(restockAlerts.userId, userId)))
  revalidatePath('/')
}
