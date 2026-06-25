import { useEffect, useState } from 'react'
import api from '../api/axios'

const SO_STATUS = { PENDING: 'Na čekanju', CONFIRMED: 'Potvrđena', REJECTED: 'Odbijena' }
const SO_BADGE = { PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', REJECTED: 'badge-rejected' }

export default function AdminDashboard() {
  const [tab, setTab] = useState('employees')
  const [users, setUsers] = useState([])
  const [specialOrders, setSpecialOrders] = useState([])
  const [newEmp, setNewEmp] = useState({ username: '', email: '', password: '', phone: '' })
  const [msg, setMsg] = useState('')
  const [respondId, setRespondId] = useState(null)
  const [respondForm, setRespondForm] = useState({ status: 'CONFIRMED', note: '' })

  useEffect(() => {
    if (tab === 'employees') fetchUsers()
    if (tab === 'specialOrders') fetchSpecialOrders()
  }, [tab])

  const fetchUsers = async () => {
    const res = await api.get('/admin/users')
    setUsers(res.data)
  }

  const fetchSpecialOrders = async () => {
    const res = await api.get('/special-orders/all')
    setSpecialOrders(res.data)
  }

  const createEmployee = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/admin/employees', newEmp)
      setMsg('Zaposleni je uspešno dodat.')
      setNewEmp({ username: '', email: '', password: '', phone: '' })
      fetchUsers()
    } catch {
      setMsg('Greška pri kreiranju zaposlenog.')
    }
  }

  const sendResponse = async (id) => {
    await api.put(`/special-orders/${id}/respond`, respondForm)
    setRespondId(null)
    fetchSpecialOrders()
  }

  const ROLE_BADGE = { ADMIN: 'badge-delivered', EMPLOYEE: 'badge-pending', CLIENT: 'badge-cancelled' }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1>Admin panel</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>Zaposleni</button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Svi korisnici</button>
        <button className={`tab ${tab === 'specialOrders' ? 'active' : ''}`} onClick={() => setTab('specialOrders')}>Spec. porudžbine</button>
      </div>

      {tab === 'employees' && (
        <div>
          {msg && <div className={`alert ${msg.includes('Greška') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
          <div className="card card-body" style={{ maxWidth: 500, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 14 }}>Dodaj zaposlenog</h3>
            <form onSubmit={createEmployee}>
              <div className="form-group">
                <label>Korisničko ime *</label>
                <input required value={newEmp.username} onChange={e => setNewEmp({ ...newEmp, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" required value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Lozinka *</label>
                <input type="password" required value={newEmp.password} onChange={e => setNewEmp({ ...newEmp, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">Dodaj zaposlenog</button>
            </form>
          </div>

          <div className="table-wrapper card">
            <table>
              <thead>
                <tr><th>Korisničko ime</th><th>Email</th><th>Uloga</th></tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'EMPLOYEE').map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrapper card">
          <table>
            <thead>
              <tr><th>#</th><th>Korisničko ime</th><th>Email</th><th>Telefon</th><th>Uloga</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'specialOrders' && (
        <div>
          {specialOrders.length === 0 ? (
            <p style={{ color: '#888' }}>Nema specijalnih porudžbina.</p>
          ) : (
            specialOrders.map(so => (
              <div key={so.id} className="card card-body mb-16">
                <div className="flex justify-between align-center mb-16">
                  <div>
                    <span style={{ fontWeight: 600 }}>#{so.id} - {so.clientName}</span>
                    <span style={{ marginLeft: 12, color: '#888', fontSize: '0.85rem' }}>
                      {new Date(so.createdAt).toLocaleDateString('sr-RS')}
                    </span>
                  </div>
                  <span className={`badge ${SO_BADGE[so.status]}`}>{SO_STATUS[so.status]}</span>
                </div>

                <div className="grid-2" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
                  <div><strong>Email:</strong> {so.clientEmail}</div>
                  <div><strong>Telefon:</strong> {so.clientPhone || '-'}</div>
                  <div><strong>Vozilo:</strong> {so.carBrand} {so.carModel} {so.carYear}</div>
                  <div><strong>VIN:</strong> {so.carVin || '-'}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Opis delova:</strong>
                  <p style={{ marginTop: 4, color: '#555' }}>{so.partDescription}</p>
                </div>

                {so.adminNote && (
                  <div style={{ background: '#f0f7ff', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: '0.88rem' }}>
                    <strong>Odgovor prodavnice:</strong> {so.adminNote}
                  </div>
                )}

                {so.status === 'PENDING' && (
                  respondId === so.id ? (
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                      <div className="form-group">
                        <label>Odluka</label>
                        <select value={respondForm.status} onChange={e => setRespondForm({ ...respondForm, status: e.target.value })}>
                          <option value="CONFIRMED">Potvrdi</option>
                          <option value="REJECTED">Odbij</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Poruka klijentu</label>
                        <textarea value={respondForm.note} onChange={e => setRespondForm({ ...respondForm, note: e.target.value })}
                          placeholder="npr. Deo je dostupan, rok isporuke 5-7 dana, preuzimanje na adresi..." rows={3} />
                      </div>
                      <div className="flex gap-8">
                        <button className="btn btn-success btn-sm" onClick={() => sendResponse(so.id)}>Pošalji odgovor</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setRespondId(null)}>Odustani</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setRespondId(so.id); setRespondForm({ status: 'CONFIRMED', note: '' }) }}>
                      Odgovori
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
