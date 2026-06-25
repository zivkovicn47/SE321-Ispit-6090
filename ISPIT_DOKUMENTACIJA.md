# KOMPLETNA DOKUMENTACIJA ISPITNOG PROJEKTA — AutoParts
**Predmet:** SE321 — Testiranje softvera  
**Kandidat (Broj indeksa):** Nikola Živković (6090)  

Ovaj dokument predstavlja objedinjenu i sistematizovanu dokumentaciju za sve delove ispitnog zadatka za aplikaciju **AutoParts** (Prodavnica auto-delova). Dokument je strukturiran tako da se lako može kopirati u Word ili izvesti u PDF, sa jasno označenim mestima za ubacivanje screenshot-ova izvršavanja testova.

---

## ZADATAK 1: Plan testiranja i specifikacija slučajeva korišćenja

### 1.1 Tabela za testiranje na osnovu slučajeva korišćenja
Tabela je kreirana na osnovu Use Case-ova definisanih u specifikaciji aplikacije.

| Slučaj korišćenja | Funkcija koja se testira | Inicijalno stanje sistema | Ulazi | Očekivani izlaz |
| :--- | :--- | :--- | :--- | :--- |
| **Registracija klijenta** | `registerClient()` | Korisnik je gost, nalazi se na formi za registraciju. | Korisničko ime: `novi_klijent`<br>Email: `klijent@test.com`<br>Lozinka: `lozinka123`<br>Telefon: `060111222` | Kreiran nalog klijenta u bazi sa ulogom `CLIENT`. Korisnik je automatski ulogovan i preusmeren na HomePage sa JWT tokenom. |
| **Prijava korisnika** | `login()` | Korisnik nije ulogovan, nalazi se na stranici za prijavu. | Korisničko ime: `zaposleni1`<br>Lozinka: `zap123` | Korisnik je uspešno ulogovan (JWT token sačuvan), preusmeren na EmployeeDashboard na osnovu uloge `EMPLOYEE`. |
| **Nastavak kao gost** | Kupovina bez prijave | Korisnik nije ulogovan, klikće na "Nastavi kao gost". | Klik na link "Nastavi kao gost" ili direktno na artikle. | Korisnik je na HomePage, može pretraživati katalog i dodavati artikle u korpu bez unosa kredencijala. |
| **Kreiranje novog zaposlenog** | `createEmployee()` | Administrator je ulogovan i nalazi se na tabu "Zaposleni". | Korisničko ime: `novi_zap`<br>Email: `novi@test.com`<br>Lozinka: `sifra123` | Novi nalog sa ulogom `EMPLOYEE` je kreiran u bazi podataka i pojavljuje se na listi svih korisnika. |
| **Pregled porudžbina po statusu** | `getOrdersByStatus()` | Zaposleni je ulogovan i nalazi se na tabu "Porudžbine". | Izbor filtera statusa: "Poništena" (CANCELLED) | Tabela prikazuje isključivo porudžbine čiji je status `CANCELLED` (neupelo isporučene). |
| **Pretraga po filterima** | `fetchArticles()` | Korisnik na HomePage-u sa prikazanim svim artiklima. | Naziv: "Kočione"<br>Proizvođač: "Bosch"<br>Kategorija: "Kočioni sistem" | Prikazuje se samo artikal "Kočione pločice Bosch" koji ispunjava sve kriterijume. Ostali se uklanjaju iz prikaza. |
| **Dodavanje u korpu** | `addItem()` | Korpa je prazna. Artikal je na stanju (`stock > 0`). | Klik na dugme "Dodaj u korpu" za artikal ID `1`. | Stanje korpe u `CartContext` se ažurira na 1 stavku, a u zaglavlju (Navbar) se menja tekst u "Korpa (1)". |
| **Plaćanje / Naručivanje** | `createOrder()` | Artikal je u korpi, korisnik je na CartPage. | Adresa: "Bul. Umetnosti 2, N. Beograd"<br>Način plaćanja: `CARD` | Porudžbina je kreirana u bazi sa statusom `PENDING`, količina artikla na lageru je umanjena, korpa je ispražnjena, prikazuje se ekran sa potvrdom. |
| **Opcija "Obavesti me"** | `createNotificationRequest()` | Artikal nije na stanju (`stock = 0`). | Klik na "Obavesti me", izbor kanala `EMAIL`, unos: `klijent@test.com` | Kreiran zapis u tabeli `notification_request` za dati artikal. Prikazuje se poruka potvrde. |
| **Specijalno poručivanje** | `createSpecialOrder()` | Klijent/gost je na SpecialOrderPage. | Ime klijenta, podaci o vozilu (Marka, Model, Godina, VIN), opis potrebnih delova. | Specijalni zahtev je sačuvan u bazi sa statusom `PENDING`. Zaposleni ga vidi na svom dashboard-u. |

