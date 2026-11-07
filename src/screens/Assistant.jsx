import { useEffect, useRef, useState } from 'react'
import { Button as GButton } from 'glisse'
import { ArrowUp, Bot } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ASSETS, CUSTODY, FEES, PARTNERS } from '../lib/mock.js'
import { kzt, qty, time } from '../lib/format.js'
import { Panel } from '../components/ui.jsx'
import { realized } from './ProfilePages.jsx'

const SUGGESTIONS = [
  'Почему отклонили оплату?',
  'Сколько я заплатил комиссий?',
  'Как считается кешбэк в золоте?',
  'Где хранится моё золото?',
  'Сколько я потратил за месяц?',
  'Стоит ли сейчас купить золото?',
]

const has = (q, ...words) => words.some((w) => q.includes(w))
const MONTH = 30 * 86400000

// Сценарный ответ: текст, необязательная табличка строк и кнопки-действия
function answer(raw, ctx) {
  const { state, totals, prices } = ctx
  const q = raw.toLowerCase()
  const s = state.settings
  const recent = state.txs.filter((t) => Date.now() - t.ts < MONTH)

  if (has(q, 'потерял', 'украл', 'украли', 'мошен')) {
    return {
      text: 'Сначала обезопасим деньги. Заморозьте карту: оплаты сразу перестанут проходить, а деньги и активы останутся на месте. Если карта у чужих людей, лучше заблокировать её навсегда и выпустить новую, это делается на той же странице.',
      actions: [{ label: 'Заморозить карту', go: ['freeze', { reason: 'lost' }] }, { label: 'Завершить чужие сеансы', go: ['security'] }],
    }
  }

  if (has(q, 'отклон', 'не прош', 'не проход', 'отказ')) {
    const n = state.notifications.find((x) => x.kind === 'error' && x.title.startsWith('Оплата отклонена'))
    if (!n) return { text: 'За последнее время отказов в оплате не было. Если что-то не прошло, причина появится в уведомлениях и в этом чате.' }
    const fix = s.frozen ? ['freeze', {}, 'Разморозить карту']
      : n.text.includes('интернет') || n.text.includes('подписк') || n.text.includes('зарубеж') ? ['online', {}, 'Настройки онлайн-оплаты']
        : n.text.includes('лимит') ? ['limits', {}, 'Изменить лимиты']
          : ['topup', {}, 'Пополнить баланс']
    return {
      text: `Последний отказ: ${n.title.replace('Оплата отклонена · ', '')}, ${time(n.ts)}.\n${n.text}`,
      actions: [{ label: fix[2], go: [fix[0], fix[1]] }],
    }
  }

  if (has(q, 'купить', 'продать', 'стоит ли', 'вырастет', 'упадёт', 'упадет', 'прогноз', 'совет', 'выгодн', 'куда вложить', 'инвест')) {
    return {
      text: 'Я не даю инвестиционных советов и не прогнозирую цены: золото, акции и крипта могут как расти, так и снижаться. Решение за вами. Могу показать факты, которые помогут решить: текущую цену и её изменение, комиссии, условия хранения и риски.',
      rows: [['Золото, 1 г', kzt(prices.gold)], ['Спред золота', `${ASSETS.gold.spread * 100}%`], ['Комиссия', `${FEES.commission * 100}%, мин. ${kzt(FEES.minCommission)}`]],
      actions: [{ label: 'График золота', tab: 'gold' }, { label: 'Условия и риски', go: ['documents'] }],
    }
  }

  if (has(q, 'комисс', 'спред', 'переплат')) {
    const trades = recent.filter((t) => t.kind === 'buy' || t.kind === 'sell')
    const tradeFee = trades.reduce((a, t) => a + (t.fee || 0), 0)
    const spread = trades.reduce((a, t) => a + Math.abs(t.kzt) * (ASSETS[t.asset]?.spread || 0), 0)
    const transferFee = recent.filter((t) => t.kind === 'transfer').reduce((a, t) => a + (t.fee || 0), 0)
    return {
      text: trades.length || transferFee
        ? `За 30 дней вы заплатили ${kzt(tradeFee + transferFee)} комиссий. Ещё около ${kzt(spread)} пришлось на спред: это разница между биржевой ценой и ценой сделки, она видна в каждой котировке до подтверждения.`
        : 'За последние 30 дней сделок и переводов с комиссией не было. Обслуживание карты и хранение активов бесплатные.',
      rows: [['Комиссии за сделки', kzt(tradeFee)], ['Переводы с бирж', kzt(transferFee)], ['Спред (оценка)', kzt(spread)], ['Сделок', String(trades.length)]],
      actions: [{ label: 'Все тарифы', go: ['documents'] }],
    }
  }

  if (has(q, 'кешб', 'кэшб', 'cashback')) {
    const cb = state.txs.filter((t) => t.kind === 'cashback')
    const g = cb.reduce((a, t) => a + (t.grams || 0), 0)
    const k = cb.reduce((a, t) => a + t.cashbackKzt, 0)
    const ex = 10000 * FEES.cashbackRate / prices.gold
    return {
      text: `С каждой покупки картой 1% переводится в выбранный актив по цене на момент покупки. Сейчас вы получаете кешбэк ${state.cashback === 'btc' ? 'в BTC' : 'в золоте'}.\nПример: покупка 10 000 ₸ → 100 ₸ → ${qty(ASSETS.gold, ex)} золота. Граммы остаются вашими, а их стоимость в тенге меняется вместе с ценой золота, вверх и вниз.`,
      rows: [['Получено всего', `${qty(ASSETS.gold, g)} золота`], ['Это было на момент начисления', kzt(k, 2)], ['Стоит сейчас', kzt(g * prices.gold, 2)]],
      actions: [{ label: 'Настроить кешбэк', go: ['cashback'] }],
    }
  }

  if (has(q, 'хран', 'аудит', 'обеспеч', 'настоящ', 'физическ')) {
    return {
      text: `Каждый bzGOLD обеспечен 1 граммом физического золота пробы 999,9. Металл хранится у кастодиана, отдельно от денег банка. Аудитор проверяет хранилище и публикует отчёт каждый месяц.`,
      rows: [['Кастодиан', CUSTODY.custodian], ['Последний аудит', CUSTODY.lastAudit], ['Всего выпущено', CUSTODY.totalIssued], ['Ваше золото', qty(ASSETS.gold, state.balances.gold)]],
      actions: [{ label: 'Подробнее о токене', tab: 'gold' }],
    }
  }

  if (has(q, 'потрат', 'расход', 'трачу')) {
    const pays = recent.filter((t) => t.kind === 'pay')
    const sum = pays.reduce((a, t) => a - t.kzt, 0)
    const by = {}
    pays.forEach((t) => { by[t.title] = (by[t.title] || 0) - t.kzt })
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return {
      text: pays.length ? `За 30 дней покупки картой составили ${kzt(sum)}, это ${pays.length} операций. Кешбэк с них уже пришёл в ${state.cashback === 'btc' ? 'BTC' : 'золоте'}.` : 'За последние 30 дней покупок картой не было.',
      rows: top.map(([name, v]) => [name, kzt(v)]),
      actions: [{ label: 'История по карте', go: ['history', { filter: 'card' }] }],
    }
  }

  if (has(q, 'баланс', 'сколько у меня', 'портфел', 'всего')) {
    return {
      text: `Всего у вас ${kzt(totals.all)}. Из них ${kzt(totals.partners)} хранится на биржах-партнёрах, остальное в Bozzihyra.`,
      rows: [['Карта', kzt(totals.kzt)], ['Золото', kzt(totals.gold)], ['Акции', kzt(totals.stocks)], ['Крипта', kzt(totals.crypto)], ['На биржах', kzt(totals.partners)]],
      actions: [{ label: 'Весь портфель', go: ['portfolio'] }],
    }
  }

  if (has(q, 'лимит')) {
    return {
      text: 'Лимиты можно менять в любой момент. Уменьшение действует сразу, увеличение подтверждается Face ID.',
      rows: [['Покупки в день', kzt(s.dailyLimit)], ['Онлайн в день', kzt(s.onlineLimit)], ['Наличные в день', kzt(s.cashLimit)]],
      actions: [{ label: 'Изменить лимиты', go: ['limits'] }],
    }
  }

  if (has(q, 'замороз', 'заблок', 'разморо')) {
    return {
      text: s.frozen ? 'Карта сейчас заморожена: оплаты отклоняются. Разморозить можно в один шаг с подтверждением Face ID.' : 'Заморозка временно запрещает оплаты картой. Деньги, переводы на карту и активы продолжают работать.',
      actions: [{ label: s.frozen ? 'Разморозить' : 'Заморозить карту', go: ['freeze'] }],
    }
  }

  if (has(q, 'налог', 'деклар')) {
    const rows = realized(state.txs)
    const total = rows.reduce((a, r) => a + r.result, 0)
    return {
      text: `Налог считается с прибыли от продажи активов. Ваш реализованный результат в этом году: ${kzt(total)}. Это предварительная оценка: ставки и порядок по Налоговому кодексу РК 2026 нужно проверить.`,
      actions: [{ label: 'Раздел «Налоги»', go: ['taxes'] }],
    }
  }

  if (has(q, 'бирж', 'binance', 'bybit', 'ataix', 'usdt', 'мфца')) {
    const conn = PARTNERS.filter((p) => state.partners[p.id])
    return {
      text: `Можно подключать только биржи из реестра МФЦА: Binance KZ, Bybit KZ, ATAIX Eurasia. Мы видим балансы, а активы остаются у биржи. ${conn.length ? `Подключено: ${conn.map((p) => p.name).join(', ')}.` : 'Пока ни одна не подключена.'}${s.autoConvert ? ' Включена автоконвертация: если на карте не хватит денег, докупим тенге из USDT.' : ''}`,
      actions: [{ label: 'Биржи-партнёры', tab: 'partners' }],
    }
  }

  if (has(q, 'реквизит', 'iban', 'номер карт', 'cvv')) {
    return { text: 'Реквизиты карты откроются на странице карты после подтверждения Face ID. Там же их можно скопировать.', actions: [{ label: 'Открыть карту', go: ['cardPage'] }] }
  }

  if (has(q, 'привет', 'здравств', 'салем', 'сәлем', 'hello')) {
    return { text: `Здравствуйте, ${state.user.name}! Спросите про оплату, комиссии, кешбэк, хранение золота или расходы.` }
  }
  if (has(q, 'спасибо', 'рахмет')) return { text: 'Пожалуйста! Если что-то ещё будет непонятно, я здесь.' }

  return {
    text: 'Пока я умею отвечать на вопросы о вашем счёте: почему отклонили оплату, сколько ушло на комиссии, как работает кешбэк в золоте, где хранится золото, расходы, лимиты, биржи и налоги. Попробуйте один из вопросов ниже.',
    suggest: true,
  }
}

