import { useState } from 'react'
import { Switch, Slider } from 'glisse'
import { Wifi, Snowflake, Globe, Gauge, Copy, Eye, Smartphone, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, X as XIcon, Check, ChevronRight } from 'lucide-react'
import { useStore } from '../store.jsx'
import { CARD } from '../lib/mock.js'
import { kzt } from '../lib/format.js'
import { Panel, Card, Button, Notice, Choice, Section, Row, Label } from '../components/ui.jsx'
import { BioGate } from '../components/Security.jsx'
import TxRow from '../components/TxRow.jsx'
import ToonGold from '../components/ToonGold.jsx'

const backTo = (nav, back) => (back ? () => nav.open(back.type, back) : undefined)

// Лицевая сторона карты — используется на главной, в табе «Карта» и на странице карты
export function CardFace({ onClick, compact }) {
  const { state, money } = useStore()
  const s = state.settings
  return (
    <button onClick={onClick} aria-label="Открыть карту: реквизиты и управление"
      className={`w-full aspect-[1.586] rounded-[22px] p-5 text-white flex flex-col justify-between text-left relative overflow-hidden isolate ${compact ? '' : ''}`}
      style={{ background: 'linear-gradient(135deg, #2a2a2c 0%, #0a0a0a 65%, #1c1c1e 100%)' }}>
      <div className={`absolute -right-10 top-1/2 -translate-y-[58%] -z-10 ${s.frozen ? 'opacity-25 grayscale' : ''}`}><ToonGold model="coin" live={false} size={170} sparkle={!s.frozen} /></div>
      <div className="flex justify-between items-start">
        <span className="font-display font-semibold text-[17px]">bozzihyra<span className="text-gold-fill">.</span></span>
        {s.frozen ? <Snowflake size={20} className="text-sky-200" /> : <Wifi size={20} className="rotate-90 text-white/70" />}
      </div>
      <div>
        <div className="text-[11px] text-white/55 uppercase tracking-[.08em]">{s.frozen ? 'Карта заморожена' : 'Доступно'}</div>
        <div className="font-display font-semibold text-[24px] num">{money(state.balances.kzt)}</div>
        <div className="flex justify-between items-end mt-2 text-[13px] text-white/75">
          <span className="num tracking-wider">•••• {s.cardLast4}</span>
          <span>VISA · виртуальная</span>
        </div>
      </div>
    </button>
  )
}