---

### 1.2 Test plan
#### 1. Cilj i obim testiranja
* **Cilj:** Verifikacija ispravnosti celokupne poslovne logike i korisničkog interfejsa veb aplikacije AutoParts, osiguravajući stabilan rad bez kritičnih grešaka.
* **Obim:** Obuhvata sve funkcionalnosti navedene u specifikaciji (registracija, prijava, pretraga sa filterima, korpa, plaćanje karticom/pouzećem, "Obavesti me" notifikacije, specijalne porudžbine i administratorske/zaposlene dashboards).

#### 2. Funkcionalnosti koje nisu obuhvaćene testiranjem
* Stvarna integracija sa platnim procesorima (plaćanje karticom se simulira).
* Stvarno slanje SMS i Email poruka (eksterni servisi su mokovani).
* Load i stres testiranje performansi.

#### 3. Vrste testiranja koje se primenjuju
* **Jedinično testiranje:** Izolovani testovi servisne logike (JUnit 5 + Mockito).
* **Integraciono testiranje:** Testiranje saradnje kontrolera, servisa i baze podataka (Spring Boot Test + MockMvc + H2).
* **Testiranje React komponenti:** Testiranje UI interakcije na frontendu (Vitest + React Testing Library + MSW).
* **Sistemsko/E2E testiranje:** Testiranje celokupnog toka aplikacije u realnom pretraživaču bez mokovanja (Playwright).

#### 4. Kriterijumi za završetak testiranja
* Prolaznost svih definisanih automatizovanih testova od $100\%$.
* Pokrivenost servisnog sloja testovima od najmanje $80\%$.

---

### 1.3 Tabela test scenarija

| ID | Funkcionalnost | Preduslovi | Koraci testiranja | Testni podaci | Očekivani rezultat | Prioritet |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-01** | Registracija klijenta | Korisnik je gost, otvoren HomePage. | 1. Klik na "Registruj se" u Navbaru.<br>2. Popuni formu sa jedinstvenim podacima.<br>3. Klikni na dugme "Registruj se". | Username: `test_klijent`<br>Email: `test@test.com`<br>Lozinka: `lozinka123` | Korisnik je uspešno registrovan, preusmeren na `/` i ulogovan. | Visok |
| **TS-02** | Prijavljivanje korisnika | Korisnik ima nalog u bazi. | 1. Odlazak na stranicu `/login`.<br>2. Unos ispravnih kredencijala.<br>3. Klik na "Prijavi se". | Username: `zaposleni1`<br>Lozinka: `zap123` | Korisnik je ulogovan i preusmeren na `/employee` dashboard. | Visok |
| **TS-03** | Pretraga artikala po filterima | Artikli postoje u bazi. | 1. Otvaranje kataloga.<br>2. Unos proizvođača u filter polje.<br>3. Klik na "Pretraži". | Proizvođač: `Bosch` | Prikazuju se isključivo artikli proizvođača "Bosch". | Srednji |
| **TS-04** | Dodavanje u korpu | Artikal je na stanju. | 1. Klik na dugme "Dodaj u korpu". | Artikal: `Kočione pločice Bosch` | Dugme menja tekst u "Dodato!", a brojač u Navbaru se menja u "Korpa (1)". | Visok |
| **TS-05** | Plaćanje i porudžbina | Artikal je u korpi. Korisnik je ulogovan. | 1. Odlazak na `/cart`.<br>2. Unos adrese.<br>3. Izbor plaćanja "Karticom".<br>4. Klik na "Naruči". | Adresa: `Ulica 1, Grad`<br>Plaćanje: `CARD` | Prikazuje se ekran za potvrdu, korpa je ispražnjena, lager artikla u bazi je umanjen. | Visok |
| **TS-06** | Opcija "Obavesti me" | Artikal nije na stanju (`stock = 0`). | 1. Klik na "Obavesti me".<br>2. Izbor kanala "Email".<br>3. Unos email-a i slanje. | Email: `obavesti@test.com` | Modal se zatvara i prikazuje se poruka o uspešnoj prijavi. | Srednji |
| **TS-07** | Specijalno poručivanje | Korisnik želi deo koji ne postoji u katalogu. | 1. Odlazak na `/special-order`.<br>2. Unos podataka o vozilu i VIN broja.<br>3. Unos opisa delova i slanje. | VIN: `WVWZZZ1JZW`<br>Opis: `Karburator za Golf 4` | Prikazuje se poruka o uspešnom slanju zahteva. | Srednji |
| **TS-08** | Obrada porudžbine | Postoji porudžbina sa statusom `PENDING`. Zaposleni je ulogovan. | 1. Odlazak na `/employee` tab "Porudžbine".<br>2. Klik na dugme "Isporučena". | Porudžbina ID: `1` | Status porudžbine se menja u `DELIVERED` u tabeli i u bazi podataka. | Visok |

