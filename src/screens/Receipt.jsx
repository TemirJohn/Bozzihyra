import { useState } from 'react'
import { Share2, Download, Flag, RotateCw, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS } from '../lib/mock.js'
import { kzt, qtyExact, btc } from '../lib/format.js'
import { download } from '../lib/download.js'
import { Panel, Button, Notice, Choice } from '../components/ui.jsx'
import GoldBar from '../components/GoldBar.jsx'

const KIND = {
  pay: 'Покупка картой', cashback: 'Начисление кешбэка', buy: 'Покупка актива', sell: 'Продажа актива',
  topup: 'Пополнение', transfer: 'Перевод с биржи',
}
const DISPUTE = ['Я не совершал эту операцию', 'Деньги списали дважды', 'Товар или услугу не получил', 'Сумма отличается от чека']

function receiptRows(t, txs) {
  const asset = t.asset ? ASSETS[t.asset] : null
  const rows = []
  if (t.kind === 'pay') {
    rows.push(['Магазин', t.title], ['Категория', t.sub], ['MCC', t.mcc || '—'], ['Карта', `VISA •••• ${t.last4 || '2026'}`])
    const cb = txs.find((x) => x.kind === 'cashback' && x.title === `Кешбэк · ${t.title}` && Math.abs(x.ts - t.ts) < 3000)
    if (cb) rows.push(['Кешбэк 1%', cb.grams ? `${qtyExact(ASSETS.gold, cb.grams)} золота` : cb.btc ? btc(cb.btc) : kzt(cb.kztBack, 2)])
  }
  if (t.kind === 'cashback') {
    rows.push(['За покупку', t.title.replace('Кешбэк · ', ''), ], ['1% от покупки', kzt(t.cashbackKzt, 2)])
    if (t.grams) rows.push(['Получено', qtyExact(ASSETS.gold, t.grams)], ['Цена 1 г на момент начисления', kzt(t.cashbackKzt / t.grams)])
    if (t.btc) rows.push(['Получено', btc(t.btc)])
  }
  if ((t.kind === 'buy' || t.kind === 'sell') && asset) {
    rows.push(['Актив', `${asset.name} (${asset.symbol})`], ['Количество', qtyExact(asset, Math.abs(t.qty))])
    if (t.price) rows.push(['Цена с учётом спреда', kzt(t.price)])
    rows.push(['Спред', `${(asset.spread * 100).toFixed(1)}%`], ['Комиссия', kzt(t.fee || 0)], ['Котировка', `Q-${t.id.slice(0, 6).toUpperCase()}`])
  }
  if (t.kind === 'topup') rows.push(['Источник', 'Карта другого банка •••• 4417'], ['Комиссия', '0 ₸'])
  if (t.kind === 'transfer') rows.push(['Откуда', t.title.replace(/^(Перевод с |Автоконвертация · )/, '')], ['Сумма', t.sub], ['Комиссия', t.fee ? kzt(t.fee) : '0,3%'])
  return rows
}

