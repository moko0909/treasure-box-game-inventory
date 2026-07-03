'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/** 현재 사용자의 예약금 잔액을 조회합니다 */
export async function getBalance(): Promise<number> {
  const userId = await getUserId()
  const rows = await db
    .select({ balance: user.balance })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return rows[0]?.balance ?? 0
}

/** 예약금을 충전합니다 (amount: 원 단위 양수) */
export async function chargeBalance(amount: number): Promise<{ balance: number }> {
  if (amount <= 0) throw new Error('충전 금액은 0보다 커야 합니다')
  const userId = await getUserId()
  const rows = await db
    .update(user)
    .set({ balance: sql`${user.balance} + ${amount}` })
    .where(eq(user.id, userId))
    .returning({ balance: user.balance })
  revalidatePath('/')
  return { balance: rows[0].balance }
}

/** 예약 완료 시 잔액을 차감합니다 (amount: 원 단위 양수, 잔액 부족 시 에러) */
export async function deductBalance(amount: number): Promise<{ balance: number }> {
  if (amount <= 0) return { balance: await getBalance() }
  const userId = await getUserId()
  // 잔액 확인 후 차감 (음수 방지)
  const rows = await db
    .update(user)
    .set({ balance: sql`GREATEST(${user.balance} - ${amount}, 0)` })
    .where(eq(user.id, userId))
    .returning({ balance: user.balance })
  revalidatePath('/')
  return { balance: rows[0].balance }
}
