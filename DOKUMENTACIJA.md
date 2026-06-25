# AutoParts - Dokumentacija projekta

Veb aplikacija za prodavnicu auto delova razvijena kao ispit za predmet SE321.

## Tech stack

- **Backend:** Java 17 + Spring Boot 3.2 + Spring Security + Spring Data JPA
- **Baza podataka:** H2 (file-based, bez eksternog servera)
- **Autentifikacija:** JWT (JSON Web Token)
- **Frontend:** React 18 + Vite + React Router v6
- **HTTP klijent:** Axios

---

## Struktura projekta

```
SE321-Ispit-6090/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/autoparts/
│       │   ├── AutoPartsApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java
│       │   │   └── DataInitializer.java
│       │   ├── entity/
│       │   │   ├── User.java
│       │   │   ├── Article.java
│       │   │   ├── Order.java
│       │   │   ├── OrderItem.java
│       │   │   ├── NotificationRequest.java
│       │   │   └── SpecialOrder.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   ├── ArticleRepository.java
│       │   │   ├── OrderRepository.java
│       │   │   ├── NotificationRequestRepository.java
│       │   │   └── SpecialOrderRepository.java
│       │   ├── dto/
│       │   │   ├── LoginRequest.java
│       │   │   ├── RegisterRequest.java
│       │   │   ├── AuthResponse.java
│       │   │   ├── ArticleDto.java
│       │   │   ├── OrderRequest.java
│       │   │   ├── OrderItemRequest.java
│       │   │   ├── NotificationRequestDto.java
│       │   │   ├── SpecialOrderRequest.java
│       │   │   └── CreateEmployeeRequest.java
│       │   ├── security/
│       │   │   ├── JwtUtil.java
│       │   │   ├── JwtFilter.java
│       │   │   └── UserDetailsServiceImpl.java
│       │   ├── service/
│       │   │   ├── AuthService.java
│       │   │   ├── ArticleService.java
│       │   │   ├── OrderService.java
│       │   │   ├── NotificationService.java
│       │   │   ├── SpecialOrderService.java
│       │   │   └── AdminService.java
│       │   └── controller/
│       │       ├── AuthController.java
│       │       ├── ArticleController.java
│       │       ├── OrderController.java
│       │       ├── NotificationController.java
│       │       ├── SpecialOrderController.java
│       │       └── AdminController.java
│       └── resources/
│           └── application.properties
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx
        ├── api/
        │   └── axios.js
        ├── context/
        │   ├── AuthContext.jsx
        │   └── CartContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── NotifyModal.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── HomePage.jsx
            ├── CartPage.jsx
            ├── OrdersPage.jsx
            ├── SpecialOrderPage.jsx
            ├── EmployeeDashboard.jsx
            └── AdminDashboard.jsx
```

---

## Pokretanje aplikacije

### Backend

```bash
cd backend
mvn spring-boot:run
```

Aplikacija se pokreće na `http://localhost:8080`.  
H2 konzola dostupna na `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/autoparts-db`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacija se pokreće na `http://localhost:5173`.  
Vite proxy prosljeđuje sve `/api/*` pozive na backend (`localhost:8080`).

---

## Podrazumevani nalozi (DataInitializer)

| Uloga | Korisničko ime | Lozinka |
|---|---|---|
| Admin | `admin` | `admin123` |
| Zaposleni | `zaposleni1` | `zap123` |
| Klijent | registracija putem forme | — |

Uz naloge, inicijalizator kreira 5 test artikala u bazi pri prvom pokretanju.

---

## Baza podataka — entiteti

### User
| Polje | Tip | Opis |
|---|---|---|
| id | Long | PK |
| username | String | jedinstveno |
| email | String | jedinstveno |
| password | String | BCrypt hash |
| phone | String | opciono |
| role | Enum | ADMIN / EMPLOYEE / CLIENT |

### Article
| Polje | Tip | Opis |
|---|---|---|
| id | Long | PK |
| name | String | naziv artikla |
| description | String | do 2000 znakova |
| price | BigDecimal | cena u RSD |
| stock | Integer | količina na lageru |
| category | String | kategorija |
| manufacturer | String | proizvođač |
| partNumber | String | kataloški broj |
| imageUrl | String | opciono |

