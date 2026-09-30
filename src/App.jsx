import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }   from './context/AuthContext'
import { ToastProvider }           from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout    from './components/Layout'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects  from './pages/Projects'
import Tasks     from './pages/Tasks'
import Chat      from './pages/Chat'
import Team      from './pages/Team'
import Stats     from './pages/Stats'
import Profile   from './pages/Profile'

function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">
        <span className="splash-logo-icon">⬡</span>
        <span className="splash-logo-name">TeamTask</span>
      </div>
      <div className="spinner" />
    </div>
  )
}

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <Splash />
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index                           element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"                element={<Dashboard />} />
        <Route path="projects"                 element={<Projects />} />
        <Route path="projects/:id/tasks"       element={<Tasks />} />
        <Route path="projects/:id/chat"        element={<Chat />} />
        <Route path="projects/:id/team"        element={<Team />} />
        <Route path="projects/:id/stats"       element={<Stats />} />
        <Route path="profile"                  element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
