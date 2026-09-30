import { useState, useEffect, useRef, useCallback } from 'react'
import { messagesAPI } from '../api'

/**
 * Hook complet pour la messagerie d'un projet
 * Gère : chargement initial, polling incrémental, envoi, cleanup
 */
export function useMessages(projectId) {
  const [messages,  setMessages]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState(null)

  const pollingRef  = useRef(null)
  const lastTimeRef = useRef(null)

  // ── Chargement initial ─────────────────────────────────────
  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    setLoading(true)
    setMessages([])
    lastTimeRef.current = null

    messagesAPI.list(projectId)
      .then(msgs => {
        if (cancelled) return
        setMessages(msgs)
        if (msgs.length) lastTimeRef.current = msgs[msgs.length - 1].created_at
        setError(null)
      })
      .catch(e => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId])

  // ── Polling toutes les 3 secondes ─────────────────────────
  useEffect(() => {
    if (!projectId) return

    pollingRef.current = setInterval(async () => {
      try {
        const newMsgs = await messagesAPI.list(projectId, lastTimeRef.current)
        if (newMsgs.length) {
          setMessages(prev => {
            // Déduplication par id (sécurité)
            const existingIds = new Set(prev.map(m => m.id))
            const fresh = newMsgs.filter(m => !existingIds.has(m.id))
            return fresh.length ? [...prev, ...fresh] : prev
          })
          lastTimeRef.current = newMsgs[newMsgs.length - 1].created_at
        }
      } catch { /* silencieux — le polling ne bloque pas l'UI */ }
    }, 3000)

    return () => clearInterval(pollingRef.current)
  }, [projectId])

  // ── Envoi de message ──────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || sending) return null

    setSending(true)
    try {
      const msg = await messagesAPI.send({ project_id: Number(projectId), content: content.trim() })
      setMessages(prev => [...prev, msg])
      lastTimeRef.current = msg.created_at
      return msg
    } finally {
      setSending(false)
    }
  }, [projectId, sending])

  return { messages, loading, sending, error, sendMessage }
}