---

## ZADATAK 2: Jedinično testiranje Spring Boot aplikacije (JUnit 5 + Mockito)

### 2.1 Teorijska objašnjenja
1. **Jedinica koja se testira:** Jedinicu predstavlja metoda `OrderService.create(OrderRequest request, String username)`. Testira se isključivo interna poslovna logika te metode (validacije, izračunavanje ukupne cene, umanjenje zaliha artikala), izolovano od baze podataka i HTTP sloja.
2. **Simulirane (mokovane) zavisnosti:** Pomoću `@Mock` anotacije simulirani su repozitorijumi `UserRepository`, `ArticleRepository` i `OrderRepository`. Preko njih kontrolišemo podatke koje servis dobija (npr. da li klijent postoji, koje su cene i zalihe artikala) i verifikujemo da li su metode perzistencije (`save()`) pozvane sa ispravnim parametrima.
3. **Zašto se ne koristi prava baza podataka:** 
   * **Brzina:** Pokretanje prave baze usporava testove (traju sekundama umesto milisekundama).
   * **Izolacija:** Greška u bazi podataka (loše mapiranje, constraint) ne sme uticati na pad testa koji testira isključivo matematičku logiku sabiranja cene u servisu.
   * **Determinizam:** Izbegava se zavisnost od prethodnog stanja baze ili redosleda izvršavanja testova.

### 2.2 Lista implementiranih JUnit testova
Ključni testovi prate **Arrange–Act–Assert** obrazac:
* `create_uspesnoKreiranje_statusCenaStanjeSave` (Happy Path — kreiranje sa ispravnim artiklima)
* `create_praznaKorpa_bacaExceptionISaveNijePozvan` (Validacija prazne korpe)
* `create_klijentNijePronadjen_bacaExceptionISaveNijePozvan` (Korisnik sa tim username-om ne postoji)
* `create_nedovoljnoStanje_bacaExceptionIStanjeOstajaNepromenjeno` (Količina u korpi veća od količine na lageru)
* `create_viseArtikala_tacnoIzracunavanjeUkupneCene` (Verifikacija tačnog obračuna cene)

### 2.3 Screenshot izvršavanja jediničnih testova
> **[OVDE UBACITI SCREENSHOT IZ IDE-a ILI TERMINALA SA POKRENUTIM JUNIT TESTOVIMA (npr. mvn test -Dtest=OrderServiceTest)]**

---

## ZADATAK 3: Integraciono testiranje Spring Boot REST API-ja

### 3.1 Komponente koje se zajednički testiraju
Integracioni testovi testiraju ceo tok obrade zahteva bez frontenda:
```
HTTP Zahtev → Controller → Service → Repository → H2 Testna baza podataka
```
Za razliku od jediničnih testova, ovde se verifikuje i Spring Security (autentifikacija/autorizacija preko JWT tokena), JSON serijalizacija/deserijalizacija, GlobalExceptionHandler i stvarni JPA upiti nad H2 bazom u memoriji.

### 3.2 Lista implementiranih integracionih testova
U klasi `OrderIntegrationTest.java` uspešno su pokrivena 4 integraciona scenarija:
1. **Test 1 — Uspešno kreiranje porudžbine:** Registrovan klijent šalje validan POST zahtev za naručivanje. Proverava se HTTP 200, ispravan JSON odgovor sa statusom `PENDING`, tačna cena (7000.00) i potvrda da je zaliha u bazi smanjena sa 15 na 13 komada.
2. **Test 2 — Poručivanje artikla koji nije na stanju:** Šalje se zahtev za artikal čiji je lager 0. Proverava se HTTP 400 Bad Request, prisustvo poruke "Nedovoljno stanja" i da baza nije pretrpela nikakve izmene.
3. **Test 3 — Neautorizovan pristup:** Klijent pokušava da pošalje `PUT` zahtev na endpoint za promenu statusa porudžbine (rezervisan za zaposlene/admine). Očekuje se i proverava HTTP `403 Forbidden`.
4. **Test 4 — Promena statusa porudžbine:** Provera ispravne tranzicije statusa od strane zaposlenog (`PENDING` $\rightarrow$ `DELIVERED` - HTTP 200), i nevalidne tranzicije (`DELIVERED` $\rightarrow$ `PENDING` - HTTP 400).

