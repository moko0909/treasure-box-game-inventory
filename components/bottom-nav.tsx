'use client'

import { Store, Gamepad2, Bell, CalendarDays, User, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT, type TranslationKey } from '@/lib/i18n'

export type Tab = 'stores' | 'games' | 'notifications' | 'reservations' | 'mypage' | 'admin'

interface TabItem {
  id: Tab
  labelKey: TranslationKey
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
  { id: 'stores',        labelKey: 'nav_stores',        Icon: Store },
  { id: 'games',         labelKey: 'nav_games',         Icon: Gamepad2 },
  { id: 'notifications', labelKey: 'nav_notifications', Icon: Bell },
  { id: 'reservations',  labelKey: 'nav_reservations',  Icon: CalendarDays },
  { id: 'mypage',        labelKey: 'nav_mypage',        Icon: User },
]

const ADMIN_ITEM: TabItem = { id: 'admin', labelKey: 'nav_admin', Icon: LayoutGrid }

export function BottomNav({
  active,
  onNavigate,
  showAdmin = false,
  notificationCount = 0,
  activeReservationCount = 0,
}: BottomNavProps) {
  const t = useT()
  const items = showAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <nav
      aria-label="주요 내비게이션"
      className="w-full bg-[#0D0D0D]/96 backdrop-blur-md border-t border-[#2C2C2C] z-50 flex-shrink-0"
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
                  'relative flex w-full flex-col items-center justify-center gap-1 py-1 transition-colors duration-200',
                  isActive ? 'text-[#BB86FC]' : 'text-[#4A4A4A] hover:text-[#6A6A6A]'
                )}
              >
                {/* 뱃지 — 항상 최상위 레이어 */}
                {badge > 0 && (
                  <span
                    className="absolute top-1 right-1/2 translate-x-[14px] min-w-[16px] h-[16px] rounded-full bg-[#CF6679] text-white text-[9px] font-extrabold flex items-center justify-center px-1 pointer-events-none"
                    style={{ zIndex: 10 }}
                    aria-label={`${badge}개 알림`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {/* 활성 탭 글로우 인디케이터 — 뱃지 위, 아이콘 위 */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#6200EE]"
                    style={{ boxShadow: '0 0 8px 2px rgba(98,0,238,0.7)', zIndex: 5 }}
                    aria-hidden="true"
                  />
                )}
                {/* 아이콘 — 눌리면 z-index가 뱃지(10) 아래(1)로 내려가며 scale+translate */}
                <span
                  className={cn(
                    'relative flex items-center justify-center transition-all duration-100',
                    'active:scale-75 active:translate-y-[3px]',
                  )}
                  style={{ zIndex: 1 }}
                >
                  <item.Icon
                    className={cn(
                      'h-[20px] w-[20px]',
                      isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'
                    )}
                  />
                </span>
                <span className={cn('text-[9px] leading-none whitespace-nowrap relative', isActive ? 'font-bold text-[#BB86FC]' : '')} style={{ zIndex: 5 }}>
                  {t(item.labelKey)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
