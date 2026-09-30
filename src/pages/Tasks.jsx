import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, FileDown,
  MessageCircle, Users, BarChart3
} from 'lucide-react'
import { useTasks }   from '../hooks/useTasks'
import { useProject } from '../hooks/useProjects'
import { useToast }   from '../context/ToastContext'
import { tasksAPI }   from '../api'
import Modal          from '../components/Modal'
import Confirm        from '../components/Confirm'
import Avatar         from '../components/Avatar'
import Spinner        from '../components/Spinner'
import { StatusBadge, PriorityBadge } from '../components/Badge'
import { relativeDate, isOverdue, STATUS_LABELS, PRIORITY_LABELS } from '../utils/helpers'
import { exportProjectPDF } from '../utils/pdfExport'

const COLUMNS = [
  { key: 'todo',        label: 'À faire',  color: 'var(--text-muted)' },
  { key: 'in_progress', label: 'En cours', color: 'var(--info)' },
  { key: 'done',        label: 'Terminé',  color: 'var(--success)' },
]

// ── Formulaire tâche ──────────────────────────────────────────
function TaskForm({ initial = {}, members = [], onSubmit, loading }) {
  const [title,      setTitle]      = useState(initial.title       || '')
  const [desc,       setDesc]       = useState(initial.description || '')
  const [status,     setStatus]     = useState(initial.status      || 'todo')
  const [priority,   setPriority]   = useState(initial.priority    || 'medium')
  const [assignedTo, setAssignedTo] = useState(initial.assigned_to || '')
  const [deadline,   setDeadline]   = useState(initial.deadline?.split(' ')[0] || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ title, description: desc, status, priority,
      assigned_to: assignedTo || null, deadline: deadline || null })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Titre *</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Que faut-il faire ?" required autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Détails optionnels…" />
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Statut</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priorité</label>
          <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assigné à</label>
          <select className="form-select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">— Non assigné —</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer" style={{ marginTop: 4 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : (initial.id ? 'Enregistrer' : 'Créer la tâche')}
        </button>
      </div>
    </form>
  )
}

// ── Carte tâche ───────────────────────────────────────────────
function TaskCard({ task, members, onClick }) {
  const overdue  = isOverdue(task.deadline) && task.status !== 'done'
  const assignee = members.find(m => m.id == task.assigned_to)

  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-title">{task.title}</div>
      {task.description && (
        <div className="fs-12 text-muted mb-8" style={{ lineHeight: 1.4 }}>
          {task.description.length > 60 ? task.description.slice(0, 60) + '…' : task.description}
        </div>
      )}
      <div className="task-card-meta">
        <PriorityBadge priority={task.priority} />
        {assignee && <Avatar name={assignee.name} size="sm" title={assignee.name} />}
        {task.deadline && (
          <span className={`task-card-deadline ${overdue ? 'overdue' : ''}`}>
            {overdue ? '⚠ ' : '📅 '}
            {relativeDate(task.deadline)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page Kanban ───────────────────────────────────────────────
export default function Tasks() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const { project, loading: pLoad }       = useProject(id)
  const { grouped, loading: tLoad, reload } = useTasks(id)

  const [showCreate,   setShowCreate]   = useState(false)
  const [editTask,     setEditTask]     = useState(null)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  const members = project?.members || []

  if (pLoad || tLoad) return <Spinner fullPage />

  const handleCreate = async (data) => {
    setSubmitting(true)
    try {
      await tasksAPI.create({ ...data, project_id: Number(id) })
      toast('Tâche créée', 'success')
      setShowCreate(false)
      reload()
    } catch (e) { toast(e, 'error') }
    finally    { setSubmitting(false) }
  }

  const handleUpdate = async (data) => {
    setSubmitting(true)
    try {
      await tasksAPI.update(editTask.id, { ...data, project_id: Number(id) })
      toast('Tâche mise à jour', 'success')
      setEditTask(null)
      reload()
    } catch (e) { toast(e, 'error') }
    finally    { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await tasksAPI.delete(editTask.id)
      toast('Tâche supprimée', 'success')
      setEditTask(null)
      setConfirmDel(false)
      reload()
    } catch (e) { toast(e, 'error') }
    finally    { setDeleting(false) }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus)
      reload()
    } catch (e) { toast(e, 'error') }
  }

  const handleExportPDF = () => {
    if (!project) return
    const allTasks = [...grouped.todo, ...grouped.in_progress, ...grouped.done]
    exportProjectPDF(project, allTasks)
    toast('Rapport PDF généré', 'success')
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <div className="topbar-title">{project?.name}</div>
          <div className="fs-12 text-muted">{project?.subject}</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/chat`)}>
            <MessageCircle size={14} /> Chat
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/team`)}>
            <Users size={14} /> Équipe
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/stats`)}>
            <BarChart3 size={14} /> Stats
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            <FileDown size={14} /> PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Tâche
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 0, minHeight: 0, overflow: 'hidden' }}>
        <div className="kanban" style={{ flex: 1, minHeight: 0 }}>
          {COLUMNS.map(col => {
            const colTasks = grouped[col.key] || []
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="kanban-col-dot" style={{ background: col.color }} />
                  {col.label}
                  <span className="kanban-col-count">{colTasks.length}</span>
                </div>
                <div className="kanban-col-body">
                  {colTasks.length === 0 ? (
                    <div className="task-empty">
                      <div className="task-empty-icon">○</div>
                      <div className="task-empty-text">Aucune tâche</div>
                    </div>
                  ) : colTasks.map(t => (
                    <div key={t.id}>
                      <TaskCard task={t} members={members} onClick={() => setEditTask(t)} />
                      {/* Boutons déplacement rapide */}
                      <div className="flex gap-4" style={{ marginTop: -2, paddingLeft: 2, paddingBottom: 2 }}>
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button
                            key={c.key}
                            className="btn btn-ghost"
                            style={{ fontSize: 10, padding: '1px 6px', color: 'var(--text-muted)', height: 'auto' }}
                            onClick={() => handleStatusChange(t.id, c.key)}
                            title={`→ ${c.label}`}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Bouton rapide nouvelle tâche dans colonne todo */}
                  {col.key === 'todo' && (
                    <button
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '8px', marginTop: 4, border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus size={13} /> Ajouter une tâche
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouvelle tâche" onClose={() => setShowCreate(false)}>
          <TaskForm members={members} onSubmit={handleCreate} loading={submitting} />
        </Modal>
      )}

      {/* Modal édition */}
      {editTask && (
        <Modal
          title="Modifier la tâche"
          onClose={() => setEditTask(null)}
          footer={
            <div className="flex" style={{ width: '100%' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmDel(true)}
                style={{ marginRight: 'auto' }}
              >
                <Trash2 size={13} /> Supprimer
              </button>
              <button className="btn btn-ghost" onClick={() => setEditTask(null)}>Annuler</button>
            </div>
          }
        >
          <TaskForm initial={editTask} members={members} onSubmit={handleUpdate} loading={submitting} />
        </Modal>
      )}

      {/* Confirm suppression */}
      <Confirm
        open={confirmDel}
        title="Supprimer la tâche"
        message={`Supprimer "${editTask?.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </>
  )
}