### Order
| Polje | Tip | Opis |
|---|---|---|
| id | Long | PK |
| client | User | FK, može biti null za gosta |
| guestName/Email/Phone | String | podaci gosta ako nema naloga |
| status | Enum | PENDING / DELIVERED / CANCELLED |
| paymentMethod | Enum | CARD / CASH_ON_DELIVERY |
| deliveryAddress | String | adresa dostave |
| totalPrice | BigDecimal | ukupan iznos |
| createdAt | LocalDateTime | vreme kreiranja |
| items | List\<OrderItem\> | stavke (cascade) |

### OrderItem
Veza između `Order` i `Article` — čuva `quantity` i `unitPrice` u trenutku naručivanja.

### NotificationRequest
Zahtev za obaveštenjem kada artikal dođe na stanje. Čuva `type` (EMAIL/PHONE), `contactValue`, i `notified` flag.

### SpecialOrder
Specijalna porudžbina sa podacima o klijentu, vozilu, opisu traženih delova i odgovoru prodavnice (`status`: PENDING/CONFIRMED/REJECTED, `adminNote`).

---

## REST API

### Autentifikacija — `/api/auth`

| Metod | Putanja | Pristup | Opis |
|---|---|---|---|
| POST | `/api/auth/login` | javno | Prijava, vraća JWT token |
| POST | `/api/auth/register` | javno | Registracija klijenta, vraća JWT token |

### Artikli — `/api/articles`

| Metod | Putanja | Pristup | Opis |
|---|---|---|---|
| GET | `/api/articles` | javno | Lista artikala sa filterima (name, category, manufacturer, minPrice, maxPrice) |
| GET | `/api/articles/{id}` | javno | Detalji jednog artikla |
| POST | `/api/articles` | EMPLOYEE, ADMIN | Dodavanje novog artikla |
| PUT | `/api/articles/{id}` | EMPLOYEE, ADMIN | Izmena artikla |
| DELETE | `/api/articles/{id}` | EMPLOYEE, ADMIN | Brisanje artikla |

### Porudžbine — `/api/orders`

| Metod | Putanja | Pristup | Opis |
|---|---|---|---|
| POST | `/api/orders` | javno (sa ili bez tokena) | Kreiranje porudžbine |
| GET | `/api/orders/all` | EMPLOYEE, ADMIN | Sve porudžbine |
| GET | `/api/orders/status/{status}` | EMPLOYEE, ADMIN | Filter po statusu |
| GET | `/api/orders/my` | CLIENT | Porudžbine prijavljenog klijenta |
| PUT | `/api/orders/{id}/status?status=` | EMPLOYEE, ADMIN | Promena statusa |

### Obaveštenja — `/api/notifications`

| Metod | Putanja | Pristup | Opis |
|---|---|---|---|
| POST | `/api/notifications` | javno | Prijava za obaveštenje kada artikal dođe na stanje |

### Specijalne porudžbine — `/api/special-orders`

| Metod | Putanja | Pristup | Opis |
|---|---|---|---|
| POST | `/api/special-orders` | javno | Slanje specijalnog zahteva |
| GET | `/api/special-orders/all` | EMPLOYEE, ADMIN | Sve specijalne porudžbine |
| GET | `/api/special-orders/my` | CLIENT | Specijalne porudžbine klijenta |
| PUT | `/api/special-orders/{id}/respond` | ADMIN | Odgovor prodavnice (status + nota) |

### Admin — `/api/admin`

| Metod | Putanja | Pristup | Opis |
|---|---|---|---|
| POST | `/api/admin/employees` | ADMIN | Kreiranje novog zaposlenog |
| GET | `/api/admin/users` | ADMIN | Lista svih korisnika |

---

## Bezbednost

