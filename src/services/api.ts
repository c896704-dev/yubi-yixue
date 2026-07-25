import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
})

function getDeviceId(): string {
  return localStorage.getItem('device_id') || ''
}

function getDeviceSign(): string {
  return localStorage.getItem('device_sign') || ''
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const deviceId = getDeviceId()
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId
    const deviceSign = getDeviceSign()
    if (deviceSign) {
      config.headers['X-Device-Sign'] = deviceSign
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    const serverDeviceId = res.headers['x-device-id']
    const serverDeviceSign = res.headers['x-device-sign']
    if (serverDeviceId && serverDeviceSign) {
      localStorage.setItem('device_id', serverDeviceId)
      localStorage.setItem('device_sign', serverDeviceSign)
    }
    return res.data
  },
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default api
