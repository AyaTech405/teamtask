import React from 'react'
import { pct } from '../utils/helpers'

export default function ProgressBar({ done, total, showLabel = true, success = false }) {
  const p = pct(done, total)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress" style={{ flex: 1 }}>
        <div
          className={`progress-bar ${success || p === 100 ? 'progress-bar-success' : ''}`}
          style={{ width: `${p}%` }}
        />
      </div>
      {showLabel && (
        <span className="mono fs-12 text-muted">{p}%</span>
      )}
    </div>
  )
}
