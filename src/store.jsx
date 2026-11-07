import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { ASSETS, FEES, PARTNERS, PRICES, CRYPTO, STOCKS, RATES, DEVICES, dayChange } from './lib/mock.js'
import { kzt, qty, qtyExact, pct } from './lib/format.js'
import { q } from './lib/shot.js'

const KEY = 'bozzhyra-demo-v2'

export const DEFAULT_SETTINGS = {
  // Банк
  frozen: false,          // карта заморожена
  freezeReason: null,     // lost | suspicious | temp
  cardLast4: '2026',
  online: true,           // оплата в интернете
  subs: true,             // подписки и автосписания
  foreign: true,          // покупки на зарубежных сайтах
  dailyLimit: 300000,     // лимит покупок в день, ₸
  onlineLimit: 150000,    // лимит онлайн-покупок в день, ₸
  cashLimit: 200000,      // лимит снятия наличных в день, ₸
  confirmOps: true,       // подтверждать крупные операции Face ID
  pin: '1234',            // тестовый код входа
  hideBalances: false,    // скрывать суммы на главной
  currency: 'KZT',        // валюта отображения портфеля
  push: true,             // всплывающие уведомления
  biometrics: true,       // вход по Face ID
  theme: 'system',        // system | light | dark
  // Биржа и активы
  autoConvert: true,      // докупать ₸ из USDT на бирже, если не хватает на карте
  priceAlerts: true,      // уведомления об изменении цены
  confirmQuote: true,     // подтверждать котировку вручную
  risk: 'moderate',       // conservative | moderate | active
}

const initial = {
  onboarded: false,
  guest: false,
  goal: null,
  user: { name: 'Айгерим', phone: '+7 701 555 12 34' },
  balances: { kzt: 0, gold: 0, btc: 0, eth: 0, nvda: 0, aapl: 0, tsla: 0 },
  cashback: 'gold',
  partners: {},
  txs: [],
  notifications: [],
  devices: DEVICES,
  settings: DEFAULT_SETTINGS,
  events: {},
  sessions: 0,
}

const uid = () => Math.random().toString(36).slice(2)
const bump = (events, name) => ({ ...events, [name]: (events[name] || 0) + 1 })
const tx = (data) => ({ id: uid(), ts: Date.now(), ...data })
const note = (kind, title, text) => ({ id: uid(), ts: Date.now(), kind, title, text, read: false })
const catOf = (assetId) => assetId === 'gold' ? 'gold' : CRYPTO.includes(assetId) ? 'crypto' : 'stock'

function withNote(s, n) {
  return { ...s, notifications: [n, ...s.notifications].slice(0, 50) }
}

