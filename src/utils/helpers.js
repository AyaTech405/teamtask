import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(parseISO(d.includes('T') ? d : d + 'T00:00:00'), 'd MMM yyyy', { locale: fr }) }
  catch { return d }
}

export const relativeDate = (d) => {
  if (!d) return ''
  try {
    const date = parseISO(d.includes('T') ? d : d + 'T00:00:00')
    if (isPast(date)) return `${formatDistanceToNow(date, { locale: fr })} de retard`
    return `dans ${formatDistanceToNow(date, { locale: fr })}`
  } catch { return '' }
}

export const isOverdue = (d) => {
  if (!d) return false
  try { return isPast(parseISO(d.includes('T') ? d : d + 'T23:59:59')) }
  catch { return false }
}

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

export const PROJECT_COLORS = [
  '#4F46E5','#0891B2','#059669','#D97706','#DC2626',
  '#7C3AED','#BE185D','#65A30D','#EA580C','#0369A1',
]

export const randomColor = () =>
  PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]

export const STATUS_LABELS   = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé' }
export const PRIORITY_LABELS = { high: 'Urgent', medium: 'Moyen', low: 'Faible' }

export const pct = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0

export const escapeHtml = (str = '') =>
  str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
