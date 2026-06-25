# Plan testiranja i slučajevi korišćenja — AutoParts

Ovaj dokument sadrži **Tabelu za testiranje na osnovu slučajeva korišćenja** (prema specifikaciji aplikacije) i **Test plan za aplikaciju prodavnice auto-delova** (Zadatak 1).

---

## 1. Tabela za testiranje na osnovu slučajeva korišćenja (5 poena)

Tabela u nastavku je kreirana na osnovu specifikacije aplikacije i definiše testiranje za sve ključne slučajeve korišćenja (Use Cases) u sistemu.

| Slučaj korišćenja | Funkcija koja se testira | Inicijalno stanje sistema | Ulazi | Očekivani izlaz |
| :--- | :--- | :--- | :--- | :--- |
| **Registracija klijenta** | `registerClient()` | Korisnik je gost, nalazi se na formi za registraciju. | Korisničko ime: `novi_klijent`<br>Email: `klijent@test.com`<br>Lozinka: `lozinka123`<br>Telefon: `060111222` | Kreiran nalog klijenta u bazi sa ulogom `CLIENT`. Korisnik je automatski ulogovan i preusmeren na HomePage sa JWT tokenom. |
| **Prijava korisnika** | `login()` | Korisnik nije ulogovan, nalazi se na stranici za prijavu. | Korisničko ime: `zaposleni1`<br>Lozinka: `zap123` | Korisnik je uspešno ulogovan (JWT token sačuvan), preusmeren na EmployeeDashboard na osnovu uloge `EMPLOYEE`. |
| **Nastavak kao gost** | Nastavak kupovine bez prijave | Korisnik nije ulogovan, klikće na "Nastavi kao gost". | Klik na link "Nastavi kao gost" ili direktno na artikle. | Korisnik je na HomePage, može pretraživati katalog i dodavati artikle u korpu bez unosa kredencijala. |
| **Kreiranje novog zaposlenog** | `createEmployee()` | Administrator je ulogovan i nalazi se na tabu "Zaposleni". | Korisničko ime: `novi_zap`<br>Email: `novi@test.com`<br>Lozinka: `sifra123` | Novi nalog sa ulogom `EMPLOYEE` je kreiran u bazi podataka i pojavljuje se na listi svih korisnika. |
| **Pregled porudžbina po statusu** | `getOrdersByStatus()` | Zaposleni je ulogovan i nalazi se na tabu "Porudžbine". | Izbor filtera statusa: "Poništena" (CANCELLED) | Tabela prikazuje isključivo porudžbine čiji je status `CANCELLED` (neupelo isporučene). |
| **Manipulacija artiklima — Dodavanje** | `createArticle()` | Zaposleni je ulogovan, otvorena forma za novi artikal. | Naziv: "Svećica NGK"<br>Kategorija: "Elektrika"<br>Cena: `450`<br>Lager: `30`<br>Proizvođač: "NGK" | Novi artikal je sačuvan u bazi, prikazan u tabeli artikala na dashboard-u i u katalogu na HomePage-u. |
| **Pretraga po filterima** | `fetchArticles()` | Korisnik (bilo koja uloga) na HomePage-u sa prikazanim svim artiklima. | Naziv: "Kočione"<br>Proizvođač: "Bosch"<br>Kategorija: "Kočioni sistem" | Prikazuje se samo artikal "Kočione pločice Bosch" koji ispunjava sve kriterijume. Ostali se uklanjaju iz prikaza. |
| **Dodavanje u korpu** | `addItem()` | Korpa je prazna (stavke = 0). Artikal je na stanju (`stock > 0`). | Klik na dugme "Dodaj u korpu" za artikal ID `1`. | Stanje korpe u `CartContext` se ažurira na 1 stavku, a u zaglavlju (Navbar) se menja tekst u "Korpa (1)". |
| **Plaćanje / Naručivanje** | `createOrder()` | Artikal je u korpi, korisnik je na CartPage. | Adresa: "Bul. Umetnosti 2, N. Beograd"<br>Način plaćanja: `CARD`<br>Podaci gosta (ako nije ulogovan): Ime, Email, Telefon | Porudžbina je kreirana u bazi sa statusom `PENDING`, količina artikla na lageru je umanjena za naručenu količinu, korpa je ispražnjena, prikazuje se ekran sa potvrdom. |
| **Opcija "Obavesti me"** | `createNotificationRequest()` | Artikal nije na stanju (`stock = 0`). Dugme "Dodaj u korpu" je zamenjeno sa "Obavesti me". | Klik na "Obavesti me", izbor kanala `EMAIL`, unos: `klijent@test.com` | Kreiran zapis u tabeli `notification_request` za dati artikal. Prikazuje se poruka potvrde. |
| **Trigerovanje obaveštenja** | `triggerNotifications()` | Postoji zahtev za obaveštenje za artikal ID `2`. Zaposleni povećava lager artikla sa `0` na `5`. | Izmena stanja artikla: `stock = 5` | Sistem u bazi označava zahtev kao poslat (`notified = true`) i pokreće eksterni servis za slanje obaveštenja klijentu. |
| **Specijalno poručivanje** | `createSpecialOrder()` | Klijent/gost je na SpecialOrderPage. | Ime klijenta, podaci o vozilu (Marka, Model, Godina, VIN), opis potrebnih delova. | Specijalni zahtev je sačuvan u bazi sa statusom `PENDING`. Zaposleni ga vidi na svom dashboard-u. |
| **Odgovor na spec. porudžbinu** | `respondToSpecialOrder()` | Administrator je na tabu "Spec. porudžbine". | Selektovan zahtev ID `1`, status: `CONFIRMED`, nota: "Dostupno za 3 dana" | Status zahteva u bazi se menja u `CONFIRMED`, admin nota se čuva, a klijentu se šalje email sa informacijama o preuzimanju. |