export default function Receipt({ id, back, nav }) {
  const { state, dispatch } = useStore()
  const t = state.txs.find((x) => x.id === id)
  const [step, setStep] = useState('view') // view | dispute | disputed
  const [reason, setReason] = useState(null)
  const [flash, setFlash] = useState('')
  if (!t) return null

  const asset = t.asset ? ASSETS[t.asset] : null
  const amount = t.kind === 'cashback'
    ? (t.grams ? `+${qtyExact(ASSETS.gold, t.grams)}` : t.btc ? `+${btc(t.btc)}` : `+${kzt(t.kztBack, 2)}`)
    : `${t.kzt > 0 ? '+' : ''}${kzt(t.kzt)}`
  const rows = receiptRows(t, state.txs)
  const date = new Date(t.ts)
  const txId = `TX-${t.id.toUpperCase()}`
  const text = [
    'Bozzhyra · чек операции (тест)', KIND[t.kind], amount, '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    `Дата: ${date.toLocaleString('ru-RU')}`, `Статус: Проведена`, `ID: ${txId}`,
  ].join('\n')

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Чек Bozzhyra', text })
      else { await navigator.clipboard.writeText(text); setFlash('Чек скопирован') }
    } catch { /* пользователь закрыл окно */ }
  }

  if (step === 'disputed') {
    return (
      <Panel title="" onClose={nav.close} footer={<Button onClick={nav.close}>Готово</Button>}>
        <div className="flex flex-col items-center text-center pt-14 gap-3">
          <CheckCircle2 size={56} className="text-up anim-pop" />
          <div className="font-display font-semibold text-[20px]">Заявка принята</div>
          <p className="text-[14px] text-mute max-w-[30ch]">Номер заявки D-{t.id.slice(0, 5).toUpperCase()}. Ответим в течение 30 дней. Статус придёт в уведомления.</p>
        </div>
      </Panel>
    )
  }

  if (step === 'dispute') {
    return (
      <Panel title="Оспорить операцию" onBack={() => setStep('view')} onClose={nav.close}
        footer={<Button disabled={!reason} onClick={() => {
          dispatch({ type: 'notify', kind: 'info', title: `Заявка D-${t.id.slice(0, 5).toUpperCase()} принята`, text: `Оспаривание ${kzt(-t.kzt)} · ${t.title}. Ответ в течение 30 дней.` })
          setStep('disputed')
        }}>Отправить заявку</Button>}>
        <div className="flex flex-col gap-3 pt-1">
          <p className="text-[14px] text-mute">{t.title} · {kzt(-t.kzt)} · {date.toLocaleDateString('ru-RU')}</p>
          {DISPUTE.map((r) => (
            <Choice key={r} selected={reason === r} onClick={() => setReason(r)} className="py-3.5 text-[14px]">{r}</Choice>
          ))}
          {reason === DISPUTE[0] && (
            <Notice tone="warn" title="Рекомендуем заморозить карту">Если операцию совершили не вы, заморозьте карту, чтобы не было новых списаний.</Notice>
          )}
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Чек" onBack={back ? () => nav.open(back.type, back) : undefined} onClose={nav.close}>
      <div className="flex flex-col gap-4 pt-1">
        <div className="bz-card bz-receipt rounded-b-none border-b-0">
          <div className="flex flex-col items-center text-center pt-2 pb-4 border-b border-dashed border-line">
            {asset && asset.kind !== 'gold'
              ? <span className="w-12 h-12 rounded-full bg-vault text-white grid place-items-center font-display font-semibold text-[14px]">{asset.symbol.slice(0, 2)}</span>
              : t.cat === 'gold'
                ? <GoldBar live={false} size={56} className="-my-1" />
                : <span className="w-12 h-12 rounded-full bg-ink text-paper grid place-items-center font-display font-semibold">{t.title[0]}</span>}
            <div className="text-[13px] text-mute mt-3">{KIND[t.kind]}</div>
            <div className="font-display font-semibold text-[26px] num mt-0.5">{amount}</div>
            <div className="text-[13px] mt-1 flex items-center gap-1.5 text-up"><CheckCircle2 size={14} /> Проведена</div>
          </div>
          <dl className="pt-3 flex flex-col gap-2.5 text-[13px]">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-mute">{k}</dt><dd className="num text-right">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4"><dt className="text-mute">Дата и время</dt><dd className="num">{date.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-mute">ID операции</dt><dd className="font-mono text-[12px]">{txId}</dd></div>
          </dl>
          <div className="text-center text-[11px] text-mute mt-5">Bozzhyra · тестовый чек</div>
        </div>

        {flash && <Notice tone="ok">{flash}</Notice>}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" className="h-11!" onClick={share}><Share2 size={16} /> Поделиться</Button>
          <Button variant="ghost" size="sm" className="h-11!" onClick={() => { download(`chek-${t.id}.txt`, text); setFlash('Чек сохранён в загрузки') }}><Download size={16} /> Сохранить</Button>
          {t.kind === 'pay' && <Button variant="danger" size="sm" className="h-11! col-span-2" onClick={() => setStep('dispute')}><Flag size={16} /> Оспорить операцию</Button>}
          {(t.kind === 'buy' || t.kind === 'sell') && (
            <Button size="sm" className="h-11! col-span-2" onClick={() => nav.open('trade', { asset: t.asset, mode: t.kind })}><RotateCw size={16} /> Повторить</Button>
          )}
        </div>
      </div>
    </Panel>
  )
}
