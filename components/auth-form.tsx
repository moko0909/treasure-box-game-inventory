'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Gamepad2, Loader2, User, Store } from 'lucide-react'
import { ensureGuestAccount } from '@/app/actions/guest'

type Role = 'user' | 'owner'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [role, setRole] = useState<Role>('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const isSignUp = mode === 'sign-up'
  const isOwner = role === 'owner'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (isSignUp && isOwner && (!businessNumber.trim() || !storeLocation.trim())) {
      setError('점주 계정은 사업자 번호와 점포 위치가 필요합니다.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
          role,
          businessNumber: isOwner ? businessNumber : undefined,
          storeLocation: isOwner ? storeLocation : undefined,
        })
        if (error) throw new Error(error.message || '회원가입에 실패했습니다')
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) throw new Error(error.message || '로그인에 실패했습니다')
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제가 발생했습니다')
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setGuestLoading(true)
    setError(null)
    try {
      const { email: gEmail, password: gPw } = await ensureGuestAccount()
      const { error: signInError } = await authClient.signIn.email({ email: gEmail, password: gPw })
      if (signInError) throw new Error(signInError.message || '게스트 로그인 실패')
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '게스트 로그인에 실패했습니다')
      setGuestLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#070D1A] px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F46E5]">
            <Gamepad2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isSignUp ? '계정 만들기' : '다시 오신 걸 환영해요'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp
              ? '보물상자에 가입하고 내 주변 게임을 예약하세요'
              : '로그인하고 예약을 관리하세요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">계정 유형</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  aria-pressed={!isOwner}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                    !isOwner
                      ? 'border-[#4F46E5] bg-[#4F46E5]/15 text-white'
                      : 'border-[#243049] bg-[#111A2E] text-slate-400 hover:border-[#334568]'
                  }`}
                >
                  <User className="h-5 w-5" />
                  일반 사용자
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  aria-pressed={isOwner}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                    isOwner
                      ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-white'
                      : 'border-[#243049] bg-[#111A2E] text-slate-400 hover:border-[#334568]'
                  }`}
                >
                  <Store className="h-5 w-5" />
                  점주
                </button>
              </div>
            </div>
          )}

          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-300">
                {isOwner ? '점주 이름' : '이름'}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#4F46E5]"
                placeholder="홍길동"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              이메일
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#4F46E5]"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#4F46E5]"
              placeholder="8자 이상 입력"
            />
          </div>

          {isSignUp && isOwner && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="businessNumber" className="text-sm font-medium text-slate-300">
                  사업자 번호
                </label>
                <input
                  id="businessNumber"
                  type="text"
                  required
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#F59E0B]"
                  placeholder="123-45-67890"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="storeLocation" className="text-sm font-medium text-slate-300">
                  점포 위치
                </label>
                <input
                  id="storeLocation"
                  type="text"
                  required
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#F59E0B]"
                  placeholder="서울시 강남구 테헤란로 123"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm text-[#F87171]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${
              isSignUp && isOwner
                ? 'bg-[#F59E0B] text-[#1A1206]'
                : 'bg-[#F59E0B] text-[#1A1206]'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? (isOwner ? '점주 계정 만들기' : '계정 만들기') : '로그인'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="font-semibold text-[#818CF8] hover:underline"
          >
            {isSignUp ? '로그인' : '회원가입'}
          </Link>
        </p>

        {/* 구분선 */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#243049]" aria-hidden="true" />
          <span className="text-xs text-slate-500 font-medium">또는</span>
          <div className="flex-1 h-px bg-[#243049]" aria-hidden="true" />
        </div>

        {/* 게스트 로그인 */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={guestLoading || loading}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-[#334568] hover:text-white disabled:opacity-50"
        >
          {guestLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
          게스트로 둘러보기
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          게스트는 재고 조회만 가능하며 예약 기능은 제한됩니다.
        </p>
      </div>
    </div>
  )
}