---

## 2. Test plan za aplikaciju prodavnice auto-delova (Zadatak 1 — 7 poena)

### 2.1 Cilj i obim testiranja
* **Cilj:** Osigurati da veb aplikacija prodavnice auto-delova radi pouzdano, u skladu sa specifikacijom, bez kritičnih grešaka u tokovima kupovine, autorizacije, administracije i integracije sa bazom podataka.
* **Obim testiranja:**
  * **Obuhvaćeno:** Registracija i prijava korisnika, upravljanje stanjem sesije (klijent/gost/zaposleni/admin), katalog artikala i pretraga sa filterima, korpa i naručivanje (klijent i gost), plaćanje (kartica/pouzeće), sistem obaveštenja "Obavesti me" pri dolasku na stanje, specijalne porudžbine, menadžment artikala i porudžbina od strane zaposlenih, i kreiranje zaposlenih od strane administratora.
  * **Nije obuhvaćeno (van obima):** Performanse sistema pod visokim opterećenjem (Load/Stress testovi), sigurnosni penetracioni testovi (osim osnovne provere autorizacije), stvarni eksterni servisi za slanje elektronske pošte i SMS poruka (oni se mokuju), stvarni platni procesori (plaćanje karticom se simulira na adresi).

### 2.2 Vrste testiranja koje se primenjuju
1. **Jedinično testiranje (Unit testing):** Testiranje pojedinačnih Java klasa i metoda u potpunoj izolaciji pomoću **JUnit 5** i **Mockito** (npr. logika `OrderService.create`).
2. **Integraciono testiranje (Integration testing):** Testiranje saradnje više komponenti (Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database) pomoću `@SpringBootTest` i `MockMvc`.
3. **Testiranje REST API-ja:** Verifikacija ispravnosti HTTP statusnih kodova, formata JSON odgovora, error handler-a i autorizacije (Spring Security) kroz integracione testove.
4. **Testiranje React komponenti (Component testing):** Izolovano testiranje korisničkog interfejsa pomoću biblioteka **Vitest** i **React Testing Library**, uz presretanje API zahteva kroz **MSW (Mock Service Worker)**.
5. **Sistemsko testiranje (System/E2E testing):** Testiranje kompletne integracije frontenda, backenda i baze podataka bez mokovanja, kroz simulaciju ponašanja realnog korisnika u pretraživaču pomoću **Playwright** alata.
6. **Testiranje prihvatljivosti (Acceptance testing):** Provera da li aplikacija ispunjava sve poslovne zahteve navedene u specifikaciji.

### 2.3 Testno okruženje i alati
* **Baza podataka za test:** H2 in-memory baza podataka (za jedinične/integracione testove) i lokalna H2 file-based baza (za E2E testove).
* **Alati i biblioteke:**
  * **Backend:** JUnit 5, Mockito, AssertJ, Spring Boot Test, MockMvc, Jackson ObjectMapper.
  * **Frontend:** Vitest, React Testing Library, Mock Service Worker (MSW), user-event, jsdom.
  * **Sistemsko/E2E:** Playwright (Chromium), Node.js.

### 2.4 Kriterijumi za početak i završetak testiranja
* **Kriterijum za početak:** Uspešno kompajliranje koda bez sintaksnih grešaka, stabilan build backend i frontend projekata, definisani testni scenariji i testni podaci.
* **Kriterijum za završetak:** Svi implementirani testovi (jedinični, integracioni, komponentni i E2E) prolaze bez grešaka ($100\%$ prolaznost), pokrivenost koda poslovne logike je iznad $80\%$, i nema otvorenih kritičnih grešaka.

