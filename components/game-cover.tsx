'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Game } from '@/lib/data'
import { getPlatformShort } from '@/lib/data'

interface GameCoverProps {
  game: Game
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { wrapper: 'w-14 h-20', text: 'text-[8px]' },
  md: { wrapper: 'w-20 h-28', text: 'text-[9px]' },
  lg: { wrapper: 'w-28 h-40', text: 'text-xs' },
  xl: { wrapper: 'w-full aspect-[3/4]', text: 'text-sm' },
}

export function GameCover({ game, size = 'md', className }: GameCoverProps) {
  const { wrapper, text } = sizeMap[size]

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden flex-shrink-0 shadow-md',
        wrapper,
        className
      )}
      style={{ background: game.coverColor }}
    >
      {game.imagePath ? (
        <Image
          src={game.imagePath}
          alt={`${game.title} cover`}
          fill
          className="object-cover"
          sizes="(max-width: 390px) 30vw, 200px"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
          <span
            className={cn('font-bold text-white leading-tight text-balance', text)}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {game.title}
          </span>
          <span
            className={cn('mt-1 px-1.5 py-0.5 rounded text-white/90 font-medium', text)}
            style={{ background: game.coverAccent }}
          >
            {getPlatformShort(game.platform)}
          </span>
        </div>
      )}
    </div>
  )
}
