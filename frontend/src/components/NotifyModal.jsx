import { useState } from 'react'
import api from '../api/axios'

export default function NotifyModal({ article, onClose }) {
  const [type, setType] = useState('EMAIL')
  const [contact, setContact] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/notifications', {
        articleId: article.id,
        type,
        contactValue: contact,
      })
      setSuccess(true)
    } catch {
      setError('Greška pri slanju zahteva.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Obavesti me kada bude na stanju</h2>
        <p style={{ marginBottom: 16, color: '#555', fontSize: '0.9rem' }}>
          Artikal: <strong>{article.name}</strong>
        </p>

        {success ? (
          <>
            <div className="alert alert-success">
              Uspešno ste se prijavili za obaveštenje!
            </div>
            <button className="btn btn-secondary full-width" onClick={onClose}>Zatvori</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Način obaveštavanja</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Telefon (SMS)</option>
              </select>
            </div>
            <div className="form-group">
              <label>{type === 'EMAIL' ? 'Email adresa' : 'Broj telefona'}</label>
              <input
                type={type === 'EMAIL' ? 'email' : 'tel'}
                value={contact}
                onChange={e => setContact(e.target.value)}
                required
                placeholder={type === 'EMAIL' ? 'vas@email.com' : '+381601234567'}
              />
            </div>
            <div className="flex gap-8 justify-end">
              <button type="button" className="btn btn-outline" onClick={onClose}>Odustani</button>
              <button type="submit" className="btn btn-primary">Prijavi se</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
