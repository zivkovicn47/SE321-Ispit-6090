package com.autoparts.integration;

import com.autoparts.dto.LoginRequest;
import com.autoparts.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.*;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Integracioni test — kompletan tok porudžbine")
class OrderFlowIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    // Deljeni state između koraka (static jer @DirtiesContext ne restartuje između metoda)
    private static String clientToken;
    private static String employeeToken;
    private static Long firstArticleId;
    private static Long createdOrderId;

    // ------------------------------------------------------------------ helpers

    private String body(Object dto) throws Exception {
        return objectMapper.writeValueAsString(dto);
    }

    // ------------------------------------------------------------------ Step 1: Registracija

    @Test
    @org.junit.jupiter.api.Order(1)
    @DisplayName("1. Registracija novog klijenta vraća JWT token i ulogu CLIENT")
    void step1_registerClient_returnsToken() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("test_klijent");
        req.setEmail("test_klijent@autoparts.com");
        req.setPassword("lozinka123");
        req.setPhone("060123456");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CLIENT"))
                .andExpect(jsonPath("$.username").value("test_klijent"))
                .andReturn();

        clientToken = JsonPath.parse(result.getResponse().getContentAsString())
                .read("$.token");
    }

    // ------------------------------------------------------------------ Step 2: Login klijenta

    @Test
    @org.junit.jupiter.api.Order(2)
    @DisplayName("2. Login registrovanog klijenta vraća novi token")
    void step2_loginClient_returnsToken() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("test_klijent");
        req.setPassword("lozinka123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CLIENT"))
                .andReturn();

        clientToken = JsonPath.parse(result.getResponse().getContentAsString())
                .read("$.token");
    }

    // ------------------------------------------------------------------ Step 3: Pretraga artikala

    @Test
    @org.junit.jupiter.api.Order(3)
    @DisplayName("3. GET /api/articles bez tokena vraća listu artikala (DataInitializer)")
    void step3_getArticles_returnsNonEmptyList() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].name").isNotEmpty())
                .andExpect(jsonPath("$[0].price").isNumber())
                .andReturn();

        firstArticleId = ((Integer) JsonPath.parse(
                result.getResponse().getContentAsString()).read("$[0].id")).longValue();
    }

    @Test
    @org.junit.jupiter.api.Order(4)
    @DisplayName("4. Pretraga po imenu filtrira rezultate")
    void step4_searchByName_returnsFilteredResults() throws Exception {
        mockMvc.perform(get("/api/articles")
                        .param("name", "Kočione"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", everyItem(containsStringIgnoringCase("kočione"))));
    }

    @Test
    @org.junit.jupiter.api.Order(5)
    @DisplayName("5. Pretraga po nepostojećem nazivu vraća praznu listu")
    void step5_searchByNonexistentName_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/articles")
                        .param("name", "nema_ovog_dela_xyzabc123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ------------------------------------------------------------------ Step 6: Kreiranje porudžbine

    @Test
    @org.junit.jupiter.api.Order(6)
    @DisplayName("6. Klijent kreira porudžbinu — status PENDING, cena ispravna")
    void step6_createOrder_returnsOrderWithPendingStatus() throws Exception {
        String orderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 2}],
                  "paymentMethod": "CASH_ON_DELIVERY",
                  "deliveryAddress": "Knez Mihailova 10, Beograd"
                }
                """.formatted(firstArticleId);

        MvcResult result = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.paymentMethod").value("CASH_ON_DELIVERY"))
                .andExpect(jsonPath("$.totalPrice").isNumber())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andReturn();

        createdOrderId = ((Integer) JsonPath.parse(
                result.getResponse().getContentAsString()).read("$.id")).longValue();
    }

    @Test
    @org.junit.jupiter.api.Order(7)
    @DisplayName("7. Kreiranje porudžbine bez tokena (gost) sa podacima — 200 OK")
    void step7_createOrderAsGuest_succeeds() throws Exception {
        String guestOrderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 1}],
                  "paymentMethod": "CARD",
                  "deliveryAddress": "Test ulica 5, Novi Sad",
                  "guestName": "Petar Petrović",
                  "guestEmail": "petar@test.com",
                  "guestPhone": "0641234567"
                }
                """.formatted(firstArticleId);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(guestOrderJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.guestName").value("Petar Petrović"));
    }

    // ------------------------------------------------------------------ Step 8: Pregled porudžbina klijenta

    @Test
    @org.junit.jupiter.api.Order(8)
    @DisplayName("8. Klijent vidi sopstvenu porudžbinu u /orders/my")
    void step8_getMyOrders_containsCreatedOrder() throws Exception {
        mockMvc.perform(get("/api/orders/my")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @org.junit.jupiter.api.Order(9)
    @DisplayName("9. /orders/my bez tokena vraća 403 Forbidden")
    void step9_getMyOrdersWithoutToken_returns403() throws Exception {
        mockMvc.perform(get("/api/orders/my"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ Step 10: Login zaposlenog

    @Test
    @org.junit.jupiter.api.Order(10)
    @DisplayName("10. Login zaposlenog (DataInitializer) vraća token sa ulogom EMPLOYEE")
    void step10_loginEmployee_returnsEmployeeToken() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("zaposleni1");
        req.setPassword("zap123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("EMPLOYEE"))
                .andReturn();

        employeeToken = JsonPath.parse(result.getResponse().getContentAsString())
                .read("$.token");
    }

    // ------------------------------------------------------------------ Step 11: Zaposleni pregleda porudžbine

    @Test
    @org.junit.jupiter.api.Order(11)
    @DisplayName("11. Zaposleni vidi sve porudžbine u /orders/all")
    void step11_getAllOrders_asEmployee_succeeds() throws Exception {
        mockMvc.perform(get("/api/orders/all")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }

    @Test
    @org.junit.jupiter.api.Order(12)
    @DisplayName("12. Klijent ne može pristupiti /orders/all — 403")
    void step12_getAllOrders_asClient_returns403() throws Exception {
        mockMvc.perform(get("/api/orders/all")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @org.junit.jupiter.api.Order(13)
    @DisplayName("13. Filtriranje PENDING porudžbina — sve imaju status PENDING")
    void step13_getPendingOrders_allStatusArePending() throws Exception {
        mockMvc.perform(get("/api/orders/status/PENDING")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].status", everyItem(is("PENDING"))));
    }

    // ------------------------------------------------------------------ Step 14: Promena statusa

    @Test
    @org.junit.jupiter.api.Order(14)
    @DisplayName("14. Zaposleni menja status porudžbine na DELIVERED")
    void step14_updateOrderToDelivered_returnsUpdatedOrder() throws Exception {
        mockMvc.perform(put("/api/orders/{id}/status", createdOrderId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("status", "DELIVERED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdOrderId))
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    @org.junit.jupiter.api.Order(15)
    @DisplayName("15. Nakon isporuke, PENDING lista ne sadrži tu porudžbinu")
    void step15_pendingListNoLongerContainsDeliveredOrder() throws Exception {
        mockMvc.perform(get("/api/orders/status/PENDING")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + createdOrderId + ")]").isEmpty());
    }

    @Test
    @org.junit.jupiter.api.Order(16)
    @DisplayName("16. Zaposleni može da poništi drugu porudžbinu")
    void step16_cancelOrder_returnsCancelledStatus() throws Exception {
        // Prvo napravi novu porudžbinu
        String orderJson = """
                {
                  "items": [{"articleId": %d, "quantity": 1}],
                  "paymentMethod": "CARD",
                  "deliveryAddress": "Test 1"
                }
                """.formatted(firstArticleId);

        MvcResult created = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderJson))
                .andExpect(status().isOk())
                .andReturn();

        Long newOrderId = ((Integer) JsonPath.parse(
                created.getResponse().getContentAsString()).read("$.id")).longValue();

        mockMvc.perform(put("/api/orders/{id}/status", newOrderId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .param("status", "CANCELLED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
