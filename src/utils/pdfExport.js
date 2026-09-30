import { fmtDate, STATUS_LABELS, PRIORITY_LABELS, pct, escapeHtml } from './helpers'

export function exportProjectPDF(project, tasks) {
  const byStatus = {
    todo:        tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done:        tasks.filter(t => t.status === 'done'),
  }
  const progress = pct(byStatus.done.length, tasks.length)
  const members  = project.members || []

  const taskTable = (list) => list.length === 0 ? '<p style="color:#888;font-size:13px">Aucune tâche</p>' : `
    <table>
      <thead><tr><th>Tâche</th><th>Assigné</th><th>Priorité</th><th>Deadline</th></tr></thead>
      <tbody>
        ${list.map(t => `
          <tr>
            <td>${escapeHtml(t.title)}${t.description ? `<div class="sub">${escapeHtml(t.description)}</div>` : ''}</td>
            <td>${t.assigned_name ? escapeHtml(t.assigned_name) : '—'}</td>
            <td>${PRIORITY_LABELS[t.priority] || t.priority}</td>
            <td>${fmtDate(t.deadline)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`

  const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<title>Rapport — ${project.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; color: #111; padding: 40px 48px; font-size: 13px; line-height: 1.5; }
  h1   { font-size: 22px; font-weight: 800; color: ${project.color}; margin-bottom: 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap; }
  .stats { display: flex; gap: 16px; margin-bottom: 28px; }
  .stat  { background: #F5F5F5; border-radius: 8px; padding: 12px 18px; text-align: center; min-width: 90px; }
  .stat b { display: block; font-size: 24px; font-weight: 800; color: ${project.color}; }
  .stat small { font-size: 11px; color: #888; }
  .prog-wrap { margin-bottom: 28px; }
  .prog-label { font-size: 12px; color: #555; margin-bottom: 6px; font-weight: 600; }
  .prog { background: #E5E7EB; height: 8px; border-radius: 99px; }
  .prog-bar { background: ${project.color}; height: 100%; border-radius: 99px; width: ${progress}%; }
  h2   { font-size: 14px; font-weight: 700; margin: 24px 0 10px; border-bottom: 2px solid #EFEFEF; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th    { background: #F9FAFB; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 1px solid #E5E7EB; }
  td    { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
  .sub  { color: #888; font-size: 11px; margin-top: 3px; }
  .team-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
  .member { display: flex; align-items: center; gap: 10px; background: #F9FAFB; border-radius: 8px; padding: 10px 14px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: ${project.color}22; border: 1px solid ${project.color}55; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: ${project.color}; flex-shrink: 0; }
  .member-info .name  { font-size: 13px; font-weight: 600; }
  .member-info .email { font-size: 11px; color: #888; }
  footer { margin-top: 40px; text-align: center; color: #AAA; font-size: 11px; border-top: 1px solid #EEE; padding-top: 16px; }
  @media print { body { padding: 20px 28px; } }
</style>
</head><body>

<h1>${escapeHtml(project.name)}</h1>
<div class="meta">
  <span>📚 ${escapeHtml(project.subject)}</span>
  ${project.deadline ? `<span>⏰ Deadline : ${fmtDate(project.deadline)}</span>` : ''}
  <span>📅 Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
</div>

<div class="stats">
  <div class="stat"><b>${tasks.length}</b><small>Tâches totales</small></div>
  <div class="stat"><b>${byStatus.done.length}</b><small>Terminées</small></div>
  <div class="stat"><b>${byStatus.in_progress.length}</b><small>En cours</small></div>
  <div class="stat"><b>${byStatus.todo.length}</b><small>À faire</small></div>
  <div class="stat"><b>${progress}%</b><small>Avancement</small></div>
</div>

<div class="prog-wrap">
  <div class="prog-label">Progression globale — ${progress}%</div>
  <div class="prog"><div class="prog-bar"></div></div>
</div>

${byStatus.in_progress.length ? `<h2>🔵 En cours (${byStatus.in_progress.length})</h2>${taskTable(byStatus.in_progress)}` : ''}
${byStatus.todo.length        ? `<h2>⚪ À faire (${byStatus.todo.length})</h2>${taskTable(byStatus.todo)}`               : ''}
${byStatus.done.length        ? `<h2>✅ Terminées (${byStatus.done.length})</h2>${taskTable(byStatus.done)}`             : ''}

<h2>👥 Équipe (${members.length} membre${members.length > 1 ? 's' : ''})</h2>
<div class="team-grid">
  ${members.map(m => {
    const inits = m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return `
    <div class="member">
      <div class="avatar">${escapeHtml(inits)}</div>
      <div class="member-info">
        <div class="name">${escapeHtml(m.name)} ${m.role === 'owner' ? '👑' : ''}</div>
        <div class="email">${escapeHtml(m.email)}</div>
      </div>
    </div>`
  }).join('')}
</div>

<footer>TeamTask — Rapport généré automatiquement</footer>
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Autorisez les popups pour exporter le PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)
}
