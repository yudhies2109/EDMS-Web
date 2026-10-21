const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const sessionKey = 'edms-api-session'

export function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(sessionKey))
    return session?.token && session?.user ? session : null
  } catch { return null }
}

export function clearSession() {
  sessionStorage.removeItem(sessionKey)
}

async function request(path, { method = 'GET', body, signal, token = getSession()?.token } = {}) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Tidak dapat menghubungi API. Pastikan server backend berjalan.')
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) {
      clearSession()
      window.dispatchEvent(new Event('edms-session-expired'))
    }
    const messages = Object.values(payload?.errors || {}).flat().join(' ')
    throw new Error(response.status === 401 && token
      ? 'Sesi berakhir. Silakan masuk kembali.'
      : response.status === 403
        ? 'Anda tidak memiliki izin untuk melakukan tindakan ini.'
        : messages || payload?.message || `Request gagal (${response.status}).`)
  }
  if (!payload || !Object.hasOwn(payload, 'data')) throw new Error('Respons API tidak valid.')
  return payload
}

export async function signIn(email, password) {
  const { data } = await request('/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password }, token: null })
  if (!data?.token || !data?.user) throw new Error('Respons login API tidak valid.')
  const session = { token: data.token, user: data.user }
  sessionStorage.setItem(sessionKey, JSON.stringify(session))
  return session.user
}

export async function currentUser(signal) {
  return (await request('/user', { signal })).data
}

export async function signOut() {
  await request('/logout', { method: 'POST' })
  clearSession()
}

export const employeeApi = {
  async list(signal) {
    const employees = []
    let page = 1
    let lastPage = 1
    do {
      const result = await request(`/employees?page=${page}`, { signal })
      if (!Array.isArray(result.data)) throw new Error('Daftar karyawan dari API tidak valid.')
      employees.push(...result.data)
      lastPage = result.meta?.last_page || 1
      page += 1
    } while (page <= lastPage)
    return employees
  },
  async save(employee) {
    const body = Object.fromEntries(['name', 'email', 'phone', 'department', 'position'].map(key => [key, employee[key] || null]))
    return (await request(employee.id ? `/employees/${employee.id}` : '/employees', {
      method: employee.id ? 'PUT' : 'POST', body,
    })).data
  },
  async remove(id) {
    await request(`/employees/${id}`, { method: 'DELETE' })
  },
}
