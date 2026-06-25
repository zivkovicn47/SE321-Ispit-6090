const { test, expect } = require('@playwright/test');

// Ovo je sistemski/E2E test koji testira stvarnu integraciju frontend-a, backend-a i baze podataka.
// Ne koriste se mokovani delovi, već se testira stvarni korisnički scenario od početka do kraja.
// Zbog toga E2E testovi daju najveću sigurnost da kompletan sistem radi ispravno.

test('kompletan proces kupovine od registracije do provere porudžbine', async ({ page }) => {
  // Generišemo jedinstvene podatke kako bi test mogao da se pokreće više puta bez konflikata
  const timestamp = Date.now();
  const username = `klijent_${timestamp}`;
  const email = `klijent_${timestamp}@test.com`;

  // 1. Otvara frontend i prelazi na registraciju
  await page.goto('/');
  await page.getByRole('link', { name: 'Registruj se' }).click();

  // 2. Popunjava formu registracije
  await page.getByTestId('register-username').fill(username);
  await page.getByTestId('register-email').fill(email);
  await page.getByTestId('register-password').fill('testlozinka123');
  await page.getByTestId('register-phone').fill('0601234567');
  await page.getByRole('button', { name: 'Registruj se' }).click();

  // 3. Proverava da je uspešno registrovan i ulogovan
  // Preusmeren na HomePage, Navbar treba da prikaže korisničko ime i opciju za odjavu
  await expect(page).toHaveURL('/');
  await expect(page.getByText(`${username} (CLIENT)`)).toBeVisible();

  // Provera JWT tokena u localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  // 4. Koristi filter da pronađe artikal (Kočione pločice Bosch)
  await page.getByPlaceholder('npr. kočione pločice').fill('Kočione pločice');
  await page.getByPlaceholder('npr. Bosch').fill('Bosch');
  await page.getByRole('button', { name: 'Pretraži' }).click();

  // Proveravamo da je artikal na stanju i vidljiv
  const articleCard = page.locator('.article-card').filter({ hasText: 'Kočione pločice' });
  await expect(articleCard).toBeVisible();
  await expect(articleCard.locator('.stock-in')).toBeVisible();

  // 5. Klikom dodaje artikal u korpu
  await articleCard.getByRole('button', { name: 'Dodaj u korpu' }).click();
  
  // Očekujemo da dugme kratko prikaže "Dodato!"
  await expect(articleCard.getByRole('button', { name: 'Dodato!' })).toBeVisible();

  // 6. Odlazi na CartPage, unosi adresu dostave, bira način plaćanja
  await page.getByRole('link', { name: 'Korpa (1)' }).click();
  await expect(page).toHaveURL('/cart');

  await page.locator('#deliveryAddress').fill('Test Adresa 123, Beograd');
  // Pošto je ulogovan, paymentMethod dropdown postoji i možemo izabrati Karticu
  await page.locator('select').selectOption('CARD');

  // 7. Šalje porudžbinu i proverava potvrdu
  await page.getByRole('button', { name: 'Naruči' }).click();
  
  // Provera da se pojavila poruka o uspehu
  await expect(page.getByText('Porudžbina je uspešno kreirana!')).toBeVisible();

  // 8. Odlazi na OrdersPage i proverava istoriju porudžbina
  // Zbog redirekcije, klikćemo na 'Moje porudžbine' u Navbaru
  await page.getByRole('link', { name: 'Moje porudžbine' }).click();
  await expect(page).toHaveURL('/orders');

  // Proveravamo da li je nova porudžbina tu sa statusom i artikalom
  const orderCard = page.locator('.card').first();
  await expect(orderCard.getByText('Na čekanju')).toBeVisible(); // Status
  await expect(orderCard.getByText('Kočione pločice')).toBeVisible(); // Artikal
  await expect(orderCard.getByText('Kartica')).toBeVisible(); // Nacin placanja
  // Provera iznosa - Kočione pločice koštaju 3500 RSD
  await expect(orderCard.getByText(/Ukupno: 3\.500 RSD/)).toBeVisible();
});
