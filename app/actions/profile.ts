'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export interface UpdateProfileInput {
  name: string
}

export interface UpdateProfileResult {
  name: string
  image: string | null
}

/** 현재 사용자의 프로필(이름, 이미지)을 조회합니다 */
export async function getProfile(): Promise<UpdateProfileResult> {
  const userId = await getUserId()
  const rows = await db
    .select({ name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return { name: rows[0].name, image: rows[0].image }
}

/** 사용자 이름을 업데이트합니다 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const name = input.name.trim()
  if (!name) throw new Error('이름을 입력해주세요')
  if (name.length > 20) throw new Error('이름은 20자 이내로 입력해주세요')

  const userId = await getUserId()
  const rows = await db
    .update(user)
    .set({ name, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ name: user.name, image: user.image })

  revalidatePath('/')
  return { name: rows[0].name, image: rows[0].image }
}
