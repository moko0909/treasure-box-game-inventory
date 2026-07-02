'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  role: 'user' | 'owner'
  onBack: () => void
}

type Language = 'ko' | 'en' | 'ja'
type Theme = 'dark' | 'light' | 'system'

const LANGUAGES: { id: Language; label: string; native: string }[] = [
  { id: 'ko', label: 'Korean', native: '한국어' },
  { id: 'en', label: 'English', native: 'English' },
  { id: 'ja', label: 'Japanese', native: '日本語' },
]

const THEMES: { id: Theme; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dark',
    label: '다크',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
  {
    id: 'light',
    label: '라이트',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    id: 'system',
    label: '시스템',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
]

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
        on ? 'bg-[#4F46E5]' : 'bg-[#334155]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
          on && 'translate-x-5'
        )}
      />
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest px-1 mb-2 mt-6 first:mt-0">
      {children}
    </p>
  )
}

export function SettingsPanel({ role, onBack }: SettingsPanelProps) {
  const [language, setLanguage] = useState<Language>('ko')
  const [theme, setTheme] = useState<Theme>('dark')
  const [pushNotif, setPushNotif] = useState(true)
  const [stockAlerts, setStockAlerts] = useState(true)
  const [reservationAlerts, setReservationAlerts] = useState(true)
  const [marketing, setMarketing] = useState(false)

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-[#1E293B] border-b border-[#334155]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-9 h-9 rounded-full bg-[#0F172A] border border-[#334155] flex items-center justify-center flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-extrabold text-[#F8FAFC] tracking-tight">설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Language */}
        <SectionLabel>사용자 언어</SectionLabel>
        <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] overflow-hidden">
          {LANGUAGES.map((lang, i) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#263347] transition-colors min-h-[52px]',
                i !== 0 && 'border-t border-[#334155]'
              )}
            >
              <span className="flex-1 text-sm font-semibold text-[#F8FAFC]">
                {lang.native}
                <span className="text-[#64748B] font-normal ml-2">{lang.label}</span>
              </span>
              {language === lang.id && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Theme */}
        <SectionLabel>테마</SectionLabel>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 py-4 rounded-[16px] border transition-colors',
                theme === t.id
                  ? 'bg-[#4F46E5]/15 border-[#4F46E5] text-[#818CF8]'
                  : 'bg-[#1E293B] border-[#334155] text-[#64748B]'
              )}
            >
              {t.icon}
              <span className={cn('text-xs font-bold', theme === t.id ? 'text-[#F8FAFC]' : 'text-[#94A3B8]')}>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications */}
        <SectionLabel>알림</SectionLabel>
        <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px]">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F8FAFC]">푸시 알림</p>
              <p className="text-[11px] text-[#64748B]">앱 전체 푸시 알림 받기</p>
            </div>
            <Toggle on={pushNotif} onToggle={() => setPushNotif((v) => !v)} label="푸시 알림" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] border-t border-[#334155]">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F8FAFC]">재고 입고 알림</p>
              <p className="text-[11px] text-[#64748B]">찜한 게임 입고 시 알림</p>
            </div>
            <Toggle on={stockAlerts} onToggle={() => setStockAlerts((v) => !v)} label="재고 입고 알림" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] border-t border-[#334155]">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F8FAFC]">예약 알림</p>
              <p className="text-[11px] text-[#64748B]">예약 상태 및 만료 알림</p>
            </div>
            <Toggle on={reservationAlerts} onToggle={() => setReservationAlerts((v) => !v)} label="예약 알림" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] border-t border-[#334155]">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#F8FAFC]">마케팅 알림</p>
              <p className="text-[11px] text-[#64748B]">할인 및 이벤트 소식</p>
            </div>
            <Toggle on={marketing} onToggle={() => setMarketing((v) => !v)} label="마케팅 알림" />
          </div>
        </div>

        {/* Account role */}
        <SectionLabel>사용자 권한</SectionLabel>
        <div className="bg-[#1E293B] rounded-[18px] border border-[#334155] p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
                role === 'owner' ? 'bg-[#F59E0B]/15' : 'bg-[#4F46E5]/15'
              )}
            >
              {role === 'owner' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-[#F8FAFC]">
                {role === 'owner' ? '점주 계정' : '일반 사용자'}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {role === 'owner'
                  ? '재고 관리 및 예약 관리 권한'
                  : '게임 검색 및 예약 이용 권한'}
              </p>
            </div>
            <span
              className={cn(
                'text-[11px] font-bold px-2.5 py-1 rounded-full',
                role === 'owner' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-[#4F46E5]/15 text-[#818CF8]'
              )}
            >
              {role === 'owner' ? 'OWNER' : 'USER'}
            </span>
          </div>
          {role === 'user' && (
            <button
              type="button"
              className="mt-3 w-full h-11 rounded-[12px] bg-[#4F46E5]/15 border border-[#4F46E5]/30 text-[#818CF8] text-sm font-bold hover:bg-[#4F46E5]/25 transition-colors"
            >
              점주 계정으로 전환 신청
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
