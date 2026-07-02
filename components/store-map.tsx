'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Store } from '@/lib/data'

interface StoreMapProps {
  stores: Store[]
  selectedStoreId?: string
  onSelectStore?: (id: string) => void
  className?: string
}

const MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  s1: { x: 40, y: 55 },
  s2: { x: 48, y: 38 },
  s3: { x: 74, y: 28 },
  s4: { x: 46, y: 22 },
}

export function StoreMap({ stores, selectedStoreId, onSelectStore, className }: StoreMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl overflow-hidden border border-[#334155]',
        className
      )}
      aria-label="Store locations map"
      role="img"
    >
      <svg
        viewBox="0 0 390 200"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark navy background */}
        <rect width="390" height="200" fill="#0B1220" />

        {/* City blocks — dark surface tones */}
        <rect x="20"  y="15" width="60" height="35" rx="4" fill="#1A2640" />
        <rect x="90"  y="20" width="45" height="25" rx="4" fill="#1A2640" />
        <rect x="145" y="10" width="70" height="30" rx="4" fill="#1A2640" />
        <rect x="225" y="15" width="55" height="40" rx="4" fill="#1A2640" />
        <rect x="290" y="12" width="80" height="28" rx="4" fill="#1A2640" />
        <rect x="20"  y="60" width="40" height="45" rx="4" fill="#1A2640" />
        <rect x="70"  y="65" width="55" height="35" rx="4" fill="#1A2640" />
        <rect x="135" y="55" width="65" height="45" rx="4" fill="#1A2640" />
        <rect x="210" y="62" width="50" height="38" rx="4" fill="#1A2640" />
        <rect x="270" y="55" width="100" height="50" rx="4" fill="#1A2640" />
        <rect x="20"  y="115" width="80" height="65" rx="4" fill="#1A2640" />
        <rect x="110" y="110" width="50" height="70" rx="4" fill="#1A2640" />
        <rect x="170" y="118" width="60" height="60" rx="4" fill="#1A2640" />
        <rect x="240" y="115" width="70" height="65" rx="4" fill="#1A2640" />
        <rect x="320" y="112" width="60" height="70" rx="4" fill="#1A2640" />

        {/* Roads */}
        <rect x="0"   y="51" width="390" height="8" fill="#0F172A" opacity="0.9" />
        <rect x="0"   y="103" width="390" height="8" fill="#0F172A" opacity="0.9" />
        <rect x="63"  y="0"   width="8" height="200" fill="#0F172A" opacity="0.9" />
        <rect x="127" y="0"   width="8" height="200" fill="#0F172A" opacity="0.9" />
        <rect x="200" y="0"   width="8" height="200" fill="#0F172A" opacity="0.9" />
        <rect x="265" y="0"   width="8" height="200" fill="#0F172A" opacity="0.9" />
        <rect x="330" y="0"   width="8" height="200" fill="#0F172A" opacity="0.9" />

        {/* Park area */}
        <ellipse cx="170" cy="160" rx="30" ry="22" fill="#0D2818" />
        <ellipse cx="85"  cy="145" rx="20" ry="15" fill="#0D2818" />

        {/* Water */}
        <path d="M 340 150 Q 360 140 390 155 L 390 200 L 310 200 Z" fill="#0C1E2E" />

        {/* Road lane markers */}
        <line x1="0" y1="55" x2="390" y2="55" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="8,6" />
        <line x1="0" y1="107" x2="390" y2="107" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="8,6" />

        {/* Store Pins */}
        {stores.map((store) => {
          const pos = MAP_POSITIONS[store.id] || { x: 50, y: 50 }
          const x = (pos.x / 100) * 390
          const y = (pos.y / 100) * 200
          const isSelected = store.id === selectedStoreId
          const isHov = store.id === hovered
          const pinColor = isSelected ? '#4F46E5' : store.isOpen ? '#22C55E' : '#475569'

          return (
            <g
              key={store.id}
              onClick={() => onSelectStore?.(store.id)}
              onMouseEnter={() => setHovered(store.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`Select ${store.name}`}
            >
              {/* Glow ring for selected */}
              {isSelected && (
                <circle cx={x} cy={y - 14} r="20" fill="#4F46E5" opacity="0.18" />
              )}
              {/* Pin shadow */}
              <circle cx={x} cy={y - 12} r={isSelected || isHov ? 13 : 11} fill="#000" opacity="0.3" />
              {/* Pin body */}
              <circle
                cx={x}
                cy={y - 14}
                r={isSelected || isHov ? 11 : 9}
                fill={pinColor}
                stroke={isSelected ? '#818CF8' : 'rgba(255,255,255,0.2)'}
                strokeWidth="1.5"
              />
              {/* Center dot */}
              <circle cx={x} cy={y - 14} r="3" fill="white" opacity="0.9" />
            </g>
          )
        })}

        {/* You are here — gold dot */}
        <circle cx="155" cy="120" r="12" fill="#F59E0B" opacity="0.15" />
        <circle cx="155" cy="120" r="6"  fill="#F59E0B" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <circle cx="155" cy="120" r="2.5" fill="white" opacity="0.9" />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] font-semibold text-[#94A3B8]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-sm" />
          Open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#475569] shadow-sm" />
          Closed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm" />
          You
        </span>
      </div>
    </div>
  )
}
