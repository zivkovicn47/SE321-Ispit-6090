import { useEffect, useState } from 'react'
import api from '../api/axios'

const STATUS_LABEL = { PENDING: 'Na čekanju', DELIVERED: 'Isporučena', CANCELLED: 'Poništena' }
const STATUS_BADGE = { PENDING: 'badge-pending', DELIVERED: 'badge-delivered', CANCELLED: 'badge-cancelled' }
const CATEGORIES = ['Kočioni sistem', 'Filteri', 'Vešanje', 'Motor', 'Elektrika', 'Karoserija', 'Ostalo']

export default function EmployeeDashboard() {
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [orderFilter, setOrderFilter] = useState('ALL')
  const [articles, setArticles] = useState([])
  const [editArticle, setEditArticle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [articleForm, setArticleForm] = useState({
    name: '', description: '', price: '', stock: '', category: '', manufacturer: '', partNumber: '', imageUrl: ''
  })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (tab === 'orders') fetchOrders()
    if (tab === 'articles') fetchArticles()
  }, [tab])

  const fetchOrders = async () => {
    const res = await api.get('/orders/all')
    setOrders(res.data)
  }

  const fetchArticles = async () => {
    const res = await api.get('/articles')
    setArticles(res.data)
  }

  const filteredOrders = orderFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === orderFilter)

  const updateOrderStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, null, { params: { status } })
    fetchOrders()
  }

  const openEdit = (article) => {
    setEditArticle(article.id)
    setArticleForm({
      name: article.name || '',
      description: article.description || '',
      price: article.price || '',
      stock: article.stock || '',
      category: article.category || '',
      manufacturer: article.manufacturer || '',
      partNumber: article.partNumber || '',
      imageUrl: article.imageUrl || '',
    })
    setShowForm(true)
  }

  const openNew = () => {
    setEditArticle(null)
    setArticleForm({ name: '', description: '', price: '', stock: '', category: '', manufacturer: '', partNumber: '', imageUrl: '' })
    setShowForm(true)
  }

  const saveArticle = async (e) => {
    e.preventDefault()
    setMsg('')
    const payload = { ...articleForm, price: Number(articleForm.price), stock: Number(articleForm.stock) }
    try {
      if (editArticle) {
        await api.put(`/articles/${editArticle}`, payload)
        setMsg('Artikal je ažuriran.')
      } else {
        await api.post('/articles', payload)
        setMsg('Artikal je dodat.')
      }
      setShowForm(false)
      fetchArticles()
    } catch {
      setMsg('Greška pri čuvanju.')
    }
  }

  const deleteArticle = async (id) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj artikal?')) return
    await api.delete(`/articles/${id}`)
    fetchArticles()
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1>Dashboard zaposlenog</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Porudžbine</button>
        <button className={`tab ${tab === 'articles' ? 'active' : ''}`} onClick={() => setTab('articles')}>Artikli</button>
      </div>

      {tab === 'orders' && (
        <div>
          <div className="flex gap-8 mb-16">
            {['ALL', 'PENDING', 'DELIVERED', 'CANCELLED'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${orderFilter === s ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOrderFilter(s)}
              >
                {s === 'ALL' ? 'Sve' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="table-wrapper card">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Klijent</th>
                  <th>Datum</th>
                  <th>Ukupno</th>
                  <th>Plaćanje</th>
                  <th>Status</th>
                  <th>Akcija</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.client?.username || order.guestName || 'Gost'}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('sr-RS')}</td>
                    <td>{order.totalPrice?.toLocaleString('sr-RS')} RSD</td>
                    <td>{order.paymentMethod === 'CARD' ? 'Kartica' : 'Pouzeće'}</td>
                    <td><span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span></td>
                    <td>
                      {order.status === 'PENDING' && (
                        <div className="flex gap-8">
                          <button className="btn btn-success btn-sm" onClick={() => updateOrderStatus(order.id, 'DELIVERED')}>Isporučena</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateOrderStatus(order.id, 'CANCELLED')}>Poništi</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'articles' && (
        <div>
          {msg && <div className={`alert ${msg.includes('Greška') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

          <div className="mb-16">
            <button className="btn btn-primary" onClick={openNew}>+ Dodaj artikal</button>
          </div>

          {showForm && (
            <div className="card card-body mb-16">
              <h3 style={{ marginBottom: 14 }}>{editArticle ? 'Izmeni artikal' : 'Novi artikal'}</h3>
              <form onSubmit={saveArticle}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Naziv *</label>
                    <input required value={articleForm.name} onChange={e => setArticleForm({ ...articleForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Proizvođač</label>
                    <input value={articleForm.manufacturer} onChange={e => setArticleForm({ ...articleForm, manufacturer: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Cena (RSD) *</label>
                    <input type="number" required value={articleForm.price} onChange={e => setArticleForm({ ...articleForm, price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Stanje na lageru *</label>
                    <input type="number" required value={articleForm.stock} onChange={e => setArticleForm({ ...articleForm, stock: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Kategorija</label>
                    <select value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category: e.target.value })}>
                      <option value="">Odaberi...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kataloški broj</label>
                    <input value={articleForm.partNumber} onChange={e => setArticleForm({ ...articleForm, partNumber: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Opis</label>
                  <textarea value={articleForm.description} onChange={e => setArticleForm({ ...articleForm, description: e.target.value })} />
                </div>
                <div className="flex gap-8">
                  <button type="submit" className="btn btn-primary">Sačuvaj</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Odustani</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-wrapper card">
            <table>
              <thead>
                <tr>
                  <th>Naziv</th>
                  <th>Kategorija</th>
                  <th>Proizvođač</th>
                  <th>Cena</th>
                  <th>Stanje</th>
                  <th>Akcija</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.category}</td>
                    <td>{a.manufacturer}</td>
                    <td>{a.price?.toLocaleString('sr-RS')} RSD</td>
                    <td>
                      {a.stock > 0
                        ? <span className="stock-in">{a.stock} kom</span>
                        : <span className="stock-out">0</span>}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>Izmeni</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteArticle(a.id)}>Obriši</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
