# Dokumentacija testnog koda — AutoParts

Ovaj dokument objašnjava strukturu, pristup i ključne odluke u testnom kodu napravljenom
za zadatke 2, 3 i 4, uključujući objašnjenja koja specifikacija ispitnog zadatka eksplicitno
traži (jedinica koja se testira, mokovane zavisnosti, razlozi pristupa).

---

## Zadatak 2 — Jedinično testiranje (`OrderServiceTest.java`)

**Lokacija:** `backend/src/test/java/com/autoparts/service/OrderServiceTest.java`

### Šta predstavlja jedinicu koja se testira

Jedinica koja se testira je metoda `OrderService.create(Long clientId, CreateOrderRequest request)`,
izolovana od svih spoljnih zavisnosti. Testira se isključivo poslovna logika unutar same metode:
validacija ulaza, izračunavanje cene, postavljanje statusa i odluka da li se porudžbina sme
sačuvati — bez ikakve interakcije sa stvarnom bazom podataka ili HTTP slojem.

### Koje zavisnosti su simulirane (mokovane)

| Zavisnost | Razlog mokovanja |
|---|---|
| `UserRepository` | Servis poziva `findById()` da provери postojanje klijenta — mokovano da test kontroliše da li klijent "postoji" ili ne, bez stvarnog upita u bazu |
| `ArticleRepository` | Servis poziva `findById()` za svaki artikal iz korpe da provери stanje i cenu — mokovano da test može precizno postaviti stanje (stock) i cenu po test slučaju |
| `OrderRepository` | Servis poziva `save()` da sačuva kreiranu porudžbinu — mokovano da test može provериti DA LI je `save()` pozvan (ili nije, kod grešaka), bez stvarnog upisa |

Mokovanje je realizovano pomoću Mockito-a: `@Mock` na svakom repozitorijumu, `@InjectMocks` na
`OrderService` (Mockito automatski ubacuje mokove u konstruktor/polja servisa),
`@ExtendWith(MockitoExtension.class)` na nivou klase za integraciju sa JUnit 5.

### Zašto se ne koristi prava baza podataka

1. **Brzina** — jedinični testovi treba da se izvršavaju u milisekundama; pokretanje stvarne
   baze (čak i H2) po testu unosi nepotrebnu sporost kada testiramo samo logiku jedne metode.
2. **Izolacija** — cilj jediničnog testa je da testira *samo* logiku servisa, ne i ispravnost
   JPA mapiranja, SQL upita ili konfiguracije baze. Ako test koristi stvarnu bazu, greška u bazi
   (npr. loš constraint) bi mogla pokvariti test koji testira nešto sasvim drugo (npr. izračunavanje cene).
3. **Kontrola test podataka** — mokovanjem repozitorijuma, test može precizno simulirati granične
   slučajeve (npr. "klijent ne postoji", "stanje je 0") bez potrebe da se ti scenariji prvo
   pripreme u bazi.
4. **Determinizam** — mokovi garantuju da test uvek vraća isti rezultat, bez zavisnosti od
   prethodnog stanja baze ili reda izvršavanja testova.

### Struktura testova (Arrange–Act–Assert)

Svaki test je organizovan u tri jasno odvojena dela:
- **Arrange** — priprema mok objekata (`when(...).thenReturn(...)`) i test podataka
- **Act** — pozivanje metode koja se testira (`orderService.create(...)`)
- **Assert** — provera rezultata (`assertEquals`, `assertThrows`) i provera da su mokovane
  metode pozvane onoliko puta koliko se očekuje (`verify(..., times(n))` / `never()`)

### Napomena o `@MockitoSettings(strictness = Strictness.LENIENT)`

Mockito-ov podrazumevani "strict stubbing" režim baca grešku ako je stub definisan
(npr. u `@BeforeEach`) ali nije korišćen u određenom testu. Pošto neki testovi (npr. testovi
koji testiraju da metoda baca exception zbog praznе korpe ili nepostojećeg klijenta) prekidaju
izvršavanje metode pre nego što dođu do koraka koji koristi `orderRepository.save()`, taj stub
ostaje nekorišćen u tim specifičnim testovima. LENIENT režim to tretira kao prihvatljivo, umesto
kao grešku.

