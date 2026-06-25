package com.autoparts.service;

/*
 * Jedinica koja se testira: OrderService#create(OrderRequest, String)
 *
 * Mokovane zavisnosti:
 *   - OrderRepository   — jedina tačka perzistencije porudžbine; kontrolišemo šta save() vraća
 *                         i verifikujemo da li je uopšte pozvan
 *   - ArticleRepository — deterministički odgovori za findById(); pratimo pozive save()
 *                         kojim se evidentira umanjivanje stanja artikla
 *   - UserRepository    — kontrolišemo scenarije "korisnik postoji" i "korisnik ne postoji"
 *                         bez punjenja baze test korisnicima
 *
 * Zašto se ne koristi prava baza podataka:
 *   Jedinični testovi verifikuju poslovnu logiku servisa u potpunoj izolaciji od infrastrukture.
 *   Prava baza uvodi sporo I/O, zavisnost od redosleda testova i stanja šeme, te otežava
 *   preciznu kontrolu scenarija (npr. tačno koje stanje ima artikal). Mokovanje repozitorijuma
 *   Spring kontekst ne podiže — svaki test završava za ~milisekunde.
 *
 *   Napomena o statusu: enum OrderStatus koristi naziv PENDING za tek kreiranu porudžbinu
 *   (ekvivalent "CREATED" iz specifikacije).
 */

