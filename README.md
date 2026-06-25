# AutoParts — Ispitni projekat (SE321)

Veb aplikacija za prodavnicu auto-delova razvijena u okviru ispitnog zadatka za predmet **SE321 — Testiranje softvera**.

Projekat se sastoji od funkcionalne Full-Stack aplikacije i sveobuhvatnog paketa testova na svim nivoima testiranja (Unit, Integration, Component i End-to-End).

---

## 🛠️ Tehnologije (Tech Stack)

* **Frontend:** React 18 + Vite + Context API (Auth & Cart) + Axios (HTTP klijent)
* **Backend:** Java 17 + Spring Boot 3.2 + Spring Security (JWT) + Spring Data JPA
* **Baza podataka:** H2 (in-memory profil za testiranje, local file-based za pokretanje aplikacije)
* **Komunikacija:** REST API (JSON)
* **Test Alati:** JUnit 5, Mockito, MockMvc, Vitest, React Testing Library, MSW (Mock Service Worker), Playwright.

---

## 📁 Struktura projekta

```
SE321-Ispit-6090/
├── backend/                  # Spring Boot REST API aplikacija
├── frontend/                 # React + Vite korisnički interfejs
├── e2e/                      # Playwright End-to-End testovi
├── PLAN_TESTIRANJA.md        # Plan testiranja i use-case specifikacija (Zadatak 1)
├── ISPIT_DOKUMENTACIJA.md    # Kompletna ispitna dokumentacija (Zadaci 1-4 + E2E)
└── IZVESTAJ_TESTIRANJA.md    # Kratak izveštaj o rezultatima pokrenutih testova
```

---

## 🚀 Kako pokrenuti aplikaciju lokalno

### 1. Pokretanje Backend-a
Zahteva instaliran Java 17+ i Maven (ili pokretanje iz vašeg IDE-a kao što je IntelliJ/Eclipse):
```bash
cd backend
# Ukoliko je Maven u sistemskom PATH-u:
mvn spring-boot:run
# Ukoliko koristite lokalnu instalaciju u Tools folderu na Windows-u:
C:\Tools\Maven\bin\mvn.cmd spring-boot:run
```
Backend se pokreće na `http://localhost:8080`.

### 2. Pokretanje Frontend-a
Zahteva instaliran Node.js (v18+):
```bash
cd frontend
npm install
npm run dev
```
Frontend se pokreće na `http://localhost:5173`. Sve API rute su proksirane na backend.

---

## 🧪 Pokretanje testova

Paket testova je u potpunosti implementiran i pokriva sve zahteve sa ispita:

### 1. Jedinični testovi (Zadatak 2)
Testira se izolovana servisna logika poručivanja artikala (`OrderService`):
```bash
cd backend
C:\Tools\Maven\bin\mvn.cmd test -Dtest=OrderServiceTest
```

### 2. Integracioni testovi (Zadatak 3)
Testira se ceo lanac kontrolera, servisa i baze bez frontenda:
```bash
cd backend
C:\Tools\Maven\bin\mvn.cmd test -Dtest=OrderIntegrationTest
```

### 3. Komponentni testovi frontenda (Zadatak 4)
Testira se UI ponašanje React komponenti uz MSW presretanje API komunikacije:
```bash
cd frontend
npm run test
```

### 4. End-to-End testovi (Dodatni poeni)
Simulacija kompletnog korisničkog scenarija kupovine u realnom pretraživaču preko Playwright-a (osigurajte da backend i frontend serveri rade pre pokretanja):
```bash
cd e2e
npx playwright test
```

---

## 📝 Ispitna dokumentacija

Za detaljne opise i teorijska pitanja pogledajte sledeće markdown dokumente:
* **[PLAN_TESTIRANJA.md](PLAN_TESTIRANJA.md)** — Use-case tabela testiranja i plan testiranja sa scenarijima.
* **[ISPIT_DOKUMENTACIJA.md](ISPIT_DOKUMENTACIJA.md)** — Objedinjen dokument spreman za kopiranje u Word sa svim rešenjima zadataka i mestima za screenshot-ove.
* **[IZVESTAJ_TESTIRANJA.md](IZVESTAJ_TESTIRANJA.md)** — Zbirni izveštaj o prolaznosti testova.
