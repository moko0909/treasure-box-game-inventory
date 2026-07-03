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
    .returning({ name: user.name })

  revalidatePath('/')
  return { name: rows[0].name }
}