import com.autoparts.dto.OrderItemRequest;
import com.autoparts.dto.OrderRequest;
import com.autoparts.entity.Article;
import com.autoparts.entity.Order;
import com.autoparts.entity.OrderItem;
import com.autoparts.entity.User;
import com.autoparts.repository.ArticleRepository;
import com.autoparts.repository.OrderRepository;
import com.autoparts.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OrderService — jedinični testovi")
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock ArticleRepository articleRepository;
    @Mock UserRepository userRepository;

    @InjectMocks
    OrderService orderService;

    private Article kocione;   // cena 3500, stanje 15
    private Article filter;    // cena 850,  stanje 10
    private User klijent;

    @BeforeEach
    void setUp() {
        kocione = Article.builder()
                .id(1L).name("Kočione pločice Bosch")
                .price(new BigDecimal("3500")).stock(15).build();

        filter = Article.builder()
                .id(2L).name("Filter ulja Mann")
                .price(new BigDecimal("850")).stock(10).build();

        klijent = User.builder()
                .id(1L).username("klijent1").email("klijent1@test.com")
                .role(User.Role.CLIENT).build();

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Pomoćni metodi za konstruisanje zahteva
    // ─────────────────────────────────────────────────────────────────────────

    private OrderRequest zahtevSaJednimArtiklom(long articleId, int kolicina) {
        OrderItemRequest stavka = new OrderItemRequest();
        stavka.setArticleId(articleId);
        stavka.setQuantity(kolicina);

        OrderRequest req = new OrderRequest();
        req.setItems(List.of(stavka));
        req.setPaymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY);
        req.setDeliveryAddress("Knez Mihailova 10, Beograd");
        return req;
    }

    private OrderRequest zahtevSaDvaArtikla(long id1, int qty1, long id2, int qty2) {
        OrderItemRequest s1 = new OrderItemRequest();
        s1.setArticleId(id1); s1.setQuantity(qty1);
        OrderItemRequest s2 = new OrderItemRequest();
        s2.setArticleId(id2); s2.setQuantity(qty2);

        OrderRequest req = new OrderRequest();
        req.setItems(List.of(s1, s2));
        req.setPaymentMethod(Order.PaymentMethod.CARD);
        req.setDeliveryAddress("Test adresa");
        return req;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 1 — Uspešno kreiranje porudžbine
    //           Proverava: status PENDING, tačna ukupna cena, umanjeno stanje,
    //           OrderRepository.save() pozvan tačno jednom
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("1. Uspešno kreiranje — status PENDING, cena tačna, stanje umanjeno, save() pozvan jednom")
    void create_uspesnoKreiranje_statusCenaStanjeSave() {
        // Arrange
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));
        // kolicina = 2, cena = 3500  →  ukupno = 7000, stanje: 15 → 13

        // Act
        Order result = orderService.create(zahtevSaJednimArtiklom(1L, 2), null);

        // Assert — status inicijalne porudžbine je PENDING (ekvivalent "CREATED")
        assertThat(result.getStatus())
                .as("Inicijalni status porudžbine mora biti PENDING")
                .isEqualTo(Order.OrderStatus.PENDING);

        assertThat(result.getTotalPrice())
                .as("Ukupna cena: 2 × 3500 = 7000")
                .isEqualByComparingTo("7000");

        assertThat(kocione.getStock())
                .as("Stanje artikla mora biti umanjeno za naručenu količinu (15 − 2 = 13)")
                .isEqualTo(13);

        verify(articleRepository, times(1)).save(kocione);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 2 — Prazna korpa
    //           Proverava: RuntimeException se baca, save() se NE poziva
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("2. Prazna korpa — baca RuntimeException, orderRepository.save() se ne poziva")
    void create_praznaKorpa_bacaExceptionISaveNijePozvan() {
        // Arrange
        OrderRequest prazanZahtev = new OrderRequest();
        prazanZahtev.setItems(List.of());
        prazanZahtev.setPaymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY);
        prazanZahtev.setDeliveryAddress("Neka adresa");

        // Act + Assert
        assertThatThrownBy(() -> orderService.create(prazanZahtev, null))
                .as("Prazna korpa mora baciti RuntimeException")
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("prazna");

        verify(orderRepository, never()).save(any());
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 3 — Klijent ne postoji u bazi
    //           Proverava: RuntimeException se baca, save() se NE poziva
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("3. Klijent ne postoji — baca RuntimeException, orderRepository.save() se ne poziva")
    void create_klijentNijePronadjen_bacaExceptionISaveNijePozvan() {
        // Arrange
        when(userRepository.findByUsername("nepostoji")).thenReturn(Optional.empty());
        // articleRepository se NE stubuje — servis ne sme ni doći do tog koraka

        // Act + Assert
        assertThatThrownBy(() -> orderService.create(zahtevSaJednimArtiklom(1L, 1), "nepostoji"))
                .as("Nepostojeći klijent mora baciti RuntimeException")
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Klijent nije pronađen");

        verify(orderRepository, never()).save(any());
        verify(articleRepository, never()).findById(any());
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 4 — Nedovoljno stanje artikla na lageru
    //           Proverava: RuntimeException se baca, stanje artikla ostaje nepromenjeno,
    //           articleRepository.save() i orderRepository.save() se NE pozivaju
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("4. Nedovoljno stanje — baca RuntimeException, stanje artikla ostaje nepromenjeno, save() se ne poziva")
    void create_nedovoljnoStanje_bacaExceptionIStanjeOstajaNepromenjeno() {
        // Arrange
        // kocione ima stock=15; tražimo količinu 20 — više nego što postoji
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));
        int stanjePreNarudzbine = kocione.getStock(); // 15

        // Act + Assert
        assertThatThrownBy(() -> orderService.create(zahtevSaJednimArtiklom(1L, 20), null))
                .as("Tražena količina (20) veća od stanja (15) — mora baciti RuntimeException")
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Nedovoljno stanja");

        assertThat(kocione.getStock())
                .as("Stanje artikla NE sme biti izmenjeno kada narudžba nije uspela")
                .isEqualTo(stanjePreNarudzbine);

        verify(articleRepository, never()).save(any());
        verify(orderRepository, never()).save(any());
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  TEST 5 — Tačno izračunavanje ukupne cene sa više artikala
    //           kocione: 2 × 3500 = 7000
    //           filter:  3 ×  850 = 2550
    //           UKUPNO:            9550
    // ═════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("5. Ukupna cena — više artikala sa različitim cenama i količinama (2×3500 + 3×850 = 9550)")
    void create_viseArtikala_tacnoIzracunavanjeUkupneCene() {
        // Arrange
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));
        when(articleRepository.findById(2L)).thenReturn(Optional.of(filter));

        OrderRequest req = zahtevSaDvaArtikla(1L, 2, 2L, 3);

        // Act
        Order result = orderService.create(req, null);

        // Assert
        assertThat(result.getTotalPrice())
                .as("Ukupna cena: (2×3500) + (3×850) = 7000 + 2550 = 9550")
                .isEqualByComparingTo("9550");

        assertThat(result.getItems())
                .as("Porudžbina mora sadržati tačno 2 stavke")
                .hasSize(2);

        assertThat(result.getItems().get(0).getUnitPrice())
                .as("Jedinična cena prve stavke = cena kočionih pločica (3500)")
                .isEqualByComparingTo("3500");

        assertThat(result.getItems().get(1).getUnitPrice())
                .as("Jedinična cena druge stavke = cena filtera (850)")
                .isEqualByComparingTo("850");
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Dodatni testovi za potpunije pokrivanje servisa
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Gost korisnik (null username) — client ostaje null, userRepository se ne poziva")
    void create_gostKorisnik_clientJeNull() {
        // Arrange
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));

        // Act
        Order result = orderService.create(zahtevSaJednimArtiklom(1L, 1), null);

        // Assert
        assertThat(result.getClient()).isNull();
        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    @DisplayName("Prijavljen klijent — porudžbina se vezuje za User entitet")
    void create_prijavljenKlijent_vezujeKlijentaZaPorudzbinu() {
        // Arrange
        when(userRepository.findByUsername("klijent1")).thenReturn(Optional.of(klijent));
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));

        // Act
        Order result = orderService.create(zahtevSaJednimArtiklom(1L, 1), "klijent1");

        // Assert
        assertThat(result.getClient()).isEqualTo(klijent);
        assertThat(result.getClient().getUsername()).isEqualTo("klijent1");
    }

    @Test
    @DisplayName("Nepostojeći artikal — baca RuntimeException sa porukom 'Article not found'")
    void create_nepostojeciArtikal_bacaRuntimeException() {
        // Arrange
        when(articleRepository.findById(99L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThatThrownBy(() -> orderService.create(zahtevSaJednimArtiklom(99L, 1), null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Article not found");
    }

    @Test
    @DisplayName("unitPrice u stavci = snapshot cene artikla u trenutku narudžbe")
    void create_snapshotCene_sacuvanaUStavci() {
        // Arrange
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));

        // Act
        Order result = orderService.create(zahtevSaJednimArtiklom(1L, 1), null);

        // Assert
        assertThat(result.getItems().get(0).getUnitPrice())
                .isEqualByComparingTo(kocione.getPrice());
    }

    @Test
    @DisplayName("Metod plaćanja CARD se pravilno prenosi u kreiranu porudžbinu")
    void create_metodPlacanjaCard_prenosi() {
        // Arrange
        OrderRequest req = zahtevSaJednimArtiklom(1L, 1);
        req.setPaymentMethod(Order.PaymentMethod.CARD);
        when(articleRepository.findById(1L)).thenReturn(Optional.of(kocione));

        // Act
        Order result = orderService.create(req, null);

        // Assert
        assertThat(result.getPaymentMethod()).isEqualTo(Order.PaymentMethod.CARD);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Testovi za getMyOrders() i updateStatus()
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyOrders — nepostojeći username baca RuntimeException 'User not found'")
    void getMyOrders_nepostojeciUsername_bacaException() {
        // Arrange
        when(userRepository.findByUsername("nepostoji")).thenReturn(Optional.empty());

        // Act + Assert
        assertThatThrownBy(() -> orderService.getMyOrders("nepostoji"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("getMyOrders — poziva repozitorijum sa ispravnim korisnikom")
    void getMyOrders_pozivRepozitorijumaSaKorisnikom() {
        // Arrange
        when(userRepository.findByUsername("klijent1")).thenReturn(Optional.of(klijent));
        when(orderRepository.findByClientOrderByCreatedAtDesc(klijent)).thenReturn(List.of());

        // Act
        orderService.getMyOrders("klijent1");

        // Assert
        verify(orderRepository).findByClientOrderByCreatedAtDesc(klijent);
    }

    @Test
    @DisplayName("updateStatus — nepostojeći ID baca RuntimeException 'Order not found'")
    void updateStatus_nepostojeciId_bacaException() {
        // Arrange
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThatThrownBy(() -> orderService.updateStatus(999L, Order.OrderStatus.DELIVERED))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Order not found");
    }

    @Test
    @DisplayName("updateStatus — menja status na DELIVERED i čuva porudžbinu")
    void updateStatus_menjaNaDeliveredISacuva() {
        // Arrange
        Order existing = Order.builder().id(1L).status(Order.OrderStatus.PENDING).build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(existing));

        // Act
        Order result = orderService.updateStatus(1L, Order.OrderStatus.DELIVERED);

        // Assert
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.DELIVERED);
        verify(orderRepository).save(existing);
    }

    @Test
    @DisplayName("updateStatus — može da postavi CANCELLED")
    void updateStatus_menjaNaCancelled() {
        // Arrange
        Order existing = Order.builder().id(2L).status(Order.OrderStatus.PENDING).build();
        when(orderRepository.findById(2L)).thenReturn(Optional.of(existing));

        // Act
        Order result = orderService.updateStatus(2L, Order.OrderStatus.CANCELLED);

        // Assert
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
    }
}