---

## Zadatak 3 — Integraciono testiranje (`OrderIntegrationTest.java`)

**Lokacija:** `backend/src/test/java/com/autoparts/integration/OrderIntegrationTest.java`

### Koje komponente se zajedno testiraju

Za razliku od jediničnog testa (koji testira samo `OrderService` izolovano), integracioni
testovi pokrivaju **kompletan lanac** obrade HTTP zahteva:

```
HTTP zahtev → Controller (AuthController / OrderController)
            → Service (AuthService / OrderService)
            → Repository (UserRepository / ArticleRepository / OrderRepository)
            → H2 testna baza podataka
            → HTTP odgovor
```

Ovo znači da se, za razliku od jediničnih testova, ovde stvarno provеravaju:
- Spring Security konfiguracija (autentifikacija, autorizacija po ulogama)
- JWT generisanje i validacija
- Serijalizacija/deserijalizacija JSON-a
- Stvarno izvršavanje JPA upita nad H2 bazom
- Mapiranje grešaka na HTTP statuse (`GlobalExceptionHandler`)

### Testno okruženje

- `@SpringBootTest` pokreće kompletan Spring kontekst aplikacije
- `MockMvc` simulira HTTP zahteve bez potrebe za stvarnim mrežnim slojem (brže od pravog HTTP servera)
- H2 in-memory baza, konfigurisana u `application-test.properties`, zamenjuje produkcionu bazu
  samo za vreme izvršavanja testova
- `@DirtiesContext(BEFORE_EACH_TEST_METHOD)` — Spring kontekst (i baza) se potpuno restartuje
  pre svakog testa, garantujući da testovi ne utiču jedan na drugi (npr. da porudžbina kreirana
  u Test 1 ne postoji više kada počne Test 2)

### Pregled testova i komponenti koje pokrivaju

| Test | Komponente u lancu |
|---|---|
| Test 1 — Uspešno kreiranje porudžbine | `AuthController`→`AuthService` (register/login) → `OrderController`→`OrderService`→`OrderRepository`/`ArticleRepository` → H2 |
| Test 2 — Artikal nije na stanju | `OrderController`→`OrderService` (validacija stanja) →`GlobalExceptionHandler` (mapiranje na HTTP 400) |
| Test 3 — Neautorizovan pristup | Spring Security filter chain (`SecurityConfig`, `JwtFilter`) → odbacuje zahtev pre nego što dođe do `OrderController` |
| Test 4 — Tranzicije statusa | `OrderController`→`OrderService.updateStatus()` (validacija dozvoljenih tranzicija) → `OrderRepository` → H2 |

---

## Zadatak 4 — Testiranje React komponenti

**Lokacija:** `frontend/src/__tests__/HomePage.test.jsx` (i postojeći `frontend/src/pages/__tests__/`)

### Pristup testiranju

Testovi koriste **React Testing Library (RTL)** filozofiju: testira se ponašanje koje korisnik
vidi i može da izvrši (klik na dugme, prikaz teksta, popunjavanje forme), a ne unutrašnja
implementacija komponente (interni state, nazivi funkcija). Ovo je namerna odluka — testovi
ostaju validni i nakon refaktorisanja komponente, sve dok se korisničko ponašanje ne promeni.

### Mokovanje HTTP komunikacije (MSW)

Mock Service Worker (MSW) presreće stvarne HTTP zahteve koje React aplikacija šalje (`fetch`/`axios`
pozive ka `/api/articles`, `/api/orders`, itd.) na nivou mrežnog sloja, i vraća unapred definisane
mok odgovore. Ovo je preciznije od mokovanja samih JavaScript funkcija, jer testira da li
komponenta zaista šalje zahtev u ispravnom formatu (URL, query parametri, HTTP metoda, body)
— isto kao što integracioni testovi na backendu provеravaju stvarnu HTTP komunikaciju.

### Pregled scenarija i njihove svrhe

