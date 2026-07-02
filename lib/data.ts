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
    name: 'Game Zone Shibuya',
    address: '2-24-1 Shibuya, Shibuya-ku, Tokyo',
    distance: 0.3,
    isOpen: true,
    closesAt: '9:00 PM',
    rating: 4.8,
    reviewCount: 342,
    lat: 35.6598,
    lng: 139.7004,
    phone: '03-1234-5678',
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
    name: 'Pixel Palace Harajuku',
    address: '1-14-30 Jingumae, Shibuya-ku, Tokyo',
    distance: 0.8,
    isOpen: true,
    closesAt: '8:00 PM',
    rating: 4.6,
    reviewCount: 218,
    lat: 35.6715,
    lng: 139.7030,
    phone: '03-2345-6789',
    games: [
      { gameId: 'g1', stockStatus: 'in-stock', stockCount: 2, price: 69.99 },
      { gameId: 'g6', stockStatus: 'low-stock', stockCount: 2, price: 59.99 },
      { gameId: 'g7', stockStatus: 'in-stock', stockCount: 4, price: 59.99 },
      { gameId: 'g8', stockStatus: 'in-stock', stockCount: 6, price: 59.99 },
    ],
  },
  {
    id: 's3',
    name: 'Retro & New Akihabara',
    address: '4-3-3 Sotokanda, Chiyoda-ku, Tokyo',
    distance: 2.1,
    isOpen: false,
    opensAt: '11:00 AM',
    closesAt: '10:00 PM',
    rating: 4.9,
    reviewCount: 571,
    lat: 35.7022,
    lng: 139.7742,
    phone: '03-3456-7890',
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
    name: 'Level Up Shinjuku',
    address: '3-38-1 Shinjuku, Shinjuku-ku, Tokyo',
    distance: 3.4,
    isOpen: true,
    closesAt: '11:00 PM',
    rating: 4.4,
    reviewCount: 189,
    lat: 35.6938,
    lng: 139.7034,
    phone: '03-4567-8901',
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
  },
  {
    id: 'r2',
    gameId: 'g5',
    storeId: 's2',
    createdAt: '2025-01-05T10:00:00Z',
    expiresAt: '2025-01-07T10:00:00Z',
    status: 'picked-up',
    confirmationCode: 'TB-3317',
  },
  {
    id: 'r3',
    gameId: 'g3',
    storeId: 's3',
    createdAt: '2024-12-28T09:15:00Z',
    expiresAt: '2024-12-30T09:15:00Z',
    status: 'expired',
    confirmationCode: 'TB-2209',
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
      return 'In Stock'
    case 'low-stock':
      return 'Low Stock'
    case 'sold-out':
      return 'Sold Out'
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
