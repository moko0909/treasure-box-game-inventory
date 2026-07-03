import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

const GUEST_EMAIL = 'guest@treasure-box.app'
const GUEST_PASSWORD = 'guest-preview-2024'
const GUEST_USER_ID = 'guest-static-user'
// Better Auth의 기본 세션 쿠키 이름
const SESSION_COOKIE = 'better-auth.session_token'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const isSecure = origin.startsWith('https')

  try {
    // 1. 게스트 유저 upsert
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
        id: GUEST_USER_ID,
        name: '게스트',
        email: GUEST_EMAIL,
        emailVerified: false,
        role: 'guest',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await db.insert(account).values({
        id: `${GUEST_USER_ID}-account`,
        accountId: GUEST_EMAIL,
        providerId: 'credential',
        userId: GUEST_USER_ID,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // 2. Better Auth signInEmail — body 응답에서 token 추출
    const signInResult = await auth.api.signInEmail({
      body: { email: GUEST_EMAIL, password: GUEST_PASSWORD },
    })

    const token = (signInResult as unknown as { token?: string })?.token
    if (!token) throw new Error('세션 토큰을 받지 못했습니다')

    // 3. 세션 토큰 쿠키 직접 설정 후 / 로 redirect
    const res = NextResponse.redirect(new URL('/', origin))
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[guest] login error:', err)
    return NextResponse.redirect(new URL('/sign-in?error=guest', origin))
  }
}
