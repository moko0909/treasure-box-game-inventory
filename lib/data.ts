export type Platform = 'PS5' | 'Nintendo Switch' | 'Xbox'
export type StockStatus = 'in-stock' | 'low-stock' | 'sold-out'

export interface Game {
  id: string
  title: string
  platform: Platform
  genre: string
  price: number
  coverColor: string
  coverAccent: string
  stockStatus: StockStatus
  stockCount: number
  rating: number
  releaseYear: number
  developer: string
  description: string
  imagePath?: string
}

export interface Store {
  id: string
  name: string
  address: string
  distance: number // km
  isOpen: boolean
  opensAt?: string
  closesAt: string
  rating: number
  reviewCount: number
  lat: number
  lng: number
  games: StoreInventory[]
  phone: string
  tag?: string
}

export interface StoreInventory {
  gameId: string
  stockStatus: StockStatus
  stockCount: number
  price: number
}

export interface Reservation {
  id: string
  gameId: string
  storeId: string
  createdAt: string
  expiresAt: string
  status: 'active' | 'picked-up' | 'expired' | 'cancelled'
  confirmationCode: string
  quantity: number
  notes?: string | null
  pickupAt?: string | null
}

export interface RestockAlert {
  id: string
  gameId: string
  storeId: string
  status: string
  createdAt: string
  notifiedAt?: string | null
}

// --- Mock Games ---
export const GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Spider-Man 2',
    platform: 'PS5',
    genre: 'Action Adventure',
    price: 69.99,
    coverColor: '#1E3A5F',
    coverAccent: '#E63946',
    stockStatus: 'in-stock',
    stockCount: 8,
    rating: 4.9,
    releaseYear: 2023,
    developer: 'Insomniac Games',
    description:
      'Swing through New York as Peter Parker and Miles Morales as they face new threats and new challenges.',
    imagePath: '/covers/spider-man-2.png',
  },
  {
    id: 'g2',
    title: 'The Legend of Zelda: Tears of the Kingdom',
    platform: 'Nintendo Switch',
    genre: 'Action RPG',
    price: 59.99,
    coverColor: '#1A5276',
    coverAccent: '#F4D03F',
    stockStatus: 'low-stock',
    stockCount: 2,
    rating: 4.8,
    releaseYear: 2023,
    developer: 'Nintendo',
    description:
      'Return to Hyrule and explore an expanded world both above and below the surface.',
    imagePath: '/covers/zelda-totk.png',
  },
  {
    id: 'g3',
    title: 'Halo Infinite',
    platform: 'Xbox',
    genre: 'First-Person Shooter',
    price: 49.99,
    coverColor: '#1A5276',
    coverAccent: '#2ECC71',
    stockStatus: 'in-stock',
    stockCount: 12,
    rating: 4.5,
    releaseYear: 2021,
    developer: '343 Industries',
    description:
      'The Master Chief is back in the most ambitious Halo game ever, set on a mysterious ring world.',
    imagePath: '/covers/halo-infinite.png',
  },
  {
    id: 'g4',
    title: "Baldur's Gate 3",
    platform: 'PS5',
    genre: 'RPG',
    price: 59.99,
    coverColor: '#4A235A',
    coverAccent: '#9B59B6',
    stockStatus: 'sold-out',
    stockCount: 0,
    rating: 4.9,
    releaseYear: 2023,
    developer: 'Larian Studios',
    description:
      "Gather your party and return to the Forgotten Realms in the legendary RPG sequel.",
    imagePath: '/covers/bg3.png',
  },
  {
    id: 'g5',
    title: 'Mario Kart 8 Deluxe',
    platform: 'Nintendo Switch',
    genre: 'Racing',
    price: 59.99,
    coverColor: '#1E8449',
    coverAccent: '#F39C12',
    stockStatus: 'in-stock',
    stockCount: 15,
    rating: 4.7,
    releaseYear: 2017,
    developer: 'Nintendo',
    description:
      'Race your friends or foes in the definitive version of Mario Kart with all DLC included.',
    imagePath: '/covers/mario-kart.png',
  },
  {
    id: 'g6',
    title: 'Forza Horizon 5',
    platform: 'Xbox',
    genre: 'Racing',
    price: 59.99,
    coverColor: '#1A5276',
    coverAccent: '#E74C3C',
    stockStatus: 'low-stock',
    stockCount: 3,
    rating: 4.8,
    releaseYear: 2021,
    developer: 'Playground Games',
    description:
      "Explore a breathtaking open world full of diverse biomes across Mexico.",
    imagePath: '/covers/forza-5.png',
  },
  {
    id: 'g7',
    title: 'Final Fantasy XVI',
    platform: 'PS5',
    genre: 'Action RPG',
    price: 59.99,
    coverColor: '#1C2833',
    coverAccent: '#3498DB',
    stockStatus: 'in-stock',
    stockCount: 6,
    rating: 4.6,
    releaseYear: 2023,
    developer: 'Square Enix',
    description:
      'Dive into an epic dark fantasy world and experience the most action-packed Final Fantasy yet.',
    imagePath: '/covers/ff16.png',
  },
  {
    id: 'g8',
    title: 'Splatoon 3',
    platform: 'Nintendo Switch',
    genre: 'Shooter',
    price: 59.99,
    coverColor: '#784212',
    coverAccent: '#F39C12',
    stockStatus: 'in-stock',
    stockCount: 9,
    rating: 4.5,
    releaseYear: 2022,
    developer: 'Nintendo',
    description:
      'Ink-based third-person shooter with vibrant multiplayer battles and a single-player story.',
    imagePath: '/covers/splatoon-3.png',
  },
]

