package com.autoparts.config;

import com.autoparts.entity.Article;
import com.autoparts.entity.User;
import com.autoparts.repository.ArticleRepository;
import com.autoparts.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@autoparts.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .build());
        }

        if (!userRepository.existsByUsername("zaposleni1")) {
            userRepository.save(User.builder()
                    .username("zaposleni1")
                    .email("zaposleni1@autoparts.com")
                    .password(passwordEncoder.encode("zap123"))
                    .role(User.Role.EMPLOYEE)
                    .build());
        }

        if (articleRepository.count() == 0) {
            articleRepository.save(Article.builder()
                    .name("Kočione pločice Bosch")
                    .description("Prednje kočione pločice za vozila srednje klase. Visok kvalitet, dugi vek trajanja.")
                    .price(new BigDecimal("3500"))
                    .stock(15)
                    .category("Kočioni sistem")
                    .manufacturer("Bosch")
                    .partNumber("BP-0986494095")
                    .build());

            articleRepository.save(Article.builder()
                    .name("Filter ulja Mann")
                    .description("Filter ulja za benzinske i dizel motore.")
                    .price(new BigDecimal("850"))
                    .stock(0)
                    .category("Filteri")
                    .manufacturer("Mann")
                    .partNumber("W712/75")
                    .build());

            articleRepository.save(Article.builder()
                    .name("Amortizer Monroe prednji")
                    .description("Prednji amortizer, odgovarajući za veći broj modela vozila.")
                    .price(new BigDecimal("8200"))
                    .stock(8)
                    .category("Vešanje")
                    .manufacturer("Monroe")
                    .partNumber("MN-G8201")
                    .build());

            articleRepository.save(Article.builder()
                    .name("Klinasti kaiš Gates")
                    .description("Originalni kaiš za razvodni sistem.")
                    .price(new BigDecimal("2100"))
                    .stock(20)
                    .category("Motor")
                    .manufacturer("Gates")
                    .partNumber("GT-5569XS")
                    .build());

            articleRepository.save(Article.builder()
                    .name("Akumulator Varta 60Ah")
                    .description("Starter baterija 60Ah/540A za putnička vozila.")
                    .price(new BigDecimal("12500"))
                    .stock(5)
                    .category("Elektrika")
                    .manufacturer("Varta")
                    .partNumber("VA-560408054")
                    .build());
        }
    }
}
