import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'

export function renderWithProviders(ui, { initialRoute = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CartProvider>
          {ui}
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

export function renderWithCart(ui, { initialRoute = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CartProvider>
        {ui}
      </CartProvider>
    </MemoryRouter>
  )
}
