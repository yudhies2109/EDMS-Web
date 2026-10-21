import { useEffect, useMemo, useState } from 'react'
import Icon from './components/Icon'
import Modal from './components/Modal'
import { clearSession, currentUser, employeeApi, getSession, signIn, signOut } from './services/api'
import './App.css'

const initials = name => name.split(' ').slice(0, 2).map(n => n[0]).join('')
const dateLabel = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(value)) : '—'
function Avatar({ name, index = 0, large = false }) { return <span className={`avatar avatar-${index % 6} ${large ? 'avatar-large' : ''}`}>{initials(name)}</span> }

function Login({ onLogin, message }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { onLogin(await signIn(email, password)) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="login-page"><section className="login-panel"><div className="login-form-wrap">
    <span className="login-symbol"><Icon name="briefcase" size={26} /></span>
    <h2>Selamat datang kembali</h2><p className="login-subtitle">Masuk untuk melihat dan mengelola direktori tim Anda.</p>
    <form onSubmit={submit} className="login-form">
      <label>Email<div className="input-icon"><Icon name="mail" /><input type="email" autoComplete="username" placeholder="nama@perusahaan.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} /></div></label>
      <label>Kata sandi<div className="input-icon"><Icon name="lock" /><input type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan kata sandi" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /><button type="button" className="icon-button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={visible}><Icon name="eye" /></button></div></label>
      {(error || message) && <div className="error-message" role="alert">{error || message}</div>}
      <button className="button primary login-submit" disabled={busy}>{busy ? 'Sedang masuk…' : 'Masuk ke aplikasi'}<Icon name="arrow" size={18} /></button>
    </form>
  </div><div className="login-bottom"><Icon name="lock" size={14} />Employee Directory & Management System</div></section></div>
}

function EmployeeForm({ employee, departments, onSave, onClose }) {
  const [form, setForm] = useState(() => employee || { name: '', email: '', phone: '', department: '', position: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    const clean = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
    setError(''); setBusy(true)
    try { await onSave(clean) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const field = (key, label, type = 'text', required = true) => <label>{label}{required && <span className="required"> *</span>}<input type={type} value={form[key] ?? ''} required={required} maxLength={key === 'phone' ? 30 : 255} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>
  return <Modal title={employee ? 'Edit karyawan' : 'Tambah karyawan'} subtitle="Lengkapi informasi anggota tim Anda." onClose={busy ? () => {} : onClose}>
    <form onSubmit={submit}><fieldset className="employee-fields" disabled={busy}><div className="form-grid">
      {field('name', 'Nama lengkap')}{field('email', 'Email', 'email')}{field('phone', 'Nomor telepon', 'tel', false)}
      <label>Departemen<span className="required"> *</span><input list="departments" value={form.department} required maxLength={255} onChange={e => setForm({ ...form, department: e.target.value })} /><datalist id="departments">{departments.map(d => <option key={d} value={d} />)}</datalist></label>
      {field('position', 'Jabatan')}
    </div></fieldset>{error && <p className="error-message" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Batal</button><button className="button primary" disabled={busy}><Icon name="check" size={17} />{busy ? 'Menyimpan…' : 'Simpan karyawan'}</button></div>
    </form>
  </Modal>
}

function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getSession()))
  const [sessionMessage, setSessionMessage] = useState('')
  const [sessionCheck, setSessionCheck] = useState(0)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [page, setPage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState('name')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    function expired() {
      setUser(null); setEmployees([]); setModal(null); setPage('dashboard')
      setSessionMessage('Sesi berakhir. Silakan masuk kembali.')
    }
    window.addEventListener('edms-session-expired', expired)
    return () => window.removeEventListener('edms-session-expired', expired)
  }, [])
  useEffect(() => {
    if (!getSession()) return
    const controller = new AbortController()
    currentUser(controller.signal).then(setUser).catch(err => {
      if (err.name !== 'AbortError') setSessionMessage(err.message)
    }).finally(() => { if (!controller.signal.aborted) setCheckingSession(false) })
    return () => controller.abort()
  }, [sessionCheck])
  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    employeeApi.list(controller.signal).then(setEmployees).catch(err => {
      if (err.name !== 'AbortError') setLoadError(err.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [user, reload])
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timeout) }, [toast])

  const departments = useMemo(() => [...new Set(employees.map(e => e.department))].sort((a, b) => a.localeCompare(b, 'id')), [employees])
  const filtered = useMemo(() => employees.filter(e => (!department || e.department === department) && [e.name, e.email, e.department, e.position, e.id].some(v => String(v ?? '').toLowerCase().includes(search.trim().toLowerCase()))).sort((a, b) => sort === 'newest' ? (b.created_at || '').localeCompare(a.created_at || '') : a.name.localeCompare(b.name, 'id')), [employees, search, department, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / 7))
  const safePage = Math.min(currentPage, pageCount)
  const rows = filtered.slice((safePage - 1) * 7, safePage * 7)
  function navigate(next) { setPage(next); setSearch(''); setDepartment(''); setCurrentPage(1); setMobileNav(false) }
  function openModal(next) { setActionError(''); setModal(next) }
  async function saveEmployee(record) {
    const saved = await employeeApi.save(record)
    setEmployees(previous => record.id ? previous.map(e => e.id === saved.id ? saved : e) : [...previous, saved])
    setModal(null); setToast(record.id ? 'Informasi karyawan berhasil diperbarui.' : 'Karyawan baru berhasil ditambahkan.')
  }
  async function deleteEmployee() {
    setActionBusy(true); setActionError('')
    try {
      await employeeApi.remove(modal.employee.id)
      setEmployees(previous => previous.filter(e => e.id !== modal.employee.id))
      setModal(null); setToast('Karyawan berhasil dihapus.')
    } catch (err) { setActionError(err.message) } finally { setActionBusy(false) }
  }
  async function logout() {
    setActionBusy(true); setActionError('')
    try {
      await signOut()
      setUser(null); setEmployees([]); setModal(null); setToast(''); setSessionMessage(''); navigate('dashboard')
    } catch (err) { setActionError(err.message) } finally { setActionBusy(false) }
  }

  if (checkingSession) return <div className="session-state" role="status">Memeriksa sesi…</div>
  if (!user && getSession()) return <div className="session-state"><p role="alert">{sessionMessage}</p><button className="button primary" onClick={() => { setCheckingSession(true); setSessionMessage(''); setSessionCheck(value => value + 1) }}>Coba lagi</button><button className="button secondary" onClick={() => { clearSession(); setSessionMessage('') }}>Kembali ke login</button></div>
  if (!user) return <Login message={sessionMessage} onLogin={nextUser => { setSessionMessage(''); setActionError(''); setLoading(true); setLoadError(''); setUser(nextUser) }} />

  return <div className="app-shell">
    {mobileNav && <button className="sidebar-backdrop" aria-label="Tutup navigasi" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <div className="nav-label">WORKSPACE</div><nav aria-label="Navigasi utama">
        <button className={page === 'dashboard' ? 'nav-item selected' : 'nav-item'} onClick={() => navigate('dashboard')}><Icon name="grid" /><span>Dashboard</span>{page === 'dashboard' && <span className="selected-dot" />}</button>
        <button className={page === 'directory' ? 'nav-item selected' : 'nav-item'} onClick={() => navigate('directory')}><Icon name="people" /><span>Employee Directory</span>{!loading && !loadError && <span className="nav-count">{employees.length}</span>}</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-user"><Avatar name={user.name} index={1} /><div><strong>{user.name}</strong><span>{isAdmin ? 'Administrator' : 'Karyawan'}</span></div><button aria-label="Keluar dari aplikasi" title="Keluar" onClick={logout} disabled={actionBusy}><Icon name="logout" size={18} /></button></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="Buka navigasi" onClick={() => setMobileNav(true)}><Icon name="menu" /></button><span>Workspace</span><Icon name="chevron" size={13} /><strong>{page === 'dashboard' ? 'Dashboard' : 'Employee Directory'}</strong></div><div className="header-right"><Avatar name={user.name} index={1} /><span className="header-name">{user.name}<small>{isAdmin ? 'Admin' : 'Karyawan'}</small></span></div></header>
      {actionError && modal?.type !== 'delete' && <div className="error-message" role="alert">{actionError}</div>}
      <main className={page === 'dashboard' ? 'dashboard-welcome' : undefined}>
        {page === 'dashboard' ? <h1>WELCOME</h1> : <>
          <div className="page-heading"><div />{isAdmin ? <button className="button primary" onClick={() => openModal({ type: 'add' })} disabled={loading || Boolean(loadError)}><Icon name="plus" size={18} />Tambah karyawan</button> : <span className="viewer-label"><Icon name="shield" size={16} />Akses karyawan</span>}</div>
          {loading ? <div className="panel data-state" role="status">Memuat data karyawan…</div> : loadError ? <div className="panel data-state"><p role="alert">{loadError}</p><button className="button secondary" onClick={() => { setLoading(true); setLoadError(''); setReload(value => value + 1) }}>Coba lagi</button></div> : <section className="panel directory-panel">
            <div className="panel-title"><div className="directory-title"><h2>Semua karyawan</h2><span className="count-badge">{employees.length} karyawan</span></div><label className="sort-label">Urutkan:<select aria-label="Urutkan karyawan" value={sort} onChange={e => { setSort(e.target.value); setCurrentPage(1) }}><option value="name">Nama A–Z</option><option value="newest">Terbaru ditambahkan</option></select></label></div>
            <div className="filter-bar"><div className="search-input"><Icon name="search" size={19} /><input aria-label="Cari karyawan" placeholder="Cari nama, email, atau jabatan…" maxLength={100} value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />{search && <button className="icon-button" aria-label="Hapus pencarian" onClick={() => { setSearch(''); setCurrentPage(1) }}><Icon name="close" size={16} /></button>}</div><select aria-label="Filter departemen" value={department} onChange={e => { setDepartment(e.target.value); setCurrentPage(1) }}><option value="">Semua departemen</option>{departments.map(d => <option key={d}>{d}</option>)}</select></div>
            <div className="table-scroll"><table><thead><tr><th>KARYAWAN</th><th>DEPARTEMEN</th><th>JABATAN</th><th className="actions-heading">AKSI</th></tr></thead><tbody>{rows.map(e => <tr key={e.id}>
              <td><button className="person-cell" onClick={() => openModal({ type: 'detail', employee: e })}><Avatar name={e.name} index={departments.indexOf(e.department)} /><span><strong>{e.name}</strong><small>{e.email}</small></span></button></td><td><span className={`department-tag dept-${departments.indexOf(e.department) % 6}`}>{e.department}</span></td><td className="position-cell">{e.position}</td>
              <td><div className="row-actions"><button className="icon-button" title="Lihat detail" aria-label={`Lihat detail ${e.name}`} onClick={() => openModal({ type: 'detail', employee: e })}><Icon name="eye" size={17} /></button>{isAdmin && <><button className="icon-button" title="Edit karyawan" aria-label={`Edit ${e.name}`} onClick={() => openModal({ type: 'edit', employee: e })}><Icon name="edit" size={16} /></button><button className="icon-button delete-icon" title="Hapus karyawan" aria-label={`Hapus ${e.name}`} onClick={() => openModal({ type: 'delete', employee: e })}><Icon name="trash" size={16} /></button></>}</div></td>
            </tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><span><Icon name="search" size={28} /></span><h3>Tidak ada karyawan ditemukan</h3><p>Coba kata kunci lain atau sesuaikan filter pencarian.</p>{(search || department) && <button className="button secondary" onClick={() => { setSearch(''); setDepartment(''); setCurrentPage(1) }}>Reset pencarian</button>}</div>}</div>
            <div className="table-footer"><p aria-live="polite">Menampilkan <strong>{filtered.length ? (safePage - 1) * 7 + 1 : 0}–{Math.min(safePage * 7, filtered.length)}</strong> dari <strong>{filtered.length}</strong> karyawan</p><div className="pagination">
              <button className="page-arrow" aria-label="Halaman sebelumnya" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}><Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).filter(n => n === 1 || n === pageCount || Math.abs(n - safePage) <= 1).map((n, i, list) => <span key={n}>{i > 0 && n - list[i - 1] > 1 && <span className="pagination-ellipsis">…</span>}<button aria-label={`Halaman ${n}`} aria-current={safePage === n ? 'page' : undefined} className={safePage === n ? 'current' : ''} onClick={() => setCurrentPage(n)}>{n}</button></span>)}
              <button className="page-arrow" aria-label="Halaman berikutnya" disabled={safePage === pageCount} onClick={() => setCurrentPage(safePage + 1)}><Icon name="chevron" size={16} /></button>
            </div></div>
          </section>}
        </>}
      </main>
      <footer className="footer"><span>© 2026 EDMS. All rights reserved.</span><span>Made for people. Built for teams.<span className="footer-separator">|</span>v1.0.0</span></footer>
    </div>
    {modal && (modal.type === 'add' || modal.type === 'edit') && isAdmin && <EmployeeForm employee={modal.employee} departments={departments} onSave={saveEmployee} onClose={() => setModal(null)} />}
    {modal?.type === 'delete' && isAdmin && <Modal title="Hapus karyawan?" onClose={actionBusy ? () => {} : () => setModal(null)}><div className="delete-message"><span className="delete-symbol"><Icon name="trash" size={25} /></span><p>Anda akan menghapus <strong>{modal.employee.name}</strong> dari direktori. Tindakan ini tidak dapat dibatalkan.</p></div>{actionError && <p className="error-message" role="alert">{actionError}</p>}<div className="modal-actions"><button className="button secondary" disabled={actionBusy} onClick={() => setModal(null)}>Batal</button><button className="button danger" disabled={actionBusy} onClick={deleteEmployee}><Icon name="trash" size={17} />{actionBusy ? 'Menghapus…' : 'Hapus karyawan'}</button></div></Modal>}
    {modal?.type === 'detail' && <Modal title="Profil karyawan" subtitle="Informasi anggota tim Anda." onClose={() => setModal(null)}><div className="profile-heading"><Avatar name={modal.employee.name} index={departments.indexOf(modal.employee.department)} large /><h3>{modal.employee.name}</h3><p>{modal.employee.position}</p></div><dl className="profile-details">{[['ID karyawan', modal.employee.id], ['Email', modal.employee.email], ['Telepon', modal.employee.phone || 'Belum ditambahkan'], ['Departemen', modal.employee.department], ['Ditambahkan', dateLabel(modal.employee.created_at)]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className="modal-actions"><button className="button secondary" onClick={() => setModal(null)}>Tutup</button>{isAdmin && <button className="button primary" onClick={() => openModal({ type: 'edit', employee: modal.employee })}><Icon name="edit" size={17} />Edit karyawan</button>}</div></Modal>}
    {toast && <div className="toast" role="status"><span><Icon name="check" size={17} /></span>{toast}<button className="icon-button" aria-label="Tutup notifikasi" onClick={() => setToast('')}><Icon name="close" size={16} /></button></div>}
  </div>
}
export default App
