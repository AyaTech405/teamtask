import React from 'react'

/**
 * Spinner de chargement centré, tailles configurables
 * Usage : <Spinner /> | <Spinner size={40} /> | <Spinner fullPage />
 */
export default function Spinner({ size = 28, fullPage = false }) {
  const el = (
    <div
      style={{
        width: size, height: size,
        border: `${Math.max(2, size / 12)}px solid var(--border-2)`,
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin .65s linear infinite',
        flexShrink: 0,
      }}
    />
  )

  if (fullPage) {
    return (
      <div className="flex-center" style={{ flex: 1, height: '100%' }}>
        {el}
      </div>
    )
  }

  return el
}
