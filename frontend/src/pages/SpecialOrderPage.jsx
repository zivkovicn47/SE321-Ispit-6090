import { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function SpecialOrderPage() {
  const { auth } = useAuth()
  const [form, setForm] = useState({
    clientName: auth?.username || '',
    clientEmail: '',
    clientPhone: '',
    carBrand: '',
    carModel: '',
    carYear: '',
    carVin: '',
    partDescription: '',
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/special-orders', { ...form, carYear: form.carYear ? Number(form.carYear) : null })
      setSuccess(true)
    } catch {
      setError('Greška pri slanju zahteva.')
    }
  }

  if (success) {
    return (
      <div className="container page-content text-center">
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📨</div>
        <h2 style={{ marginBottom: 8 }}>Zahtev je uspešno poslat!</h2>
        <p style={{ color: '#666' }}>
          Proveriće mo sa dobavljačem i obavestiti Vas emailom o dostupnosti i rokovima isporuke.
        </p>
      </div>
    )
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1>Specijalna porudžbina</h1>
        <p>Deo koji tražite nije u katalogu? Pošaljite nam zahtev i mi ćemo proveriti sa dobavljačem.</p>
      </div>

      <div style={{ maxWidth: 700 }}>
        <form className="card card-body" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <h3 style={{ marginBottom: 14 }}>Vaši podaci</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Ime i prezime *</label>
              <input required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} />
            </div>
          </div>

          <h3 style={{ margin: '14px 0' }}>Podaci o vozilu</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Marka *</label>
              <input required value={form.carBrand} onChange={e => setForm({ ...form, carBrand: e.target.value })} placeholder="npr. Volkswagen" />
            </div>
            <div className="form-group">
              <label>Model *</label>
              <input required value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} placeholder="npr. Golf 6" />
            </div>
            <div className="form-group">
              <label>Godina</label>
              <input type="number" value={form.carYear} onChange={e => setForm({ ...form, carYear: e.target.value })} placeholder="npr. 2012" min="1950" max="2030" />
            </div>
            <div className="form-group">
              <label>VIN broj (opciono)</label>
              <input value={form.carVin} onChange={e => setForm({ ...form, carVin: e.target.value })} placeholder="17-znakovni VIN" />
            </div>
          </div>

          <div className="form-group">
            <label>Opis traženih delova *</label>
            <textarea
              required
              value={form.partDescription}
              onChange={e => setForm({ ...form, partDescription: e.target.value })}
              placeholder="Opišite deo(ove) koji Vam je potreban što detaljnije (naziv, kataloški broj ako znate, strana ugradnje...)"
              rows={5}
            />
          </div>

          <button type="submit" className="btn btn-primary">Pošalji zahtev</button>
        </form>
      </div>
    </div>
  )
}
