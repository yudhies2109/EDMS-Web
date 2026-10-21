import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { clearSession, currentUser, employeeApi, getSession, signIn, signOut } from '../src/services/api.js'

const originalFetch = globalThis.fetch
let calls
let responses
beforeEach(() => {
  const storage = new Map()
  globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
  globalThis.window = new EventTarget()
  calls = []; responses = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options })
    const next = responses.shift()
    if (next instanceof Error) throw next
    assert.ok(next, 'Unexpected request')
    return new Response(JSON.stringify(next.body), { status: next.status || 200 })
  }
})
afterEach(() => { globalThis.fetch = originalFetch })
async function login(role = 'admin') {
  const user = { id: 1, name: 'Test', email: 'test@example.com', role }
  responses.push({ body: { data: { user, token: 'test-token' } } })
  await signIn(' TEST@example.com ', 'test-only')
  return user
}

test('login uses API credentials, stores token, validates profile, and revokes token on logout', async () => {
  const user = await login()
  assert.equal(calls[0].url, '/api/login')
  assert.deepEqual(JSON.parse(calls[0].body), { email: 'test@example.com', password: 'test-only' })
  assert.equal(calls[0].headers.Authorization, undefined)
  assert.deepEqual(getSession(), { token: 'test-token', user })
  assert.ok(!JSON.stringify(getSession()).includes('test-only'))
  responses.push({ body: { data: user } }, { body: { data: null } })
  assert.deepEqual(await currentUser(), user)
  assert.equal(calls[1].headers.Authorization, 'Bearer test-token')
  await signOut()
  assert.equal(calls[2].url, '/api/logout')
  assert.equal(calls[2].method, 'POST')
  assert.equal(getSession(), null)
})

test('list loads all backend pages so search is not limited to the first ten rows', async () => {
  await login()
  responses.push({ body: { data: [{ id: 1 }], meta: { last_page: 2 } } }, { body: { data: [{ id: 11 }], meta: { last_page: 2 } } })
  assert.deepEqual(await employeeApi.list(), [{ id: 1 }, { id: 11 }])
  assert.deepEqual(calls.slice(1).map(call => call.url), ['/api/employees?page=1', '/api/employees?page=2'])
})

test('CRUD sends supported fields with authentication and numeric employee IDs', async () => {
  await login()
  const employee = { name: 'Test Employee', email: 'employee@example.com', phone: '', department: 'IT', position: 'Engineer', status: 'unsupported' }
  responses.push({ body: { data: { ...employee, id: 12 } } }, { body: { data: { ...employee, id: 12 } } }, { body: { data: null } })
  const saved = await employeeApi.save(employee)
  await employeeApi.save(saved)
  await employeeApi.remove(saved.id)
  assert.deepEqual(calls.slice(1).map(call => [call.method, call.url]), [['POST', '/api/employees'], ['PUT', '/api/employees/12'], ['DELETE', '/api/employees/12']])
  assert.deepEqual(JSON.parse(calls[1].body), { name: employee.name, email: employee.email, phone: null, department: 'IT', position: 'Engineer' })
  assert.ok(calls.slice(1).every(call => call.headers.Authorization === 'Bearer test-token'))
})

test('403 is surfaced even when a user sends a write request directly', async () => {
  await login('karyawan')
  responses.push({ status: 403, body: { message: 'Forbidden', data: null } })
  await assert.rejects(employeeApi.remove(1), /tidak memiliki izin/)
  assert.ok(getSession())
})

test('401 clears the session and signals the app; invalid login does not expire another session', async () => {
  await login()
  let expired = 0
  window.addEventListener('edms-session-expired', () => expired++)
  responses.push({ status: 401, body: { message: 'Wrong password', data: null } })
  await assert.rejects(signIn('test@example.com', 'wrong'), /Wrong password/)
  assert.equal(expired, 0)
  responses.push({ status: 401, body: { data: null } })
  await assert.rejects(employeeApi.list(), /Sesi berakhir/)
  assert.equal(getSession(), null)
  assert.equal(expired, 1)
})

test('validation and network errors are actionable and failed logout keeps a retryable session', async () => {
  await login()
  responses.push({ status: 422, body: { errors: { email: ['Email sudah digunakan.'] } } })
  await assert.rejects(employeeApi.save({}), /Email sudah digunakan/)
  responses.push(new TypeError('fetch failed'))
  await assert.rejects(signOut(), /Tidak dapat menghubungi API/)
  assert.ok(getSession())
  clearSession()
  assert.equal(getSession(), null)
})

test('abort does not appear as a network error; corrupt storage and malformed responses are handled', async () => {
  sessionStorage.setItem('edms-api-session', '{')
  assert.equal(getSession(), null)
  responses.push(new DOMException('Cancelled', 'AbortError'))
  await assert.rejects(employeeApi.list(), { name: 'AbortError' })
  responses.push({ body: { unexpected: true } })
  await assert.rejects(employeeApi.list(), /Respons API tidak valid/)
})
