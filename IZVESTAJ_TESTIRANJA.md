# Izveštaj o izvršenom testiranju — AutoParts

## Pregled rezultata

| Zadatak | Vrsta testiranja | Alat/Framework | Broj testova | Rezultat |
|---|---|---|---|---|
| Zadatak 1 | Test plan i specifikacija slučajeva korišćenja | Markdown dokument | — | ✅ Dokumentovano |
| Zadatak 2 | Jedinično (unit) testiranje | JUnit 5 + Mockito | 15 | ✅ 15/15 prolazi |
| Zadatak 3 | Integraciono testiranje + REST API | JUnit 5 + Spring Boot Test + MockMvc + H2 | 4 | ✅ 4/4 prolazi |
| Zadatak 4 | Testiranje React komponenti (UI) | Vitest + React Testing Library + MSW | 40 | ✅ 40/40 prolazi |
| Dodatni poeni | End-to-end (E2E) sistemsko testiranje | Playwright | 1 | ✅ prolazi |

**Ukupno backend testova:** 19 (15 jediničnih + 4 integraciona) — `mvn test` → BUILD SUCCESS
**Ukupno frontend testova:** 40 — `npm run test` → 40/40 passed
**E2E test:** 1 kompletan scenario (registracija → login → filter → korpa → plaćanje → potvrda → istorija)

---

## Zadatak 2 — Jedinično testiranje (JUnit 5 + Mockito)

**Klasa pod testom:** `OrderService.create()`

**Komanda pokretanja:**
```bash
cd backend
mvn test -Dtest=OrderServiceTest
```

**Rezultat:** 15/15 testova prolazi

### Lista testova

| # | Naziv testa | Šta proverava |
|---|---|---|
| 1 | `create_uspesnoKreiranje_...` | Status porudžbine = PENDING, totalPrice tačno izračunat (7000), stanje artikla umanjeno (15→13), `save()` pozvan tačno jednom |
| 2 | `create_praznaKorpa_...` | Baca `RuntimeException`, `save()` se nikad ne poziva |
| 3 | `create_klijentNijePronadjen_...` | Baca `RuntimeException`, `save()` se nikad ne poziva, `findById()` na artiklima se nikad ne poziva |
| 4 | `create_nedovoljnoStanje_...` | Baca `RuntimeException`, stanje artikla ostaje nepromenjeno (15), `save()` se nikad ne poziva |
| 5 | `create_viseArtikala_tacnoIzracunavanje...` | Tačno izračunavanje ukupne cene za više artikala (2×3500 + 3×850 = 9550), tačan broj stavki i jedinične cene |
| 6–15 | Dopunski testovi | Gost vs. klijent linkovanje porudžbine, snapshot cene artikla u trenutku poručivanja, validacija `PaymentMethod`, `getMyOrders()`, `updateStatus()` (validne i nevalidne tranzicije) |

### Napomene o implementaciji

- Svi testovi prate **Arrange–Act–Assert** obrazac
- Repozitorijumi (`UserRepository`, `ArticleRepository`, `OrderRepository`) su mokovani preko `@Mock`, servis preko `@InjectMocks`
- `@ExtendWith(MockitoExtension.class)` za Mockito integraciju sa JUnit 5
- `@MockitoSettings(strictness = Strictness.LENIENT)` — neki stubovi (npr. `orderRepository.save()`) nisu korišćeni u testovima koji bacaju exception pre tog koraka; LENIENT sprečava Mockito da to prijavi kao grešku ("unnecessary stubbing")

---

## Zadatak 3 — Integraciono testiranje REST API-ja

**Klasa pod testom:** `OrderIntegrationTest` (pun lanac Controller → Service → Repository → H2 baza)

**Komanda pokretanja:**
```bash
cd backend
mvn test -Dtest=OrderIntegrationTest
```

**Rezultat:** 4/4 testova prolazi (35/35 svih backend testova ukupno, uključujući zadatak 2)

### Lista testova

| Test | Tok | Provereno |
|---|---|---|
| Test 1 — Uspešno kreiranje porudžbine | register → login → `POST /api/orders` | HTTP 200, status porudžbine = PENDING, totalPrice = 7000, stanje artikla 15→13 u bazi |
| Test 2 — Artikal nije na stanju | `GET` artikal (stock=0) → `POST /api/orders` | HTTP 400, poruka greške "Nedovoljno stanja", stanje artikla ostaje 0 (nepromenjeno) |
| Test 3 — Neautorizovan pristup | Kreiranje porudžbine → CLIENT token na `PUT /api/orders/{id}/status` | HTTP 403 Forbidden, status porudžbine ostaje PENDING (nepromenjen) |
| Test 4 — Tranzicije statusa | PENDING→DELIVERED (dozvoljeno), zatim DELIVERED→PENDING (nedozvoljeno) | Prva tranzicija HTTP 200, druga HTTP 400, baza ostaje na DELIVERED |

