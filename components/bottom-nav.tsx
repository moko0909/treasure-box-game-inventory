'use client'

import { cn } from '@/lib/utils'

export type Tab = 'stores' | 'games' | 'notifications' | 'reservations' | 'mypage' | 'admin'

interface BottomNavProps {
  active: Tab
  onNavigate: (tab: Tab) => void
  showAdmin?: boolean
  notificationCount?: number
  activeReservationCount?: number
}

const NAV_ITEMS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'stores',
    label: '매장',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'games',
    label: '게임',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="6" y1="11" x2="10" y2="11" />
        <line x1="8" y1="9" x2="8" y2="13" />
        <line x1="15" y1="12" x2="15.01" y2="12" />
        <line x1="18" y1="10" x2="18.01" y2="10" />
        <rect x="2" y="6" width="20" height="12" rx="6" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: '알림',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'reservations',
    label: '예약',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'mypage',
    label: '마이페이지',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'admin',
    label: '관리',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
]

export function BottomNav({
  active,
  onNavigate,
  showAdmin = false,
  notificationCount = 0,
  activeReservationCount = 0,
}: BottomNavProps) {
  const items = showAdmin ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'admin')

  return (
    <nav
      aria-label="주요 내비게이션"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#0D1526]/95 backdrop-blur-md border-t border-[#1E293B] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-[60px]">
        {items.map((item) => {
          const isActive = item.id === active
          const badge =
            item.id === 'notifications' ? notificationCount :
            item.id === 'reservations' ? activeReservationCount : 0

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 transition-colors',
                isActive ? 'text-[#818CF8]' : 'text-[#475569] hover:text-[#64748B]'
              )}
            >
              {/* Badge */}
              {badge > 0 && (
                <span
                  className="absolute top-2 right-1/2 translate-x-[10px] min-w-[16px] h-[16px] rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold flex items-center justify-center px-1"
                  aria-label={`${badge}개`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              <span className={cn('transition-transform duration-150', isActive && 'scale-110')}>
                {item.icon(isActive)}
              </span>
              <span className={cn(
                'text-[10px] leading-none transition-colors',
                isActive ? 'font-bold text-[#818CF8]' : 'font-medium'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
