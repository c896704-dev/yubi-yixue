import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
})

function getDeviceId(): string {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('device_id', id)
  }
  return id
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Device-Id'] = getDeviceId()
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default api
