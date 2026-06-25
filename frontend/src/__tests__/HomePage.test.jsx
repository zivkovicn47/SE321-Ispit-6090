/*
 * Testovi za HomePage komponentu — Vitest + React Testing Library + MSW
 *
 * Šta se testira:
 *   HomePage: inicijalni prikaz artikala, filtriranje, dodavanje u korpu,
 *   nedostupni artikli (stock=0), NotifyModal, greška API-ja
 *   Integracija: pun tok narudžbine (HomePage → CartPage → POST /api/orders)
 *
 * Zavisnosti su mokovane putem MSW (src/test/handlers.js):
 *   GET /api/articles — vraća listu artikala (sa podrškom za filter po name/category)
 *   POST /api/orders  — vraća uspešan odgovor (id=42, status=PENDING)
 *   POST /api/notifications — vraća uspešan odgovor
 *   Nema stvarne mreže ni Spring Boot servera — HTTP sloj presreće MSW.
 *
 * CartProvider i AuthProvider se renderuju oko komponente jer:
 *   - HomePage koristi useCart() za dodavanje artikala u korpu
 *   - CartPage koristi useAuth() za razlikovanje gosta od prijavljenog korisnika
 *
 * Izolacija: server.resetHandlers() + localStorage.clear() se pozivaju u afterEach
 * (src/test/setup.js) — svaki test startuje sa čistim stanjem.
 */

import { screen, waitFor, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, test, expect } from 'vitest'

import HomePage from '../pages/HomePage'
import CartPage from '../pages/CartPage'
import Navbar from '../components/Navbar'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { renderWithProviders } from '../test/renderWithProviders'
import { server } from '../test/server'