// --- Mock Stores ---
export const STORES: Store[] = [
  {
    id: 's1',
    name: '게임존 홍대점',
    address: '서울특별시 마포구 양화로 160 홍대입구역 근처',
    distance: 0.3,
    isOpen: true,
    closesAt: '오후 9시',
    rating: 4.8,
    reviewCount: 342,
    lat: 37.5563,
    lng: 126.9228,
    phone: '02-1234-5678',
    tag: 'Best Seller',
    games: [
      { gameId: 'g1', stockStatus: 'in-stock', stockCount: 3, price: 69.99 },
      { gameId: 'g2', stockStatus: 'low-stock', stockCount: 1, price: 59.99 },
      { gameId: 'g3', stockStatus: 'in-stock', stockCount: 5, price: 49.99 },
      { gameId: 'g4', stockStatus: 'sold-out', stockCount: 0, price: 59.99 },
      { gameId: 'g5', stockStatus: 'in-stock', stockCount: 8, price: 59.99 },
    ],
  },
  {
    id: 's2',
    name: '픽셀팰리스 신촌점',
    address: '서울특별시 서대문구 신촌로 83 신촌역 근처',
    distance: 0.8,
    isOpen: true,
    closesAt: '오후 8시',
    rating: 4.6,
    reviewCount: 218,
    lat: 37.5554,
    lng: 126.9366,
    phone: '02-2345-6789',
    games: [
      { gameId: 'g1', stockStatus: 'in-stock', stockCount: 2, price: 69.99 },
      { gameId: 'g6', stockStatus: 'low-stock', stockCount: 2, price: 59.99 },
      { gameId: 'g7', stockStatus: 'in-stock', stockCount: 4, price: 59.99 },
      { gameId: 'g8', stockStatus: 'in-stock', stockCount: 6, price: 59.99 },
    ],
  },
  {
    id: 's3',
    name: '레트로앤뉴 강남점',
    address: '서울특별시 강남구 강남대로 396 강남역 근처',
    distance: 2.1,
    isOpen: false,
    opensAt: '오전 11시',
    closesAt: '오후 10시',
    rating: 4.9,
    reviewCount: 571,
    lat: 37.4981,
    lng: 127.0276,
    phone: '02-3456-7890',
    tag: 'Top Rated',
    games: [
      { gameId: 'g2', stockStatus: 'in-stock', stockCount: 4, price: 54.99 },
      { gameId: 'g3', stockStatus: 'in-stock', stockCount: 7, price: 44.99 },
      { gameId: 'g4', stockStatus: 'in-stock', stockCount: 2, price: 59.99 },
      { gameId: 'g5', stockStatus: 'in-stock', stockCount: 10, price: 59.99 },
      { gameId: 'g6', stockStatus: 'in-stock', stockCount: 3, price: 59.99 },
      { gameId: 'g7', stockStatus: 'low-stock', stockCount: 1, price: 54.99 },
      { gameId: 'g8', stockStatus: 'in-stock', stockCount: 5, price: 59.99 },
    ],
  },
  {
    id: 's4',
    name: '레벨업 건대점',
    address: '서울특별시 광진구 아차산로 272 건대입구역 근처',
    distance: 3.4,
    isOpen: true,
    closesAt: '오후 11시',
    rating: 4.4,
    reviewCount: 189,
    lat: 37.5403,
    lng: 127.0698,
    phone: '02-4567-8901',
    games: [
      { gameId: 'g1', stockStatus: 'sold-out', stockCount: 0, price: 69.99 },
      { gameId: 'g3', stockStatus: 'in-stock', stockCount: 3, price: 49.99 },
      { gameId: 'g5', stockStatus: 'in-stock', stockCount: 6, price: 59.99 },
      { gameId: 'g6', stockStatus: 'sold-out', stockCount: 0, price: 59.99 },
      { gameId: 'g8', stockStatus: 'low-stock', stockCount: 2, price: 59.99 },
    ],
  },
]

