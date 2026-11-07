// Параметры ссылки для быстрого перехода к экрану (демо на защите и скриншоты).
// Читаются при загрузке модуля, до того как store уберёт ?demo=1 из адреса.
export const qp = (() => {
  try { return new URLSearchParams(location.search) } catch { return new URLSearchParams() }
})()
export const q = (name) => qp.get(name)