function demoState() {
  const now = Date.now(), h = 3600_000
  const t = (ago, d) => ({ id: uid(), ts: now - ago * h, ...d })
  const n = (ago, kind, title, text, read = true) => ({ id: uid(), ts: now - ago * h, kind, title, text, read })
  return {
    ...initial, onboarded: true, goal: 'save', sessions: 4,
    balances: { kzt: 61240, gold: 0.4786, btc: 0.0021, eth: 0.05, nvda: 0.35, aapl: 0.12, tsla: 0 },
    partners: { bybit: { balances: { USDT: 860, BTC: 0.0031 } } },
    txs: [
      t(2, { kind: 'cashback', cat: 'gold', title: 'Кешбэк · Coffee Boom', grams: 15 / PRICES.gold, cashbackKzt: 15 }),
      t(2, { kind: 'pay', cat: 'card', title: 'Coffee Boom', sub: 'Кофейня', kzt: -1500, mcc: '5814', last4: '2026' }),
      t(26, { kind: 'cashback', cat: 'gold', title: 'Кешбэк · Magnum', grams: 84.2 / PRICES.gold, cashbackKzt: 84.2 }),
      t(26, { kind: 'pay', cat: 'card', title: 'Magnum', sub: 'Супермаркет', kzt: -8420, mcc: '5411', last4: '2026' }),
      t(20, { kind: 'sell', cat: 'stock', asset: 'nvda', title: 'Продажа NVIDIA', kzt: 14650, qty: -0.15, price: 98500, fee: 100 }),
      t(30, { kind: 'buy', cat: 'stock', asset: 'nvda', title: 'Покупка NVIDIA', kzt: -46100, qty: 0.5, price: 92000, fee: 100 }),
      t(31, { kind: 'buy', cat: 'stock', asset: 'aapl', title: 'Покупка Apple', kzt: -16300, qty: 0.12, fee: 100 }),
      t(40, { kind: 'buy', cat: 'crypto', asset: 'eth', title: 'Покупка Ethereum', kzt: -92000, qty: 0.05, fee: 184 }),
      t(41, { kind: 'buy', cat: 'crypto', asset: 'btc', title: 'Покупка Bitcoin', kzt: -111300, qty: 0.0021, fee: 223 }),
      t(50, { kind: 'buy', cat: 'gold', asset: 'gold', title: 'Покупка золота', kzt: -30000, qty: 0.4462, fee: 100 }),
      t(51, { kind: 'topup', cat: 'card', title: 'Пополнение (тест)', kzt: 345000 }),
    ],
    notifications: [
      n(2, 'cashback', 'Оплата 1 500 ₸ · Coffee Boom', 'Кешбэк +0,22 мг золота', false),
      n(20, 'price', 'Золото за день: +0,41%', 'Цена 1 г — 66 840 ₸. Это информация, а не рекомендация.', false),
      n(26, 'cashback', 'Оплата 8 420 ₸ · Magnum', 'Кешбэк +1,26 мг золота'),
      n(48, 'partner', 'Bybit KZ подключена', 'Балансы видны на главной во вкладке «Крипта».'),
    ],
    events: { app_open: 4, onboarding_done: 1, topup: 1, gold_buy: 1, asset_buy: 4, asset_sell: 1, card_payment: 2, partner_connected: 1, cashback_gold: 1 },
  }
}

function load() {
  try {
    const params = new URLSearchParams(location.search)
    if (q('fresh') === '1') return initial
    if (q('guest') === '1') return { ...initial, guest: true }
    if (params.get('demo') === '1') {
      params.delete('demo')
      history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : ''))
      return demoState()
    }
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      return { ...initial, ...s, cashback: s.cashback === 'kzt' ? 'gold' : s.cashback, settings: { ...DEFAULT_SETTINGS, ...s.settings }, balances: { ...initial.balances, ...s.balances } }
    }
  } catch { /* ignore */ }
  return initial
}

