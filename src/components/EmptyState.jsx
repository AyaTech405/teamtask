import React from 'react'

/**
 * Composant état vide standardisé
 * Usage :
 *   <EmptyState
 *     icon="◈"
 *     title="Aucun projet"
 *     subtitle="Créez votre premier projet pour commencer"
 *     action={<button …>Nouveau projet</button>}
 *   />
 */
export default function EmptyState({ icon = '○', title, subtitle, action, style }) {
  return (
    <div className="empty-state" style={style}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title    && <div className="empty-state-title">{title}</div>}
      {subtitle && <div className="empty-state-sub">{subtitle}</div>}
      {action   && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}
