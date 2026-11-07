import { useState } from 'react'
import { Switch, SegmentedControl } from 'glisse'
import { ScanFace, ShieldCheck, EyeOff, KeyRound, Lock, Smartphone, Laptop, CheckCircle2, FileText, ChevronRight, Download, Receipt, Info, AlertTriangle } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, FEES, CARD, CUSTODY, STOCKS, CRYPTO } from '../lib/mock.js'
import { kzt, qtyExact } from '../lib/format.js'
import { download } from '../lib/download.js'
import { Panel, Card, Button, Notice, Section, Row, Label } from '../components/ui.jsx'
import { BioGate, PinPad } from '../components/Security.jsx'

/* ---------- Безопасность ---------- */

function Toggle({ icon: Icon, id, title, sub, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-line last:border-0">
      <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center shrink-0"><Icon size={17} /></span>
      <div className="flex-1 min-w-0">
        <div id={id} className="text-[14px] font-medium">{title}</div>
        {sub && <div className="text-[12px] text-mute leading-snug">{sub}</div>}
      </div>
      <Switch aria-labelledby={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function SecurityPage({ nav }) {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [pending, setPending] = useState(null) // { key, value, reason }
  const [pinStep, setPinStep] = useState(null) // old | new | repeat | done
  const [newPin, setNewPin] = useState('')

  const ask = (key, reason) => (value) => setPending({ key, value, reason })
  const apply = () => {
    dispatch({ type: 'setting', key: pending.key, value: pending.value })
    setPending(null)
  }

  if (pinStep) {
    const steps = {
      old: { title: 'Текущий код', check: (c) => { if (c !== s.pin) return false; setPinStep('new'); return true } },
      new: { title: 'Новый код', hint: 'Не используйте 1111 или дату рождения', check: (c) => { setNewPin(c); setPinStep('repeat'); return true } },
      repeat: { title: 'Повторите новый код', hint: ' ', check: (c) => {
        if (c !== newPin) { setPinStep('new'); return false }
        dispatch({ type: 'setting', key: 'pin', value: c })
        dispatch({ type: 'notify', kind: 'info', title: 'Код входа изменён', text: 'Если это были не вы, срочно позвоните в поддержку.' })
        setPinStep('done'); return true
      } },
    }
    return (
      <Panel title="Смена кода" onBack={() => setPinStep(null)} onClose={nav.close}>
        {pinStep === 'done' ? (
          <div className="flex flex-col items-center text-center pt-14 gap-3">
            <CheckCircle2 size={56} className="text-up anim-pop" />
            <div className="font-display font-semibold text-[20px]">Код изменён</div>
            <p className="text-[14px] text-mute">Новый код: {s.pin} (показываем только в тестовом режиме)</p>
            <Button className="mt-6" onClick={() => setPinStep(null)}>Готово</Button>
          </div>
        ) : (
          <div className="pt-8"><PinPad key={pinStep} title={steps[pinStep].title} hint={steps[pinStep].hint} onComplete={steps[pinStep].check} /></div>
        )}
      </Panel>
    )
  }

  const logins = [
    ['Face ID', 'iPhone 15 · Алматы', 'Сегодня'],
    ['Код', 'iPhone 15 · Алматы', 'Вчера'],
    ['Face ID', 'iPhone 15 · Алматы', '3 дня назад'],
    ['Пароль', 'MacBook Air · Safari · Алматы', '2 дня назад'],
  ]

  return (
    <Panel title="Безопасность" onClose={nav.close}>
      <div className="flex flex-col gap-5 pt-1">
        <Section title="Вход и подтверждение">
          <Card className="py-0">
            <Toggle icon={ScanFace} id="s-bio" title="Вход по Face ID" sub="Иначе вход и подтверждения по коду"
              checked={s.biometrics} onChange={ask('biometrics', 'Изменить способ входа')} />
            <Toggle icon={ShieldCheck} id="s-ops" title="Подтверждать важные действия"
              sub="Покупки активов от 100 000 ₸, показ реквизитов, рост лимитов, заморозка"
              checked={s.confirmOps} onChange={ask('confirmOps', 'Изменить подтверждение операций')} />
            <Toggle icon={EyeOff} id="s-hide" title="Скрывать балансы" sub="Вместо сумм на главной будут точки. Быстро переключается значком глаза"
              checked={s.hideBalances} onChange={(v) => dispatch({ type: 'setting', key: 'hideBalances', value: v })} />
            <button onClick={() => setPinStep('old')} className="w-full flex items-center gap-3 py-3 border-b border-line text-left">
              <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center"><KeyRound size={17} /></span>
              <span className="flex-1 text-[14px] font-medium">Сменить код входа</span>
              <ChevronRight size={18} className="text-mute" />
            </button>
            <button onClick={() => { nav.close(); nav.lock() }} className="w-full flex items-center gap-3 py-3 text-left">
              <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center"><Lock size={17} /></span>
              <span className="flex-1 text-[14px] font-medium">Заблокировать приложение сейчас</span>
              <ChevronRight size={18} className="text-mute" />
            </button>
          </Card>
        </Section>

        <Section title="Устройства">
          <Card className="py-1">
            {state.devices.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center shrink-0">{d.name.includes('Mac') ? <Laptop size={17} /> : <Smartphone size={17} />}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate">{d.name}</div>
                  <div className="text-[12px] text-mute">{d.place} · {d.last}</div>
                </div>
                {d.current
                  ? <span className="text-[12px] text-up font-medium">Это устройство</span>
                  : <Button variant="danger" size="sm" onClick={() => dispatch({ type: 'endSession', id: d.id })}>Завершить</Button>}
              </div>
            ))}
          </Card>
          <p className="text-[12px] text-mute px-1">Не узнаёте устройство? Завершите сеанс и смените код входа.</p>
        </Section>

        <Section title="История входов">
          <Card className="py-1">
            {logins.map(([how, where, when], i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0 text-[13px]">
                <span><span className="font-medium">{how}</span> <span className="text-mute">· {where}</span></span>
                <span className="text-mute shrink-0">{when}</span>
              </div>
            ))}
          </Card>
        </Section>
      </div>
      {pending && <BioGate reason={pending.reason} onCancel={() => setPending(null)} onSuccess={apply} />}
    </Panel>
  )
}

/* ---------- Документы и условия ---------- */

const P = ({ children }) => <p className="text-[14px] leading-relaxed">{children}</p>

function docList(state, prices) {
  return [
    { id: 'tariffs', title: 'Тарифы', sub: 'Комиссии, спреды, лимиты' },
    { id: 'card', title: 'Условия выпуска и обслуживания карты', sub: 'Редакция от 01.11.2026' },
    { id: 'gold', title: 'Условия bzGOLD и раскрытие рисков', sub: 'Хранение, обеспечение, риски' },
    { id: 'assets', title: 'Условия по акциям и криптовалютам', sub: 'Токенизированные акции, BTC, ETH' },
    { id: 'privacy', title: 'Политика конфиденциальности', sub: 'Какие данные мы храним' },
    { id: 'statement', title: 'Выписка по счёту', sub: 'За выбранный период', generated: true },
    { id: 'certificate', title: 'Справка о наличии счёта', sub: 'С текущими остатками', generated: true },
  ].map((d) => ({ ...d, state, prices }))
}

function DocBody({ id, state, prices, period }) {
  if (id === 'tariffs') return (
    <Card className="py-1 divide-y divide-line">
      <Row label="Выпуск и обслуживание карты" value="0 ₸" muted />
      <Row label="Пополнение с карт других банков" value="0 ₸" muted />
      <Row label="Кешбэк с покупок" value={`${FEES.cashbackRate * 100}%`} muted />
      <Row label="Спред: золото" value={`${ASSETS.gold.spread * 100}%`} muted />
      <Row label="Спред: акции" value={`${ASSETS.nvda.spread * 100}%`} muted />
      <Row label="Спред: криптовалюты" value={`${ASSETS.btc.spread * 100}%`} muted />
      <Row label="Комиссия за сделку" value={`${FEES.commission * 100}%, мин. ${kzt(FEES.minCommission)}`} muted />
      <Row label="Перевод USDT с биржи на карту" value={`${FEES.transferFee * 100}%`} muted />
      <Row label="Хранение активов" value="0 ₸" muted />
    </Card>
  )
  if (id === 'card') return (
    <div className="flex flex-col gap-3">
      <P>1. Банк выпускает виртуальную карту VISA, привязанную к текущему счёту клиента в тенге.</P>
      <P>2. Клиент может заморозить карту в приложении в любой момент. Заморозка не влияет на остаток и активы.</P>
      <P>3. Лимиты на покупки, онлайн-оплату и снятие наличных устанавливает клиент. Увеличение лимита подтверждается биометрией.</P>
      <P>4. Кешбэк 1% начисляется после проведения покупки в выбранном клиентом активе по текущей котировке.</P>
      <P>5. Спорные операции оспариваются через чек операции. Срок рассмотрения — до 30 дней.</P>
    </div>
  )
  if (id === 'gold') return (
    <div className="flex flex-col gap-3">
      <P>{CUSTODY.backing}. Металл хранится у кастодиана: {CUSTODY.custodian}. Последний аудит: {CUSTODY.lastAudit}.</P>
      <Notice tone="warn" icon={<AlertTriangle size={18} />} title="Риски">
        bzGOLD не является банковским вкладом и не входит в систему гарантирования депозитов. Цена золота меняется и может снижаться. Прошлая динамика не гарантирует будущий результат.
      </Notice>
      <P>Продать bzGOLD можно в любой момент по текущей котировке с учётом спреда и комиссии из тарифов.</P>
    </div>
  )
  if (id === 'assets') return (
    <div className="flex flex-col gap-3">
      <P>Токенизированная акция — цифровое право на акцию, которая хранится у кастодиана в соотношении 1:1. Дробные доли доступны от 1 000 ₸.</P>
      <P>Криптовалюты хранятся кастодиально: банк хранит ключи за клиента, seed-фразы не нужны. Балансы на биржах-партнёрах показываются для удобства и хранятся у партнёра.</P>
      <Notice tone="warn" icon={<AlertTriangle size={18} />} title="Риски">Цены акций и особенно криптовалют могут резко снижаться. Вкладывайте только те деньги, потерю которых готовы принять.</Notice>
    </div>
  )
  if (id === 'privacy') return (
    <div className="flex flex-col gap-3">
      <P>Мы храним данные, нужные для обслуживания: ФИО, номер телефона, историю операций и данные подключённых бирж (только балансы, без доступа к торговле).</P>
      <P>Биометрия не покидает устройство: приложение получает только ответ «подтверждено» или «не подтверждено».</P>
      <P>Данные не передаются третьим лицам без согласия клиента, кроме случаев, предусмотренных законом.</P>
    </div>
  )
  if (id === 'statement') {
    const from = Date.now() - period * 86400000
    const list = state.txs.filter((t) => t.ts >= from && t.kzt != null)
    const inSum = list.filter((t) => t.kzt > 0).reduce((a, t) => a + t.kzt, 0)
    const outSum = list.filter((t) => t.kzt < 0).reduce((a, t) => a - t.kzt, 0)
    return (
      <div className="flex flex-col gap-3">
        <Card className="py-1 divide-y divide-line">
          <Row label="Счёт" value={CARD.iban} muted />
          <Row label="Поступления" value={`+${kzt(inSum)}`} />
          <Row label="Списания" value={`−${kzt(outSum)}`} />
          <Row label="Остаток сейчас" value={kzt(state.balances.kzt)} strong />
        </Card>
        <Card className="py-1">
          {list.length === 0 && <div className="py-4 text-center text-[13px] text-mute">За период операций нет</div>}
          {list.map((t) => (
            <div key={t.id} className="flex justify-between gap-3 py-2 border-b border-line last:border-0 text-[13px]">
              <span className="min-w-0 truncate">{new Date(t.ts).toLocaleDateString('ru-RU')} · {t.title}</span>
              <span className="num shrink-0">{t.kzt > 0 ? '+' : ''}{kzt(t.kzt)}</span>
            </div>
          ))}
        </Card>
      </div>
    )
  }
  if (id === 'certificate') return (
    <div className="flex flex-col gap-3">
      <P>Настоящим подтверждается, что {CARD.holder} является клиентом {CARD.bank} и имеет текущий счёт {CARD.iban}.</P>
      <Card className="py-1 divide-y divide-line">
        <Row label="Остаток на счёте" value={kzt(state.balances.kzt)} />
        {['gold', ...STOCKS, ...CRYPTO].filter((k) => state.balances[k] > 0).map((k) => (
          <Row key={k} label={ASSETS[k].name} value={`${qtyExact(ASSETS[k], state.balances[k])} ≈ ${kzt(state.balances[k] * prices[k])}`} muted />
        ))}
      </Card>
      <P>Справка выдана {new Date().toLocaleDateString('ru-RU')} для предъявления по месту требования.</P>
    </div>
  )
  return null
}

function docText(id, state, period) {
  if (id === 'statement') {
    const from = Date.now() - period * 86400000
    return ['Дата;Операция;Сумма, KZT', ...state.txs.filter((t) => t.ts >= from && t.kzt != null)
      .map((t) => `${new Date(t.ts).toLocaleString('ru-RU')};${t.title};${t.kzt.toFixed(2)}`)].join('\n')
  }
  return `Bozzhyra · тестовый документ «${id}» от ${new Date().toLocaleDateString('ru-RU')}`
}

export function DocumentsPage({ nav }) {
  const { state, prices } = useStore()
  const [open, setOpen] = useState(null)
  const [period, setPeriod] = useState('30')
  const docs = docList(state, prices)

  if (open) {
    const d = docs.find((x) => x.id === open)
    return (
      <Panel title={d.title} onBack={() => setOpen(null)} onClose={nav.close}
        footer={d.generated && <Button variant="ghost" onClick={() => download(`${d.id}.${d.id === 'statement' ? 'csv' : 'txt'}`, docText(d.id, state, +period))}>
          <Download size={16} /> Сохранить {d.id === 'statement' ? 'CSV' : 'файл'}
        </Button>}>
        <div className="flex flex-col gap-4 pt-1">
          {d.id === 'statement' && (
            <div className="flex justify-center">
              <SegmentedControl className="bz-seg-3" aria-label="Период" value={period} onValueChange={setPeriod}
                items={[{ value: '7', label: '7 дней' }, { value: '30', label: '30 дней' }, { value: '90', label: '90 дней' }]} />
            </div>
          )}
          <DocBody id={d.id} state={state} prices={prices} period={+period} />
          <p className="text-[11px] text-mute">Тестовый документ для прототипа. Не является офертой.</p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Документы и условия" onClose={nav.close}>
      <div className="flex flex-col gap-5 pt-1">
        {[['Условия', docs.filter((d) => !d.generated)], ['Справки и выписки', docs.filter((d) => d.generated)]].map(([title, list]) => (
          <Section key={title} title={title}>
            <Card className="py-0">
              {list.map((d) => (
                <button key={d.id} onClick={() => setOpen(d.id)} className="w-full flex items-center gap-3 py-3 border-b border-line last:border-0 text-left">
                  <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center shrink-0"><FileText size={17} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium">{d.title}</div>
                    <div className="text-[12px] text-mute">{d.sub}</div>
                  </div>
                  <ChevronRight size={18} className="text-mute" />
                </button>
              ))}
            </Card>
          </Section>
        ))}
      </div>
    </Panel>
  )
}

/* ---------- Налоги ---------- */

const TAX_RATE = 0.1 // оценка; ставку и порядок нужно проверить по НК РК 2026

export function realized(txs) {
  const ids = ['gold', ...STOCKS, ...CRYPTO]
  return ids.map((id) => {
    const buys = txs.filter((t) => t.asset === id && t.kind === 'buy')
    const sells = txs.filter((t) => t.asset === id && t.kind === 'sell')
    const bq = buys.reduce((a, t) => a + t.qty, 0)
    const avg = bq > 0 ? buys.reduce((a, t) => a - t.kzt, 0) / bq : 0
    const sq = sells.reduce((a, t) => a - t.qty, 0)
    const proceeds = sells.reduce((a, t) => a + t.kzt, 0)
    const cost = sq * avg
    return { id, asset: ASSETS[id], deals: sells.length, qty: sq, proceeds, cost, result: proceeds - cost }
  }).filter((r) => r.deals > 0)
}

export function TaxesPage({ nav }) {
  const { state } = useStore()
  const [view, setView] = useState('summary')
  const rows = realized(state.txs)
  const total = rows.reduce((a, r) => a + r.result, 0)
  const tax = Math.max(0, total) * TAX_RATE
  const cashback = state.txs.filter((t) => t.kind === 'cashback').reduce((a, t) => a + t.cashbackKzt, 0)
  const year = new Date().getFullYear()

  const csv = ['Актив;Сделок;Количество;Выручка, KZT;Стоимость покупки, KZT;Результат, KZT',
    ...rows.map((r) => `${r.asset.name};${r.deals};${r.qty};${r.proceeds.toFixed(2)};${r.cost.toFixed(2)};${r.result.toFixed(2)}`),
    `Итого;;;;;${total.toFixed(2)}`, `Кешбэк получен;;;;;${cashback.toFixed(2)}`].join('\n')

  if (view === 'report') {
    return (
      <Panel title={`Справка для декларации · ${year}`} onBack={() => setView('summary')} onClose={nav.close}
        footer={<Button variant="ghost" onClick={() => download(`nalog-${year}.csv`, csv)}><Download size={16} /> Сохранить CSV</Button>}>
        <div className="flex flex-col gap-3 pt-1">
          <P>Справка о доходах от реализации активов через Bozzhyra за {year} год. Клиент: {CARD.holder}.</P>
          <Card className="py-1">
            {rows.map((r) => (
              <div key={r.id} className="py-2.5 border-b border-line last:border-0">
                <div className="text-[14px] font-medium">{r.asset.name}</div>
                <div className="grid grid-cols-3 gap-2 text-[12px] mt-1 num">
                  <span><span className="text-mute block">Выручка</span>{kzt(r.proceeds)}</span>
                  <span><span className="text-mute block">Покупка</span>{kzt(r.cost)}</span>
                  <span><span className="text-mute block">Результат</span><span className={r.result >= 0 ? 'text-up' : 'text-down'}>{kzt(r.result)}</span></span>
                </div>
              </div>
            ))}
          </Card>
          <Row label="Итого результат" value={kzt(total)} strong />
          <p className="text-[11px] text-mute">Себестоимость рассчитана по средней цене покупки. Тестовый документ.</p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Налоги" onClose={nav.close}
      footer={<Button disabled={!rows.length} onClick={() => setView('report')}><Receipt size={16} /> Справка для декларации</Button>}>
      <div className="flex flex-col gap-4 pt-1">
        <Notice tone="warn" icon={<Info size={18} />} title="Предварительная оценка">
          С 2026 года действует новый Налоговый кодекс РК. Ставка, льготы для инструментов МФЦА, налоговый статус кешбэка и срок подачи формы 270.00 требуют проверки. Цифры ниже — ориентир, а не расчёт налога.
        </Notice>
        <Card>
          <Label>Реализованный результат за {year}</Label>
          <div className={`font-display font-semibold text-[28px] num mt-1 ${total >= 0 ? '' : 'text-down'}`}>{kzt(total)}</div>
          <div className="text-[13px] text-mute mt-1 num">Оценка налога при ставке {TAX_RATE * 100}%: {kzt(tax)}</div>
        </Card>
        <Section title="По активам">
          {rows.length ? (
            <Card className="py-1">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium">{r.asset.name}</div>
                    <div className="text-[12px] text-mute num">Продаж: {r.deals} · {qtyExact(r.asset, r.qty)}</div>
                  </div>
                  <span className={`text-[14px] num font-medium ${r.result >= 0 ? 'text-up' : 'text-down'}`}>{r.result >= 0 ? '+' : ''}{kzt(r.result)}</span>
                </div>
              ))}
            </Card>
          ) : <div className="bz-card text-center text-[14px] text-mute py-6">Продаж в этом году не было. Налог возникает только при продаже с прибылью.</div>}
        </Section>
        <Card className="py-1 divide-y divide-line">
          <Row label="Кешбэк получен за год" value={kzt(cashback, 2)} hint="Налоговый статус уточняется" />
          <Row label="Активы, которые вы не продали" value="Учитываются при продаже" muted />
        </Card>
      </div>
    </Panel>
  )
}