- **BCrypt** za hashovanje lozinki
- **JWT** token sa 24h trajanjem (HS256 potpis)
- `JwtFilter` — `OncePerRequestFilter` koji čita `Authorization: Bearer <token>` header na svakom zahtevu
- `SecurityConfig` definiše javne rute (artikli GET, auth, notifikacije, specijalne porudžbine) i zaštićene rute po ulozi
- CORS konfigurisan za `http://localhost:5173`

---

## Frontend — opis stranica

### LoginPage (`/login`)
Forma za prijavu. Nakon uspešne prijave, preusmerava:
- ADMIN → `/admin`
- EMPLOYEE → `/employee`
- CLIENT → `/`

Sadrži linkove za registraciju i nastavak kao gost.

### RegisterPage (`/register`)
Forma za registraciju klijenta (username, email, lozinka, telefon). Automatski prijavljuje korisnika i preusmerava na početnu.

### HomePage (`/`)
Katalog artikala sa filterima. Komponente:
- **Filters bar** — pretraga po nazivu, kategoriji, proizvođaču, opsegu cene
- **Articles grid** — kartica za svaki artikal sa statusom stanja
- Dugme **"Dodaj u korpu"** za artikle na stanju
- Dugme **"Obavesti me"** za artikle koji nisu na stanju → otvara `NotifyModal`

### NotifyModal
Modal koji se prikazuje nad HomePage. Klijent bira EMAIL ili PHONE i unosi kontakt podatak. Šalje `POST /api/notifications`.

### CartPage (`/cart`)
Pregled korpe. Omogućava:
- Promenu količine i uklanjanje artikala
- Unos adrese dostave
- Izbor načina plaćanja (kartica/pouzeće)
- Za gosta — unos imena, emaila, telefona
- Slanje porudžbine (`POST /api/orders`)

### OrdersPage (`/orders`) — zaštićena, CLIENT
Pregled svih porudžbina prijavljenog klijenta sa statusima, stavkama i ukupnim iznosom.

### SpecialOrderPage (`/special-order`)
Forma za specijalnu porudžbinu sa sekcijama:
- Podaci klijenta (ime, email, telefon)
- Podaci o vozilu (marka, model, godina, VIN)
- Opis traženih delova (textarea)

### EmployeeDashboard (`/employee`) — zaštićena, EMPLOYEE/ADMIN
Dva taba:
1. **Porudžbine** — tabela sa svim porudžbinama, filter po statusu, dugmad za promenu statusa (Isporučena / Poništi) za PENDING porudžbine
2. **Artikli** — tabela artikala, dugmad za izmenu i brisanje, inline forma za dodavanje/izmenu

### AdminDashboard (`/admin`) — zaštićena, ADMIN
Tri taba:
1. **Zaposleni** — forma za dodavanje novog zaposlenog + lista zaposlenih
2. **Svi korisnici** — tabela svih korisnika u sistemu
3. **Spec. porudžbine** — lista specijalnih zahteva sa mogućnošću odgovaranja (potvrda/odbijanje + poruka klijentu)

---

## Ključni detalji implementacije

### Obaveštenje pri dolasku na stanje
U `ArticleService.update()` — ako je staro stanje bilo 0 a novo je > 0, poziva se `triggerNotifications()` koji sve neposlate `NotificationRequest` za taj artikal označava kao `notified = true`. U realnom sistemu ovde bi se poslao email/SMS.

### Gost korisnik
Porudžbine i specijalne porudžbine mogu se kreirati bez prijave. Ako JWT token nije prisutan u zahtevu, `client` u `Order` ostaje `null`, a koriste se `guestName`, `guestEmail`, `guestPhone` polja.

### Korpa (CartContext)
Korpa je čisto klijentska — čuva se u React stanju (ne persists između sesija). `CartContext` izlaže `addItem`, `removeItem`, `updateQuantity`, `clearCart` i izračunati `total`.

### AuthContext
Čuva JWT token, ulogu, korisničko ime i ID u `localStorage`. Axios interceptor automatski dodaje `Authorization` header na sve API pozive.

### ProtectedRoute
Provjerava da li je korisnik prijavljen i da li ima odgovarajuću ulogu. U slučaju da nije prijavljen, preusmerava na `/login`; u slučaju pogrešne uloge, preusmerava na `/`.