### 3.3 Screenshot izvršavanja integracionih testova
> **[OVDE UBACITI SCREENSHOT IZ IDE-a ILI TERMINALA SA POKRENUTIM INTEGRACIONIM TESTOVIMA (npr. mvn test -Dtest=OrderIntegrationTest)]**

---

## ZADATAK 4: Testiranje React frontenda i povezivanja sa Spring Boot backendom

### 4.1 Pristup testiranju
Testiranje je realizovano pomoću alata **Vitest**, **React Testing Library (RTL)** i **Mock Service Worker (MSW)**. 
Prati se RTL filozofija: ne testira se interna struktura i stanje komponenti, već isključivo ponašanje vidljivo korisniku. Komunikacija sa backend API-jem se presreće na mrežnom nivou pomoću MSW-a, simulirajući realne HTTP odgovore.

### 4.2 Lista pokrivenih scenarija u HomePage.test.jsx
1. **Prikaz svih artikala:** MSW vraća artikle, verifikuje se da su ispravno renderovani na ekranu.
2. **Filtriranje artikala:** Odabir filtera kategorije i klik na "Pretraži" šalje ispravan API GET zahtev i na ekranu ostavlja samo filtrirane elemente.
3. **Dodavanje artikla u korpu:** Klik na dugme ažurira `CartContext` i menja broj u Navbaru na "Korpa (1)".
4. **Onemogućavanje dugmeta:** Ako je `stock = 0`, dugme "Dodaj u korpu" ne postoji/onemogućeno je.
5. **Opcija "Obavesti me":** Za nedostupan artikal prikazuje se dugme "Obavesti me" koje uspešno otvara modal za unos email-a/telefona.
6. **Prikaz poruke o grešci:** MSW vraća HTTP 500, proverava se da li se korisniku na UI-ju renders adekvatna poruka upozorenja.
7. **Uspešno slanje porudžbine (Integracija React <-> API):** Simulira se pun korisnički tok: pretraga $\rightarrow$ dodavanje u korpu $\rightarrow$ odlazak na `/cart` $\rightarrow$ popunjavanje forme $\rightarrow$ klik na "Naruči" $\rightarrow$ provera prikaza uspešno kreirane porudžbine.

### 4.3 Screenshot izvršavanja frontend testova
> **[OVDE UBACITI SCREENSHOT IZ TERMINALA SA POKRENUTIM VITEST TESTOVIMA (npm run test)]**

---

## DODATNI POENI: End-to-End (E2E) testiranje pomoću Playwright-a

### 5.1 Razlika u odnosu na ostale vrste testiranja
* **Jedinični testovi** testiraju izolovane metode bez baze i HTTP-a.
* **Integracioni testovi** testiraju backend lanac bez frontenda (sa simuliranim HTTP-om).
* **Komponentni testovi** testiraju frontend sa mock-ovanim mrežnim slojem (MSW).
* **E2E testovi** ne mokuju **apsolutno ništa**. Pokreće se stvarni Vite frontend server, stvarni Spring Boot backend i stvarni pretraživač (Chromium) kojim Playwright upravlja. Testira se stvarna integracija svih sistema i baze podataka.

### 5.2 Scenario pokriven u order-flow.spec.js
Test u potpunosti pokriva zahtevani tok:
1. Otvara početnu stranu i odlazi na registraciju.
2. Registruje klijenta sa jedinstvenim kredencijalima (timestamp-based username/email).
3. Verifikuje uspešnu registraciju, automatski login i postojanje JWT tokena u `localStorage`.
4. Pronalazi artikal na stanju preko filtera pretrage ("Kočione pločice Bosch").
5. Dodaje artikal u korpu i odlazi na stranicu korpe.
6. Popunjava adresu dostave, bira plaćanje karticom i uspešno šalje porudžbinu.
7. Odlazi na stranicu "Moje porudžbine" i proverava da li se kreirana porudžbina nalazi u istoriji sa statusom "Na čekanju", načinom plaćanja "Kartica" i ukupnim iznosom "3.500 RSD".

### 5.3 Screenshot izvršavanja Playwright E2E testova
> **[OVDE UBACITI SCREENSHOT IZ TERMINALA SA POKRENUTIM PLAYWRIGHT TESTOVIMA (npx playwright test)]**

---
