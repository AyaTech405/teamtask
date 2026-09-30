import { useState, useEffect, useCallback } from 'react'
import { projectsAPI } from '../api'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await projectsAPI.list()
      setProjects(data)
      setError(null)
    } catch(e) { setError(e) }
    finally    { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return { projects, loading, error, reload: load, setProjects }
}

export function useProject(id) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await projectsAPI.get(id)
      setProject(data)
      setError(null)
    } catch(e) { setError(e) }
    finally    { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  return { project, loading, error, reload: load }
}