function reducer(s, a) {
  switch (a.type) {
    case 'session': {
      let next = { ...s, sessions: s.sessions + 1, events: bump(s.events, 'app_open') }
      if (s.onboarded && s.settings.priceAlerts) {
        const ch = dayChange('gold')
        next = withNote(next, note('price', `Золото за день: ${pct(ch)}`,
          `Цена 1 г — ${kzt(ASSETS.gold.price)}. Это информация, а не рекомендация.`))
      }
      return next
    }
    case 'track':
      return { ...s, events: bump(s.events, a.name) }
    case 'guest':
      return { ...s, guest: a.value, events: a.value ? bump(s.events, 'guest_open') : s.events }
    case 'onboard':
      return withNote({
        ...s, onboarded: true, guest: false, goal: a.goal, cashback: 'gold',
        events: bump(s.events, 'onboarding_done'),
      }, note('info', 'Добро пожаловать в Bozzhyra', 'Карта открыта. Кешбэк 1% будет приходить в золоте.'))
    case 'topup':
      return withNote({
        ...s,
        balances: { ...s.balances, kzt: s.balances.kzt + a.amount },
        txs: [tx({ kind: 'topup', cat: 'card', title: 'Пополнение (тест)', kzt: a.amount }), ...s.txs],
        events: bump(s.events, 'topup'),
      }, note('topup', `Баланс пополнен на ${kzt(a.amount)}`, 'С карты •••• 4417'))
    case 'buy':
    case 'sell': {
      const asset = ASSETS[a.asset]
      const buy = a.type === 'buy'
      const balances = {
        ...s.balances,
        kzt: s.balances.kzt + (buy ? -a.kzt : a.kzt),
        [a.asset]: s.balances[a.asset] + (buy ? a.qty : -a.qty),
      }
      const title = `${buy ? 'Покупка' : 'Продажа'} ${asset.kind === 'gold' ? 'золота' : asset.name}`
      return withNote({
        ...s, balances,
        txs: [tx({ kind: a.type, cat: catOf(a.asset), asset: a.asset, title, kzt: buy ? -a.kzt : a.kzt, qty: buy ? a.qty : -a.qty, price: a.price, fee: a.fee }), ...s.txs],
        events: bump(bump(s.events, a.asset === 'gold' ? `gold_${a.type}` : `asset_${a.type}`), a.type === 'buy' ? 'any_buy' : 'any_sell'),
      }, note('trade', `${buy ? 'Куплено' : 'Продано'}: ${qtyExact(asset, a.qty)}`,
        `${buy ? 'Списано' : 'Зачислено'} ${kzt(a.kzt)}, комиссия ${kzt(a.fee)}`))
    }
    case 'pay': {
      let next = s
      // Автоконвертация: если на карте не хватает, докупаем ₸ из USDT на бирже
      if (a.convert) {
        const p = next.partners[a.convert.id]
        next = {
          ...next,
          partners: { ...next.partners, [a.convert.id]: { balances: { ...p.balances, USDT: p.balances.USDT - a.convert.usdt } } },
          balances: { ...next.balances, kzt: next.balances.kzt + a.convert.kzt },
          txs: [tx({ kind: 'transfer', cat: 'crypto', title: `Автоконвертация · ${a.convert.name}`, sub: `${a.convert.usdt.toFixed(2)} USDT`, kzt: a.convert.kzt }), ...next.txs],
        }
      }
      const cb = a.amount * FEES.cashbackRate
      const balances = { ...next.balances, kzt: next.balances.kzt - a.amount }
      let reward = {}, rewardText = '', cbCat = 'card'
      if (s.cashback === 'gold') { const g = cb / a.prices.gold; balances.gold += g; reward = { grams: g }; rewardText = `${qty(ASSETS.gold, g)} золота`; cbCat = 'gold' }
      else if (s.cashback === 'btc') { const b = cb / a.prices.btc; balances.btc += b; reward = { btc: b }; rewardText = qty(ASSETS.btc, b); cbCat = 'crypto' }
      else { balances.kzt += cb; reward = { kztBack: cb }; rewardText = kzt(cb, 2) }
      return withNote({
        ...next, balances,
        txs: [
          tx({ kind: 'cashback', cat: cbCat, title: `Кешбэк · ${a.merchant}`, ...reward, cashbackKzt: cb }),
          tx({ kind: 'pay', cat: 'card', title: a.merchant, sub: a.cat, kzt: -a.amount, mcc: a.mcc, last4: s.settings.cardLast4 }),
          ...next.txs,
        ],
        events: bump(s.events, 'card_payment'),
      }, note('cashback', `Оплата ${kzt(a.amount)} · ${a.merchant}`, `Кешбэк +${rewardText}${a.convert ? `. Докупили ${kzt(a.convert.kzt)} из USDT` : ''}`))
    }
    case 'payDeclined':
      return withNote({ ...s, events: bump(s.events, `error_${a.code}`) },
        note('error', `Оплата отклонена · ${a.merchant}`, a.reason))
    case 'setCashback':
      return { ...s, cashback: a.value, events: bump(s.events, `cashback_${a.value}`) }
    case 'connectPartner': {
      const p = PARTNERS.find((x) => x.id === a.id)
      return withNote({
        ...s,
        partners: { ...s.partners, [a.id]: { balances: { ...p.balances } } },
        events: bump(s.events, 'partner_connected'),
      }, note('partner', `${p.name} подключена`, 'Балансы видны на главной во вкладке «Крипта».'))
    }
    case 'partnerDenied':
      return withNote({ ...s, events: bump(s.events, 'error_partner_not_allowed') },
        note('error', `${a.name}: подключение недоступно`, 'Площадки нет в реестре МФЦА.'))
    case 'disconnectPartner': {
      const partners = { ...s.partners }; delete partners[a.id]
      return { ...s, partners }
    }
    case 'transferFromPartner': {
      const p = s.partners[a.id]
      const gross = a.usdt * PRICES.usdt
      const fee = gross * FEES.transferFee
      return withNote({
        ...s,
        partners: { ...s.partners, [a.id]: { balances: { ...p.balances, USDT: p.balances.USDT - a.usdt } } },
        balances: { ...s.balances, kzt: s.balances.kzt + gross - fee },
        txs: [tx({ kind: 'transfer', cat: 'crypto', title: `Перевод с ${a.name}`, sub: `${a.usdt} USDT`, kzt: gross - fee, fee }), ...s.txs],
        events: bump(s.events, 'partner_transfer'),
      }, note('partner', `Зачислено ${kzt(gross - fee)}`, `Перевод ${a.usdt} USDT с ${a.name}`))
    }
    case 'setting':
      return { ...s, settings: { ...s.settings, [a.key]: a.value } }
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } }
    case 'notify':
      return withNote(s, note(a.kind || 'info', a.title, a.text))
    case 'deleteNote':
      return { ...s, notifications: s.notifications.filter((n) => n.id !== a.id) }
    case 'clearNotes':
      return { ...s, notifications: [] }
    case 'endSession': {
      const d = s.devices.find((x) => x.id === a.id)
      return withNote({ ...s, devices: s.devices.filter((x) => x.id !== a.id) },
        note('info', 'Сеанс завершён', `${d.name} больше не имеет доступа к аккаунту.`))
    }
    case 'reissueCard': {
      const last4 = String(1000 + Math.floor(Math.random() * 9000))
      return withNote({ ...s, settings: { ...s.settings, frozen: false, freezeReason: null, cardLast4: last4 } },
        note('info', 'Карта перевыпущена', `Старая карта заблокирована навсегда. Новая виртуальная карта •••• ${last4} уже работает.`))
    }
    case 'readAll':
      return { ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }
    case 'reset':
      return { ...initial, sessions: 1, events: { app_open: 1 } }
    default:
      return s
  }
}

