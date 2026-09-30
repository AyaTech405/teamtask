import React from 'react'
import { STATUS_LABELS, PRIORITY_LABELS } from '../utils/helpers'

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge-${priority}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  )
}
