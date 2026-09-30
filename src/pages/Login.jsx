import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hexagon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [tab,      setTab]      = useState('login')   // 'login' | 'register'
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Connexion
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass,  setLoginPass]  = useState('')

  // Inscription
  const [regName,  setRegName]  = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass,  setRegPass]  = useState('')

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(loginEmail, loginPass)
      navigate('/dashboard')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Identifiants incorrects')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(regName, regEmail, regPass)
      toast('Compte créé ! Connectez-vous.', 'success')
      setTab('login')
      setLoginEmail(regEmail)
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Erreur lors de l\'inscription')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-bg" />
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon"><Hexagon size={26} color="var(--accent-hv)" /></div>
          <div className="auth-logo-name">TeamTask</div>
          <div className="auth-logo-sub">Gestion de projets étudiants</div>
        </div>

        {/* Onglets */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login'    ? 'active' : ''}`} onClick={() => { setTab('login');    setError('') }}>Connexion</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Inscription</button>
        </div>

        {/* ── Connexion ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input" type="email" autoComplete="email"
                placeholder="prenom.nom@univ.fr"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input" type="password" autoComplete="current-password"
                placeholder="••••••"
                value={loginPass} onChange={e => setLoginPass(e.target.value)}
                required
              />
            </div>
            {error && <div className="form-error mb-8">{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}

        {/* ── Inscription ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                className="form-input" type="text"
                placeholder="Jean Dupont"
                value={regName} onChange={e => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input" type="email"
                placeholder="prenom.nom@univ.fr"
                value={regEmail} onChange={e => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe <span className="text-muted">(min. 6 caractères)</span></label>
              <input
                className="form-input" type="password"
                placeholder="••••••"
                value={regPass} onChange={e => setRegPass(e.target.value)}
                required minLength={6}
              />
            </div>
            {error && <div className="form-error mb-8">{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
