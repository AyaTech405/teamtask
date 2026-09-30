import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Boîte de confirmation modale
 * Usage :
 *   <Confirm
 *     open={open}
 *     title="Supprimer ?"
 *     message="Cette action est irréversible."
 *     variant="danger"          // 'danger' | 'warning' | 'info'
 *     confirmLabel="Supprimer"
 *     onConfirm={() => doDelete()}
 *     onCancel={() => setOpen(false)}
 *   />
 */
export default function Confirm({
  open,
  title       = 'Confirmation',
  message     = 'Êtes-vous sûr ?',
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  variant      = 'danger',   // 'danger' | 'warning' | 'info'
  loading      = false,
  onConfirm,
  onCancel,
}) {
  // Fermer avec Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const colors = {
    danger:  { icon: 'var(--danger)',  bg: 'var(--danger-dim)',  btnClass: 'btn-danger' },
    warning: { icon: 'var(--warning)', bg: 'var(--warning-dim)', btnClass: 'btn-secondary' },
    info:    { icon: 'var(--info)',    bg: 'rgba(96,165,250,.12)', btnClass: 'btn-primary' },
  }
  const style = colors[variant] || colors.danger

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      <div className="modal" style={{ width: 400 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-8">
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: style.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={16} style={{ color: style.icon }} />
            </div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onCancel}><X size={17} /></button>
        </div>

        {/* Body */}
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${style.btnClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Chargement…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
