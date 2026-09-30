import { useState, useEffect, useCallback } from 'react'
import { tasksAPI } from '../api'

export function useTasks(projectId) {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await tasksAPI.list(projectId)
      setTasks(data)
      setError(null)
    } catch(e) { setError(e) }
    finally    { setLoading(false) }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const grouped = {
    todo:        tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done:        tasks.filter(t => t.status === 'done'),
  }

  return { tasks, grouped, loading, error, reload: load }
}

export function useMyTasks() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tasksAPI.myTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { tasks, loading }
}
