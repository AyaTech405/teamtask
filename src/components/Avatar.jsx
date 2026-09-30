import React from 'react'
import { initials } from '../utils/helpers'

/**
 * Avatar avec initiales et couleur dérivée du nom
 * Tailles : 'sm' (26px) | 'md' (32px) | 'lg' (40px) | 'xl' (52px)
 */

// Palette de couleurs pour les avatars (dérivé du nom)
const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'],
  ['#0891B2', '#ECFEFF'],
  ['#059669', '#D1FAE5'],
  ['#D97706', '#FEF3C7'],
  ['#DC2626', '#FEE2E2'],
  ['#7C3AED', '#F5F3FF'],
  ['#BE185D', '#FCE7F3'],
  ['#0369A1', '#E0F2FE'],
]

const SIZE_MAP = {
  sm: { size: 26, fontSize: 10 },
  md: { size: 32, fontSize: 12 },
  lg: { size: 40, fontSize: 15 },
  xl: { size: 52, fontSize: 18 },
}

function getColorFromName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function Avatar({ name = '', size = 'md', style, title }) {
  const { size: px, fontSize } = SIZE_MAP[size] || SIZE_MAP.md
  const [bg, text] = getColorFromName(name)

  return (
    <div
      title={title || name}
      style={{
        width: px, height: px, borderRadius: '50%',
        background: bg + '33',
        border: `1px solid ${bg}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, color: bg,
        flexShrink: 0, userSelect: 'none',
        letterSpacing: '-.5px',
        ...style,
      }}
    >
      {initials(name)}
    </div>
  )
}