const Ctx = createContext(null)
let sessionCounted = false

const basePrices = Object.fromEntries(Object.values(ASSETS).map((a) => [a.id, a.price]))

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [prices, setPrices] = useState(basePrices)

  useEffect(() => {
    if (sessionCounted) return
    sessionCounted = true
    dispatch({ type: 'session' })
  }, [])
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // Тема: system — без атрибута, иначе data-theme на <html> (его понимают и наши стили, и glisse)
  useEffect(() => {
    const el = document.documentElement
    if (state.settings.theme === 'system') el.removeAttribute('data-theme')
    else el.setAttribute('data-theme', state.settings.theme)
  }, [state.settings.theme])

  // «Живые» тестовые котировки: колеблются в узком коридоре вокруг базовой цены
  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) => {
        const next = {}
        for (const a of Object.values(ASSETS)) {
          const band = a.vol * 0.08
          const p = prev[a.id] * (1 + (Math.random() - 0.5) * band * 0.6)
          next[a.id] = Math.min(a.price * (1 + band), Math.max(a.price * (1 - band), p))
        }
        return next
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const b = state.balances
  const partnerKzt = Object.values(state.partners).reduce(
    (sum, p) => sum + (p.balances.USDT || 0) * PRICES.usdt + (p.balances.BTC || 0) * prices.btc, 0)

  const totals = {
    kzt: b.kzt,
    gold: b.gold * prices.gold,
    stocks: STOCKS.reduce((s, id) => s + b[id] * prices[id], 0),
    crypto: CRYPTO.reduce((s, id) => s + b[id] * prices[id], 0),
    partners: partnerKzt,
  }
  totals.own = totals.kzt + totals.gold + totals.stocks + totals.crypto
  totals.all = totals.own + totals.partners

  const unread = state.notifications.filter((n) => !n.read).length

  // Суммы в валюте отображения; при «скрыть балансы» вместо цифр точки
  const cur = state.settings.currency
  const money = (n, { raw = false } = {}) => {
    if (state.settings.hideBalances && !raw) return '••••••'
    if (cur === 'KZT') return kzt(n)
    const v = n / RATES[cur]
    return `${v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur === 'USD' ? '$' : '€'}`
  }

  return (
    <Ctx.Provider value={{ state, dispatch, prices, goldPrice: prices.gold, totals, unread, money }}>
      {children}
    </Ctx.Provider>
  )
}

export const useStore = () => useContext(Ctx)
