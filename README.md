# Bozzihyra — необанк с золотым кешбэком

Прототип для кейса BCC Future Talent «Crypto Neobank». Все данные, котировки и комиссии тестовые.

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173
```

- `http://localhost:5173/?demo=1` — открыть сразу с примером данных (без онбординга)
- `?jury=1` — открыть режим жюри с метриками гипотезы (или 5 быстрых нажатий на «Bozzihyra 0.3» внизу профиля)
- Профиль → «Сбросить демо» — начать с онбординга
- Тестовый OTP-код: `1234`

## Деплой

Vercel: `npx vercel` (framework: Vite, build: `npm run build`, output: `dist`).
Netlify: `npx netlify deploy --prod --dir=dist` после `npm run build`.

## Структура

- `src/lib/mock.js` — котировки, комиссии, партнёры, история цены золота
- `src/store.jsx` — состояние (балансы, операции, события для метрик), сохраняется в localStorage
- `src/screens/` — Onboarding, Home (табы Карта/Золото/Акции/Крипта), Gold (Цена / О токене), Trade (OTC для любого актива), AssetPanel, Card, Cashback, Partners, TopUp, Notifications, History, Portfolio, Profile (настройки), Jury

## Сценарий для демо

Онбординг → цель → тест рисков → OTP → пополнение → покупка золота (котировка 30 сек, ошибка «котировка истекла») → оплата картой → кешбэк в мг → подключение Bybit KZ (ошибка: CryptoX Global нет в реестре МФЦА) → метрики в профиле.
