import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/v1/health", (route) =>
    route.fulfill({
      json: {
        status: "ok",
        service: "atmosalert-api",
        version: "0.1.0",
        environment: "test",
        model_ready: false,
      },
    }),
  );
  await page.route("**/v1/nowcasts", (route) =>
    route.fulfill({
      status: 503,
      json: { detail: "No trained nowcasting model is configured" },
    }),
  );
});

test("landing preview responds to hazards and opens the workspace", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Early signals. Earlier action." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Flash floods Runoff/ }).click();
  await expect(page.locator(".hero-map-key")).toContainText("Flash floods");
  await page.getByRole("button", { name: "+6h", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "+6h", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("link", { name: "Explore the dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Forecast layers" }),
  ).toBeVisible();
  await expect(page.locator(".scenario-banner")).toContainText(
    "Synthetic data",
  );
});

test("hazard, horizon, location and region remain connected", async ({
  page,
}) => {
  await page.goto("/#/dashboard");
  await page
    .getByRole("button", { name: "Inspect Uttarkashi", exact: true })
    .click();
  await expect(page.locator(".inspector h2")).toHaveText("Uttarkashi");
  await page
    .getByRole("button", { name: "Inspect Rudraprayag", exact: true })
    .click();
  await page.getByRole("button", { name: "Flash floods", exact: true }).click();
  await page.getByRole("button", { name: "+6 hours", exact: true }).click();
  await expect(page.locator(".probability-block strong")).toHaveText("60%");
  await expect(page.locator(".forecast-window")).toContainText(
    "18:00–19:00 IST",
  );
  await page.getByRole("button", { name: /Chamoli.*potential/ }).click();
  await expect(page.locator(".inspector h2")).toHaveText("Chamoli");
  await expect(page.locator(".probability-block strong")).toHaveText("69%");
  await page.getByLabel("Search a location").fill("Mandi");
  await page
    .locator(".search-results")
    .getByRole("button", { name: /Mandi/ })
    .click();
  await expect(page.getByLabel("Forecast region")).toHaveValue(
    "Himachal Pradesh",
  );
  await expect(page.locator(".inspector h2")).toHaveText("Mandi");
});

test("live mode requests the API and never substitutes synthetic predictions", async ({
  page,
}) => {
  await page.goto("/#/dashboard");
  const request = page.waitForRequest("**/v1/nowcasts");
  await page.getByRole("button", { name: "Live data", exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({
    horizons_hours: [2],
    event_types: ["cloudburst"],
  });
  await expect(
    page.getByRole("heading", { name: "No live forecast available" }),
  ).toBeVisible();
  await expect(page.locator(".probability-block")).toHaveCount(0);
  await expect(page.locator(".location-list")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download demo forecast JSON" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(page.locator(".probability-block strong")).toHaveText("82%");
});

test("alerts filter, persist local acknowledgement and export only visible rows", async ({
  page,
}) => {
  await page.goto("/#/alerts");
  await page
    .getByRole("combobox", { name: "Hazard", exact: true })
    .selectOption("flash_flood");
  await page
    .getByRole("combobox", { name: "Potential", exact: true })
    .selectOption("High");
  await expect(page.locator(".alerts-table tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Acknowledge", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Acknowledged", exact: true }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Acknowledged", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Hazard", exact: true })
    .selectOption("flash_flood");
  await page
    .getByRole("combobox", { name: "Potential", exact: true })
    .selectOption("High");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("atmosalert-demo-alerts.csv");
  const stream = await download.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk.toString();
  expect(content.trim().split("\n")).toHaveLength(3);
  expect(content).toContain("illustrative_demo");
});

test("source status displays actual model readiness", async ({ page }) => {
  await page.goto("/#/sources");
  await expect(
    page.getByRole("heading", { name: "Backend service connected" }),
  ).toBeVisible();
  await expect(page.locator(".service-status")).toContainText(
    "No forecasting model is loaded",
  );
  await page.route("**/v1/health", (route) =>
    route.fulfill({ status: 502, body: "Unavailable" }),
  );
  await page.getByRole("button", { name: "Refresh status" }).click();
  await expect(
    page.getByRole("heading", { name: "Backend service unavailable" }),
  ).toBeVisible();
});

test("mobile navigation and forecast controls remain usable without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("button", { name: "How it works", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close navigation" }).click();
  await page.getByRole("link", { name: "Open dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Flash floods", exact: true }).click();
  await page.getByRole("button", { name: "+4 hours", exact: true }).click();
  await expect(page.locator(".probability-block strong")).toHaveText("68%");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Alerts", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Alert log" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
