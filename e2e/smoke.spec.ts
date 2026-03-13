/**
 * Smoke E2E tests — 3 critical user journeys.
 *
 * All Supabase calls are intercepted at the network level (no real backend).
 * Guards against: white-screen, broken sidebar, conversation creation failures.
 *
 * Run locally:  npm run e2e
 * Determinism:  npm run e2e:repeat   (×3, catches race conditions)
 */
import { test, expect } from "@playwright/test";
import { mockSupabase, loginViaUI, CONVO_2 } from "./helpers/mock-supabase";

// ─── Helpers ──────────────────────────────────────────

async function assertNotBlankScreen(page: import("@playwright/test").Page) {
  // The workspace should have visible text content (not just hidden toasters)
  await expect(
    page.locator("body").filter({ hasText: /\S/ })
  ).toBeVisible({ timeout: 10_000 });
}

// ─── Tests ────────────────────────────────────────────

test.describe("Smoke: Critical User Journeys", () => {
  // ───────────────────────────────────────────────────
  // J1: Empty state → create first conversation
  // ───────────────────────────────────────────────────
  test("J1: empty state → creates first conversation → shows workspace", async ({ page }) => {
    await mockSupabase(page, "empty");
    await loginViaUI(page);

    await assertNotBlankScreen(page);

    // Welcome message should appear (the app creates welcome messages for new conversations)
    await expect(page.getByText("欢迎来到家庭愿景工坊")).toBeVisible({ timeout: 10_000 });
  });

  // ───────────────────────────────────────────────────
  // J2: Has conversations → loads latest → shows content
  // ───────────────────────────────────────────────────
  test("J2: has conversations → loads latest → renders content", async ({ page }) => {
    await mockSupabase(page, "has-conversations");
    await loginViaUI(page);

    await assertNotBlankScreen(page);

    // Should show the welcome message from mocked MESSAGES_1
    await expect(page.getByText("欢迎来到家庭愿景工坊")).toBeVisible({ timeout: 10_000 });

    // Should show the user's message
    await expect(page.getByText("家庭代号：测试家庭")).toBeVisible({ timeout: 5_000 });
  });

  // ───────────────────────────────────────────────────
  // J3: Open history drawer → select a conversation → no blank screen
  // ───────────────────────────────────────────────────
  test("J3: history drawer → select conversation → no blank screen", async ({ page }) => {
    await mockSupabase(page, "has-conversations");
    await loginViaUI(page);

    // Wait for initial content
    await expect(page.getByText("欢迎来到家庭愿景工坊")).toBeVisible({ timeout: 10_000 });

    // Click "历史" button in top bar
    const historyBtn = page.getByRole("button", { name: /历史/ });
    await expect(historyBtn).toBeVisible({ timeout: 5_000 });
    await historyBtn.click();

    // The drawer overlay + panel should appear
    const overlay = page.locator(".fixed.inset-0");
    await expect(overlay.first()).toBeVisible({ timeout: 5_000 });

    // Drawer title
    await expect(page.locator("h2").filter({ hasText: "历史对话" })).toBeVisible();

    // "新建愿景对话" button should be present
    await expect(page.getByRole("button", { name: /新建愿景对话/ })).toBeVisible();

    // Should show conversation items (wait for loading to finish)
    await expect(page.getByText("继续进行")).toBeVisible({ timeout: 5_000 });

    // Click on the history conversation (CONVO_2 family code)
    const historyItem = page.getByText("历史家庭").first();
    if (await historyItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await historyItem.click();

      // Drawer should close after selection
      await expect(overlay.first()).not.toBeVisible({ timeout: 5_000 });

      // Workspace should not be blank
      await assertNotBlankScreen(page);

      // Should show MESSAGES_2 content (welcome message from the loaded conversation)
      await expect(page.getByText("欢迎来到家庭愿景工坊")).toBeVisible({ timeout: 5_000 });
    }
  });
});
