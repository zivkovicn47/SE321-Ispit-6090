import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import CartPage from '../CartPage'
import { server } from '../../test/server'

// ----------------------------------------------------------------------- mock setup

const mockRemoveItem = vi.fn()
const mockUpdateQuantity = vi.fn()
const mockClearCart = vi.fn()

vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: vi.fn(),
}))

import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

const articleBosch = {
  id: 1, name: 'Kočione pločice Bosch', price: 3500, manufacturer: 'Bosch', stock: 15,
}
const articleMann = {
  id: 2, name: 'Filter ulja Mann', price: 850, manufacturer: 'Mann', stock: 0,
}

const Wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>

// ----------------------------------------------------------------------- prazna korpa

describe('CartPage — prazna korpa', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ auth: null })
    vi.mocked(useCart).mockReturnValue({
      items: [],
      removeItem: mockRemoveItem,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
      total: 0,
    })
  })

  test('prikazuje poruku kada je korpa prazna', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Vaša korpa je prazna.')).toBeInTheDocument()
  })

  test('dugme "Pogledaj artikle" je vidljivo', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Pogledaj artikle')).toBeInTheDocument()
  })

  test('forma za checkout nije vidljiva', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.queryByText('Naruči')).not.toBeInTheDocument()
  })
})

// ----------------------------------------------------------------------- artikli u korpi

describe('CartPage — korpa sa artiklima', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ auth: null })
    vi.mocked(useCart).mockReturnValue({
      items: [
        { article: articleBosch, quantity: 2 },
        { article: articleMann, quantity: 1 },
      ],
      removeItem: mockRemoveItem,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
      total: 7850,
    })
  })

  test('prikazuje nazive svih artikala u korpi', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Kočione pločice Bosch')).toBeInTheDocument()
    expect(screen.getByText('Filter ulja Mann')).toBeInTheDocument()
  })

  test('prikazuje ukupnu cenu iz CartContext', () => {
    render(<CartPage />, { wrapper: Wrapper })
    // 7.850 RSD — toLocaleString('sr-RS') formatira broj
    expect(screen.getByText(/7.850/)).toBeInTheDocument()
  })

  test('prikazuje stavku u pregledu: "Naziv × količina"', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Kočione pločice Bosch × 2')).toBeInTheDocument()
    expect(screen.getByText('Filter ulja Mann × 1')).toBeInTheDocument()
  })

  test('klik "+" poziva updateQuantity sa povećanom količinom', async () => {
    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    const plusButtons = screen.getAllByText('+')
    await user.click(plusButtons[0]) // Bosch pločice, quantity 2 → 3

    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3)
  })

  test('klik "−" poziva updateQuantity sa smanjenom količinom', async () => {
    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    const minusButtons = screen.getAllByText('−')
    await user.click(minusButtons[0])

    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 1)
  })

  test('klik "✕" poziva removeItem sa ispravnim ID-jem', async () => {
    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    const removeButtons = screen.getAllByText('✕')
    await user.click(removeButtons[0])

    expect(mockRemoveItem).toHaveBeenCalledWith(1)
  })
})

// ----------------------------------------------------------------------- gost checkout

describe('CartPage — gost korisnik (nije prijavljen)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ auth: null })
    vi.mocked(useCart).mockReturnValue({
      items: [{ article: articleBosch, quantity: 1 }],
      removeItem: mockRemoveItem,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
      total: 3500,
    })
  })

  test('prikazuje polja za gosta: ime, email, telefon', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Ime i prezime *')).toBeInTheDocument()
    expect(screen.getByText('Email *')).toBeInTheDocument()
    expect(screen.getByText('Telefon')).toBeInTheDocument()
  })

  test('prikazuje izbor načina plaćanja', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Način plaćanja')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pouzećem')).toBeInTheDocument()
  })

  test('info o kartici vidljiv kada se izabere CARD', async () => {
    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    await user.selectOptions(screen.getByDisplayValue('Pouzećem'), 'CARD')

    await waitFor(() => {
      expect(screen.getByText(/Plaćanje karticom se vrši/)).toBeInTheDocument()
    })
  })
})

// ----------------------------------------------------------------------- prijavljen klijent

describe('CartPage — prijavljen klijent', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      auth: { token: 'test-token', role: 'CLIENT', username: 'klijent1', userId: 1 },
    })
    vi.mocked(useCart).mockReturnValue({
      items: [{ article: articleBosch, quantity: 1 }],
      removeItem: mockRemoveItem,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
      total: 3500,
    })
  })

  test('polja za gosta NISU vidljiva', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.queryByText('Ime i prezime *')).not.toBeInTheDocument()
    expect(screen.queryByText('Email *')).not.toBeInTheDocument()
  })

  test('prikazuje dugme "Naruči"', () => {
    render(<CartPage />, { wrapper: Wrapper })
    expect(screen.getByText('Naruči')).toBeInTheDocument()
  })
})

// ----------------------------------------------------------------------- slanje porudžbine

describe('CartPage — slanje porudžbine', () => {
  beforeEach(() => {
    mockClearCart.mockClear()
    vi.mocked(useAuth).mockReturnValue({ auth: null })
    vi.mocked(useCart).mockReturnValue({
      items: [{ article: articleBosch, quantity: 2 }],
      removeItem: mockRemoveItem,
      updateQuantity: mockUpdateQuantity,
      clearCart: mockClearCart,
      total: 7000,
    })
  })

  test('uspešno slanje prikazuje ekran potvrde', async () => {
    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    await user.type(screen.getByRole('textbox', { name: /ime i prezime/i }), 'Marko Marković')
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'marko@test.com')
    await user.type(screen.getByRole('textbox', { name: /adresa dostave/i }), 'Test ulica 1')

    await user.click(screen.getByText('Naruči'))

    await waitFor(() => {
      expect(screen.getByText('Porudžbina je uspešno kreirana!')).toBeInTheDocument()
    })
    expect(mockClearCart).toHaveBeenCalledOnce()
  })

  test('greška API-ja prikazuje alert sa porukom greške', async () => {
    server.use(
      http.post('/api/orders', () =>
        HttpResponse.json({ message: 'Greška' }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    await user.type(screen.getByRole('textbox', { name: /ime i prezime/i }), 'Marko M')
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'marko@test.com')
    await user.type(screen.getByRole('textbox', { name: /adresa dostave/i }), 'Test 1')

    await user.click(screen.getByText('Naruči'))

    await waitFor(() => {
      expect(screen.getByText('Greška pri naručivanju. Pokušajte ponovo.')).toBeInTheDocument()
    })
    expect(mockClearCart).not.toHaveBeenCalled()
  })

  test('slanje bez adrese dostave ne šalje API zahtev (required polje)', async () => {
    let apiCalled = false
    server.use(
      http.post('/api/orders', () => {
        apiCalled = true
        return HttpResponse.json({})
      })
    )

    const user = userEvent.setup()
    render(<CartPage />, { wrapper: Wrapper })

    await user.type(screen.getByRole('textbox', { name: /ime i prezime/i }), 'Marko M')
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'marko@test.com')
    // adresa dostave se namerno izostavi

    await user.click(screen.getByText('Naruči'))

    // Browser validacija sprečava submit → API ne bi trebao biti pozvan
    expect(apiCalled).toBe(false)
  })
})
