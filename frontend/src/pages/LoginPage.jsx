import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data)
      const role = res.data.role
      if (role === 'ADMIN') navigate('/admin')
      else if (role === 'EMPLOYEE') navigate('/employee')
      else navigate('/')
    } catch {
      setError('Pogrešno korisničko ime ili lozinka.')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Prijava</h1>
        <p className="auth-subtitle">Unesite vaše podatke za pristup</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Korisničko ime</label>
            <input
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary full-width">Prijavi se</button>
        </form>

        <div className="auth-links">
          Nemate nalog? <Link to="/register">Registrujte se</Link>
          <br />
          <Link to="/">Nastavi kao gost</Link>
        </div>
      </div>
    </div>
  )
}
