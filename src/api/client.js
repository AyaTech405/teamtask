import axios from 'axios'

const BASE = 'http://localhost:8000/api'

const client = axios.create({ baseURL: BASE })

// Injecter le token automatiquement
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_token')
  if (token) config.headers['X-Auth-Token'] = token
  return config
})

// Gérer les 401 globalement
client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tt_token')
      localStorage.removeItem('tt_user')
      window.location.hash = '#/login'
    }
    return Promise.reject(err.response?.data?.error || 'Erreur réseau')
  }
)

export default client