export function CardPage({ nav }) {
  const { state } = useStore()
  const s = state.settings
  const [flipped, setFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [gate, setGate] = useState(false)
  const [flash, setFlash] = useState('')
  const number = CARD.number.slice(0, -4) + s.cardLast4
  const cardTx = state.txs.filter((t) => t.cat === 'card').slice(0, 5)

  const copy = async (label, value) => {
    try { await navigator.clipboard.writeText(value.replace(/\s/g, label === 'IBAN' ? ' ' : '')); setFlash(`${label} скопирован`) }
    catch { setFlash('Не удалось скопировать') }
    setTimeout(() => setFlash(''), 2000)
  }

  const reqs = [
    ['Номер карты', revealed ? number : `•••• •••• •••• ${s.cardLast4}`],
    ['Срок действия', revealed ? CARD.expiry : '••/••'],
    ['CVV', revealed ? CARD.cvv : '•••'],
    ['Держатель', CARD.holder],
    ['IBAN', revealed ? CARD.iban : 'KZ•• •••• •••• ••••'],
    ['БИК', CARD.bic],
  ]

  return (
    <Panel title="Карта" onClose={nav.close}>
      <div className="flex flex-col gap-4">
        <div className="bz-flip">
          <div className={`bz-flip-inner ${flipped ? 'is-flipped' : ''}`}>
            <div className="bz-face"><CardFace onClick={() => setFlipped(true)} /></div>
            <button onClick={() => setFlipped(false)} aria-label="Перевернуть карту"
              className="bz-face bz-back rounded-[22px] p-5 text-white text-left flex flex-col justify-between"
              style={{ background: 'linear-gradient(135deg, #1c1c1e, #0a0a0a)' }}>
              <div className="h-9 -mx-5 bg-black/70" />
              <div className="flex flex-col gap-1.5">
                <div className="font-mono text-[18px] tracking-wider">{revealed ? number : `•••• •••• •••• ${s.cardLast4}`}</div>
                <div className="flex gap-6 text-[13px] text-white/80 font-mono">
                  <span>{revealed ? CARD.expiry : '••/••'}</span><span>CVV {revealed ? CARD.cvv : '•••'}</span>
                </div>
                <div className="text-[12px] text-white/60">{CARD.holder}</div>
              </div>
            </button>
          </div>
        </div>
        <p className="text-[12px] text-mute text-center -mt-1">Нажмите на карту, чтобы перевернуть</p>

        <div className="grid grid-cols-3 gap-2">
          <Tile icon={s.frozen ? Snowflake : Snowflake} label={s.frozen ? 'Разморозить' : 'Заморозить'} active={s.frozen} onClick={() => nav.open('freeze', { back: { type: 'cardPage' } })} />
          <Tile icon={Globe} label="Интернет" sub={s.online ? 'Вкл' : 'Выкл'} onClick={() => nav.open('online', { back: { type: 'cardPage' } })} />
          <Tile icon={Gauge} label="Лимиты" sub={kzt(s.dailyLimit)} onClick={() => nav.open('limits', { back: { type: 'cardPage' } })} />
        </div>

        <Section title="Реквизиты" action={!revealed && (
          <button onClick={() => setGate(true)} className="text-[13px] font-semibold flex items-center gap-1"><Eye size={15} /> Показать</button>
        )}>
          <Card className="py-1">
            {reqs.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-mute">{k}</div>
                  <div className="text-[14px] font-mono truncate">{v}</div>
                </div>
                {revealed && <button onClick={() => copy(k, v)} aria-label={`Скопировать: ${k}`} className="w-9 h-9 rounded-full bg-ink/6 grid place-items-center"><Copy size={15} /></button>}
              </div>
            ))}
          </Card>
          {flash && <Notice tone="ok">{flash}</Notice>}
          {!revealed && <p className="text-[12px] text-mute px-1">Полные реквизиты откроются после подтверждения Face ID.</p>}
        </Section>

        <Section title="Операции по карте" action={
          <button onClick={() => nav.open('history', { filter: 'card' })} className="text-[13px] font-semibold underline underline-offset-2">Все</button>
        }>
          {cardTx.length
            ? <Card className="py-1">{cardTx.map((t) => <TxRow key={t.id} t={t} onOpen={(id) => nav.open('receipt', { id, back: { type: 'cardPage' } })} />)}</Card>
            : <div className="bz-card text-center text-[14px] text-mute py-6">Операций по карте пока нет</div>}
        </Section>

        <Card className="py-0">
          <button className="w-full flex items-center gap-3 py-3 border-b border-line text-left">
            <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center"><Smartphone size={17} /></span>
            <span className="flex-1 text-[14px] font-medium">Apple Pay</span>
            <span className="text-[13px] text-up">Добавлена</span>
          </button>
          <button onClick={() => nav.open('freeze', { reason: 'lost', back: { type: 'cardPage' } })} className="w-full flex items-center gap-3 py-3 text-left">
            <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center"><RefreshCw size={17} /></span>
            <span className="flex-1 text-[14px] font-medium">Перевыпустить карту</span>
            <ChevronRight size={18} className="text-mute" />
          </button>
        </Card>
      </div>
      {gate && <BioGate reason="Показать реквизиты карты" onCancel={() => setGate(false)}
        onSuccess={() => { setGate(false); setRevealed(true); setFlipped(true) }} />}
    </Panel>
  )
}

