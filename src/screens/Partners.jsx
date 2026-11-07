import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck, ShieldAlert, Loader2, CheckCircle2, AlertCircle, Eye, ArrowRightLeft, Ban } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PARTNERS, PRICES, FEES } from '../lib/mock.js'
import { kzt, usdt, btc } from '../lib/format.js'
import { Button, Card, Label, Notice, Panel, Row } from '../components/ui.jsx'

export default function Partners() {
  const { state } = useStore()
  const [flow, setFlow] = useState(null) // { kind: 'connect'|'transfer', partner }

  const connected = PARTNERS.filter((p) => state.partners[p.id])
  const available = PARTNERS.filter((p) => !state.partners[p.id])
  const total = connected.reduce((s, p) => {
    const b = state.partners[p.id].balances
    return s + (b.USDT || 0) * PRICES.usdt + (b.BTC || 0) * PRICES.btc
  }, 0)

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-6 flex flex-col gap-4">
      <header className="px-1">
        <h1 className="font-semibold text-[18px]">Биржи-партнёры</h1>
        <p className="text-[13px] text-mute mt-1">Только площадки из реестра МФЦА. Балансы видны здесь, а активы хранятся у партнёра.</p>
      </header>

      {connected.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <Label>Подключено</Label>
            <span className="num text-[13px] text-mute">≈ {kzt(total)}</span>
          </div>
          {connected.map((p) => {
            const b = state.partners[p.id].balances
            return (
              <Card key={p.id}>
                <div className="flex items-center gap-3">
                  <Logo p={p} />
                  <div className="flex-1">
                    <div className="font-semibold text-[15px]">{p.name}</div>
                    <div className="text-[12px] text-up flex items-center gap-1"><ShieldCheck size={12} /> Подключено · хранится у партнёра</div>
                  </div>
                </div>
                <div className="divide-y divide-line mt-2">
                  <Row label="USDT" value={<>{usdt(b.USDT)}<span className="block text-[12px] text-mute">≈ {kzt(b.USDT * PRICES.usdt)}</span></>} />
                  {b.BTC > 0 && <Row label="BTC" value={<>{btc(b.BTC)}<span className="block text-[12px] text-mute">≈ {kzt(b.BTC * PRICES.btc)}</span></>} />}
                </div>
                <Button variant="ghost" className="mt-3" disabled={b.USDT <= 0} onClick={() => setFlow({ kind: 'transfer', partner: p })}>
                  <ArrowRightLeft size={16} /> Перевести USDT на карту
                </Button>
              </Card>
            )
          })}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <Label>{connected.length ? 'Можно подключить' : 'Доступные площадки'}</Label>
        <Card className="py-1">
          {available.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
              <Logo p={p} />
              <div className="flex-1">
                <div className="font-medium text-[14px]">{p.name}</div>
                {p.allowed ? (
                  <div className="text-[12px] text-up flex items-center gap-1"><ShieldCheck size={12} /> В реестре МФЦА</div>
                ) : (
                  <div className="text-[12px] text-down flex items-center gap-1"><ShieldAlert size={12} /> Нет в реестре МФЦА</div>
                )}
              </div>
              <Button size="sm" variant={p.allowed ? 'primary' : 'ghost'} onClick={() => setFlow({ kind: 'connect', partner: p })}>Подключить</Button>
            </div>
          ))}
          {available.length === 0 && <div className="py-4 text-center text-[13px] text-mute">Все партнёры подключены</div>}
        </Card>
      </section>

      {flow && createPortal(
        flow.kind === 'connect'
          ? <ConnectFlow partner={flow.partner} onClose={() => setFlow(null)} />
          : <TransferFlow partner={flow.partner} onClose={() => setFlow(null)} />,
        document.getElementById('phone'))}
    </div>
  )
}

function Logo({ p }) {
  return <span className="w-10 h-10 rounded-xl grid place-items-center text-white font-display font-semibold text-[14px]" style={{ background: p.color }}>{p.name[0]}</span>
}

