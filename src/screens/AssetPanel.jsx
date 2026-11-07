import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS } from '../lib/mock.js'
import { kzt, pct, qtyExact } from '../lib/format.js'
import { Panel, Card, Button, Label, Row, Disclaimer } from '../components/ui.jsx'
import PriceChart, { useSeries } from '../components/PriceChart.jsx'
import GoldBar from '../components/GoldBar.jsx'

export function AssetIcon({ asset, size = 40 }) {
  if (asset.kind === 'gold') return <GoldBar live={false} size={size} className="shrink-0" />
  return (
    <span className="rounded-full grid place-items-center bg-vault text-white font-display font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {asset.symbol.slice(0, asset.kind === 'crypto' ? 1 : 2)}
    </span>
  )
}

export default function AssetPanel({ id, nav }) {
  const { state, prices, dispatch } = useStore()
  const asset = ASSETS[id]
  const guest = !state.onboarded
  useEffect(() => { if (guest) dispatch({ type: 'track', name: 'guest_asset_view' }) }, [guest, dispatch])
  const [range, setRange] = useState('30d')
  const price = prices[id]
  const { data, change, range: r } = useSeries(id, range, price)
  const held = state.balances[id]
  const up = change >= 0
  const buys = state.txs.filter((t) => t.asset === id && t.kind === 'buy')
  const boughtQty = buys.reduce((s, t) => s + t.qty, 0)
  const avg = boughtQty > 0 ? buys.reduce((s, t) => s - t.kzt, 0) / boughtQty : null
  const kindLabel = asset.kind === 'crypto' ? 'Криптовалюта' : 'Токенизированная акция'

  return (
    <Panel title={asset.name} onClose={nav.close}
      footer={guest ? (
        <Button onClick={() => nav.open('signupPrompt', { what: `купить ${asset.name}` })}>Купить {asset.symbol}</Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => nav.open('trade', { asset: id, mode: 'buy' })}>Купить</Button>
          <Button variant="ghost" disabled={held * price < 500} onClick={() => nav.open('trade', { asset: id, mode: 'sell' })}>Продать</Button>
        </div>
      )}>
      <div className="flex flex-col gap-4">
        <header className="px-1">
          <div className="flex items-center gap-3">
            <AssetIcon asset={asset} />
            <div>
              <div className="font-semibold text-[16px]">{asset.symbol}</div>
              <div className="text-[12px] text-mute">{kindLabel}</div>
            </div>
          </div>
          <div className="mt-4 font-display font-semibold text-[28px] num leading-tight">{kzt(price)}</div>
          <div className={`flex flex-wrap items-center gap-x-1.5 text-[14px] font-medium num ${up ? 'text-up' : 'text-down'}`}>
            {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {pct(change)} за {r.long}
            <span className="text-mute font-normal">· тестовая котировка</span>
          </div>
        </header>

        <PriceChart data={data} color={asset.color} unit={`1 ${asset.kind === 'stock' ? 'шт' : asset.symbol}`} range={range} onRange={setRange} />

        {!guest && <Card>
          <Label>У вас</Label>
          <div className="flex items-baseline justify-between mt-1 gap-3">
            <span className="font-display font-semibold text-[18px] num">{qtyExact(asset, held)}</span>
            <span className="num text-[15px]">≈ {kzt(held * price)}</span>
          </div>
          {avg && <div className="text-[12px] text-mute mt-1 num">Средняя цена покупки: {kzt(avg)}</div>}
        </Card>}

        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Info size={16} className="text-gold" />
            <span className="font-semibold text-[15px]">Об активе</span>
          </div>
          <p className="text-[14px] leading-snug">{asset.about}</p>
          <div className="divide-y divide-line mt-2">
            <Row label="Спред" value={`${(asset.spread * 100).toFixed(1)}%`} muted />
            <Row label="Комиссия" value="0,2%, мин. 100 ₸" muted />
            <Row label="Минимальная покупка" value="1 000 ₸" muted />
            <Row label="Хранение" value="Кастодиальное, без seed-фраз" muted />
          </div>
        </Card>

        <Disclaimer>
          {asset.kind === 'crypto'
            ? 'Криптовалюты не являются депозитом и не застрахованы. Цена может резко снижаться.'
            : 'Токенизированные акции не являются депозитом. Цена может снижаться; прошлая динамика не гарантирует будущий результат.'}
          {' '}Котировки тестовые. Регуляторная модель — гипотеза.
        </Disclaimer>
      </div>
    </Panel>
  )
}