### 2.5 Način evidentiranja grešaka i glavni rizici
* **Evidentiranje grešaka:** Sve greške se prate kroz logs izveštaje test framework-a (JUnit report, Vitest CLI, Playwright HTML report/screenshots) i dokumentuju u internom izveštaju testiranja sa sledećim elementima: ID greške, opis, koraci za reprodukciju, ozbiljnost (kritična/visoka/srednja/niska), i trenutni status.
* **Glavni rizici:**
  * **Flaky testovi:** E2E testovi mogu pasti zbog mrežnog kašnjenja ili asinhronog učitavanja elemenata (rešeno upotrebom Playwright automatskih čekanja i retries).
  * **Gubitak sinhronizacije stanja baze:** H2 baza se puni podacima iz `DataInitializer`-a. Testovi koji menjaju stanje (npr. zalihe artikala) mogu uticati na sledeće testove (rešeno korišćenjem `@DirtiesContext` u integracionim testovima i brisanjem/resetovanjem stanja u E2E testu).

---

### 2.6 Tabela test scenarija (Najmanje 8 scenarija)

U tabeli je definisano 8 ključnih test scenarija koji pokrivaju sve zahteve iz specifikacije.

| ID | Funkcionalnost | Preduslovi | Koraci testiranja | Testni podaci | Očekivani rezultat | Prioritet |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-01** | Registracija klijenta | Korisnik je gost, otvoren HomePage. | 1. Klik na "Registruj se" u Navbaru.<br>2. Popuni formu sa jedinstvenim podacima.<br>3. Klikni na dugme "Registruj se". | Username: `test_klijent`<br>Email: `test@test.com`<br>Lozinka: `lozinka123` | Korisnik je uspešno registrovan, preusmeren na `/` i ulogovan (prikazan je u Navbaru). | Visok |
| **TS-02** | Prijavljivanje korisnika | Korisnik ima otvoren nalog u bazi (npr. zaposleni). | 1. Odlazak na stranicu `/login`.<br>2. Unos ispravnih kredencijala.<br>3. Klik na "Prijavi se". | Username: `zaposleni1`<br>Lozinka: `zap123` | Korisnik je uspešno ulogovan i preusmeren na `/employee` dashboard. | Visok |
| **TS-03** | Pretraga artikala po filterima | Baza sadrži artikle različitih kategorija i proizvođača. | 1. Otvaranje kataloga.<br>2. Unos proizvođača u filter polje.<br>3. Klik na "Pretraži". | Proizvođač: `Bosch` | Prikazuju se isključivo artikli proizvođača "Bosch" (npr. Kočione pločice Bosch). | Srednji |
| **TS-04** | Dodavanje artikla u korpu | Artikal je na stanju (`stock > 0`). Korpa je prazna. | 1. Pronalaženje artikla na HomePage.<br>2. Klik na dugme "Dodaj u korpu". | Artikal: `Kočione pločice Bosch` | Dugme menja tekst u "Dodato!", a brojač u korpi u Navbaru se menja u "Korpa (1)". | Visok |
| **TS-05** | Plaćanje i kreiranje porudžbine | Artikal je u korpi. Korisnik je ulogovan. | 1. Odlazak na `/cart`.<br>2. Unos adrese dostave.<br>3. Izbor plaćanja "Karticom".<br>4. Klik na "Naruči". | Adresa: `Ulica 1, Grad`<br>Plaćanje: `CARD` | Prikazuje se ekran za potvrdu porudžbine, korpa je ispražnjena, a lager artikla je umanjen u bazi. | Visok |
| **TS-06** | Opcija "Obavesti me" | Artikal nije na stanju (`stock = 0`). | 1. Klik na dugme "Obavesti me" za nedostupni artikal.<br>2. Izbor kanala "Email".<br>3. Unos adrese i slanje. | Email: `obavesti@test.com` | Modal se zatvara i prikazuje se poruka o uspešnoj prijavi za obaveštenje. | Srednji |
| **TS-07** | Specijalno poručivanje dela | Korisnik želi deo koji ne postoji u katalogu. | 1. Odlazak na `/special-order`.<br>2. Unos ličnih podataka i VIN broja vozila.<br>3. Unos opisa delova.<br>4. Slanje zahteva. | VIN: `WVWZZZ1JZW`<br>Opis: `Karburator za Golf 4` | Prikazuje se poruka da je zahtev uspešno poslat i primljen na obradu. | Srednji |
| **TS-08** | Obrada porudžbine od strane zaposlenog | Postoji porudžbina sa statusom `PENDING`. Zaposleni je ulogovan. | 1. Odlazak na `/employee` tab "Porudžbine".<br>2. Klik na dugme "Isporučena" pored porudžbine. | Porudžbina ID: `1` | Status porudžbine se menja u `DELIVERED` u tabeli i u bazi podataka. | Visok |
