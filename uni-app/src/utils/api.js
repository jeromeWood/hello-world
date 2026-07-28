const DEFAULT_BASE = 'http://127.0.0.1:3000'
const BASE_KEY = 'domoney_api_base'

export function getApiBase() {
  try {
    return uni.getStorageSync(BASE_KEY) || DEFAULT_BASE
  } catch (e) {
    return DEFAULT_BASE
  }
}

export function setApiBase(url) {
  uni.setStorageSync(BASE_KEY, String(url || DEFAULT_BASE).replace(/\/$/, ''))
}

export function request({ url, method = 'GET', data }) {
  const base = getApiBase()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${base}${url}`,
      method,
      data,
      timeout: 12000,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error((res.data && res.data.error) || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

export async function aiParse(text) {
  return request({ url: '/api/ai/parse', method: 'POST', data: { text } })
}

export async function aiAdvice(payload) {
  return request({ url: '/api/ai/advice', method: 'POST', data: payload })
}

export async function healthCheck() {
  return request({ url: '/api/health', method: 'GET' })
}