| Scenario | Svrha |
|---|---|
| Prikaz artikala nakon učitavanja | Provеrava osnovni "happy path" — da komponenta pravilno renderuje podatke dobijene sa API-ja |
| Filtriranje | Provеrava da promena filtera generiše novi HTTP zahtev sa odgovarajućim parametrima |
| Dodavanje u korpu | Provеrava integraciju sa `CartContext` — da klik na dugme ažurira globalno stanje korpe |
| Disabled dugme bez stanja | Provеrava da UI sprečava korisnika da poruči artikal koji nije dostupan, pre nego što zahtev i stigne do backend-a |
| "Obavesti me" | Provеrava da je alternativna akcija (za nedostupne artikle) dostupna korisniku |
| Greška kad API nije dostupan | Provеrava graceful degradation — korisnik dobija razumljivu poruku, ne praznu stranicu ili pad aplikacije |
| Slanje porudžbine | Provеrava ceo tok od interakcije do HTTP POST zahteva i prikaza potvrde — najbliže simulira stvarnu upotrebu |

### Izmene u produkcijskom kodu nastale tokom testiranja

Pisanje testova otkrilo je dva stvarna problema u komponentama, koji su ispravljeni:

1. **`HomePage.jsx` — nedostatak error handling-a.** Komponenta ranije nije imala stanje za
   prikaz greške ako `GET /api/articles` ne uspe — dodat je `error` state i `try/catch` blok.
2. **`HomePage.jsx` — stale closure bug.** Funkcija za resetovanje filtera je ranije koristila
   `setTimeout` da bi "sačekala" da se state ažurira pre ponovnog poziva API-ja, što je
   nepouzdan obrazac (React state update nije sinhron, a `setTimeout` ne garantuje da će state
   biti ažuriran do tada). Ispravljeno tako da `fetchArticles` prima filtere direktno kao
   parametar, izbegavajući zavisnost od zastarele (stale) closure vrednosti.
3. **`CartPage.jsx` — pristupačnost formi.** Dodati `htmlFor`/`id` parovi na input poljima, čime
   su test upiti tipa `getByLabelText` postali mogući, a forma je istovremeno postala
   pristupačnija (accessible) i za stvarne korisnike koji koriste screen reader-e.

---

## Dodatni poeni — End-to-end testiranje (Playwright)

**Lokacija:** `e2e/order-flow.spec.js` (ili odgovarajuća putanja u projektu)

### Razlika u odnosu na ostale vrste testiranja

| Vrsta testa | Frontend | Backend | Baza | Šta se zapravo testira |
|---|---|---|---|---|
| Jedinični (Zadatak 2) | — | Mokovan (samo servis) | Mokovana | Logika jedne metode |
| Integracioni (Zadatak 3) | — | Stvaran (cely Spring kontekst) | H2 (stvarna, ali test) | Backend lanac u celini |
| Komponentni (Zadatak 4) | Stvaran (renderovan) | Mokovan (MSW) | — | Ponašanje UI komponente |
| **End-to-end** | **Stvaran (Vite dev server)** | **Stvaran (Spring Boot)** | **Stvarna (test)** | **Cela aplikacija, kao što bi je stvarni korisnik koristio** |

E2E test je jedini test u celom paketu koji ne mokuje **ništa** — pokreće se pravi frontend
server, pravi backend server, i test (preko Playwright-a) upravlja pretraživačem kao da je
stvaran korisnik: klikće, popunjava forme, čeka na promene na ekranu. Ovo je najsporiji ali
najrealniji nivo testiranja, i direktno odgovara konceptu "sistemskog testiranja" iz test plana ([Zadatak 1](file:///c:/_Projekti/SE321-Ispit-6090/PLAN_TESTIRANJA.md)).

### Scenario pokriven testom

Registracija novog klijenta → automatska prijava → filtriranje kataloga artikala → dodavanje
artikla na stanju u korpu → odabir načina plaćanja i adrese dostave → slanje porudžbine →
provera da se porudžbina pojavljuje u istoriji porudžbina prijavljenog klijenta.

Test koristi dinamički generisane podatke (npr. username sa timestamp sufiksom) da bi mogao
da se ponovo izvršava bez konflikta sa podacima iz prethodnog pokretanja.
