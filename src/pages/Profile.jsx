import React, { useState } from 'react'
import { useNavigate }   from 'react-router-dom'
import { ArrowLeft, Save, User } from 'lucide-react'
import { useAuth }  from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI }  from '../api'
import Avatar       from '../components/Avatar'

export default function Profile() {
  const navigate = useNavigate()
  const toast    = useToast()
  const { user, logout, updateUser } = useAuth()

  const [name,       setName]       = useState(user?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [oldPass,    setOldPass]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [passErr,    setPassErr]    = useState('')

  const handleSaveName = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSavingName(true)
    try {
      const res = await authAPI.updateProfile({ name: trimmed })
      updateUser(res.user)
      toast('Profil mis à jour', 'success')
    } catch (err) {
      toast(typeof err === 'string' ? err : 'Erreur lors de la mise à jour', 'error')
    } finally { setSavingName(false) }
  }

  const handleChangePass = async (e) => {
    e.preventDefault()
    setPassErr('')
    if (newPass.length < 6) { setPassErr('Nouveau mot de passe trop court (min 6)'); return }
    setLoading(true)
    try {
      await authAPI.changePassword({ old_password: oldPass, new_password: newPass })
      toast('Mot de passe modifié avec succès', 'success')
      setOldPass(''); setNewPass('')
    } catch (err) {
      setPassErr(typeof err === 'string' ? err : 'Ancien mot de passe incorrect')
    } finally { setLoading(false) }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} />
        </button>
        <span className="topbar-title">Mon profil</span>
      </div>

      <div className="content" style={{ maxWidth: 560 }}>

        {/* Carte identité */}
        <div className="card mb-16">
          <div className="flex items-center gap-16 mb-20">
            <Avatar name={user?.name} size="xl" />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
              <div className="text-muted fs-13">{user?.email}</div>
              <div className="fs-12 text-muted mt-4">
                Membre depuis {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveName}>
            <div className="form-group">
              <label className="form-label">Nom affiché</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Votre nom complet"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingName}>
              <Save size={13} /> {savingName ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>

        {/* Changement de mot de passe */}
        <div className="card mb-16">
          <div className="fw-700 mb-16" style={{ fontSize: 13 }}>Changer de mot de passe</div>
          <form onSubmit={handleChangePass}>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <input
                className="form-input" type="password"
                value={oldPass} onChange={e => setOldPass(e.target.value)}
                placeholder="••••••" required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                className="form-input" type="password"
                value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="Min. 6 caractères" required minLength={6}
              />
              {passErr && <div className="form-error">{passErr}</div>}
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" disabled={loading}>
              {loading ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* Zone danger */}
        <div className="card" style={{ borderColor: 'rgba(248,113,113,.2)' }}>
          <div className="fw-700 mb-8" style={{ fontSize: 13, color: 'var(--danger)' }}>Zone de danger</div>
          <p className="fs-13 text-muted mb-16">
            Déconnectez-vous de votre session sur cet appareil.
          </p>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  )
}
