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

// Map pin positions are proportionally placed on a stylized tile map
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
        'relative w-full rounded-2xl overflow-hidden border border-border',
        className
      )}
      aria-label="Store locations map"
      role="img"
    >
      {/* Stylized map background */}
      <svg
        viewBox="0 0 390 200"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="390" height="200" fill="#E8F0FE" />

        {/* City blocks */}
        <rect x="20" y="15" width="60" height="35" rx="4" fill="#C7D9F9" />
        <rect x="90" y="20" width="45" height="25" rx="4" fill="#C7D9F9" />
        <rect x="145" y="10" width="70" height="30" rx="4" fill="#C7D9F9" />
        <rect x="225" y="15" width="55" height="40" rx="4" fill="#C7D9F9" />
        <rect x="290" y="12" width="80" height="28" rx="4" fill="#C7D9F9" />
        <rect x="20" y="60" width="40" height="45" rx="4" fill="#C7D9F9" />
        <rect x="70" y="65" width="55" height="35" rx="4" fill="#C7D9F9" />
        <rect x="135" y="55" width="65" height="45" rx="4" fill="#C7D9F9" />
        <rect x="210" y="62" width="50" height="38" rx="4" fill="#C7D9F9" />
        <rect x="270" y="55" width="100" height="50" rx="4" fill="#C7D9F9" />
        <rect x="20" y="115" width="80" height="65" rx="4" fill="#C7D9F9" />
        <rect x="110" y="110" width="50" height="70" rx="4" fill="#C7D9F9" />
        <rect x="170" y="118" width="60" height="60" rx="4" fill="#C7D9F9" />
        <rect x="240" y="115" width="70" height="65" rx="4" fill="#C7D9F9" />
        <rect x="320" y="112" width="60" height="70" rx="4" fill="#C7D9F9" />

        {/* Roads */}
        <rect x="0" y="51" width="390" height="9" fill="#FFFFFF" opacity="0.9" />
        <rect x="0" y="103" width="390" height="9" fill="#FFFFFF" opacity="0.9" />
        <rect x="63" y="0" width="9" height="200" fill="#FFFFFF" opacity="0.9" />
        <rect x="127" y="0" width="9" height="200" fill="#FFFFFF" opacity="0.9" />
        <rect x="200" y="0" width="9" height="200" fill="#FFFFFF" opacity="0.9" />
        <rect x="265" y="0" width="9" height="200" fill="#FFFFFF" opacity="0.9" />
        <rect x="330" y="0" width="9" height="200" fill="#FFFFFF" opacity="0.9" />

        {/* Park */}
        <ellipse cx="170" cy="160" rx="30" ry="22" fill="#BBF7D0" />
        <ellipse cx="85" cy="145" rx="20" ry="15" fill="#BBF7D0" />

        {/* Water */}
        <path d="M 340 150 Q 360 140 390 155 L 390 200 L 310 200 Z" fill="#BAE6FD" />

        {/* Store Pins */}
        {stores.map((store) => {
          const pos = MAP_POSITIONS[store.id] || { x: 50, y: 50 }
          const x = (pos.x / 100) * 390
          const y = (pos.y / 100) * 200
          const isSelected = store.id === selectedStoreId
          const isHov = store.id === hovered

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
              {/* Pulse ring for selected */}
              {isSelected && (
                <circle cx={x} cy={y - 14} r="18" fill="#2563EB" opacity="0.15" />
              )}
              {/* Pin body */}
              <circle
                cx={x}
                cy={y - 14}
                r={isSelected || isHov ? 11 : 9}
                fill={isSelected ? '#2563EB' : store.isOpen ? '#22C55E' : '#94A3B8'}
                stroke="white"
                strokeWidth="2"
              />
              {/* Dot center */}
              <circle
                cx={x}
                cy={y - 14}
                r="3"
                fill="white"
              />
            </g>
          )
        })}

        {/* You are here */}
        <circle cx="155" cy="120" r="6" fill="#F97316" stroke="white" strokeWidth="2" />
        <circle cx="155" cy="120" r="11" fill="#F97316" opacity="0.2" />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] font-medium text-slate-600">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white shadow-sm" />
          Open
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white shadow-sm" />
          Closed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white shadow-sm" />
          You
        </span>
      </div>
    </div>
  )
}