// История переписки живёт, пока открыта вкладка браузера
let saved = null

export default function Assistant({ nav, ask }) {
  const ctx = useStore()
  const { state, dispatch } = ctx
  const [msgs, setMsgs] = useState(() => saved || [{
    id: 'hi', from: 'bot',
    text: `Здравствуйте, ${state.user.name}! Я помогаю разобраться в счёте: объясняю комиссии, отказы, кешбэк и хранение золота. Инвестиционных советов не даю.`,
    suggest: true,
  }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef(null)
  const asked = useRef(false)

  useEffect(() => { saved = msgs }, [msgs])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, typing])

  const send = (text) => {
    const q = text.trim()
    if (!q || typing) return
    setInput('')
    setMsgs((m) => [...m, { id: `u${Date.now()}`, from: 'me', text: q }])
    setTyping(true)
    dispatch({ type: 'track', name: 'assistant_question' })
    setTimeout(() => {
      setMsgs((m) => [...m, { id: `b${Date.now()}`, from: 'bot', ...answer(q, ctx) }])
      setTyping(false)
    }, 700 + Math.min(900, q.length * 15))
  }

  // Открыли помощника с готовым вопросом (например, из окна отказа в оплате)
  useEffect(() => {
    if (ask && !asked.current) { asked.current = true; send(ask) }
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const act = (a) => {
    if (a.tab) nav.tab(a.tab)
    else nav.open(a.go[0], a.go[1] || {})
  }

  return (
    <Panel title="Помощник" onClose={nav.close}
      footer={
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(input) }}>
          <label htmlFor="ask" className="sr-only">Вопрос помощнику</label>
          <input id="ask" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Спросите о счёте…" autoComplete="off"
            className="flex-1 h-12 rounded-full bg-card border border-line px-4 text-[15px] outline-none focus:border-ink" />
          <GButton type="submit" variant="filled" icon={<ArrowUp />} aria-label="Отправить" disabled={!input.trim() || typing}
            style={{ width: 48, height: 48, borderRadius: 24 }} />
        </form>
      }>
      <div className="flex flex-col gap-3 pt-1" aria-live="polite">
        <p className="text-[11px] text-mute text-center">Демо-помощник: отвечает по шаблонам и данным из приложения</p>
        {msgs.map((m) => m.from === 'me' ? (
          <div key={m.id} className="self-end max-w-[80%] rounded-[20px] rounded-br-md bg-ink text-paper px-4 py-2.5 text-[14px] leading-snug anim-rise">{m.text}</div>
        ) : (
          <div key={m.id} className="flex gap-2 items-end max-w-[92%] anim-rise">
            <span className="w-7 h-7 rounded-full bg-ink text-paper grid place-items-center shrink-0"><Bot size={15} /></span>
            <div className="flex flex-col gap-2 min-w-0">
              <div className="bz-card rounded-bl-md py-3 px-4 text-[14px] leading-snug whitespace-pre-line">
                {m.text}
                {m.rows?.length > 0 && (
                  <dl className="mt-2.5 pt-2 border-t border-line flex flex-col gap-1.5 text-[13px]">
                    {m.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3"><dt className="text-mute">{k}</dt><dd className="num text-right">{v}</dd></div>
                    ))}
                  </dl>
                )}
              </div>
              {m.actions?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.actions.map((a) => (
                    <button key={a.label} onClick={() => act(a)} className="h-9 px-3.5 rounded-full bg-ink text-paper text-[13px] font-semibold">{a.label}</button>
                  ))}
                </div>
              )}
              {m.suggest && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((sg) => (
                    <button key={sg} onClick={() => send(sg)} className="h-9 px-3.5 rounded-full border border-line bg-card text-[13px]">{sg}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2 items-center text-mute text-[13px]" role="status">
            <span className="w-7 h-7 rounded-full bg-ink text-paper grid place-items-center"><Bot size={15} /></span>
            печатает…
          </div>
        )}
        <div ref={end} />
      </div>
    </Panel>
  )
}
