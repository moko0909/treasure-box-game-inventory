'use server'

import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

const GUEST_EMAIL = 'guest@treasure-box.app'
const GUEST_PASSWORD = 'guest-preview-2024'
const GUEST_ID = 'guest-static-user'

export async function GET(request: NextRequest) {
  try {
    // 1. 게스트 계정이 없으면 생성
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, GUEST_EMAIL))
      .limit(1)

    if (existing.length === 0) {
      const bcrypt = await import('bcryptjs')
      const hashFn =
        typeof (bcrypt as unknown as { hash: unknown }).hash === 'function'
          ? (bcrypt as unknown as { hash: (pw: string, r: number) => Promise<string> }).hash
          : (bcrypt.default as unknown as { hash: (pw: string, r: number) => Promise<string> }).hash
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

    // 2. Better Auth API를 통해 로그인 — 세션 쿠키를 응답에 포함
    const origin = request.nextUrl.origin
    const signInRes = await auth.api.signInEmail({
      body: { email: GUEST_EMAIL, password: GUEST_PASSWORD },
      asResponse: true,
    })

    // 3. 로그인 응답의 Set-Cookie를 그대로 가져와 / 로 redirect
    const redirectRes = NextResponse.redirect(new URL('/', origin))
    const setCookie = signInRes.headers.get('set-cookie')
    if (setCookie) {
      redirectRes.headers.set('set-cookie', setCookie)
    }
    return redirectRes
  } catch (err) {
    console.error('[guest] login error:', err)
    const origin = request.nextUrl.origin
    return NextResponse.redirect(new URL('/sign-in?error=guest', origin))
  }
}
