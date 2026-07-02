import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  serial,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Global catalog data (stores / games / inventory) is shared across all users,
// so these tables have no userId. User-owned data (reservations, favorites)
// carries a plain userId column for per-user scoping — no FK by design.

export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  distance: real('distance').notNull(),
  isOpen: boolean('isOpen').notNull().default(true),
  opensAt: text('opensAt'),
  closesAt: text('closesAt').notNull(),
  rating: real('rating').notNull().default(0),
  reviewCount: integer('reviewCount').notNull().default(0),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  phone: text('phone').notNull(),
  tag: text('tag'),
})

export const games = pgTable('games', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  platform: text('platform').notNull(),
  genre: text('genre').notNull(),
  price: real('price').notNull(),
  coverColor: text('coverColor').notNull(),
  coverAccent: text('coverAccent').notNull(),
  rating: real('rating').notNull().default(0),
  releaseYear: integer('releaseYear').notNull(),
  developer: text('developer').notNull(),
  description: text('description').notNull(),
  imagePath: text('imagePath'),
})

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  storeId: text('storeId').notNull(),
  gameId: text('gameId').notNull(),
  stockStatus: text('stockStatus').notNull(),
  stockCount: integer('stockCount').notNull().default(0),
  price: real('price').notNull(),
})

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  gameId: text('gameId').notNull(),
  storeId: text('storeId').notNull(),
  status: text('status').notNull().default('active'),
  confirmationCode: text('confirmationCode').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  expiresAt: timestamp('expiresAt').notNull(),
})

export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  storeId: text('storeId').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
