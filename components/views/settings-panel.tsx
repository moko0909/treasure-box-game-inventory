'use client'

import { cn } from '@/lib/utils'
import { useSettingsStore, type Language, type Theme } from '@/lib/settings-store'
import { useT } from '@/lib/i18n'
import { useState } from 'react'

interface SettingsPanelProps {
  role: 'user' | 'owner'
  onBack: () => void
}

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
        on ? 'bg-primary' : 'bg-muted-foreground/30'
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
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2 mt-6 first:mt-0">
      {children}
    </p>
  )
}

export function SettingsPanel({ role, onBack }: SettingsPanelProps) {
  const t = useT()
  // 전역 스토어 — 변경 즉시 앱 전체에 반영
  const language = useSettingsStore((s) => s.language)
  const theme = useSettingsStore((s) => s.theme)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const [pushNotif, setPushNotif] = useState(true)
  const [stockAlerts, setStockAlerts] = useState(true)
  const [reservationAlerts, setReservationAlerts] = useState(true)
  const [marketing, setMarketing] = useState(false)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-card border-b border-border">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로가기"
          className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-extrabold text-foreground tracking-tight">{t('settings_title')}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Language */}
        <SectionLabel>{t('settings_language')}</SectionLabel>
        <div className="bg-card rounded-[18px] border border-border overflow-hidden">
          {LANGUAGES.map((lang, i) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors min-h-[52px]',
                i !== 0 && 'border-t border-border'
              )}
            >
              <span className="flex-1 text-sm font-semibold text-foreground">
                {lang.native}
                <span className="text-muted-foreground font-normal ml-2">{lang.label}</span>
              </span>
              {language === lang.id && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Theme */}
        <SectionLabel>{t('settings_theme')}</SectionLabel>
        <div className="flex gap-2">
          {THEMES.map((themeItem) => (
            <button
              key={themeItem.id}
              type="button"
              onClick={() => setTheme(themeItem.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 py-4 rounded-[16px] border transition-colors',
                theme === themeItem.id
                  ? 'bg-primary/15 border-primary text-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {themeItem.icon}
              <span className={cn('text-xs font-bold', theme === themeItem.id ? 'text-primary' : 'text-muted-foreground')}>
                {t(themeItem.id === 'dark' ? 'settings_theme_dark' : themeItem.id === 'light' ? 'settings_theme_light' : 'settings_theme_system')}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications */}
        <SectionLabel>{t('settings_notifications')}</SectionLabel>
        <div className="bg-card rounded-[18px] border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px]">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('settings_push')}</p>
              <p className="text-[11px] text-muted-foreground">{t('settings_push_desc')}</p>
            </div>
            <Toggle on={pushNotif} onToggle={() => setPushNotif((v) => !v)} label={t('settings_push')} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] border-t border-border">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('settings_stock_alerts')}</p>
              <p className="text-[11px] text-muted-foreground">{t('settings_stock_alerts_desc')}</p>
            </div>
            <Toggle on={stockAlerts} onToggle={() => setStockAlerts((v) => !v)} label={t('settings_stock_alerts')} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] border-t border-border">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('settings_reservation_alerts')}</p>
              <p className="text-[11px] text-muted-foreground">{t('settings_reservation_alerts_desc')}</p>
            </div>
            <Toggle on={reservationAlerts} onToggle={() => setReservationAlerts((v) => !v)} label={t('settings_reservation_alerts')} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[52px] border-t border-border">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('settings_marketing')}</p>
              <p className="text-[11px] text-muted-foreground">{t('settings_marketing_desc')}</p>
            </div>
            <Toggle on={marketing} onToggle={() => setMarketing((v) => !v)} label={t('settings_marketing')} />
          </div>
        </div>

        {/* Account role */}
        <SectionLabel>{t('settings_role')}</SectionLabel>
        <div className="bg-card rounded-[18px] border border-border p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
                role === 'owner' ? 'bg-[#F59E0B]/15' : 'bg-primary/15'
              )}
            >
              {role === 'owner' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground">
                {role === 'owner' ? t('settings_role_owner') : t('settings_role_user')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {role === 'owner' ? t('settings_role_owner_desc') : t('settings_role_user_desc')}
              </p>
            </div>
            <span
              className={cn(
                'text-[11px] font-bold px-2.5 py-1 rounded-full',
                role === 'owner' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-primary/15 text-primary'
              )}
            >
              {role === 'owner' ? 'OWNER' : 'USER'}
            </span>
          </div>
          {role === 'user' && (
            <button
              type="button"
              className="mt-3 w-full h-11 rounded-[12px] bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 transition-colors"
            >
              {t('settings_apply_owner')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
