import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Users, BarChart3 } from 'lucide-react'
import { useProject } from '../hooks/useProjects'
import { tasksAPI }   from '../api'
import Spinner        from '../components/Spinner'
import Avatar         from '../components/Avatar'
import ProgressBar    from '../components/ProgressBar'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { fmtDate, relativeDate, isOverdue, pct, PRIORITY_LABELS, STATUS_LABELS } from '../utils/helpers'

export default function Stats() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { project, loading: pLoad } = useProject(id)
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    tasksAPI.list(id)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (pLoad || loading) return <Spinner fullPage />

  const members = project?.members || []

  const byStatus   = {
    todo:        tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done:        tasks.filter(t => t.status === 'done'),
  }
  const overdue    = tasks.filter(t => isOverdue(t.deadline) && t.status !== 'done')
  const unassigned = tasks.filter(t => !t.assigned_to)
  const highPrio   = tasks.filter(t => t.priority === 'high' && t.status !== 'done')

  // Stats par membre
  const memberStats = members.map(m => {
    const assigned = tasks.filter(t => t.assigned_to == m.id)
    const done     = assigned.filter(t => t.status === 'done')
    return {
      ...m,
      total: assigned.length,
      done:  done.length,
      pct:   pct(done.length, assigned.length),
    }
  }).sort((a, b) => b.total - a.total)

  // Stats par priorité
  const byPriority = ['high', 'medium', 'low'].map(p => ({
    key:   p,
    label: PRIORITY_LABELS[p],
    count: tasks.filter(t => t.priority === p).length,
    done:  tasks.filter(t => t.priority === p && t.status === 'done').length,
  }))

  return (
    <>
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/tasks`)}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <div className="topbar-title">Statistiques — {project?.name}</div>
          <div className="fs-12 text-muted">{project?.subject}</div>
        </div>
      </div>

      <div className="content">
        {/* KPIs principaux */}
        <div className="stats-row mb-20">
          <KPI icon={<CheckCircle2 size={20} />} value={`${pct(byStatus.done.length, tasks.length)}%`} label="Taux de complétion" color="var(--success)" />
          <KPI icon={<BarChart3 size={20} />}    value={tasks.length}                                   label="Tâches au total"     color="var(--accent-hv)" />
          <KPI icon={<AlertTriangle size={20} />} value={overdue.length}                                label="Tâches en retard"    color={overdue.length ? 'var(--danger)' : 'var(--success)'} />
          <KPI icon={<Users size={20} />}         value={members.length}                                label="Membres"             color="var(--info)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Répartition par statut */}
          <div className="card">
            <div className="fw-700 mb-16" style={{ fontSize: 13 }}>Répartition par statut</div>
            {Object.entries(byStatus).map(([key, list]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-8 mb-8">
                  <StatusBadge status={key} />
                  <span className="ml-auto mono fs-12 text-muted">{list.length} / {tasks.length}</span>
                </div>
                <ProgressBar done={list.length} total={tasks.length} showLabel={false} />
              </div>
            ))}
          </div>

          {/* Répartition par priorité */}
          <div className="card">
            <div className="fw-700 mb-16" style={{ fontSize: 13 }}>Répartition par priorité</div>
            {byPriority.map(p => (
              <div key={p.key} style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-8 mb-8">
                  <PriorityBadge priority={p.key} />
                  <span className="ml-auto mono fs-12 text-muted">{p.done}/{p.count} terminées</span>
                </div>
                <ProgressBar done={p.done} total={p.count} showLabel={false} success={p.done === p.count && p.count > 0} />
              </div>
            ))}
          </div>
        </div>

        {/* Stats par membre */}
        <div className="fw-700 mb-16" style={{ fontSize: 13 }}>Charge de travail par membre</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
          {memberStats.map(m => (
            <div key={m.id} className="card">
              <div className="flex items-center gap-10 mb-12">
                <Avatar name={m.name} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-700 fs-13 truncate">{m.name}</div>
                  <div className="fs-12 text-muted">{m.role === 'owner' ? '👑 Propriétaire' : '👤 Membre'}</div>
                </div>
                <div className="mono fw-700" style={{ fontSize: 18, color: 'var(--accent-hv)' }}>{m.pct}%</div>
              </div>
              <ProgressBar done={m.done} total={m.total} success={m.pct === 100 && m.total > 0} />
              <div className="flex gap-12 mt-8">
                <div className="text-center" style={{ flex: 1 }}>
                  <div className="mono fw-700" style={{ fontSize: 16 }}>{m.total}</div>
                  <div className="fs-11 text-muted">assignées</div>
                </div>
                <div className="text-center" style={{ flex: 1 }}>
                  <div className="mono fw-700" style={{ fontSize: 16, color: 'var(--success)' }}>{m.done}</div>
                  <div className="fs-11 text-muted">terminées</div>
                </div>
                <div className="text-center" style={{ flex: 1 }}>
                  <div className="mono fw-700" style={{ fontSize: 16, color: m.total - m.done > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{m.total - m.done}</div>
                  <div className="fs-11 text-muted">en cours</div>
                </div>
              </div>
            </div>
          ))}
          {unassigned.length > 0 && (
            <div className="card" style={{ borderStyle: 'dashed' }}>
              <div className="flex items-center gap-10 mb-12">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', border: '1px dashed var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>?</div>
                <div><div className="fw-700 fs-13">Non assignées</div></div>
                <div className="ml-auto mono fw-700" style={{ fontSize: 18, color: 'var(--text-muted)' }}>{unassigned.length}</div>
              </div>
              <div className="fs-12 text-muted">Ces tâches n'ont pas de responsable désigné.</div>
            </div>
          )}
        </div>

        {/* Tâches urgentes */}
        {(overdue.length > 0 || highPrio.length > 0) && (
          <>
            <div className="fw-700 mb-16" style={{ fontSize: 13, color: 'var(--danger)' }}>
              ⚠ Points d'attention ({overdue.length + highPrio.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[...overdue, ...highPrio.filter(t => !overdue.find(o => o.id === t.id))].slice(0, 8).map(t => (
                <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="fs-13 fw-700" style={{ flex: 1 }}>{t.title}</span>
                  {t.assigned_name && <Avatar name={t.assigned_name} size="sm" title={t.assigned_name} />}
                  {t.deadline && (
                    <span className={`fs-12 ${isOverdue(t.deadline) ? 'text-danger fw-700' : 'text-muted'}`}>
                      {isOverdue(t.deadline) ? '⚠ ' : '📅 '}{relativeDate(t.deadline)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Timeline deadline */}
        {project?.deadline && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Clock size={20} style={{ color: isOverdue(project.deadline) ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="fw-700 fs-13">Deadline du projet</div>
              <div className="fs-12 text-muted">{fmtDate(project.deadline)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={`fw-700 ${isOverdue(project.deadline) ? 'text-danger' : 'text-warning'}`}>
                {isOverdue(project.deadline) ? '⚠ Expiré' : relativeDate(project.deadline)}
              </div>
              <div className="fs-12 text-muted">{pct(byStatus.done.length, tasks.length)}% complété</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function KPI({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div style={{ color, marginBottom: 6, opacity: .7 }}>{icon}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
