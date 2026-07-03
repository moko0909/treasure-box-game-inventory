'use server'

import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const GUEST_EMAIL = 'guest@treasure-box.app'
const GUEST_PASSWORD = 'guest-preview-2024'
const GUEST_ID = 'guest-static-user'

/**
 * 게스트 계정이 DB에 없으면 생성합니다.
 * 클라이언트에서 authClient.signIn.email()로 로그인할 때 사용할 자격증명을 반환합니다.
 */
export async function ensureGuestAccount(): Promise<{ email: string; password: string }> {
  // 이미 존재하면 그대로 반환
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, GUEST_EMAIL))
    .limit(1)

  if (existing.length === 0) {
    // bcryptjs로 패스워드 해시 생성
    const bcrypt = await import('bcryptjs')
    const hashFn = (bcrypt as unknown as { hash: (pw: string, r: number) => Promise<string> }).hash ?? bcrypt.default?.hash
    const hashed = await hashFn(GUEST_PASSWORD, 10)

    await db.insert(user).values({
      id: GUEST_ID,
      name: '게스트',
      email: GUEST_EMAIL,
      emailVerified: false,
      role: 'guest',
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(account).values({
      id: `${GUEST_ID}-account`,
      accountId: GUEST_EMAIL,
      providerId: 'credential',
      userId: GUEST_ID,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return { email: GUEST_EMAIL, password: GUEST_PASSWORD }
}
