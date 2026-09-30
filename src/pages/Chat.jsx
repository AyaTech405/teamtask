import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { useProject }  from '../hooks/useProjects'
import { useMessages } from '../hooks/useMessages'
import { useAuth }     from '../context/AuthContext'
import { useToast }    from '../context/ToastContext'
import Avatar          from '../components/Avatar'
import Spinner         from '../components/Spinner'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

function fmtTime(dateStr) {
  if (!dateStr) return ''
  try { return format(parseISO(dateStr), 'HH:mm', { locale: fr }) }
  catch { return '' }
}

function fmtDay(dateStr) {
  if (!dateStr) return ''
  try {
    const d = parseISO(dateStr)
    if (isToday(d))     return "Aujourd'hui"
    if (isYesterday(d)) return 'Hier'
    return format(d, 'EEEE d MMMM', { locale: fr })
  } catch { return '' }
}

function dayKey(dateStr) { return dateStr ? dateStr.split(' ')[0] : '' }

function Message({ msg, isMine }) {
  return (
    <div className={`flex ${isMine ? 'msg-mine' : ''}`} style={{ gap: 9, alignItems: 'flex-end' }}>
      {!isMine && <Avatar name={msg.user_name} size="sm" title={msg.user_name} />}
      <div style={{ maxWidth: '72%' }}>
        {!isMine && <div className="fs-12 text-muted mb-4" style={{ paddingLeft: 2 }}>{msg.user_name}</div>}
        <div style={{
          padding: '9px 13px',
          borderRadius: isMine ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
          fontSize: 13, lineHeight: 1.55,
          background: isMine ? 'var(--accent)' : 'var(--surface)',
          color: isMine ? '#fff' : 'var(--text)',
          border: isMine ? 'none' : '1px solid var(--border)',
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
        <div className="msg-meta" style={{ textAlign: isMine ? 'right' : 'left', paddingLeft: 2 }}>
          {fmtTime(msg.created_at)}
        </div>
      </div>
    </div>
  )
}

function DaySeparator({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function Chat() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()
  const { user } = useAuth()

  const { project, loading: pLoad } = useProject(id)
  const { messages, loading, sending, sendMessage } = useMessages(id)

  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    try {
      await sendMessage(text)
    } catch (e) {
      toast(typeof e === 'string' ? e : "Erreur d'envoi", 'error')
      setInput(text)
    }
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const grouped = []
  let lastDay = null
  messages.forEach(msg => {
    const day = dayKey(msg.created_at)
    if (day !== lastDay) { grouped.push({ type: 'separator', day, label: fmtDay(msg.created_at) }); lastDay = day }
    grouped.push({ type: 'message', msg })
  })

  return (
    <>
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}/tasks`)}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <div className="topbar-title">{pLoad ? '…' : `Chat — ${project?.name}`}</div>
          <div className="fs-12 text-muted">
            {project?.subject || ''}{project?.members?.length ? ` · ${project.members.length} membre${project.members.length > 1 ? 's' : ''}` : ''}
          </div>
        </div>
        {!pLoad && project?.members && (
          <div className="topbar-actions">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {project.members.slice(0, 5).map(m => (
                <Avatar key={m.id} name={m.name} size="sm" style={{ marginLeft: -6, outline: '2px solid var(--bg-2)' }} />
              ))}
              {project.members.length > 5 && <span className="fs-12 text-muted" style={{ marginLeft: 10 }}>+{project.members.length - 5}</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? <Spinner fullPage /> : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title">Pas encore de message</div>
              <div className="empty-state-sub">Commencez la conversation !</div>
            </div>
          ) : grouped.map((item, i) =>
            item.type === 'separator'
              ? <DaySeparator key={`sep-${item.day}`} label={item.label} />
              : <Message key={item.msg.id} msg={item.msg} isMine={item.msg.user_id == user?.id} />
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="form-textarea"
            style={{ flex: 1, minHeight: 'unset', height: 40, resize: 'none', padding: '9px 12px', lineHeight: 1.45 }}
            placeholder="Votre message… (Entrée pour envoyer)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={sending}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ height: 40, padding: '0 14px' }}
          >
            {sending ? <Loader2 size={15} style={{ animation: 'spin .6s linear infinite' }} /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </>
  )
}
