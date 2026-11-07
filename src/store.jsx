import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { FEES, PARTNERS, PRICES } from './lib/mock.js'

const KEY = 'bozzihyra-demo-v1'

const initial = {
  onboarded: false,
  goal: null,
  user: { name: 'Айгерим', phone: '+7 701 555 12 34' },
  balances: { kzt: 0, gold: 0, btc: 0 },
  cashback: 'gold',
  partners: {}, // id -> { balances }
  txs: [],
  events: {}, // name -> count
  sessions: 0,
}

// ?demo=1 — открыть сразу с примером: прошёл онбординг, есть покупки и кешбэк
function demoState() {
  const now = Date.now(), h = 3600_000
  const t = (ago, d) => ({ id: Math.random().toString(36).slice(2), ts: now - ago * h, ...d })
  return {
    ...initial, onboarded: true, goal: 'save', sessions: 4,
    balances: { kzt: 61240, gold: 0.4786, btc: 0 },
    partners: { bybit: { balances: { USDT: 860, BTC: 0.0031 } } },
    txs: [
      t(2, { kind: 'cashback', title: 'Кешбэк · Coffee Boom', grams: 15 / PRICES.gold, cashbackKzt: 15 }),
      t(2, { kind: 'pay', title: 'Coffee Boom', sub: 'Кофейня', kzt: -1500 }),
      t(26, { kind: 'cashback', title: 'Кешбэк · Magnum', grams: 84.2 / PRICES.gold, cashbackKzt: 84.2 }),
      t(26, { kind: 'pay', title: 'Magnum', sub: 'Супермаркет', kzt: -8420 }),
      t(50, { kind: 'buy', title: 'Покупка золота', kzt: -30000, grams: 0.4462, price: 67174, fee: 100 }),
      t(51, { kind: 'topup', title: 'Пополнение (тест)', kzt: 100000 }),
    ],
    events: { app_open: 4, onboarding_done: 1, topup: 1, gold_buy: 1, card_payment: 2, partner_connected: 1, cashback_gold: 1 },
  }
}

function load() {
  try {
    if (new URLSearchParams(location.search).get('demo') === '1') {
      history.replaceState(null, '', location.pathname)
      return demoState()
    }
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return initial
}

const bump = (events, name) => ({ ...events, [name]: (events[name] || 0) + 1 })
const tx = (data) => ({ id: Math.random().toString(36).slice(2), ts: Date.now(), ...data })

function reducer(s, a) {
  switch (a.type) {
    case 'session':
      return { ...s, sessions: s.sessions + 1, events: bump(s.events, 'app_open') }
    case 'track':
      return { ...s, events: bump(s.events, a.name) }
    case 'onboard':
      return {
        ...s, onboarded: true, goal: a.goal, cashback: 'gold',
        events: bump(s.events, 'onboarding_done'),
      }
    case 'topup':
      return {
        ...s,
        balances: { ...s.balances, kzt: s.balances.kzt + a.amount },
        txs: [tx({ kind: 'topup', title: 'Пополнение (тест)', kzt: a.amount }), ...s.txs],
        events: bump(s.events, 'topup'),
      }
    case 'buyGold':
      return {
        ...s,
        balances: { ...s.balances, kzt: s.balances.kzt - a.kzt, gold: s.balances.gold + a.grams },
        txs: [tx({ kind: 'buy', title: 'Покупка золота', kzt: -a.kzt, grams: a.grams, price: a.price, fee: a.fee }), ...s.txs],
        events: bump(s.events, 'gold_buy'),
      }
    case 'sellGold':
      return {
        ...s,
        balances: { ...s.balances, kzt: s.balances.kzt + a.kzt, gold: s.balances.gold - a.grams },
        txs: [tx({ kind: 'sell', title: 'Продажа золота', kzt: a.kzt, grams: -a.grams, price: a.price, fee: a.fee }), ...s.txs],
        events: bump(s.events, 'gold_sell'),
      }
    case 'pay': {
      const cb = a.amount * FEES.cashbackRate
      const balances = { ...s.balances, kzt: s.balances.kzt - a.amount }
      let reward = {}
      if (s.cashback === 'gold') { const g = cb / a.goldPrice; balances.gold += g; reward = { grams: g } }
      else if (s.cashback === 'btc') { const b = cb / PRICES.btc; balances.btc += b; reward = { btc: b } }
      else { balances.kzt += cb; reward = { kztBack: cb } }
      return {
        ...s, balances,
        txs: [
          tx({ kind: 'cashback', title: `Кешбэк · ${a.merchant}`, ...reward, cashbackKzt: cb }),
          tx({ kind: 'pay', title: a.merchant, sub: a.cat, kzt: -a.amount }),
          ...s.txs,
        ],
        events: bump(s.events, 'card_payment'),
      }
    }
    case 'setCashback':
      return { ...s, cashback: a.value, events: bump(s.events, `cashback_${a.value}`) }
    case 'connectPartner': {
      const p = PARTNERS.find((x) => x.id === a.id)
      return {
        ...s,
        partners: { ...s.partners, [a.id]: { balances: { ...p.balances } } },
        events: bump(s.events, 'partner_connected'),
      }
    }
    case 'disconnectPartner': {
      const partners = { ...s.partners }; delete partners[a.id]
      return { ...s, partners }
    }
    case 'transferFromPartner': {
      const p = s.partners[a.id]
      const gross = a.usdt * PRICES.usdt
      const fee = gross * FEES.transferFee
      return {
        ...s,
        partners: { ...s.partners, [a.id]: { balances: { ...p.balances, USDT: p.balances.USDT - a.usdt } } },
        balances: { ...s.balances, kzt: s.balances.kzt + gross - fee },
        txs: [tx({ kind: 'transfer', title: `Перевод с ${a.name}`, sub: `${a.usdt} USDT`, kzt: gross - fee, fee }), ...s.txs],
        events: bump(s.events, 'partner_transfer'),
      }
    }
    case 'reset':
      return { ...initial, sessions: 1, events: { app_open: 1 } }
    default:
      return s
  }
}

const Ctx = createContext(null)
let sessionCounted = false

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [goldPrice, setGoldPrice] = useState(PRICES.gold)

  useEffect(() => {
    if (sessionCounted) return
    sessionCounted = true
    dispatch({ type: 'session' })
  }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // «Живая» тестовая котировка: колеблется ±0,15% вокруг базовой цены
  useEffect(() => {
    const id = setInterval(() => {
      setGoldPrice((p) => {
        const next = p * (1 + (Math.random() - 0.5) * 0.0012)
        const clamped = Math.min(PRICES.gold * 1.0015, Math.max(PRICES.gold * 0.9985, next))
        return Math.round(clamped)
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const partnerKzt = Object.values(state.partners).reduce(
    (sum, p) => sum + (p.balances.USDT || 0) * PRICES.usdt + (p.balances.BTC || 0) * PRICES.btc, 0)

  const totals = {
    kzt: state.balances.kzt,
    gold: state.balances.gold * goldPrice,
    btc: state.balances.btc * PRICES.btc,
    partners: partnerKzt,
  }
  totals.own = totals.kzt + totals.gold + totals.btc
  totals.all = totals.own + totals.partners

  return <Ctx.Provider value={{ state, dispatch, goldPrice, totals }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
