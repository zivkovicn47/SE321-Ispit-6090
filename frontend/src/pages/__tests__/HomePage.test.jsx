import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { CartProvider, useCart } from '../../context/CartContext'
import HomePage from '../HomePage'
import { server } from '../../test/server'
import { mockArticles } from '../../test/handlers'

// AuthContext nije korišćen u HomePage direktno — ne treba mock
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ auth: null }),
}))

const Wrapper = ({ children }) => (
  <MemoryRouter>
    <CartProvider>{children}</CartProvider>
  </MemoryRouter>
)

// Pomoćna komponenta za proveru stanja korpe u testu
function CartCounter() {
  const { items } = useCart()
  return <span data-testid="cart-count">{items.length}</span>
}

describe('HomePage — prikaz artikala', () => {
  test('prikazuje artikle dobijene od API-ja', async () => {
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Kočione pločice Bosch')).toBeInTheDocument()
    })
    expect(screen.getByText('Filter ulja Mann')).toBeInTheDocument()
    expect(screen.getByText('Amortizer Monroe prednji')).toBeInTheDocument()
  })

  test('artikal na stanju prikazuje "Na stanju (N kom)"', async () => {
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Na stanju (15 kom)')).toBeInTheDocument()
    })
    expect(screen.getByText('Na stanju (8 kom)')).toBeInTheDocument()
  })

  test('artikal bez stanja prikazuje "Nije na stanju"', async () => {
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Nije na stanju')).toBeInTheDocument()
    })
  })

  test('artikal na stanju ima dugme "Dodaj u korpu"', async () => {
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => {
      const buttons = screen.getAllByText('Dodaj u korpu')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  test('artikal bez stanja ima dugme "Obavesti me" umesto "Dodaj u korpu"', async () => {
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Filter ulja Mann')).toBeInTheDocument()
    })

    // Mann filter ima stock: 0 → samo "Obavesti me", bez "Dodaj u korpu" za taj artikal
    const articleCards = screen.getAllByText(/Obavesti me/)
    expect(articleCards.length).toBeGreaterThan(0)
  })

  test('kada nema artikala, prikazuje poruku o praznom rezultatu', async () => {
    server.use(
      http.get('/api/articles', () => HttpResponse.json([]))
    )
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Nema pronađenih artikala.')).toBeInTheDocument()
    })
  })
})

describe('HomePage — filtriranje', () => {
  test('pretraga po imenu šalje zahtev sa query parametrom', async () => {
    const user = userEvent.setup()
    let capturedUrl = ''

    server.use(
      http.get('/api/articles', ({ request }) => {
        capturedUrl = request.url
        const url = new URL(request.url)
        const name = url.searchParams.get('name')
        const filtered = name
          ? mockArticles.filter(a => a.name.toLowerCase().includes(name.toLowerCase()))
          : mockArticles
        return HttpResponse.json(filtered)
      })
    )

    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Kočione pločice Bosch'))

    const nameInput = screen.getByPlaceholderText('npr. kočione pločice')
    await user.clear(nameInput)
    await user.type(nameInput, 'Kočione')

    await user.click(screen.getByText('Pretraži'))

    await waitFor(() => {
      expect(capturedUrl).toContain('name=Ko%C4%8Dione')
    })
  })

  test('filtriranje po imenu prikazuje samo odgovarajuće artikle', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Filter ulja Mann'))

    const nameInput = screen.getByPlaceholderText('npr. kočione pločice')
    await user.clear(nameInput)
    await user.type(nameInput, 'Kočione')
    await user.click(screen.getByText('Pretraži'))

    await waitFor(() => {
      expect(screen.getByText('Kočione pločice Bosch')).toBeInTheDocument()
      expect(screen.queryByText('Filter ulja Mann')).not.toBeInTheDocument()
    })
  })

  test('Resetuj dugme čisti filtre i ponovo učitava sve artikle', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Kočione pločice Bosch'))

    const nameInput = screen.getByPlaceholderText('npr. kočione pločice')
    await user.type(nameInput, 'nesto')

    await user.click(screen.getByText('Resetuj'))

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(screen.getByText('Filter ulja Mann')).toBeInTheDocument()
    })
  })
})

describe('HomePage — dodavanje u korpu', () => {
  test('klik na "Dodaj u korpu" privremeno menja tekst na "Dodato!"', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getAllByText('Dodaj u korpu'))

    const addButtons = screen.getAllByText('Dodaj u korpu')
    await user.click(addButtons[0])

    expect(await screen.findByText('Dodato!')).toBeInTheDocument()
  })

  test('klik "Dodaj u korpu" ažurira CartContext', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CartProvider>
          <HomePage />
          <CartCounter />
        </CartProvider>
      </MemoryRouter>
    )

    await waitFor(() => screen.getAllByText('Dodaj u korpu'))
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')

    const addButtons = screen.getAllByText('Dodaj u korpu')
    await user.click(addButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
  })

  test('klik "Obavesti me" otvara modal', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Obavesti me'))
    await user.click(screen.getByText('Obavesti me'))

    expect(screen.getByText('Obavesti me kada bude na stanju')).toBeInTheDocument()
  })
})

describe('HomePage — NotifyModal', () => {
  test('modal prikazuje naziv artikla', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Obavesti me'))
    await user.click(screen.getByText('Obavesti me'))

    // Naziv se prikazuje u <strong> tagu unutar modala
    // (isti tekst postoji i u article-card, pa se mora precizirati selector)
    expect(screen.getByText('Filter ulja Mann', { selector: 'strong' })).toBeInTheDocument()
  })

  test('modal može da se zatvori', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Obavesti me'))
    await user.click(screen.getByText('Obavesti me'))

    expect(screen.getByText('Obavesti me kada bude na stanju')).toBeInTheDocument()

    await user.click(screen.getByText('Odustani'))

    await waitFor(() => {
      expect(screen.queryByText('Obavesti me kada bude na stanju')).not.toBeInTheDocument()
    })
  })

  test('uspešno slanje EMAIL notifikacije prikazuje potvrdu', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Obavesti me'))
    await user.click(screen.getByText('Obavesti me'))

    const emailInput = screen.getByPlaceholderText('vas@email.com')
    await user.type(emailInput, 'korisnik@test.com')

    await user.click(screen.getByRole('button', { name: 'Prijavi se' }))

    await waitFor(() => {
      expect(screen.getByText('Uspešno ste se prijavili za obaveštenje!')).toBeInTheDocument()
    })
  })

  test('prebacivanje na PHONE menja input tip i placeholder', async () => {
    const user = userEvent.setup()
    render(<HomePage />, { wrapper: Wrapper })

    await waitFor(() => screen.getByText('Obavesti me'))
    await user.click(screen.getByText('Obavesti me'))

    // Kada je modal otvoren postoje 2 combobox-a (filter kategorija + modal select)
    // Modal select inicijalno prikazuje "Email" — targetiramo ga po displayValue
    const select = screen.getByDisplayValue('Email')
    await user.selectOptions(select, 'PHONE')

    expect(screen.getByPlaceholderText('+381601234567')).toBeInTheDocument()
  })
})
