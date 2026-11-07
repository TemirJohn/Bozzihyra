export const kzt = (n, digits = 0) =>
  `${Number(n).toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ₸`

export const grams = (g) => {
  const mg = g * 1000
  if (Math.abs(mg) < 10) return `${mg.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} мг`
  if (Math.abs(g) < 1) return `${Math.round(mg).toLocaleString('ru-RU')} мг`
  return `${g.toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} г`
}

export const gramsExact = (g) =>
  `${g.toLocaleString('ru-RU', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} г`

export const btc = (n) => `${n.toLocaleString('ru-RU', { maximumFractionDigits: 6 })} BTC`
export const usdt = (n) => `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`

export const pct = (n, digits = 2) =>
  `${n > 0 ? '+' : ''}${(n * 100).toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`

export const time = (ts) =>
  new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const dateShort = (ts) =>
  new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

// Количество актива в его единицах: граммы для золота, монеты для крипты, штуки для акций
export const qty = (asset, q) => {
  if (asset.kind === 'gold') return grams(q)
  if (asset.kind === 'crypto') return `${q.toLocaleString('ru-RU', { maximumFractionDigits: 6 })} ${asset.symbol}`
  return `${q.toLocaleString('ru-RU', { maximumFractionDigits: 4 })} шт`
}

export const qtyExact = (asset, q) => {
  if (asset.kind === 'gold') return gramsExact(q)
  if (asset.kind === 'crypto') return `${q.toLocaleString('ru-RU', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} ${asset.symbol}`
  return `${q.toLocaleString('ru-RU', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} шт ${asset.symbol}`
}
