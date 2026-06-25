export interface ApiErrorPayload {
  error?: string
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const hasBody = options.body !== undefined

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin'
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null
    const message = errorPayload?.error || errorPayload?.message || `请求失败 (${response.status})`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export const adminLogin = (password: string) =>
  apiRequest<{ ok: true }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  })

export const adminLogout = () =>
  apiRequest<{ ok: true }>('/api/admin/logout', {
    method: 'POST',
    body: JSON.stringify({})
  })

export const getAdminSession = () =>
  apiRequest<{ authenticated: boolean }>('/api/admin/session')

export const resetAdminPassword = (token: string, newPassword: string) =>
  apiRequest<{ ok: true }>('/api/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  })