// ─── Helper: mini aplikacija sa Navbar-om i rutama ───────────────────────────
// Koristi se za testove koji zahtevaju navigaciju između stranica
// ili vidljivost broja artikala u korpi kroz Navbar.
function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 1 — Prikaz svih artikala
//
//  Proverava: MSW GET /api/articles → React renderuje sve artikle po imenu
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 1 — Prikaz svih artikala', () => {
  test('Prikazuje sve artikle nakon uspešnog učitavanja sa servera', async () => {
    renderWithProviders(<HomePage />)

    // MSW handlers.js vraća 3 artikla; čekamo asinhrono učitavanje
    expect(await screen.findByText('Kočione pločice Bosch')).toBeInTheDocument()
    expect(screen.getByText('Filter ulja Mann')).toBeInTheDocument()
    expect(screen.getByText('Amortizer Monroe prednji')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 2 — Filtriranje po kategoriji
//
//  Proverava: izbor kategorije → GET /api/articles?category=... → prikazuje
//  samo artikle koji odgovaraju filteru
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 2 — Filtriranje artikala po kategoriji', () => {
  test('Izbor kategorije i klik "Pretraži" prikazuje samo filtrirane artikle', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    // Sačekaj inicijalno učitavanje sva 3 artikla
    await screen.findByText('Kočione pločice Bosch')

    // Izaberi kategoriju "Kočioni sistem" iz <select> forme
    await user.selectOptions(screen.getByRole('combobox'), 'Kočioni sistem')

    // Klikni "Pretraži" — okida GET /api/articles?category=Kočioni sistem
    await user.click(screen.getByRole('button', { name: 'Pretraži' }))

    // MSW handler filtrira po kategoriji i vraća samo "Kočione pločice Bosch"
    await waitFor(() => {
      expect(screen.queryByText('Filter ulja Mann')).not.toBeInTheDocument()
      expect(screen.queryByText('Amortizer Monroe prednji')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Kočione pločice Bosch')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 3 — Dodavanje dostupnog artikla u korpu
//
//  Proverava: klik "Dodaj u korpu" → CartContext ažuriran →
//  Navbar reflektuje novi broj stavki (Korpa (1))
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 3 — Dodavanje dostupnog artikla u korpu', () => {
  test('Klik "Dodaj u korpu" ažurira CartContext i Navbar pokazuje Korpa (1)', async () => {
    const user = userEvent.setup()
    renderApp() // renderujemo sa Navbar-om koji prikazuje broj stavki u korpi

    await screen.findByText('Kočione pločice Bosch')

    // Korpa je inicijalno prazna
    expect(screen.getByRole('link', { name: /Korpa \(0\)/i })).toBeInTheDocument()

    // Klikni "Dodaj u korpu" za prvi dostupni artikal (Kočione pločice Bosch)
    const addButtons = screen.getAllByRole('button', { name: 'Dodaj u korpu' })
    await user.click(addButtons[0])

    // Navbar reflektuje ažuriran CartContext — broj stavki je 1
    expect(await screen.findByRole('link', { name: /Korpa \(1\)/i })).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 4 — Onemogućeno dugme za artikal koji nije na stanju
//
//  Proverava: artikal sa stock=0 prikazuje "Obavesti me" umesto "Dodaj u korpu"
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 4 — Artikal sa stock=0 nema dugme "Dodaj u korpu"', () => {
  test('Artikal bez stanja prikazuje "Obavesti me", a ne "Dodaj u korpu"', async () => {
    renderWithProviders(<HomePage />)

    await screen.findByText('Filter ulja Mann') // sačekaj render

    // 2 od 3 artikla su na stanju → tačno 2 dugmeta "Dodaj u korpu"
    expect(screen.getAllByRole('button', { name: 'Dodaj u korpu' })).toHaveLength(2)

    // 1 artikal bez stanja ("Filter ulja Mann") → tačno 1 dugme "Obavesti me"
    expect(screen.getAllByRole('button', { name: 'Obavesti me' })).toHaveLength(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 5 — Prikaz opcije "Obavesti me" i otvaranje NotifyModal
//
//  Proverava: klik "Obavesti me" otvara modal → naziv artikla je prikazan →
//  klik "Odustani" zatvara modal
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 5 — NotifyModal za nedostupan artikal', () => {
  test('Klik "Obavesti me" otvara NotifyModal sa imenom artikla; "Odustani" ga zatvara', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HomePage />)

    await screen.findByText('Filter ulja Mann')

    // Modal nije prikazan pre klika
    expect(screen.queryByText('Obavesti me kada bude na stanju')).not.toBeInTheDocument()

    // Klikni dugme "Obavesti me" (jedino dugme te vrste na stranici)
    await user.click(screen.getByRole('button', { name: 'Obavesti me' }))

    // NotifyModal se otvara i prikazuje naslov i naziv artikla
    // Naziv se nalazi u <strong> tagu unutar modala (pored istog teksta u article-card)
    expect(screen.getByText('Obavesti me kada bude na stanju')).toBeInTheDocument()
    expect(screen.getByText('Filter ulja Mann', { selector: 'strong' })).toBeInTheDocument()

    // Klik "Odustani" zatvara modal
    await user.click(screen.getByRole('button', { name: 'Odustani' }))
    expect(screen.queryByText('Obavesti me kada bude na stanju')).not.toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 6 — Prikaz poruke o grešci kada API nije dostupan
//
//  Proverava: MSW vraća HTTP 500 → HomePage prikazuje poruku o grešci
//  (role="alert"), artikli se ne prikazuju
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 6 — Greška Spring Boot API', () => {
  test('Prikazuje poruku o grešci korisniku kada server vrati HTTP 500', async () => {
    // Prepiši handler za ovaj test — simulira serversku grešku
    server.use(
      http.get('/api/articles', () => new HttpResponse(null, { status: 500 }))
    )

    renderWithProviders(<HomePage />)

    // Poruka o grešci se prikazuje umesto liste artikala
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Greška pri učitavanju artikala'
    )
    expect(screen.queryByText('Kočione pločice Bosch')).not.toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  TEST 7 — Pun tok narudžbine (HomePage → CartPage → potvrda)
//
//  Komponente: HomePage (filter, dodavanje u korpu) →
//              Navbar (navigacija na /cart) →
//              CartPage (forma za gosta, POST /api/orders) →
//              MSW (presreće POST i vraća uspešan odgovor)
//
//  Proverava: filter → artikal se prikazuje → dodaje se u korpu →
//  forma za gosta se popunjava → narudžbina se šalje → prikazuje se potvrda
// ═════════════════════════════════════════════════════════════════════════════

describe('Test 7 — Integracija: pun tok narudžbine', () => {
  test(
    'Pretraga → dodaj u korpu → naruči kao gost → potvrda narudžbine (React ↔ Spring Boot API)',
    async () => {
      const user = userEvent.setup()
      renderApp()

      // ── Faza 1: Učitavanje i filtriranje artikala ─────────────────────────
      await screen.findByText('Kočione pločice Bosch')

      // Unesi filter po nazivu
      await user.type(screen.getByPlaceholderText('npr. kočione pločice'), 'Kočione')
      await user.click(screen.getByRole('button', { name: 'Pretraži' }))

      // Čekamo da ostali artikli nestanu iz DOM-a (re-fetch završen)
      await waitFor(() => {
        expect(screen.queryByText('Filter ulja Mann')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Kočione pločice Bosch')).toBeInTheDocument()

      // ── Faza 2: Dodavanje u korpu ─────────────────────────────────────────
      // Samo jedan artikal je vidljiv → jedno dugme "Dodaj u korpu"
      await user.click(screen.getByRole('button', { name: 'Dodaj u korpu' }))
      await screen.findByRole('link', { name: /Korpa \(1\)/i })

      // ── Faza 3: Navigacija do korpe ───────────────────────────────────────
      await user.click(screen.getByRole('link', { name: /Korpa \(1\)/i }))

      // ── Faza 4: Forma za gosta i slanje narudžbine ────────────────────────
      // auth=null (localStorage je čist) → prikazuju se polja za gosta
      await user.type(screen.getByLabelText(/Ime i prezime/i), 'Test Korisnik')
      await user.type(screen.getByLabelText(/Email \*/i), 'test@test.com')
      await user.type(screen.getByLabelText(/Adresa dostave/i), 'Knez Mihailova 10')

      // POST /api/orders → MSW vraća { id: 42, status: 'PENDING', ... }
      await user.click(screen.getByRole('button', { name: 'Naruči' }))

      // ── Faza 5: Potvrda narudžbine ────────────────────────────────────────
      expect(
        await screen.findByText('Porudžbina je uspešno kreirana!')
      ).toBeInTheDocument()
    }
  )
})
