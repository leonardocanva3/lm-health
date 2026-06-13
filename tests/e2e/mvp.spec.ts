import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/admin",
  "/admin/configuracoes",
  "/admin/pacientes",
  "/admin/agenda",
  "/paciente",
];
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const patientEmail = process.env.E2E_PATIENT_EMAIL;
const patientPassword = process.env.E2E_PATIENT_PASSWORD;
const publicWorkspaceSlug = process.env.E2E_PUBLIC_WORKSPACE_SLUG;
const hasFullStagingConfig = Boolean(
  adminEmail &&
    adminPassword &&
    patientEmail &&
    patientPassword &&
    publicWorkspaceSlug,
);

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
    return scrollWidth > window.innerWidth + 2;
  });

  expect(hasOverflow).toBe(false);
}

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  expectedPath: RegExp,
) {
  await page.goto("/entrar");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(expectedPath, { timeout: 20000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

test.describe("MVP security gates", () => {
  for (const route of protectedRoutes) {
    test(`${route} does not expose private data without login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => undefined);

      await expect(page.getByText(/sess|entre com|acesso|entrar/i).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/Logado como/i);
      await expect(page.locator("body")).not.toContainText(/Atividades recentes/i);
    });
  }
});

test.describe("Public portal", () => {
  test("unknown slug returns 404 without a runtime crash", async ({ page }) => {
    const response = await page.goto("/w/slug-inexistente-auditoria-mvp");

    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).not.toContainText(/Application error/i);
  });

  test("valid slug opens without login when E2E_PUBLIC_WORKSPACE_SLUG is provided", async ({
    page,
  }) => {
    const slug = publicWorkspaceSlug;

    test.skip(!slug, "Set E2E_PUBLIC_WORKSPACE_SLUG to validate a real public portal.");

    await page.goto(`/w/${slug}`);
    await page.waitForLoadState("networkidle").catch(() => undefined);

    await expect(page).not.toHaveURL(/entrar/);
    await expect(page.locator("body")).not.toContainText(/Logado como/i);
    await expect(page.locator("body")).not.toContainText(/Status de divulgacao/i);
    await expect(page.locator("body")).not.toContainText(/Pacientes cadastrados/i);
  });
});

test.describe("Authenticated staging E2E", () => {
  test.skip(
    !hasFullStagingConfig,
    "Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_PATIENT_EMAIL, E2E_PATIENT_PASSWORD and E2E_PUBLIC_WORKSPACE_SLUG.",
  );

  test("admin login opens the dashboard", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/admin$/);

    await expect(page.getByRole("heading", { name: /Clinica Modelo/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/White Label|white label|LM Health/);
  });

  test("admin patients page lists the staging patient", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/admin$/);
    await page.goto("/admin/pacientes");

    await expect(page.getByText("Joao da Silva").first()).toBeVisible();
    await expect(page.getByText("paciente.teste@lmhealth.local").first()).toBeVisible();
  });

  test("admin agenda page shows the staging appointment", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/admin$/);
    await page.goto("/admin/agenda");

    await expect(page.getByText("Joao da Silva").first()).toBeVisible();
    await expect(page.getByText("Consulta de teste E2E").first()).toBeVisible();
  });

  test("admin resources page shows active and inactive resources", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/admin$/);
    await page.goto("/admin/recursos");

    await expect(page.getByText("Recurso ativo de teste").first()).toBeVisible();
    await expect(page.getByText("Recurso inativo de teste").first()).toBeVisible();
  });

  test("admin notes page shows active and inactive notes", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/admin$/);
    await page.goto("/admin/orientacoes");

    await expect(page.getByText("Orientacao ativa de teste").first()).toBeVisible();
    await expect(page.getByText("Orientacao inativa de teste").first()).toBeVisible();
  });

  test("admin settings page shows the staging workspace identity", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/admin$/);
    await page.goto("/admin/configuracoes");

    await expect(page.getByDisplayValue("Clinica Modelo").first()).toBeVisible();
    await expect(page.getByDisplayValue(publicWorkspaceSlug!).first()).toBeVisible();
  });

  test("published portal opens without login", async ({ page }) => {
    await page.goto(`/w/${publicWorkspaceSlug}`);

    await expect(page.getByRole("heading", { name: /Clinica Modelo/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Logado como/i);
    await expect(page.locator("body")).not.toContainText(/Joao da Silva/i);
  });

  test("patient area shows only active notes and resources", async ({ page }) => {
    await login(page, patientEmail!, patientPassword!, /\/paciente$/);

    await expect(page.getByText("Orientacao ativa de teste").first()).toBeVisible();
    await expect(page.getByText("Recurso ativo de teste").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Orientacao inativa de teste");
    await expect(page.locator("body")).not.toContainText("Recurso inativo de teste");
  });
});

test.describe("Responsive shell", () => {
  for (const route of ["/", "/entrar", "/admin/configuracoes", "/w/slug-inexistente-auditoria-mvp"]) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => undefined);

      await expectNoHorizontalOverflow(page);
    });
  }
});
