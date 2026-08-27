const BASE = '/api'

const TOKEN_KEY = 'ayd_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = {}
  const token = getToken()
  if (auth && token) headers['Authorization'] = `Bearer ${token}`

  let payload
  if (form) {
    payload = new URLSearchParams(form)
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else if (body instanceof FormData) {
    payload = body
  } else if (body) {
    payload = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch {
      /* no body */
    }
    throw new ApiError(typeof detail === 'string' ? detail : 'Something went wrong', res.status)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (email, password) =>
    request('/users', { method: 'POST', body: { email, password }, auth: false }),

  login: (email, password) =>
    request('/login', { method: 'POST', form: { username: email, password }, auth: false }),

  listDocuments: () => request('/documents'),

  getDocument: (id) => request(`/documents/${id}`),

  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  uploadDocument: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/documents/upload', { method: 'POST', body: fd })
  },

  search: (query, top_k = 5) =>
    request('/documents/search', { method: 'POST', body: { query, top_k } }),

  ask: (question, top_k = 5) =>
    request('/documents/ask', { method: 'POST', body: { question, top_k } }),
}

export { ApiError }
