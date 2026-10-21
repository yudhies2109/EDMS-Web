const seed = [
  ['Aditya Pratama', 'aditya.pratama', 'Engineering', 'Frontend Developer', 'Aktif'],
  ['Nadia Putri', 'nadia.putri', 'Design', 'UI/UX Designer', 'Aktif'],
  ['Rizky Ramadhan', 'rizky.ramadhan', 'Engineering', 'Backend Developer', 'Aktif'],
  ['Salsabila Zahra', 'salsabila.zahra', 'Human Resources', 'HR Specialist', 'Aktif'],
  ['Fajar Nugroho', 'fajar.nugroho', 'Marketing', 'Marketing Strategist', 'Cuti'],
  ['Dewi Lestari', 'dewi.lestari', 'Finance', 'Finance Analyst', 'Aktif'],
  ['Muhammad Ilham', 'muhammad.ilham', 'Engineering', 'DevOps Engineer', 'Aktif'],
  ['Alya Maharani', 'alya.maharani', 'Design', 'Product Designer', 'Aktif'],
  ['Bima Saputra', 'bima.saputra', 'Operations', 'Operations Manager', 'Aktif'],
  ['Citra Permata', 'citra.permata', 'Marketing', 'Content Specialist', 'Cuti'],
  ['Dimas Wicaksono', 'dimas.wicaksono', 'Engineering', 'QA Engineer', 'Aktif'],
  ['Intan Puspita', 'intan.puspita', 'Human Resources', 'Talent Acquisition', 'Aktif'],
  ['Kevin Alexander', 'kevin.alexander', 'Finance', 'Accountant', 'Aktif'],
  ['Laras Ayuningtyas', 'laras.ayuningtyas', 'Operations', 'Office Administrator', 'Aktif'],
].map(([name, email, department, position, status], i) => ({ id: `EMP-${String(i + 1).padStart(3, '0')}`, name, email: `${email}@edms.co.id`, department, position, status, phone: `0812${String(34560000 + i)}`, joined: `2026-${String((i % 9) + 1).padStart(2, '0')}-12` }))

export const departments = ['Engineering', 'Design', 'Human Resources', 'Marketing', 'Finance', 'Operations']
export const demoAccounts = {
  admin: { email: 'admin@edms.co.id', password: 'Admin123!', name: 'Administrator', role: 'admin' },
  karyawan: { email: 'karyawan@edms.co.id', password: 'Karyawan123!', name: 'Aditya Pratama', role: 'karyawan' },
}

export function readLocal(key, fallback, storage = localStorage) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback } catch { return fallback }
}
export function writeLocal(key, value, storage = localStorage) {
  try { storage.setItem(key, JSON.stringify(value)) } catch { /* The current session still works when storage is unavailable. */ }
}
export const employeeStore = {
  list() {
    const saved = readLocal('edms-employees-v1', seed)
    return Array.isArray(saved) && saved.every(e => e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.email === 'string' && departments.includes(e.department)) ? saved : seed
  },
  save(employees, employee, role) {
    if (role !== 'admin') throw new Error('Hanya Admin yang dapat mengelola karyawan.')
    if (employees.some(e => e.email.toLowerCase() === employee.email.toLowerCase() && e.id !== employee.id)) throw new Error('Email sudah digunakan oleh karyawan lain.')
    const record = employee.id ? employee : { ...employee, id: `EMP-${String(Math.max(0, ...employees.map(e => Number(e.id.split('-')[1]) || 0)) + 1).padStart(3, '0')}` }
    const result = employee.id ? employees.map(e => e.id === employee.id ? record : e) : [...employees, record]
    writeLocal('edms-employees-v1', result)
    return result
  },
  remove(employees, id, role) {
    if (role !== 'admin') throw new Error('Hanya Admin yang dapat mengelola karyawan.')
    const result = employees.filter(e => e.id !== id)
    writeLocal('edms-employees-v1', result)
    return result
  },
}
export function signIn(email, password) {
  const account = Object.values(demoAccounts).find(a => a.email === email.trim().toLowerCase() && a.password === password)
  if (!account) throw new Error('Email atau kata sandi salah. Gunakan akun demo yang tersedia.')
  const user = { name: account.name, email: account.email, role: account.role }
  writeLocal('edms-session', user, sessionStorage)
  return user
}
export function getSession() {
  const saved = readLocal('edms-session', null, sessionStorage)
  return saved && Object.values(demoAccounts).some(a => a.email === saved.email && a.role === saved.role) ? saved : null
}
export function signOut() {
  try { sessionStorage.removeItem('edms-session') } catch { /* In-memory logout remains available. */ }
}
