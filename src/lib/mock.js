// Все данные синтетические. Котировки и комиссии — тестовые.

export const TODAY = new Date(2026, 10, 7)

// Каталог активов. price — ₸ за 1 единицу (грамм / монета / акция).
export const ASSETS = {
  gold: { id: 'gold', kind: 'gold', symbol: 'bzGOLD', name: 'Золото', price: 66840, spread: 0.005, vol: 0.02, seed: 7, color: '#d9aa45',
    about: '1 bzGOLD = 1 г золота пробы 999,9. Обеспечен физическим металлом 1:1.' },
  btc: { id: 'btc', kind: 'crypto', symbol: 'BTC', name: 'Bitcoin', price: 52_400_000, spread: 0.01, vol: 0.045, seed: 11, color: '#8e8e93',
    about: 'Первая криптовалюта. Высокая волатильность: цена может сильно меняться за день.' },
  eth: { id: 'eth', kind: 'crypto', symbol: 'ETH', name: 'Ethereum', price: 1_820_000, spread: 0.01, vol: 0.055, seed: 13, color: '#8e8e93',
    about: 'Криптовалюта сети Ethereum. Волатильность выше, чем у акций и золота.' },
  nvda: { id: 'nvda', kind: 'stock', symbol: 'NVDA', name: 'NVIDIA', price: 98_800, spread: 0.003, vol: 0.03, seed: 17, color: '#8e8e93',
    about: 'Токенизированная акция NVIDIA: цифровое право на акцию, хранящуюся у кастодиана 1:1.' },
  aapl: { id: 'aapl', kind: 'stock', symbol: 'AAPL', name: 'Apple', price: 135_200, spread: 0.003, vol: 0.018, seed: 19, color: '#8e8e93',
    about: 'Токенизированная акция Apple: цифровое право на акцию, хранящуюся у кастодиана 1:1.' },
  tsla: { id: 'tsla', kind: 'stock', symbol: 'TSLA', name: 'Tesla', price: 223_600, spread: 0.003, vol: 0.04, seed: 23, color: '#8e8e93',
    about: 'Токенизированная акция Tesla: цифровое право на акцию, хранящуюся у кастодиана 1:1.' },
}
export const CRYPTO = ['btc', 'eth']
export const STOCKS = ['nvda', 'aapl', 'tsla']

export const PRICES = { gold: ASSETS.gold.price, btc: ASSETS.btc.price, usdt: 518 }

export const FEES = {
  commission: 0.002,    // 0,2% комиссия сервиса
  minCommission: 100,   // минимум 100 ₸
  minBuy: 1000,         // минимальная покупка 1 000 ₸
  minSellKzt: 500,      // минимальная продажа на 500 ₸
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
  { id: 'coffee', name: 'Coffee Boom', cat: 'Кофейня', amount: 1500, mcc: '5814' },
  { id: 'magnum', name: 'Magnum', cat: 'Супермаркет', amount: 8420, mcc: '5411' },
  { id: 'taxi', name: 'Yandex Go', cat: 'Такси', amount: 1900, mcc: '4121' },
  { id: 'steam', name: 'Steam', cat: 'Онлайн-игры', amount: 4990, mcc: '5816', online: true, foreign: true },
  { id: 'spotify', name: 'Spotify', cat: 'Подписка', amount: 1990, mcc: '5815', online: true, sub: true, foreign: true },
  { id: 'kino', name: 'Kinopark', cat: 'Кино', amount: 3200, mcc: '7832' },
]

// Валюта отображения: только пересчёт для просмотра, счета остаются в тенге
export const RATES = { KZT: 1, USD: 518, EUR: 561 }
export const CURRENCIES = [
  { value: 'KZT', label: '₸' },
  { value: 'USD', label: '$' },
  { value: 'EUR', label: '€' },
]

export const CARD = {
  number: '4405 6390 1182 2026',
  holder: 'AIGERIM SATPAYEVA',
  expiry: '11/29',
  cvv: '381',
  iban: 'KZ86 8560 0000 1234 5678',
  bic: 'KCJBKZKX',
  bank: 'Bozzhyra (тестовый банк)',
}

export const DEVICES = [
  { id: 'd1', name: 'iPhone 15', place: 'Алматы', last: 'Сейчас', current: true },
  { id: 'd2', name: 'MacBook Air · Safari', place: 'Алматы', last: '2 дня назад' },
  { id: 'd3', name: 'Samsung Galaxy A54', place: 'Астана', last: '12 дней назад' },
]

export const PARTNERS = [
  { id: 'binance', name: 'Binance KZ', allowed: true, color: '#3a3a3c', balances: { USDT: 412.5, BTC: 0.0124 } },
  { id: 'bybit', name: 'Bybit KZ', allowed: true, color: '#1c1c1e', balances: { USDT: 860.0, BTC: 0.0031 } },
  { id: 'ataix', name: 'ATAIX Eurasia', allowed: true, color: '#636366', balances: { USDT: 150.0, BTC: 0 } },
  { id: 'cryptox', name: 'CryptoX Global', allowed: false, color: '#aeaeb2', balances: {} },
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

// История цены за 365 дней, строится назад от текущей цены.
// У каждого актива есть периоды роста и заметные просадки.
function makeHistory({ price, vol, seed }) {
  const rnd = mulberry32(seed)
  const out = []
  let p = price
  for (let i = 0; i < 365; i++) {
    const d = new Date(TODAY); d.setDate(d.getDate() - i)
    out.push({ t: d.getTime(), price: p })
    let drift = vol * 0.05
    if (i > 55 && i < 100) drift = -vol * 0.14
    if (i > 180 && i < 200) drift = -vol * 0.1
    p = p / (1 + drift + (rnd() - 0.5) * vol)
  }
  return out.reverse()
}

export const HISTORY = Object.fromEntries(Object.values(ASSETS).map((a) => [a.id, makeHistory(a)]))
export const GOLD_HISTORY = HISTORY.gold

export const dayChange = (id) => {
  const h = HISTORY[id]
  return h[h.length - 1].price / h[h.length - 2].price - 1
}