function ConnectFlow({ partner, onClose }) {
  const { dispatch } = useStore()
  const [step, setStep] = useState('consent') // consent | loading | done | denied

  const go = () => {
    setStep('loading')
    setTimeout(() => {
      if (partner.allowed) { dispatch({ type: 'connectPartner', id: partner.id }); setStep('done') }
      else { dispatch({ type: 'track', name: 'error_partner_not_allowed' }); setStep('denied') }
    }, 1400)
  }

  if (step === 'loading') {
    return (
      <Panel title={partner.name}>
        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 size={40} className="animate-spin text-gold" />
          <div className="font-semibold">Проверяем площадку в реестре МФЦА</div>
          <div className="text-[13px] text-mute">и запрашиваем доступ к балансам</div>
        </div>
      </Panel>
    )
  }

  if (step === 'denied') {
    return (
      <Panel title={partner.name} onClose={onClose} footer={<Button onClick={onClose}>Понятно</Button>}>
        <div className="flex flex-col items-center text-center pt-10 gap-4">
          <span className="w-20 h-20 rounded-full bg-down/12 text-down grid place-items-center anim-pop"><Ban size={36} /></span>
          <div className="font-display font-semibold text-[20px] text-balance">Подключение недоступно</div>
          <Notice tone="error" icon={<AlertCircle size={18} />} title={`${partner.name} нет в реестре МФЦА`}>
            Мы работаем только с площадками, которым МФЦА разрешает принимать и переводить цифровые активы. Переведите средства на разрешённую биржу, например Binance KZ или Bybit KZ, и подключите её.
          </Notice>
        </div>
      </Panel>
    )
  }

  if (step === 'done') {
    const b = partner.balances
    return (
      <Panel title="" onClose={onClose} footer={<Button onClick={onClose}>Смотреть балансы</Button>}>
        <div className="flex flex-col items-center text-center pt-12">
          <CheckCircle2 size={56} className="text-up anim-pop" />
          <div className="mt-5 font-display font-semibold text-[22px]">{partner.name} подключена</div>
          <div className="text-[14px] text-mute mt-2 num">Найдено: {usdt(b.USDT)}{b.BTC ? ` и ${btc(b.BTC)}` : ''}</div>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title={`Подключить ${partner.name}`} onClose={onClose}
      footer={<><Button onClick={go}>Разрешить доступ</Button><Button variant="ghost" onClick={onClose}>Отмена</Button></>}>
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Logo p={partner} />
          <div className="text-[14px]">Bozzihyra запрашивает доступ к вашему аккаунту <b>{partner.name}</b></div>
        </div>
        <Card className="flex flex-col gap-3">
          <Perm icon={<Eye size={16} />} title="Просмотр балансов" text="Покажем их в общем портфеле" />
          <Perm icon={<ArrowRightLeft size={16} />} title="Переводы на карту" text="Только когда вы сами подтверждаете перевод" />
          <Perm icon={<Ban size={16} />} title="Нет доступа к торговле и выводу" text="Мы не можем продавать или выводить активы за вас" />
        </Card>
        <p className="text-[12px] text-mute">Активы остаются на бирже. Отключить доступ можно в любой момент. Тестовый режим: реальные аккаунты не используются.</p>
      </div>
    </Panel>
  )
}

function Perm({ icon, title, text }) {
  return (
    <div className="flex gap-3">
      <span className="w-8 h-8 rounded-full bg-ink/6 grid place-items-center shrink-0">{icon}</span>
      <div><div className="text-[14px] font-medium">{title}</div><div className="text-[12px] text-mute">{text}</div></div>
    </div>
  )
}

function TransferFlow({ partner, onClose }) {
  const { state, dispatch } = useStore()
  const bal = state.partners[partner.id].balances.USDT
  const [raw, setRaw] = useState(String(Math.min(100, bal)))
  const [done, setDone] = useState(false)
  const v = Number(raw.replace(',', '.')) || 0
  const gross = v * PRICES.usdt
  const fee = gross * FEES.transferFee
  const over = v > bal

  if (done) {
    return (
      <Panel title="" onClose={onClose} footer={<Button onClick={onClose}>Готово</Button>}>
        <div className="flex flex-col items-center text-center pt-14">
          <CheckCircle2 size={56} className="text-up anim-pop" />
          <div className="mt-5 text-[14px] text-mute">Зачислено на карту</div>
          <div className="font-display font-semibold text-[28px] num">+{kzt(gross - fee)}</div>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title={`С ${partner.name} на карту`} onClose={onClose}
      footer={<Button disabled={!v || over} onClick={() => { dispatch({ type: 'transferFromPartner', id: partner.id, name: partner.name, usdt: v }); setDone(true) }}>
        Перевести {usdt(v)}
      </Button>}>
      <div className="text-center pt-6">
        <label htmlFor="usdt" className="text-[13px] text-mute">Сумма в USDT</label>
        <input id="usdt" value={raw} inputMode="decimal" autoFocus onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ''))}
          className={`w-full text-center bg-transparent outline-none font-display font-semibold text-[40px] num mt-2 ${over ? 'text-down' : ''}`} />
        <div className="text-[13px] text-mute num">Доступно {usdt(bal)}</div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {over && <Notice tone="error" icon={<AlertCircle size={18} />} title="Недостаточно USDT">На {partner.name} доступно {usdt(bal)}.</Notice>}
        <Card className="divide-y divide-line py-1">
          <Row label="Курс" value={`1 USDT = ${kzt(PRICES.usdt)}`} muted />
          <Row label={`Комиссия ${(FEES.transferFee * 100).toFixed(1)}%`} value={kzt(fee)} muted />
          <Row label="Зачислим на карту" value={kzt(gross - fee)} strong />
        </Card>
      </div>
    </Panel>
  )
}
