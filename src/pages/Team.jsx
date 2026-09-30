import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Crown, User } from 'lucide-react'
import { useProject } from '../hooks/useProjects'
import { useAuth }    from '../context/AuthContext'
import { useToast }   from '../context/ToastContext'
import { projectsAPI } from '../api'
import Modal  from '../components/Modal'
import { initials, fmtDate } from '../utils/helpers'

export default function Team() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()
  const { user } = useAuth()

  const { project, loading, reload } = useProject(id)
  const members = project?.members || []

  const [showAdd,    setShowAdd]    = useState(false)
  const [addEmail,   setAddEmail]   = useState('')
  const [addError,   setAddError]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isOwner = members.find(m => m.id == user?.id && m.role === 'owner')

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAddError(''); setSubmitting(true)
    try {
      await projectsAPI.addMember({ project_id: Number(id), email: addEmail.trim() })
      toast('Membre ajouté !', 'success')
      setAddEmail('')
      setShowAdd(false)
      reload()
    } catch (e) {
      setAddError(typeof e === 'string' ? e : 'Erreur lors de l\'ajout')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex-center" style={{ flex: 1 }}><div className="spinner" /></div>
  )

  return (
    <>
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/tasks`)}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <div className="topbar-title">Équipe — {project?.name}</div>
          <div className="fs-12 text-muted">{members.length} membre{members.length > 1 ? 's' : ''}</div>
        </div>
        {isOwner && (
          <div className="topbar-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              <UserPlus size={14} /> Ajouter un membre
            </button>
          </div>
        )}
      </div>

      <div className="content">
        {members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">Aucun membre</div>
          </div>
        ) : (
          <div className="team-grid">
            {members.map(m => (
              <div key={m.id} className="member-card">
                <div className="avatar avatar-lg">{initials(m.name)}</div>
                <div className="member-card-info">
                  <div className="member-card-name">{m.name}</div>
                  <div className="member-card-email truncate">{m.email}</div>
                  <div className="flex items-center gap-6 mt-4">
                    {m.role === 'owner'
                      ? <span className="member-card-role"><Crown size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Propriétaire</span>
                      : <span className="member-card-role" style={{ background: 'var(--bg-3)', color: 'var(--text-soft)' }}><User size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Membre</span>
                    }
                    {m.id == user?.id && (
                      <span className="fs-12 text-muted">(vous)</span>
                    )}
                  </div>
                  <div className="fs-12 text-muted mt-4">
                    Rejoint le {fmtDate(m.joined_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infos projet */}
        {project && (
          <div className="card mt-16">
            <div className="fw-700 mb-8" style={{ fontSize: 13 }}>Informations du projet</div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              <Info label="Nom" value={project.name} />
              <Info label="Matière" value={project.subject} />
              <Info label="Deadline" value={project.deadline ? fmtDate(project.deadline) : 'Non définie'} />
              <Info label="Créé le" value={fmtDate(project.created_at)} />
              {project.description && (
                <Info label="Description" value={project.description} style={{ gridColumn: 'span 2' }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal ajout membre */}
      {showAdd && (
        <Modal title="Ajouter un membre" onClose={() => { setShowAdd(false); setAddError('') }}>
          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label className="form-label">Email de l'utilisateur</label>
              <input
                className="form-input" type="email"
                placeholder="prenom.nom@univ.fr"
                value={addEmail} onChange={e => setAddEmail(e.target.value)}
                required autoFocus
              />
              {addError && <div className="form-error">{addError}</div>}
            </div>
            <p className="fs-12 text-muted">L'utilisateur doit déjà avoir un compte TeamTask.</p>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function Info({ label, value, style }) {
  return (
    <div style={style}>
      <div className="fs-12 text-muted">{label}</div>
      <div className="fs-13 fw-700" style={{ marginTop: 2 }}>{value}</div>
    </div>
  )
}
