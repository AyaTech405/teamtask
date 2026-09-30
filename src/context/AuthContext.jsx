import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('tt_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Vérifier la session au démarrage
  useEffect(() => {
    const token = localStorage.getItem('tt_token')
    if (!token) { setLoading(false); return }

    authAPI.me()
      .then(u  => { setUser(u); localStorage.setItem('tt_user', JSON.stringify(u)) })
      .catch(() => { localStorage.removeItem('tt_token'); localStorage.removeItem('tt_user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    localStorage.setItem('tt_token', res.token)
    localStorage.setItem('tt_user',  JSON.stringify(res.user))
    setUser(res.user)
    return res
  }, [])

  const register = useCallback(async (name, email, password) => {
    return authAPI.register({ name, email, password })
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('tt_token')
    localStorage.removeItem('tt_user')
    setUser(null)
  }, [])

  // Met à jour l'utilisateur courant (ex : après modification du profil)
  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('tt_user', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
