'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/settings-store'

/**
 * 앱 최상단에서 마운트되어, Zustand 스토어가 localStorage에서 복원된 후
 * 테마/언어를 DOM에 즉시 반영합니다.
 * FOUC는 layout.tsx의 인라인 스크립트가 막고, 이 컴포넌트는 SPA 라우팅 중
 * 상태 변화에도 DOM을 최신 상태로 유지합니다.
 */
export function SettingsBootstrap() {
  const theme = useSettingsStore((s) => s.theme)
  const language = useSettingsStore((s) => s.language)

  useEffect(() => {
    // 테마 적용
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(resolved)

    // 시스템 테마 변경 감지 (system 모드일 때만)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return null
}
