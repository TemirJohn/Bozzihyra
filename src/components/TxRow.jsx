import { ArrowDownLeft, ArrowUpRight, Sparkles, Repeat, Coins } from 'lucide-react'
import { ASSETS } from '../lib/mock.js'
import { kzt, qty, btc, time } from '../lib/format.js'

export const TX_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'card', label: 'Карта' },
  { value: 'gold', label: 'Золото' },
  { value: 'stock', label: 'Акции' },
  { value: 'crypto', label: 'Крипта' },
]

export default function TxRow({ t }) {
  const asset = t.asset ? ASSETS[t.asset] : null
  let icon = {
    topup: <ArrowDownLeft size={16} />,
    pay: <ArrowUpRight size={16} />,
    cashback: <Sparkles size={16} />,
    transfer: <Repeat size={16} />,
  }[t.kind] || <Coins size={16} />
  let iconCls = 'bg-ink/6'
  if (t.kind === 'cashback' || t.cat === 'gold') iconCls = 'bg-gold-soft text-gold'

  let value = t.kzt != null ? kzt(t.kzt) : ''
  if (t.kzt > 0) value = '+' + value
  let sub = t.sub || time(t.ts)

  if (t.kind === 'cashback') {
    value = t.grams ? `+${qty(ASSETS.gold, t.grams)}` : t.btc ? `+${btc(t.btc)}` : `+${kzt(t.kztBack, 2)}`
    sub = `1% = ${kzt(t.cashbackKzt, 2)} · ${time(t.ts)}`
  }
  if ((t.kind === 'buy' || t.kind === 'sell') && asset) {
    sub = `${t.qty > 0 ? '+' : ''}${qty(asset, t.qty)} · ${time(t.ts)}`
    if (asset.kind !== 'gold') {
      icon = <span className="text-[11px] font-display font-semibold">{asset.symbol.slice(0, 2)}</span>
      iconCls = 'text-white'
    }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
      <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${iconCls}`}
        style={asset && asset.kind !== 'gold' && (t.kind === 'buy' || t.kind === 'sell') ? { background: asset.color } : undefined}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium truncate">{t.title}</div>
        <div className="text-[12px] text-mute truncate">{sub}</div>
      </div>
      <div className={`num text-[14px] font-medium shrink-0 ${t.kind === 'cashback' ? 'text-gold' : (t.kzt > 0 ? 'text-up' : '')}`}>{value}</div>
    </div>
  )
}
