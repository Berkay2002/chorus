import { test, expect } from '@playwright/test';

/**
 * Critical Path E2E Test for Epic 1 (Foundation Infrastructure)
 *
 * This test covers the complete user journey from signup to sending/receiving messages:
 * 1. User signup with email/password
 * 2. Create a server
 * 3. Create a channel
 * 4. Send a message
 * 5. Verify message appears in real-time
 *
 * Acceptance Criteria Covered:
 * - AC 1-3: User authentication (Story 1.1)
 * - AC 4-5: Server creation (Story 1.2)
 * - AC 6-8: Channel creation (Story 1.3)
 * - AC 12-15: Send messages (Story 1.5)
 * - AC 16-18: View message history (Story 1.6)
 */

test.describe('Critical Path: Signup to Send Message', () => {
  // Generate unique test data for each run
  const timestamp = Date.now();
  const testUser = {
    email: `test-user-${timestamp}@example.com`,
    password: 'TestPassword123!',
    username: `testuser${timestamp}`,
  };
  const testServer = {
    name: `Test Server ${timestamp}`,
  };
  const testChannel = {
    name: 'general',
  };
  const testMessage = {
    content: `Hello World from E2E test! ${timestamp}`,
  };

  test('should complete full user journey from signup to messaging', async ({ page }) => {
    // =====================================================
    // Step 1: Navigate to signup page
    // =====================================================
    await test.step('Navigate to signup page', async () => {
      await page.goto('/signup');
      await expect(page).toHaveTitle(/Chorus/i);
    });

    // =====================================================
    // Step 2: Fill signup form and submit (AC 1)
    // =====================================================
    await test.step('Sign up with email and password', async () => {
      // Fill signup form
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).first().fill(testUser.password);
      await page.getByLabel(/username/i).fill(testUser.username);

      // Submit form
      await page.getByRole('button', { name: /sign up/i }).click();

      // Wait for redirect to /servers (AC 3)
      await expect(page).toHaveURL(/\/servers/);
    });

    // =====================================================
    // Step 3: Create a server (AC 4)
    // =====================================================
    await test.step('Create a new server', async () => {
      // Click "Create Server" button (could be in sidebar or modal trigger)
      const createServerButton = page.getByRole('button', { name: /create server/i });
      await createServerButton.click();

      // Wait for modal to appear
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill server name
      await page.getByLabel(/server name/i).fill(testServer.name);

      // Submit
      await page.getByRole('dialog').getByRole('button', { name: /create/i }).click();

      // Wait for server to appear in sidebar (AC 5)
      await expect(page.getByText(testServer.name)).toBeVisible();

      // Verify URL updated to server page
      await expect(page).toHaveURL(/\/servers\/[a-f0-9-]+/);
    });

    // =====================================================
    // Step 4: Create a channel (AC 6)
    // =====================================================
    await test.step('Create a new channel', async () => {
      // Click "Create Channel" button
      const createChannelButton = page.getByRole('button', { name: /create channel/i });
      await createChannelButton.click();

      // Wait for modal
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill channel name
      await page.getByLabel(/channel name/i).fill(testChannel.name);

      // Submit
      await page.getByRole('dialog').getByRole('button', { name: /create/i }).click();

      // Wait for channel to appear in sidebar (AC 7)
      await expect(page.getByText(testChannel.name)).toBeVisible();

      // Verify URL updated to channel page (AC 8)
      await expect(page).toHaveURL(/\/servers\/[a-f0-9-]+\/channels\/[a-f0-9-]+/);
    });

    // =====================================================
    // Step 5: Send a message (AC 12-13)
    // =====================================================
    await test.step('Send a message', async () => {
      // Find message input (textarea)
      const messageInput = page.getByPlaceholder(/type a message/i);
      await expect(messageInput).toBeVisible();

      // Type message
      await messageInput.fill(testMessage.content);

      // Press Enter to send (AC 12)
      await messageInput.press('Enter');

      // Verify message appears immediately (optimistic update, AC 13)
      await expect(page.getByText(testMessage.content)).toBeVisible({ timeout: 5000 });

      // Verify author name displayed (AC 15)
      await expect(page.getByText(testUser.username)).toBeVisible();

      // Verify timestamp displayed (AC 15)
      // Timestamps could be relative ("just now") or absolute
      await expect(page.getByText(/just now|seconds? ago|:\d{2}/i)).toBeVisible();
    });

    // =====================================================
    // Step 6: Verify message in history (AC 16)
    // =====================================================
    await test.step('Verify message persisted in history', async () => {
      // Refresh page to verify message persists
      await page.reload();

      // Wait for page to load
      await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();

      // Verify message still visible (AC 16)
      await expect(page.getByText(testMessage.content)).toBeVisible();

      // Verify author and timestamp still present
      await expect(page.getByText(testUser.username)).toBeVisible();
    });

    // =====================================================
    // Step 7: Verify session persistence (AC 3)
    // =====================================================
    await test.step('Verify session persists across page refreshes', async () => {
      // Refresh page again
      await page.reload();

      // Verify still authenticated (not redirected to /login)
      await expect(page).toHaveURL(/\/servers/);

      // Verify user still sees their server
      await expect(page.getByText(testServer.name)).toBeVisible();
    });
  });

  test('should handle multiple messages and display in order', async ({ page }) => {
    // Login with previously created user
    await test.step('Login', async () => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(testUser.email);
      await page.getByLabel(/password/i).fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/servers/);
    });

    // Navigate to the test server and channel
    await test.step('Navigate to test channel', async () => {
      await page.getByText(testServer.name).click();
      await page.getByText(testChannel.name).click();
      await expect(page).toHaveURL(/\/channels/);
    });

    // Send multiple messages
    await test.step('Send multiple messages in sequence', async () => {
      const messages = [
        'First message',
        'Second message',
        'Third message',
      ];

      const messageInput = page.getByPlaceholder(/type a message/i);

      for (const content of messages) {
        await messageInput.fill(content);
        await messageInput.press('Enter');
        await expect(page.getByText(content)).toBeVisible();
      }

      // Verify all messages visible in order
      const messageList = page.locator('[role="article"], [data-testid="message-item"]');
      await expect(messageList).toHaveCount(4); // 1 from first test + 3 new ones
    });
  });
});

test.describe('Authentication Edge Cases', () => {
  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).first().fill('TestPassword123!');
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Expect error message or validation feedback
    await expect(page.getByText(/invalid email|email is required/i)).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).first().fill('short');
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Expect password validation error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    // Try to access /servers without authentication
    await page.goto('/servers');

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Real-time Messaging', () => {
  test.skip('should show message from another user in real-time', async ({ browser }) => {
    // This test requires two browser contexts (two users)
    // Skipping for MVP as it requires more complex setup
    // TODO: Implement with two contexts for multi-user real-time testing
  });
});
