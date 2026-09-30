import client from './client'

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => client.post('/auth.php?action=register', data).then(r => r.data),
  login:          (data) => client.post('/auth.php?action=login',    data).then(r => r.data),
  logout:         ()     => client.post('/auth.php?action=logout',   {}).then(r => r.data),
  me:             ()     => client.get('/auth.php?action=me').then(r => r.data),
  updateProfile:  (data) => client.post('/auth.php?action=update_profile',  data).then(r => r.data),
  changePassword: (data) => client.post('/auth.php?action=change_password', data).then(r => r.data),
}

// ── Projets ───────────────────────────────────────────────────
export const projectsAPI = {
  list:      ()          => client.get('/projects.php?action=list').then(r => r.data),
  get:       (id)        => client.get(`/projects.php?action=get&id=${id}`).then(r => r.data),
  create:    (data)      => client.post('/projects.php?action=create', data).then(r => r.data),
  update:    (id, data)  => client.put(`/projects.php?action=update&id=${id}`, data).then(r => r.data),
  delete:    (id)        => client.delete(`/projects.php?action=delete&id=${id}`).then(r => r.data),
  addMember: (data)      => client.post('/projects.php?action=add_member', data).then(r => r.data),
  stats:     (id)        => client.get(`/projects.php?action=stats&id=${id}`).then(r => r.data),
}

// ── Tâches ────────────────────────────────────────────────────
export const tasksAPI = {
  list:         (pid)        => client.get(`/tasks.php?action=list&project_id=${pid}`).then(r => r.data),
  create:       (data)       => client.post('/tasks.php?action=create', data).then(r => r.data),
  update:       (id, data)   => client.put(`/tasks.php?action=update&id=${id}`, data).then(r => r.data),
  updateStatus: (id, status) => client.post('/tasks.php?action=update_status', { id, status }).then(r => r.data),
  delete:       (id)         => client.delete(`/tasks.php?action=delete&id=${id}`).then(r => r.data),
  myTasks:      ()           => client.get('/tasks.php?action=my_tasks').then(r => r.data),
}

// ── Messages ──────────────────────────────────────────────────
export const messagesAPI = {
  list: (pid, since = null) => {
    const url = since
      ? `/messages.php?action=list&project_id=${pid}&since=${encodeURIComponent(since)}`
      : `/messages.php?action=list&project_id=${pid}`
    return client.get(url).then(r => r.data)
  },
  send: (data) => client.post('/messages.php?action=send', data).then(r => r.data),
}
