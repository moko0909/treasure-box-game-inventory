'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { favorites } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getFavoriteStoreIds(): Promise<string[]> {
  const userId = await getUserId()
  const rows = await db
    .select({ storeId: favorites.storeId })
    .from(favorites)
    .where(eq(favorites.userId, userId))
  return rows.map((r) => r.storeId)
}

export async function toggleFavorite(storeId: string): Promise<boolean> {
  const userId = await getUserId()
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.storeId, storeId)))

  if (existing.length > 0) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.storeId, storeId)))
    revalidatePath('/')
    return false
  }

  await db.insert(favorites).values({
    id: crypto.randomUUID(),
    userId,
    storeId,
  })
  revalidatePath('/')
  return true
}