function Tile({ icon: Icon, label, sub, onClick, active }) {
  return (
    <button onClick={onClick} className={`bz-card py-3 px-2 flex flex-col items-center gap-1.5 ${active ? 'bg-ink! text-paper' : ''}`}>
      <Icon size={20} />
      <span className="text-[12px] font-semibold">{label}</span>
      {sub && <span className={`text-[11px] num ${active ? 'opacity-70' : 'text-mute'}`}>{sub}</span>}
    </button>
  )
}

function Done({ title, text, onClose }) {
  return (
    <div className="flex flex-col items-center text-center pt-14 gap-3">
      <CheckCircle2 size={56} className="text-up anim-pop" />
      <div className="font-display font-semibold text-[20px] text-balance">{title}</div>
      <p className="text-[14px] text-mute max-w-[32ch]">{text}</p>
      <Button className="mt-6" onClick={onClose}>Готово</Button>
    </div>
  )
}

function ListItem({ ok, children }) {
  return (
    <li className="flex gap-2.5 text-[14px] leading-snug">
      <span className={`w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5 ${ok ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>
        {ok ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
      </span>
      {children}
    </li>
  )
}

const REASONS = [
  { id: 'temp', title: 'Временно', text: 'Не пользуюсь картой, хочу обезопасить' },
  { id: 'suspicious', title: 'Подозрительная операция', text: 'Вижу списание, которое не совершал' },
  { id: 'lost', title: 'Потерял карту или её украли', text: 'Данные карты могли попасть к чужим' },
]

export function FreezePage({ nav, back, reason: initialReason }) {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [reason, setReason] = useState(initialReason || null)
  const [step, setStep] = useState('form') // form | confirmBlock | done
  const [gate, setGate] = useState(null) // 'freeze' | 'unfreeze' | 'block'
  const [understand, setUnderstand] = useState(false)
  const [done, setDone] = useState(null)
  const close = backTo(nav, back) || nav.close

  const run = (kind) => {
    setGate(null)
    if (kind === 'freeze') {
      dispatch({ type: 'settings', patch: { frozen: true, freezeReason: reason } })
      dispatch({ type: 'notify', kind: 'info', title: 'Карта заморожена', text: `•••• ${s.cardLast4}. Оплаты будут отклоняться, пока вы её не разморозите.` })
      setDone({ title: 'Карта заморожена', text: 'Оплаты и подписки отклоняются. Переводы на карту и активы работают как обычно.' })
    }
    if (kind === 'unfreeze') {
      dispatch({ type: 'settings', patch: { frozen: false, freezeReason: null } })
      dispatch({ type: 'notify', kind: 'info', title: 'Карта разморожена', text: `•••• ${s.cardLast4} снова принимает оплаты.` })
      setDone({ title: 'Карта разморожена', text: 'Можно снова платить в магазинах и онлайн.' })
    }
    if (kind === 'block') {
      dispatch({ type: 'reissueCard' })
      setDone({ title: 'Новая карта выпущена', text: 'Старая карта заблокирована навсегда. Новая виртуальная карта уже работает, Apple Pay обновится автоматически.' })
    }
    setStep('done')
  }

  if (step === 'done') return <Panel title="" onClose={close}><Done {...done} onClose={close} /></Panel>

  if (step === 'confirmBlock') {
    return (
      <Panel title="Заблокировать навсегда" onBack={() => setStep('form')} onClose={close}
        footer={<Button variant="danger" disabled={!understand} onClick={() => setGate('block')}>Заблокировать и перевыпустить</Button>}>
        <div className="flex flex-col gap-4 pt-2">
          <Notice tone="error" icon={<AlertTriangle size={18} />} title="Это действие нельзя отменить">
            Карта •••• {s.cardLast4} перестанет работать навсегда. Подписки, привязанные к ней, нужно будет перепривязать к новой карте.
          </Notice>
          <Card>
            <ul className="flex flex-col gap-2.5">
              <ListItem ok>Деньги и активы останутся на счёте</ListItem>
              <ListItem ok>Новая виртуальная карта появится сразу</ListItem>
              <ListItem>Старые номер, срок и CVV перестанут работать</ListItem>
              <ListItem>Автоплатежи по старой карте отключатся</ListItem>
            </ul>
          </Card>
          <div className="flex items-center gap-3 p-1">
            <span id="understand" className="flex-1 text-[13px]">Понимаю, что старую карту нельзя будет разблокировать</span>
            <Switch aria-labelledby="understand" checked={understand} onCheckedChange={setUnderstand} />
          </div>
        </div>
        {gate && <BioGate reason="Заблокировать карту навсегда" onCancel={() => setGate(null)} onSuccess={() => run('block')} />}
      </Panel>
    )
  }

  if (s.frozen) {
    const r = REASONS.find((x) => x.id === s.freezeReason)
    return (
      <Panel title="Заморозка карты" onBack={backTo(nav, back)} onClose={nav.close}
        footer={<Button onClick={() => setGate('unfreeze')}>Разморозить карту</Button>}>
        <div className="flex flex-col gap-4 pt-2">
          <Notice tone="warn" icon={<Snowflake size={18} />} title={`Карта •••• ${s.cardLast4} заморожена`}>
            {r ? `Причина: ${r.title.toLowerCase()}. ` : ''}Оплаты отклоняются.
          </Notice>
          {s.freezeReason === 'lost' && (
            <Card className="flex flex-col gap-3">
              <div className="text-[14px]">Если карта потеряна, надёжнее заблокировать её навсегда и выпустить новую.</div>
              <Button variant="danger" size="sm" className="h-11!" onClick={() => setStep('confirmBlock')}>Заблокировать и перевыпустить</Button>
            </Card>
          )}
        </div>
        {gate && <BioGate reason="Разморозить карту" onCancel={() => setGate(null)} onSuccess={() => run('unfreeze')} />}
      </Panel>
    )
  }

  return (
    <Panel title="Заморозить карту" onBack={backTo(nav, back)} onClose={nav.close}
      footer={<Button disabled={!reason} onClick={() => setGate('freeze')}>Заморозить карту</Button>}>
      <div className="flex flex-col gap-4 pt-1">
        <Label className="px-1">Почему замораживаете</Label>
        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <Choice key={r.id} selected={reason === r.id} onClick={() => setReason(r.id)} className="py-3.5">
              <div className="text-[15px] font-semibold">{r.title}</div>
              <div className="text-[13px] text-mute">{r.text}</div>
            </Choice>
          ))}
        </div>
        {reason === 'lost' && (
          <Notice tone="error" icon={<AlertTriangle size={18} />} title="Лучше заблокировать навсегда"
            action={<button onClick={() => setStep('confirmBlock')} className="text-[13px] font-semibold underline">Заблокировать и перевыпустить</button>}>
            Заморозка временная. Если карта у чужих людей, её безопаснее заблокировать и выпустить новую.
          </Notice>
        )}
        {reason === 'suspicious' && (
          <Notice tone="warn" icon={<AlertTriangle size={18} />} title="Оспорьте списание">
            После заморозки откройте операцию в истории и нажмите «Оспорить операцию».
          </Notice>
        )}
        <Section title="Что изменится">
          <Card>
            <ul className="flex flex-col gap-2.5">
              <ListItem>Покупки в магазинах и онлайн будут отклоняться</ListItem>
              <ListItem>Подписки и автосписания не пройдут</ListItem>
              <ListItem ok>Переводы и пополнения на карту работают</ListItem>
              <ListItem ok>Золото, акции и крипта доступны</ListItem>
              <ListItem ok>Разморозить можно в любой момент</ListItem>
            </ul>
          </Card>
        </Section>
      </div>
      {gate && <BioGate reason="Заморозить карту" onCancel={() => setGate(null)} onSuccess={() => run('freeze')} />}
    </Panel>
  )
}

export function OnlinePage({ nav, back }) {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [draft, setDraft] = useState({ online: s.online, subs: s.subs, foreign: s.foreign })
  const [gate, setGate] = useState(false)
  const [saved, setSaved] = useState(false)
  const changed = Object.keys(draft).some((k) => draft[k] !== s[k])
  const enabling = Object.keys(draft).some((k) => draft[k] && !s[k])

  const save = () => {
    dispatch({ type: 'settings', patch: draft })
    dispatch({ type: 'notify', kind: 'info', title: 'Настройки онлайн-оплаты изменены',
      text: `Интернет: ${draft.online ? 'вкл' : 'выкл'} · подписки: ${draft.subs ? 'вкл' : 'выкл'} · зарубежные сайты: ${draft.foreign ? 'вкл' : 'выкл'}` })
    setGate(false); setSaved(true)
  }

  const items = [
    { key: 'online', icon: Globe, title: 'Оплата в интернете', sub: 'Покупки на сайтах и в приложениях' },
    { key: 'subs', icon: RefreshCw, title: 'Подписки и автосписания', sub: 'Spotify, Netflix, сервисы по подписке', dep: true },
    { key: 'foreign', icon: Globe, title: 'Зарубежные сайты', sub: 'Магазины и сервисы за пределами Казахстана', dep: true },
  ]

  return (
    <Panel title="Оплата в интернете" onBack={backTo(nav, back)} onClose={nav.close}
      footer={<Button disabled={!changed} onClick={() => (enabling ? setGate(true) : save())}>Сохранить</Button>}>
      <div className="flex flex-col gap-4 pt-1">
        {saved && !changed && <Notice tone="ok" icon={<CheckCircle2 size={18} />}>Настройки сохранены</Notice>}
        <Card className="py-0">
          {items.map(({ key, icon: Icon, title, sub, dep }) => {
            const disabled = dep && !draft.online
            return (
              <div key={key} className={`flex items-center gap-3 py-3 border-b border-line last:border-0 ${disabled ? 'opacity-45' : ''}`}>
                <span className="w-9 h-9 rounded-xl bg-ink/6 grid place-items-center shrink-0"><Icon size={17} /></span>
                <div className="flex-1 min-w-0">
                  <div id={`l-${key}`} className="text-[14px] font-medium">{title}</div>
                  <div className="text-[12px] text-mute">{sub}</div>
                </div>
                <Switch aria-labelledby={`l-${key}`} disabled={disabled} checked={draft[key] && !disabled}
                  onCheckedChange={(v) => { setSaved(false); setDraft({ ...draft, [key]: v }) }} />
              </div>
            )
          })}
        </Card>
        {enabling && (
          <Notice tone="warn" icon={<AlertTriangle size={18} />} title="Включение повышает риск">
            Мошенники чаще используют данные карты именно в интернете. Не вводите реквизиты на незнакомых сайтах. Для подтверждения понадобится Face ID.
          </Notice>
        )}
        <Card className="flex gap-3">
          <ShieldCheck size={20} className="text-up shrink-0" />
          <div className="text-[13px] leading-snug">
            <div className="font-semibold text-[14px]">3-D Secure всегда включён</div>
            Каждую онлайн-покупку дополнительно подтверждает код из push-уведомления. Онлайн-лимит: {kzt(s.onlineLimit)} в день.
          </div>
        </Card>
        <button onClick={() => nav.open('limits', { back: { type: 'online', back } })} className="text-[13px] font-semibold flex items-center gap-1 px-1">
          Изменить онлайн-лимит <ChevronRight size={14} />
        </button>
      </div>
      {gate && <BioGate reason="Включить онлайн-оплату" onCancel={() => setGate(false)} onSuccess={save} />}
    </Panel>
  )
}

const LIMITS = [
  { key: 'dailyLimit', title: 'Покупки в день', min: 50000, max: 1000000, step: 50000, usedKind: 'all' },
  { key: 'onlineLimit', title: 'Онлайн-покупки в день', min: 0, max: 500000, step: 25000, usedKind: 'online' },
  { key: 'cashLimit', title: 'Снятие наличных в день', min: 0, max: 500000, step: 25000 },
]

export function LimitsPage({ nav, back }) {
  const { state, dispatch } = useStore()
  const s = state.settings
  const [draft, setDraft] = useState({ dailyLimit: s.dailyLimit, onlineLimit: s.onlineLimit, cashLimit: s.cashLimit })
  const [gate, setGate] = useState(false)
  const [saved, setSaved] = useState(false)
  const today = new Date().toDateString()
  const pays = state.txs.filter((t) => t.kind === 'pay' && new Date(t.ts).toDateString() === today)
  const used = { all: pays.reduce((a, t) => a - t.kzt, 0), online: pays.filter((t) => ['5816', '5815'].includes(t.mcc)).reduce((a, t) => a - t.kzt, 0) }
  const changed = LIMITS.some((l) => draft[l.key] !== s[l.key])
  const raising = LIMITS.filter((l) => draft[l.key] > s[l.key])

  const save = () => {
    dispatch({ type: 'settings', patch: draft })
    dispatch({ type: 'notify', kind: 'info', title: 'Лимиты изменены', text: `Покупки ${kzt(draft.dailyLimit)}, онлайн ${kzt(draft.onlineLimit)}, наличные ${kzt(draft.cashLimit)} в день` })
    setGate(false); setSaved(true)
  }

  return (
    <Panel title="Лимиты карты" onBack={backTo(nav, back)} onClose={nav.close}
      footer={<Button disabled={!changed} onClick={() => (raising.length ? setGate(true) : save())}>
        {raising.length ? 'Подтвердить и сохранить' : 'Сохранить'}
      </Button>}>
      <div className="flex flex-col gap-3 pt-1">
        {saved && !changed && <Notice tone="ok" icon={<CheckCircle2 size={18} />}>Лимиты сохранены и уже действуют</Notice>}
        {LIMITS.map((l) => {
          const u = l.usedKind ? used[l.usedKind] : 0
          const v = draft[l.key]
          return (
            <Card key={l.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span id={`lim-${l.key}`} className="text-[14px] font-medium">{l.title}</span>
                <span className="font-display font-semibold text-[16px] num">{v === 0 ? 'Запрещено' : kzt(v)}</span>
              </div>
              <div className="mt-3">
                <Slider aria-labelledby={`lim-${l.key}`} min={l.min} max={l.max} step={l.step} value={v}
                  onValueChange={(x) => { setSaved(false); setDraft({ ...draft, [l.key]: x }) }} />
              </div>
              {l.usedKind && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
                    <div className="h-full bg-ink rounded-full" style={{ width: `${v ? Math.min(100, (u / v) * 100) : 100}%` }} />
                  </div>
                  <div className="text-[12px] text-mute mt-1 num">Сегодня потрачено {kzt(u)}</div>
                </div>
              )}
              {draft[l.key] !== s[l.key] && (
                <div className={`text-[12px] mt-2 num ${draft[l.key] > s[l.key] ? 'text-warn' : 'text-up'}`}>
                  Было {kzt(s[l.key])} → станет {kzt(draft[l.key])}
                </div>
              )}
            </Card>
          )
        })}
        {raising.length > 0 && (
          <Notice tone="warn" icon={<AlertTriangle size={18} />} title="Вы увеличиваете лимит">
            Если карту украдут, с неё смогут списать больше. Увеличение нужно подтвердить Face ID. Уменьшение действует сразу без подтверждения.
          </Notice>
        )}
        <Row label="Снятие наличных" value="Через партнёрские банкоматы" muted />
      </div>
      {gate && <BioGate reason="Увеличить лимиты карты" onCancel={() => setGate(false)} onSuccess={save} />}
    </Panel>
  )
}
