import { expect, test } from "@playwright/test";

const expectedModuleIds = [
  "MOD-01",
  "MOD-02",
  "MOD-03",
  "MOD-04",
  "MOD-05",
  "MOD-08",
  "MOD-09",
];

test("home page navigates to the modules catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Explorar módulos planificados/ }).click();

  await expect(page).toHaveURL(/\/modules$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Módulos planificados" }),
  ).toBeVisible();
});

test("shows exactly the seven approved modules as planned and unimplemented", async ({ page }) => {
  await page.goto("/modules");

  const catalog = page.getByRole("list", { name: "Catálogo de módulos planificados" });
  const cards = catalog.getByRole("listitem");
  await expect(cards).toHaveCount(7);

  const ids = await cards.locator(".module-id").allTextContents();
  expect(ids.map((id) => id.trim())).toEqual(expectedModuleIds);

  for (const card of await cards.all()) {
    await expect(card.locator(".module-status")).toHaveText("Planificado · no implementado");
  }
});

test("supports mobile keyboard navigation with a visible focus indicator", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Saltar al contenido" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Tab"); // brand link
  await page.keyboard.press("Tab"); // Inicio
  const modulesLink = page.getByRole("link", { name: "Módulos", exact: true });
  await page.keyboard.press("Tab");

  await expect(modulesLink).toBeFocused();
  await expect(modulesLink).toBeVisible();
  await expect(modulesLink).toHaveCSS("outline-width", "3px");

  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  const navBounds = await nav.boundingBox();
  expect(navBounds).not.toBeNull();
  expect(navBounds!.x + navBounds!.width).toBeLessThanOrEqual(375);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/modules$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Módulos planificados" }),
  ).toBeVisible();
});
