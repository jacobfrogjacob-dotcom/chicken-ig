export const RARITY = {
  N: { name: '普通', color: '#6b7280', probability: 60 },
  R: { name: '稀有', color: '#3b82f6', probability: 25 },
  SSR: { name: '傳說', color: '#a855f7', probability: 12 },
  LOG: { name: '隱藏', color: '#f59e0b', probability: 3 },
}

export const MIN_PRICE = 100

export const FREE_DRAW_COUNT = 1

export const ADMIN_EMAIL = 'jacob.frog.jacob@gmail.com'

export const CARDS_DATA = [
  { id: '1', name: '小雞', imageUrl: '/cards/1.png', rarity: 'N' as const },
  { id: '2', name: '基礎', imageUrl: '/cards/2.png', rarity: 'N' as const },
  { id: '3', name: '進階', imageUrl: '/cards/3.png', rarity: 'R' as const },
  { id: '4', name: '稀有', imageUrl: '/cards/4.png', rarity: 'R' as const },
  { id: '5', name: '傳說', imageUrl: '/cards/5.png', rarity: 'SSR' as const },
  { id: '6', name: '英雄', imageUrl: '/cards/6.png', rarity: 'SSR' as const },
  { id: '7', name: '隱藏', imageUrl: '/cards/7.png', rarity: 'LOG' as const },
  { id: '8', name: '神秘', imageUrl: '/cards/8.png', rarity: 'LOG' as const },
]