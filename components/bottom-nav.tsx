'use client'

import { Store, Bell, CalendarDays, User, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tab = 'stores' | 'games' | 'notifications' | 'reservations' | 'mypage' | 'admin'

interface TabItem {
  id: Tab
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

interface BottomNavProps {
  active: Tab
  onNavigate: (tab: Tab) => void
  showAdmin?: boolean
  notificationCount?: number
  activeReservationCount?: number
}

const NAV_ITEMS: TabItem[] = [
  { id: 'stores',        label: '매장',     Icon: Store },
  { id: 'notifications', label: '알림',     Icon: Bell },
  { id: 'reservations',  label: '예약목록', Icon: CalendarDays },
  { id: 'mypage',        label: '마이페이지', Icon: User },
]

const ADMIN_ITEM: TabItem = { id: 'admin', label: '관리', Icon: LayoutGrid }

export function BottomNav({
  active,
  onNavigate,
  showAdmin = false,
  notificationCount = 0,
  activeReservationCount = 0,
}: BottomNavProps) {
  const items = showAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <nav
      aria-label="주요 내비게이션"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#0D1526]/95 backdrop-blur-md border-t border-[#1E293B] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-center justify-around h-[60px]">
        {items.map((item) => {
          const isActive = item.id === active
          const badge =
            item.id === 'notifications' ? notificationCount :
            item.id === 'reservations'  ? activeReservationCount : 0

          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex w-full flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-[#818CF8]' : 'text-[#475569] hover:text-[#64748B]'
                )}
              >
                {/* 뱃지 */}
                {badge > 0 && (
                  <span
                    className="absolute top-1 right-1/2 translate-x-[14px] min-w-[16px] h-[16px] rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold flex items-center justify-center px-1 pointer-events-none"
                    aria-label={`${badge}개 알림`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                <item.Icon
                  className={cn(
                    'h-[22px] w-[22px] transition-transform duration-150',
                    isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'
                  )}
                />
                <span className={cn('text-[10px] leading-none', isActive && 'font-bold')}>
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