### Izmene u produkcijskom kodu (rezultat ovog testiranja)

| Fajl | Izmena |
|---|---|
| `GlobalExceptionHandler.java` (novi) | `@RestControllerAdvice` presreće `RuntimeException` i vraća HTTP 400 sa JSON porukom `{"message": "..."}` umesto generičkog 500 |
| `SecurityConfig.java` | Dodato pravilo: `PUT /api/orders/**` dozvoljeno samo ulogama EMPLOYEE i ADMIN |
| `OrderService.updateStatus()` | Validacija dozvoljenih tranzicija statusa (PENDING → DELIVERED/CANCELLED dozvoljeno; iz DELIVERED ili CANCELLED nikuda dalje) |

### Napomene o testnom okruženju

- `@SpringBootTest` + `MockMvc`, H2 in-memory baza (`application-test.properties`)
- `@DirtiesContext(BEFORE_EACH_TEST_METHOD)` — svaki test dobija svežu šemu baze i ponovo pokreće `DataInitializer`, garantujući izolaciju između testova

---

## Zadatak 4 — Testiranje React komponenti

**Komponenta pod testom:** `HomePage.jsx`, `CartPage.jsx`

**Komanda pokretanja:**
```bash
cd frontend
npm run test
```

**Rezultat:** 40/40 testova prolazi (3 test fajla: `src/__tests__/HomePage.test.jsx` — 7 testova; `src/pages/__tests__/HomePage.test.jsx` — 16 testova; `src/pages/__tests__/CartPage.test.jsx` — 17 testova)

### Lista pokrivenih scenarija (novi `HomePage.test.jsx`, 7 testova)

| # | Scenario | Provereno |
|---|---|---|
| 1 | Prikaz svih artikala nakon učitavanja | MSW mokuje `GET /api/articles`, svi artikli se prikazuju na ekranu |
| 2 | Filtriranje po proizvođaču/kategoriji | React šalje GET zahtev sa query parametrima, prikazuje se filtrirana lista |
| 3 | Dodavanje dostupnog artikla u korpu | Klik na "Dodaj u korpu" → artikal se nalazi u `CartContext` |
| 4 | Onemogućeno dugme bez stanja | Artikal sa stock=0 → dugme "Dodaj u korpu" je disabled |
| 5 | Prikaz opcije "Obavesti me" | Artikal sa stock=0 → prikazuje se opcija za obaveštenje |
| 6 | Poruka o grešci kad API nije dostupan | MSW simulira network/500 grešku → korisniku se prikazuje razumljiva poruka, ne praznina |
| 7 | Uspešno slanje porudžbine | Pun tok: filter → korpa → `POST /api/orders` (mokovan) → potvrda porudžbine |

### Izmene u produkcijskom kodu (rezultat ovog testiranja)

| Fajl | Izmena |
|---|---|
| `HomePage.jsx` | Dodat `error` state + `try/catch` u `fetchArticles`; ispravljen stale closure bug (funkcija sada prima `activeFilters` kao parametar umesto da se oslanja na `setTimeout`) |
| `CartPage.jsx` | Dodati `htmlFor`/`id` atributi na form input poljima (guestName, guestEmail, guestPhone, deliveryAddress) radi ispravne RTL `getByLabelText` podrške i bolje pristupačnosti (accessibility) |

### Napomena o upozorenjima

Test izlaz prikazuje "React Router Future Flag Warning" — ovo su informativna upozorenja o promenama u React Router v7, ne greške. Ne utiču na ispravnost testova.

---

## Dodatni poeni — End-to-end testiranje (Playwright)

**Scenario:** Registracija klijenta → prijavljivanje → izbor filtera → dodavanje artikla u korpu → izbor načina plaćanja → potvrda porudžbine → provera da se porudžbina nalazi u istoriji porudžbina

**Komanda pokretanja:**
```bash
npx playwright test
```

**Rezultat:** Test prolazi — kompletan tok testiran kroz stvarno pokrenut frontend (Vite dev server) i stvarno pokrenut backend (Spring Boot), bez mokovanja, sa stvarnom H2 test bazom.

Ovo predstavlja **sistemsko testiranje** u punom smislu (frontend + backend + baza zajedno, stvarna integracija), za razliku od jediničnih testova (izolovana logika), integracionih testova (backend lanac bez frontenda) i komponentnih testova (frontend sa mokovanim API-jem).
