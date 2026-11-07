// Все данные синтетические. Котировки и комиссии — тестовые.

export const TODAY = new Date(2026, 10, 7)

export const PRICES = {
  gold: 66840,       // ₸ за 1 грамм (1 bzGOLD = 1 г золота 999,9)
  btc: 52_400_000,   // ₸ за 1 BTC
  usdt: 518,         // ₸ за 1 USDT
}

export const FEES = {
  spread: 0.005,        // 0,5% спред OTC к биржевой цене
  commission: 0.002,    // 0,2% комиссия сервиса
  minCommission: 100,   // минимум 100 ₸
  minBuy: 1000,         // минимальная покупка 1 000 ₸
  minSellGrams: 0.01,   // минимальная продажа 10 мг
  quoteTtl: 30,         // котировка действует 30 секунд
  cashbackRate: 0.01,   // 1% кешбэк
  transferFee: 0.003,   // 0,3% за перевод с биржи на карту
}

export const CUSTODY = {
  custodian: 'Тестовый кастодиан (AIFC), хранилище в Алматы',
  backing: '1 bzGOLD = 1 г золота пробы 999,9, обеспечение 1:1',
  lastAudit: '01.10.2026',
  auditor: 'Независимый аудитор (тест)',
  totalIssued: '1 284,6 кг',
}

export const MERCHANTS = [
  { id: 'coffee', name: 'Coffee Boom', cat: 'Кофейня', amount: 1500 },
  { id: 'magnum', name: 'Magnum', cat: 'Супермаркет', amount: 8420 },
  { id: 'taxi', name: 'Yandex Go', cat: 'Такси', amount: 1900 },
  { id: 'steam', name: 'Steam', cat: 'Онлайн', amount: 4990 },
  { id: 'kino', name: 'Kinopark', cat: 'Кино', amount: 3200 },
]

export const PARTNERS = [
  { id: 'binance', name: 'Binance KZ', allowed: true, color: '#d8a31a', balances: { USDT: 412.5, BTC: 0.0124 } },
  { id: 'bybit', name: 'Bybit KZ', allowed: true, color: '#22262c', balances: { USDT: 860.0, BTC: 0.0031 } },
  { id: 'ataix', name: 'ATAIX Eurasia', allowed: true, color: '#2f5d8a', balances: { USDT: 150.0, BTC: 0 } },
  { id: 'cryptox', name: 'CryptoX Global', allowed: false, color: '#8a8f87', balances: {} },
]

export const GOALS = [
  { id: 'save', segment: 'Digital Natives', title: 'Копить с покупок', text: 'Плачу картой, а кешбэк сам копится в золоте' },
  { id: 'diversify', segment: 'Mass Affluent', title: 'Диверсифицировать сбережения', text: 'Хочу часть денег держать не только в тенге' },
  { id: 'crypto', segment: 'Crypto Curious', title: 'Тратить и хранить крипту', text: 'Есть крипта на бирже, хочу платить ей безопасно' },
]

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// История цены за 365 дней: общий рост, но с заметной просадкой ~2–3 месяца назад
// и обычными колебаниями. Строится назад от текущей цены.
export const GOLD_HISTORY = (() => {
  const rnd = mulberry32(7)
  const out = []
  let p = PRICES.gold
  for (let i = 0; i < 365; i++) {
    const d = new Date(TODAY); d.setDate(d.getDate() - i)
    out.push({ t: d.getTime(), price: Math.round(p) })
    let drift = 0.0011
    if (i > 55 && i < 100) drift = -0.0028
    if (i > 180 && i < 200) drift = -0.002
    const r = drift + (rnd() - 0.5) * 0.02
    p = p / (1 + r)
  }
  return out.reverse()
})()
