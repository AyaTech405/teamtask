import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, CheckCircle2, AlertCircle, TrendingUp,
  ArrowRight, Clock
} from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useProjects } from '../hooks/useProjects'
import { useMyTasks }  from '../hooks/useTasks'
import ProgressBar     from '../components/ProgressBar'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { fmtDate, isOverdue, relativeDate, pct, initials } from '../utils/helpers'

export default function Dashboard() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { projects, loading: pLoad } = useProjects()
  const { tasks,    loading: tLoad } = useMyTasks()

  const totalTasks   = projects.reduce((s, p) => s + Number(p.task_count  || 0), 0)
  const doneTasks    = projects.reduce((s, p) => s + Number(p.done_count  || 0), 0)
  const overdueTasks = tasks.filter(t => isOverdue(t.deadline))
  const globalPct    = pct(doneTasks, totalTasks)

  if (pLoad || tLoad) return (
    <div className="flex-center" style={{ flex: 1 }}>
      <div className="spinner" />
    </div>
  )

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Bonjour, {user?.name?.split(' ')[0]} 👋</div>
          <div className="fs-12 text-muted" style={{ marginTop: 2 }}>Voici l'état de vos projets</div>
        </div>
      </div>

      <div className="content">
        {/* Stats */}
        <div className="stats-row mb-20">
          <StatCard
            icon={<FolderKanban size={22} />}
            value={projects.length}
            label="Projets actifs"
            accent="var(--accent-hv)"
          />
          <StatCard
            icon={<CheckCircle2 size={22} />}
            value={tasks.length}
            label="Mes tâches en cours"
            accent="var(--info)"
          />
          <StatCard
            icon={<AlertCircle size={22} />}
            value={overdueTasks.length}
            label="Tâches en retard"
            accent={overdueTasks.length > 0 ? 'var(--danger)' : 'var(--success)'}
          />
          <StatCard
            icon={<TrendingUp size={22} />}
            value={`${globalPct}%`}
            label="Avancement global"
            accent="var(--success)"
          />
        </div>

        {/* Mes tâches assignées */}
        <SectionHeader title="Mes tâches assignées" count={tasks.length} />
        {tasks.length === 0 ? (
          <div className="empty-state mb-20" style={{ padding: '30px 0' }}>
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">Aucune tâche en cours</div>
            <div className="empty-state-sub">Profitez-en !</div>
          </div>
        ) : (
          <div className="card-grid mb-20">
            {tasks.map(t => (
              <div
                key={t.id}
                className="card card-hover"
                onClick={() => navigate(`/projects/${t.project_id}/tasks`)}
              >
                <div className="flex gap-6 mb-8" style={{ alignItems: 'center' }}>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="fw-700 fs-13 mb-8" style={{ lineHeight: 1.4 }}>{t.title}</div>
                <div
                  className="fs-12 text-muted"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: t.project_color, display: 'inline-block', flexShrink: 0
                    }}
                  />
                  {t.project_name}
                </div>
                {t.deadline && (
                  <div className={`flex items-center gap-6 mt-8 fs-12 ${isOverdue(t.deadline) ? 'text-danger' : 'text-muted'}`}>
                    <Clock size={11} />
                    {relativeDate(t.deadline)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projets récents */}
        <SectionHeader
          title="Projets récents"
          action={projects.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              Voir tous <ArrowRight size={13} />
            </button>
          )}
        />
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◈</div>
            <div className="empty-state-title">Aucun projet pour l'instant</div>
            <div className="empty-state-sub">Créez votre premier projet</div>
            <button className="btn btn-primary mt-16" onClick={() => navigate('/projects')}>
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {projects.slice(0, 6).map(p => (
              <div
                key={p.id}
                className="project-card"
                onClick={() => navigate(`/projects/${p.id}/tasks`)}
              >
                <div
                  className="project-card-stripe"
                  style={{ background: p.color }}
                />
                <div className="project-card-subject">{p.subject}</div>
                <div className="project-card-name">{p.name}</div>
                <ProgressBar done={Number(p.done_count || 0)} total={Number(p.task_count || 0)} />
                <div className="project-card-meta">
                  <span>👥 {p.member_count}</span>
                  <span>📋 {p.task_count} tâche{p.task_count > 1 ? 's' : ''}</span>
                  {p.deadline && (
                    <span className="ml-auto">📅 {fmtDate(p.deadline)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({ icon, value, label, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ color: accent }}>{icon}</div>
      <div className="stat-card-value" style={{ color: accent }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

function SectionHeader({ title, count, action }) {
  return (
    <div className="flex items-center gap-8 mb-16">
      <h3 className="fw-700" style={{ fontSize: 14 }}>{title}</h3>
      {count !== undefined && (
        <span className="mono fs-12 text-muted">({count})</span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}
