import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'ko' | 'en' | 'ja'
export type Theme = 'dark' | 'light' | 'system'

interface SettingsState {
  language: Language
  theme: Theme
  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
}

/** 시스템 다크모드 여부 */
function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

/** html 태그에 dark/light 클래스 적용 */
function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(theme)
  const html = document.documentElement
  html.classList.remove('dark', 'light')
  html.classList.add(resolved)
}

/** html[lang] 속성 적용 */
function applyLangToDOM(lang: Language) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ko',
      theme: 'dark',

      setLanguage: (language) => {
        applyLangToDOM(language)
        set({ language })
      },

      setTheme: (theme) => {
        applyThemeToDOM(theme)
        set({ theme })
      },
    }),
    {
      name: 'treasure-box-settings', // localStorage key
      onRehydrateStorage: () => (state) => {
        // 스토어가 localStorage에서 복원될 때 즉시 DOM에 반영
        if (state) {
          applyThemeToDOM(state.theme)
          applyLangToDOM(state.language)
        }
      },
    },
  ),
)
