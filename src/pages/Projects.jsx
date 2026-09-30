import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ListTodo, MessageCircle, Users } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useToast }    from '../context/ToastContext'
import { projectsAPI } from '../api'
import Modal           from '../components/Modal'
import ProgressBar     from '../components/ProgressBar'
import { fmtDate, randomColor, PROJECT_COLORS } from '../utils/helpers'

// ── Formulaire projet ─────────────────────────────────────────
function ProjectForm({ initial = {}, onSubmit, loading }) {
  const [name,    setName]    = useState(initial.name        || '')
  const [subject, setSubject] = useState(initial.subject     || '')
  const [desc,    setDesc]    = useState(initial.description || '')
  const [color,   setColor]   = useState(initial.color       || randomColor())
  const [deadline,setDeadline]= useState(initial.deadline?.split(' ')[0] || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ name, subject, description: desc, color, deadline: deadline || null })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Nom du projet *</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ex: Rapport de stage" required />
      </div>
      <div className="form-group">
        <label className="form-label">Matière *</label>
        <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="Ex: Génie Logiciel" required />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Objectif du projet…" />
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Couleur</label>
          <div className="flex gap-6" style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {PROJECT_COLORS.map(c => (
              <div
                key={c} onClick={() => setColor(c)}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  outline: color === c ? `2px solid var(--accent-hv)` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="modal-footer" style={{ marginTop: 4 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : (initial.id ? 'Enregistrer' : 'Créer le projet')}
        </button>
      </div>
    </form>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function Projects() {
  const navigate   = useNavigate()
  const toast      = useToast()
  const { projects, loading, reload } = useProjects()

  const [showCreate, setShowCreate] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [submitting,  setSubmitting]  = useState(false)

  const handleCreate = async (data) => {
    setSubmitting(true)
    try {
      await projectsAPI.create(data)
      toast('Projet créé !', 'success')
      setShowCreate(false)
      reload()
    } catch (e) { toast(e, 'error') }
    finally    { setSubmitting(false) }
  }

  const handleUpdate = async (data) => {
    setSubmitting(true)
    try {
      await projectsAPI.update(editProject.id, data)
      toast('Projet modifié', 'success')
      setEditProject(null)
      reload()
    } catch (e) { toast(e, 'error') }
    finally    { setSubmitting(false) }
  }

  const handleDelete = async (p) => {
    if (!confirm(`Supprimer "${p.name}" et toutes ses tâches ?`)) return
    try {
      await projectsAPI.delete(p.id)
      toast('Projet supprimé', 'success')
      reload()
    } catch (e) { toast(e, 'error') }
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Mes projets</span>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Nouveau projet
          </button>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="flex-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◈</div>
            <div className="empty-state-title">Aucun projet pour l'instant</div>
            <div className="empty-state-sub">Créez votre premier projet pour commencer</div>
            <button className="btn btn-primary mt-16" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Nouveau projet
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {projects.map(p => (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}/tasks`)}>
                <div className="project-card-stripe" style={{ background: p.color }} />

                <div className="flex items-center" style={{ marginTop: 4, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="project-card-subject">{p.subject}</div>
                    <div className="project-card-name">{p.name}</div>
                  </div>
                  <div className="flex gap-6" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setEditProject(p)}
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleDelete(p)}
                      title="Supprimer"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {p.description && (
                  <div className="fs-12 text-muted mb-8 truncate">{p.description}</div>
                )}

                <ProgressBar done={Number(p.done_count || 0)} total={Number(p.task_count || 0)} />

                <div className="project-card-meta">
                  <span>👥 {p.member_count}</span>
                  <span>📋 {p.task_count} tâche{p.task_count > 1 ? 's' : ''}</span>
                  {p.deadline && <span className="ml-auto">📅 {fmtDate(p.deadline)}</span>}
                </div>

                <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p.id}/tasks`)}>
                    <ListTodo size={13} /> Tâches
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p.id}/chat`)}>
                    <MessageCircle size={13} /> Chat
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/projects/${p.id}/team`)}>
                    <Users size={13} /> Équipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouveau projet" onClose={() => setShowCreate(false)}>
          <ProjectForm onSubmit={handleCreate} loading={submitting} />
        </Modal>
      )}

      {/* Modal édition */}
      {editProject && (
        <Modal title="Modifier le projet" onClose={() => setEditProject(null)}>
          <ProjectForm initial={editProject} onSubmit={handleUpdate} loading={submitting} />
        </Modal>
      )}
    </>
  )
}
