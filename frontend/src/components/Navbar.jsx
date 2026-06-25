import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { auth, logout } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">AutoParts</Link>
        <div className="navbar-links">
          <Link to="/">Artikli</Link>
          <Link to="/special-order">Specijalna porudžbina</Link>

          {auth ? (
            <>
              {(auth.role === 'CLIENT') && (
                <Link to="/orders">Moje porudžbine</Link>
              )}
              {(auth.role === 'EMPLOYEE' || auth.role === 'ADMIN') && (
                <Link to="/employee">Dashboard</Link>
              )}
              {auth.role === 'ADMIN' && (
                <Link to="/admin">Admin</Link>
              )}
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                {auth.username} ({auth.role})
              </span>
              <button onClick={handleLogout}>Odjavi se</button>
            </>
          ) : (
            <>
              <Link to="/login">Prijavi se</Link>
              <Link to="/register">Registruj se</Link>
            </>
          )}

          <Link to="/cart" className="navbar-cart">
            Korpa ({items.length})
          </Link>
        </div>
      </div>
    </nav>
  )
}
