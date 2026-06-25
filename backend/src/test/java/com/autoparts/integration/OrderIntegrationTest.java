package com.autoparts.integration;

/*
 * Integracioni testovi — kompletan HTTP tok porudžbine
 *
 * Svaki test prolazi kroz stvarni HTTP zahtev → Spring Security filter → Controller →
 * Service → Repository → H2 in-memory test baza (application-test.properties).
 * Koristi se @SpringBootTest (pun Spring kontekst) + MockMvc (simulirani HTTP sloj).
 *
 * Izolacija baze: @DirtiesContext(BEFORE_EACH_TEST_METHOD) uništava i ponovo kreira
 * Spring kontekst pre svakog testa — H2 schema se ponovo pravi (create-drop),
 * DataInitializer ponovo puni podatke, pa su testovi potpuno nezavisni.
 *
 * DataInitializer seeder (uvek prisutan na startu):
 *   • Korisnici:  admin (ADMIN), zaposleni1/zap123 (EMPLOYEE)
 *   • Artikli:    [1] Kočione pločice Bosch  — cena 3500, stanje 15
 *                 [2] Filter ulja Mann        — cena  850, stanje  0  (nema na stanju)
 *                 [3-5] Amortizer, Kaiš, Akumulator
 */

import com.autoparts.dto.LoginRequest;
import com.autoparts.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@DisplayName("Integracioni testovi — tok porudžbine (nezavisni)")
class OrderIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    // ─────────────────────────────────────────────────────────────────────────
    //  Pomoćni metodi
    // ─────────────────────────────────────────────────────────────────────────

    /** Registruje novog klijenta i vraća JWT token. */
    private String registerClient(String username) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setEmail(username + "@test.com");
        req.setPassword("lozinka123");
        req.setPhone("060123456");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.parse(result.getResponse().getContentAsString()).read("$.token");
    }

    /** Prijavljuje zaposlenog iz DataInitializera i vraća JWT token. */
    private String loginEmployee() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("zaposleni1");
        req.setPassword("zap123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.parse(result.getResponse().getContentAsString()).read("$.token");
    }

    /** Vraća ID artikla koji pronađe po nazivu iz /api/articles. */
    private Long findArticleIdByName(String name) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/articles")
                        .param("name", name))
                .andExpect(status().isOk())
                .andReturn();

        return ((Integer) JsonPath.parse(result.getResponse().getContentAsString())
                .read("$[0].id")).longValue();
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 1 — Uspešno kreiranje porudžbine
    //
    //  Komponente: AuthController → AuthService → UserRepository  (register/login)
    //              ArticleController → ArticleService → ArticleRepository  (pretraga)
    //              OrderController → OrderService → OrderRepository + ArticleRepository  (kreiranje)
    //
    //  Proverava: HTTP 200, status=PENDING, tačna ukupna cena, umanjeno stanje artikla
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Test 1: Pun tok — registracija → login → kreiranje porudžbine (status, cena, stanje)")
    void test1_punTok_uspesnoKreiranjePorudzbine() throws Exception {

        // ── Arrange ──────────────────────────────────────────────────────────
        String clientToken = registerClient("klijent_test1");

        // Tražimo artikal "Kočione pločice Bosch" — cena 3500, stanje 15
        Long kocionePlociceId = findArticleIdByName("Kočione");

        String orderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 2}],
                  "paymentMethod": "CASH_ON_DELIVERY",
                  "deliveryAddress": "Knez Mihailova 10, Beograd"
                }
                """.formatted(kocionePlociceId);

        // ── Act ───────────────────────────────────────────────────────────────
        MvcResult orderResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))

        // ── Assert — HTTP odgovor ─────────────────────────────────────────────
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.paymentMethod").value("CASH_ON_DELIVERY"))
                .andExpect(jsonPath("$.totalPrice").value(7000.00))      // 2 × 3500
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].unitPrice").value(3500.00))
                .andReturn();

        Long orderId = ((Integer) JsonPath.parse(
                orderResult.getResponse().getContentAsString()).read("$.id")).longValue();

        // Assert — stanje artikla je umanjeno (15 − 2 = 13)
        mockMvc.perform(get("/api/articles/{id}", kocionePlociceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(13));

        // Assert — klijent vidi svoju porudžbinu u /orders/my
        mockMvc.perform(get("/api/orders/my")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + orderId + ")].status").value("PENDING"));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 2 — Poručivanje artikla koji nije na stanju
    //
    //  Komponente: OrderController → GlobalExceptionHandler  (presrece RuntimeException)
    //              OrderService#create  (provera stanja pre kreiranja)
    //              ArticleRepository  (stanje se NE menja)
    //
    //  Proverava: HTTP 400 (ne 500), poruka greške, stanje artikla nepromenjeno
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Test 2: Artikal bez stanja → HTTP 400 + poruka greške, stanje ostaje 0")
    void test2_artikalBezStanja_vraca400IPorukuGreske() throws Exception {

        // ── Arrange ──────────────────────────────────────────────────────────
        // "Filter ulja Mann" uvek ima stock=0 od DataInitializera
        Long filterUljaId = findArticleIdByName("Filter ulja");

        String orderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 1}],
                  "paymentMethod": "CASH_ON_DELIVERY",
                  "deliveryAddress": "Test adresa",
                  "guestName": "Gost Korisnik",
                  "guestEmail": "gost@test.com"
                }
                """.formatted(filterUljaId);

        // ── Act + Assert — HTTP status i poruka greške ────────────────────────
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isBadRequest())                            // 400, ne 500
                .andExpect(jsonPath("$.message").value(containsString("Nedovoljno stanja")));

        // Assert — stanje artikla ostaje 0 (porudžbina nije prošla)
        mockMvc.perform(get("/api/articles/{id}", filterUljaId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(0));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 3 — Neautorizovan pristup (CLIENT ne može da menja status porudžbine)
    //
    //  Komponente: Spring Security → SecurityConfig
    //              (PUT /api/orders/** zahteva EMPLOYEE ili ADMIN ulogu)
    //
    //  Proverava: CLIENT token → HTTP 403 Forbidden, status porudžbine ostaje PENDING
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Test 3: CLIENT pokušava PUT /orders/{id}/status → 403 Forbidden")
    void test3_klijentMenjaStatus_403Forbidden() throws Exception {

        // ── Arrange — kreiraj porudžbinu kao gost da dobijemo validan orderId ──
        Long kocionePlociceId = findArticleIdByName("Kočione");

        String orderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 1}],
                  "paymentMethod": "CASH_ON_DELIVERY",
                  "deliveryAddress": "Test adresa",
                  "guestName": "Gost",
                  "guestEmail": "gost@test.com"
                }
                """.formatted(kocionePlociceId);

        MvcResult created = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isOk())
                .andReturn();

        Long orderId = ((Integer) JsonPath.parse(
                created.getResponse().getContentAsString()).read("$.id")).longValue();

        // Registrujemo klijenta i dobijamo CLIENT token
        String clientToken = registerClient("klijent_test3");

        // ── Act + Assert — CLIENT ne sme menjati status ───────────────────────
        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", "Bearer " + clientToken)
                        .param("status", "DELIVERED"))
                .andExpect(status().isForbidden());         // Spring Security blokira — 403

        // Assert — status ostaje PENDING (porudžbina nije izmenjena)
        String employeeToken = loginEmployee();
        mockMvc.perform(get("/api/orders/all")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + orderId + ")].status")
                        .value(contains("PENDING")));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 4 — Promena statusa: validna i nevalidna tranzicija
    //
    //  Komponente: OrderController → OrderService#updateStatus → OrderRepository
    //              GlobalExceptionHandler  (presrece nevalidnu tranziciju)
    //
    //  Proverava:
    //    a) PENDING → DELIVERED:  HTTP 200, status ažuriran u bazi
    //    b) DELIVERED → PENDING:  HTTP 400 (finalni status), status u bazi ostaje DELIVERED
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Test 4a: PENDING → DELIVERED (200 OK)  |  Test 4b: DELIVERED → PENDING (400 Bad Request)")
    void test4_tranzicijeStatusa_validnaINevalidna() throws Exception {

        // ── Arrange — kreiraćemo porudžbinu kao gost, zatim logujemo zaposlenog ─
        Long kocionePlociceId = findArticleIdByName("Kočione");
        String employeeToken = loginEmployee();

        String orderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 1}],
                  "paymentMethod": "CARD",
                  "deliveryAddress": "Test adresa 1",
                  "guestName": "Gost Korisnik",
                  "guestEmail": "gost4@test.com"
                }
                """.formatted(kocionePlociceId);

        MvcResult created = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        Long orderId = ((Integer) JsonPath.parse(
                created.getResponse().getContentAsString()).read("$.id")).longValue();

        // ── Act 4a: Validna tranzicija PENDING → DELIVERED ────────────────────
        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("status", "DELIVERED"))

        // Assert 4a: uspešna promena statusa
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        // ── Act 4b: Nevalidna tranzicija DELIVERED → PENDING ──────────────────
        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("status", "PENDING"))

        // Assert 4b: 400 Bad Request — finalni status ne može biti promenjen
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("DELIVERED")));

        // Assert 4b: status u bazi i dalje DELIVERED (nije izmenjen)
        mockMvc.perform(get("/api/orders/all")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + orderId + ")].status")
                        .value(contains("DELIVERED")));
    }
}
