import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart()
  const { auth } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    paymentMethod: 'CASH_ON_DELIVERY',
    deliveryAddress: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleOrder = async (e) => {
    e.preventDefault()
    setError('')
    if (items.length === 0) { setError('Korpa je prazna.'); return }

    const payload = {
      items: items.map(i => ({ articleId: i.article.id, quantity: i.quantity })),
      paymentMethod: form.paymentMethod,
      deliveryAddress: form.deliveryAddress,
    }

    if (!auth) {
      payload.guestName = form.guestName
      payload.guestEmail = form.guestEmail
      payload.guestPhone = form.guestPhone
    }

    try {
      await api.post('/orders', payload)
      clearCart()
      setSuccess(true)
    } catch {
      setError('Greška pri naručivanju. Pokušajte ponovo.')
    }
  }

  if (success) {
    return (
      <div className="container page-content text-center">
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ marginBottom: 8 }}>Porudžbina je uspešno kreirana!</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Vaša porudžbina je primljena i biće obrađena u najkraćem roku.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Nastavi kupovinu</button>
      </div>
    )
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1>Korpa</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center mt-20">
          <p style={{ color: '#888', marginBottom: 16 }}>Vaša korpa je prazna.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Pogledaj artikle</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div className="card">
            {items.map(item => (
              <div key={item.article.id} className="cart-item">
                <div style={{ fontSize: '2rem' }}>🔧</div>
                <div className="cart-item-info">
                  <div style={{ fontWeight: 600 }}>{item.article.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.article.manufacturer}</div>
                  <div style={{ color: '#e94560', fontWeight: 700 }}>
                    {item.article.price?.toLocaleString('sr-RS')} RSD
                  </div>
                </div>
                <div className="flex align-center gap-8">
                  <button className="btn btn-outline btn-sm" onClick={() => updateQuantity(item.article.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => updateQuantity(item.article.id, item.quantity + 1)}>+</button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.article.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="cart-summary mb-16">
              <h3 style={{ marginBottom: 12 }}>Pregled porudžbine</h3>
              {items.map(item => (
                <div key={item.article.id} className="flex justify-between" style={{ fontSize: '0.9rem', marginBottom: 6 }}>
                  <span>{item.article.name} × {item.quantity}</span>
                  <span>{(item.article.price * item.quantity).toLocaleString('sr-RS')} RSD</span>
                </div>
              ))}
              <hr style={{ margin: '12px 0' }} />
              <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Ukupno</span>
                <span style={{ color: '#e94560' }}>{total.toLocaleString('sr-RS')} RSD</span>
              </div>
            </div>

            <form className="card card-body" onSubmit={handleOrder}>
              {error && <div className="alert alert-error">{error}</div>}

              {!auth && (
                <>
                  <div className="form-group">
                    <label htmlFor="guestName">Ime i prezime *</label>
                    <input id="guestName" required value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="guestEmail">Email *</label>
                    <input id="guestEmail" type="email" required value={form.guestEmail} onChange={e => setForm({ ...form, guestEmail: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="guestPhone">Telefon</label>
                    <input id="guestPhone" value={form.guestPhone} onChange={e => setForm({ ...form, guestPhone: e.target.value })} />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="deliveryAddress">Adresa dostave *</label>
                <input id="deliveryAddress" required value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Ulica i broj, grad" />
              </div>

              <div className="form-group">
                <label>Način plaćanja</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="CASH_ON_DELIVERY">Pouzećem</option>
                  <option value="CARD">Karticom</option>
                </select>
              </div>

              {form.paymentMethod === 'CARD' && (
                <div style={{ background: '#f0f7ff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: '0.85rem', color: '#0f3460' }}>
                  Plaćanje karticom se vrši pri preuzimanju na adresi dostave ili u poslovnici.
                </div>
              )}

              <button type="submit" className="btn btn-success full-width">Naruči</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
