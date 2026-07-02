'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Gamepad2, Loader2, User, Store } from 'lucide-react'

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
        if (error) throw new Error(error.message || 'Sign up failed')
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) throw new Error(error.message || 'Sign in failed')
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
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
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp
              ? 'Join Treasure Box to reserve games near you'
              : 'Sign in to manage your reservations'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">Account type</span>
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
                {isOwner ? '점주 이름' : 'Name'}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#4F46E5]"
                placeholder={isOwner ? '홍길동' : 'Alex Player'}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email
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
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-[#243049] bg-[#111A2E] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-[#4F46E5]"
              placeholder="At least 8 characters"
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
            {isSignUp ? (isOwner ? '점주 계정 만들기' : 'Create account') : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="font-semibold text-[#818CF8] hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  )
}
