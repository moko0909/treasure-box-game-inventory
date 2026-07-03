'use client'

import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/data'

interface PlatformChipProps {
  platform: Platform
  selected?: boolean
  onClick?: () => void
  className?: string
}

const platformConfig: Record<Platform, { label: string; activeColor: string }> = {
  PS5:              { label: 'PS5',    activeColor: 'bg-blue-600 text-white border-blue-600' },
  'Nintendo Switch':{ label: 'Switch', activeColor: 'bg-red-500 text-white border-red-500' },
  Xbox:             { label: 'Xbox',   activeColor: 'bg-green-600 text-white border-green-600' },
}

export function PlatformChip({ platform, selected, onClick, className }: PlatformChipProps) {
  const config = platformConfig[platform]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'h-9 px-4 rounded-full text-sm font-semibold border transition-all duration-150 flex-shrink-0',
        selected
          ? config.activeColor
          : 'bg-[#1E1E1E] text-[#6A6A6A] border-[#2C2C2C] hover:border-[#6200EE]/50',
        className
      )}
    >
      {config.label}
    </button>
  )
}
