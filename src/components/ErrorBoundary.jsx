import React from 'react'

/**
 * Error Boundary — capture les erreurs non gérées dans l'arbre React
 * et affiche un fallback propre plutôt qu'un écran blanc
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[TeamTask ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.hash = '#/dashboard'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: 16,
          background: 'var(--bg)', color: 'var(--text)',
          padding: 32, textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>💥</div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Une erreur inattendue s'est produite</h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', maxWidth: 400 }}>
          {this.state.error?.message || 'Erreur inconnue'}
        </p>
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={this.handleReset}
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }
}