// --- Mock Reservations ---
export const RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    gameId: 'g1',
    storeId: 's1',
    createdAt: '2025-01-10T14:30:00Z',
    expiresAt: '2025-01-12T14:30:00Z',
    status: 'active',
    confirmationCode: 'TB-4821',
    quantity: 1,
  },
  {
    id: 'r2',
    gameId: 'g5',
    storeId: 's2',
    createdAt: '2025-01-05T10:00:00Z',
    expiresAt: '2025-01-07T10:00:00Z',
    status: 'picked-up',
    confirmationCode: 'TB-3317',
    quantity: 1,
  },
  {
    id: 'r3',
    gameId: 'g3',
    storeId: 's3',
    createdAt: '2024-12-28T09:15:00Z',
    expiresAt: '2024-12-30T09:15:00Z',
    status: 'expired',
    confirmationCode: 'TB-2209',
    quantity: 1,
  },
]

// --- Helpers ---
export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id)
}

export function getStoreById(id: string): Store | undefined {
  return STORES.find((s) => s.id === id)
}

export function getStockLabel(status: StockStatus): string {
  switch (status) {
    case 'in-stock':
      return '재고 있음'
    case 'low-stock':
      return '재고 부족'
    case 'sold-out':
      return '품절'
  }
}

// 예약 상태 한국어 라벨
export function getReservationStatusLabel(
  status: Reservation['status'],
): string {
  switch (status) {
    case 'active':
      return '픽업 대기'
    case 'picked-up':
      return '수령 완료'
    case 'expired':
      return '기한 만료'
    case 'cancelled':
      return '예약 취소'
  }
}

export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'PS5':
      return 'bg-blue-600 text-white'
    case 'Nintendo Switch':
      return 'bg-red-500 text-white'
    case 'Xbox':
      return 'bg-green-600 text-white'
  }
}

export function getPlatformShort(platform: Platform): string {
  switch (platform) {
    case 'PS5':
      return 'PS5'
    case 'Nintendo Switch':
      return 'Switch'
    case 'Xbox':
      return 'Xbox'
  }
}

export const FAVORITE_STORE_IDS = ['s1', 's3']

// --- 게임 검색/필터 헬퍼 ---

// 전체 장르 목록 (중복 제거)
export function getAllGenres(): string[] {
  return Array.from(new Set(GAMES.map((g) => g.genre))).sort()
}

export interface GameStockSummary {
  /** 재고(재고 있음/부족)가 있는 매장 수 */
  availableStoreCount: number
  /** 해당 게임을 취급하는 전체 매장 수 */
  totalStoreCount: number
  /** 재고 있는 매장 중 가장 가까운 매장 (없으면 가장 가까운 취급 매장) */
  nearestStore?: Store
  /** 재고 있는 매장 중 최저가 (없으면 게임 기본가) */
  lowestPrice: number
}

// 특정 게임의 매장별 재고 현황을 요약한다. 재고 있는 매장을 우선한다.
export function getGameStockSummary(gameId: string): GameStockSummary {
  const entries = STORES.map((store) => {
    const inv = store.games.find((sg) => sg.gameId === gameId)
    return inv ? { store, inv } : null
  }).filter(Boolean) as { store: Store; inv: StoreInventory }[]

  const available = entries.filter((e) => e.inv.stockStatus !== 'sold-out')
  const sortedByDistance = [...entries].sort((a, b) => a.store.distance - b.store.distance)
  const availableByDistance = [...available].sort((a, b) => a.store.distance - b.store.distance)

  const game = getGameById(gameId)
  const lowestPrice = available.length
    ? Math.min(...available.map((e) => e.inv.price))
    : game?.price ?? 0

  return {
    availableStoreCount: available.length,
    totalStoreCount: entries.length,
    nearestStore: (availableByDistance[0] ?? sortedByDistance[0])?.store,
    lowestPrice,
  }
}
