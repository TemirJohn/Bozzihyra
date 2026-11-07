import { useStore } from '../store.jsx'
import { ASSETS, STOCKS, CRYPTO } from '../lib/mock.js'
import { qty } from '../lib/format.js'
import { Panel, Card, Label, Section } from '../components/ui.jsx'
import { AssetIcon } from './AssetPanel.jsx'

export default function Portfolio({ nav }) {
  const { state, totals, prices, money } = useStore()
  const classes = [
    { id: 'card', label: 'Карта, ₸', value: totals.kzt, color: 'var(--fg)' },
    { id: 'gold', label: 'Золото', value: totals.gold, color: 'var(--gold-fill)' },
    { id: 'stock', label: 'Акции', value: totals.stocks, color: 'var(--shade-1)' },
    { id: 'crypto', label: 'Крипта', value: totals.crypto, color: 'var(--shade-2)' },
    { id: 'partners', label: 'На биржах (у партнёра)', value: totals.partners, color: 'var(--shade-3)' },
  ]
  const held = ['gold', ...STOCKS, ...CRYPTO].filter((id) => state.balances[id] > 0)

  return (
    <Panel title="Весь портфель" onClose={nav.close}>
      <div className="flex flex-col gap-4">
        <div className="px-1">
          <Label>Всего</Label>
          <div className="font-display font-semibold text-[32px] num leading-tight mt-1">{money(totals.all)}</div>
          <div className="text-[12px] text-mute mt-1 num">В Bozzihyra {money(totals.own)} · у партнёров {money(totals.partners)}</div>
        </div>
        {totals.all > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {classes.filter((c) => c.value > 0).map((c) => <span key={c.id} style={{ flexGrow: c.value, background: c.color }} />)}
          </div>
        )}
        <Card className="py-1">
          {classes.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="flex-1 text-[14px]">{c.label}</span>
              <span className="text-[12px] text-mute num w-12 text-right">{totals.all ? Math.round((c.value / totals.all) * 100) : 0}%</span>
              <span className="text-[14px] num w-28 text-right">{money(c.value)}</span>
            </div>
          ))}
        </Card>
        <Section title="Позиции">
          <Card className="py-1">
            {held.length === 0 && <div className="py-4 text-center text-[13px] text-mute">Пока нет активов</div>}
            {held.map((id) => {
              const a = ASSETS[id]
              return (
                <div key={id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                  <AssetIcon asset={a} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium">{a.name}</div>
                    <div className="text-[12px] text-mute num">{qty(a, state.balances[id])}</div>
                  </div>
                  <span className="text-[14px] num">{money(state.balances[id] * prices[id])}</span>
                </div>
              )
            })}
          </Card>
        </Section>
        <p className="text-[12px] text-mute px-1">Стоимость активов рассчитана по текущим тестовым котировкам и может меняться.</p>
      </div>
    </Panel>
  )
}
