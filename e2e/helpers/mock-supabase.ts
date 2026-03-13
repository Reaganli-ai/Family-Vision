/**
 * Intercept Supabase REST + Auth API at the network level.
 * Tests never hit a real Supabase instance — fully deterministic.
 */
import type { Page } from "@playwright/test";

// ─── Fake data ──────────────────────────────────────

const FAKE_USER = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2025-01-01T00:00:00Z",
  user_metadata: { full_name: "Test User" },
};

const FAKE_SESSION = {
  access_token: "fake-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "fake-refresh-token",
  user: FAKE_USER,
};

const CONVO_1 = {
  id: "cccccccc-0000-0000-0000-000000000001",
  user_id: FAKE_USER.id,
  family_code: "测试家庭",
  title: "测试家庭 家庭愿景",
  status: "active",
  current_module: 1,
  current_node: 2,
  started: true,
  created_at: "2025-06-01T10:00:00Z",
  updated_at: "2025-06-02T14:30:00Z",
};

const CONVO_2 = {
  id: "cccccccc-0000-0000-0000-000000000002",
  user_id: FAKE_USER.id,
  family_code: "历史家庭",
  title: "历史家庭 家庭愿景",
  status: "active",
  current_module: 0,
  current_node: 0,
  started: true,
  created_at: "2025-05-01T10:00:00Z",
  updated_at: "2025-05-15T09:00:00Z",
};

const MESSAGES_1 = [
  {
    id: "mmmm-0001",
    conversation_id: CONVO_1.id,
    role: "ai",
    content: "欢迎来到家庭愿景工坊。\n\n接下来我会引导你完成四个模块的思考，最终生成一份《家庭战略定位罗盘》。整个过程大约 20-30 分钟。",
    card_type: null,
    card_props: null,
    card_data: null,
    snapshot_content: null,
    created_at: "2025-06-01T10:00:01Z",
  },
  {
    id: "mmmm-0002",
    conversation_id: CONVO_1.id,
    role: "user",
    content: "家庭代号：测试家庭",
    card_type: null,
    card_props: null,
    card_data: null,
    snapshot_content: null,
    created_at: "2025-06-01T10:01:00Z",
  },
];

const MESSAGES_2 = [
  {
    id: "mmmm-0003",
    conversation_id: CONVO_2.id,
    role: "ai",
    content: "欢迎来到家庭愿景工坊。\n\n接下来我会引导你完成四个模块的思考，最终生成一份《家庭战略定位罗盘》。整个过程大约 20-30 分钟。",
    card_type: null,
    card_props: null,
    card_data: null,
    snapshot_content: null,
    created_at: "2025-05-01T10:00:01Z",
  },
];

const NEW_CONVO = {
  id: "cccccccc-0000-0000-0000-000000000099",
  user_id: FAKE_USER.id,
  family_code: "",
  title: "新对话",
  status: "active",
  current_module: 0,
  current_node: 0,
  started: false,
  created_at: "2025-07-01T00:00:00Z",
  updated_at: "2025-07-01T00:00:00Z",
};

// ─── Route interceptors ─────────────────────────────

export type MockScenario = "has-conversations" | "empty";

export async function mockSupabase(page: Page, scenario: MockScenario = "has-conversations") {
  // Intercept any request to supabase — matches both *.supabase.co and localhost:54321
  await page.route(/\/(auth|rest)\/v1\//, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // ── Auth: token grant (login) ───────────────────
    if (url.includes("/auth/v1/token")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_SESSION),
      });
    }

    // ── Auth: get user ──────────────────────────────
    if (url.includes("/auth/v1/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_USER),
      });
    }

    // ── Auth: get session ───────────────────────────
    if (url.includes("/auth/v1/session")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: FAKE_SESSION }),
      });
    }

    // ── Auth: logout ────────────────────────────────
    if (url.includes("/auth/v1/logout")) {
      return route.fulfill({ status: 204, body: "" });
    }

    // ── REST: conversations ─────────────────────────
    if (url.includes("/rest/v1/conversations")) {
      if (method === "GET") {
        const convos = scenario === "empty" ? [] : [CONVO_1, CONVO_2];
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(convos),
        });
      }
      if (method === "POST") {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(NEW_CONVO),
        });
      }
      if (method === "PATCH") {
        return route.fulfill({ status: 204, body: "" });
      }
    }

    // ── REST: messages ──────────────────────────────
    if (url.includes("/rest/v1/messages")) {
      if (method === "GET") {
        if (url.includes(CONVO_2.id)) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MESSAGES_2),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MESSAGES_1),
        });
      }
      if (method === "POST") {
        return route.fulfill({ status: 201, body: "[]" });
      }
    }

    // ── REST: compass_data ──────────────────────────
    if (url.includes("/rest/v1/compass_data")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: {} }),
        });
      }
      if (method === "POST") {
        return route.fulfill({ status: 201, body: "[]" });
      }
    }

    // ── Fallback ────────────────────────────────────
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

/**
 * Log in via the UI: fill the login form and submit.
 * The Supabase auth endpoint is mocked, so any email/password works.
 */
export async function loginViaUI(page: Page) {
  await page.goto("/login");
  // The email tab should already be active
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "testpass123");
  await page.click('button[type="submit"]');
  // After mock auth succeeds, the app navigates to /workspace
  await page.waitForURL("**/workspace", { timeout: 10_000 });
}

export { CONVO_1, CONVO_2, NEW_CONVO, FAKE_SESSION };
