import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, LogOut, Hexagon, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../hooks/useProjects'
import Avatar from './Avatar'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { projects } = useProjects()

  const path = location.pathname

  const isActive = (p) => path === p || path.startsWith(p + '/')
  const isProjectActive = () => path.includes('/projects') && !path.includes('/tasks') && !path.includes('/chat') && !path.includes('/team') && !path.includes('/stats')

  const navTo = (p) => navigate(p)

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><Hexagon size={17} /></div>
        <span className="sidebar-brand-name">TeamTask</span>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        <button className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => navTo('/dashboard')}>
          <span className="nav-item-icon"><LayoutDashboard size={15} /></span>
          Tableau de bord
        </button>
        <button className={`nav-item ${isProjectActive() ? 'active' : ''}`} onClick={() => navTo('/projects')}>
          <span className="nav-item-icon"><FolderKanban size={15} /></span>
          Mes projets
        </button>
      </div>

      {/* Projets récents */}
      {projects.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Projets récents</div>
          {projects.slice(0, 6).map(p => (
            <button
              key={p.id}
              className={`nav-item ${path.includes(`/projects/${p.id}`) ? 'active' : ''}`}
              onClick={() => navTo(`/projects/${p.id}/tasks`)}
            >
              <span className="nav-item-dot" style={{ background: p.color }} />
              <span className="truncate" style={{ flex: 1 }}>{p.name}</span>
              {Number(p.task_count) > 0 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                  {Number(p.done_count || 0)}/{p.task_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Utilisateur */}
      <div className="sidebar-user">
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => navTo('/profile')}
          title="Mon profil"
        >
          <Avatar name={user?.name} size="md" />
        </button>
        <div className="sidebar-user-info" style={{ cursor: 'pointer' }} onClick={() => navTo('/profile')}>
          <div className="sidebar-user-name truncate">{user?.name}</div>
          <div className="sidebar-user-email truncate">{user?.email}</div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={handleLogout} title="Déconnexion">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
