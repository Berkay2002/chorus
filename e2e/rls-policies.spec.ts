import { test, expect } from '@playwright/test';

/**
 * RLS (Row-Level Security) Policy Tests
 *
 * These tests verify that Supabase RLS policies correctly enforce authorization rules:
 * - Users can only see servers they're members of
 * - Users cannot post messages in channels they don't have access to
 * - Users cannot delete servers they don't own
 * - Unauthorized API access is blocked
 *
 * These tests use the API endpoints directly to verify security enforcement.
 */

test.describe('RLS Policy Enforcement', () => {
  const timestamp = Date.now();
  const user1 = {
    email: `user1-${timestamp}@example.com`,
    password: 'TestPassword123!',
    username: `user1${timestamp}`,
  };
  const user2 = {
    email: `user2-${timestamp}@example.com`,
    password: 'TestPassword123!',
    username: `user2${timestamp}`,
  };

  let user1Context: any;
  let user2Context: any;
  let user1ServerId: string;
  let user1ChannelId: string;

  test.beforeAll(async ({ browser }) => {
    // Create two separate user contexts
    user1Context = await browser.newContext();
    user2Context = await browser.newContext();

    // Sign up User 1
    const page1 = await user1Context.newPage();
    await page1.goto('/signup');
    await page1.getByLabel(/email/i).fill(user1.email);
    await page1.getByLabel(/password/i).first().fill(user1.password);
    await page1.getByLabel(/username/i).fill(user1.username);
    await page1.getByRole('button', { name: /sign up/i }).click();
    await expect(page1).toHaveURL(/\/servers/);

    // Create server and channel for User 1
    await page1.getByRole('button', { name: /create server/i }).click();
    await page1.getByLabel(/server name/i).fill('User1 Private Server');
    await page1.getByRole('dialog').getByRole('button', { name: /create/i }).click();
    await expect(page1.getByText('User1 Private Server')).toBeVisible();

    // Extract server ID from URL
    await page1.waitForURL(/\/servers\/[a-f0-9-]+/);
    const url1 = page1.url();
    user1ServerId = url1.match(/\/servers\/([a-f0-9-]+)/)?.[1] || '';

    // Create channel
    await page1.getByRole('button', { name: /create channel/i }).click();
    await page1.getByLabel(/channel name/i).fill('private-channel');
    await page1.getByRole('dialog').getByRole('button', { name: /create/i }).click();
    await page1.waitForURL(/\/channels\/[a-f0-9-]+/);
    const channelUrl = page1.url();
    user1ChannelId = channelUrl.match(/\/channels\/([a-f0-9-]+)/)?.[1] || '';

    await page1.close();

    // Sign up User 2 (not a member of User1's server)
    const page2 = await user2Context.newPage();
    await page2.goto('/signup');
    await page2.getByLabel(/email/i).fill(user2.email);
    await page2.getByLabel(/password/i).first().fill(user2.password);
    await page2.getByLabel(/username/i).fill(user2.username);
    await page2.getByRole('button', { name: /sign up/i }).click();
    await expect(page2).toHaveURL(/\/servers/);
    await page2.close();
  });

  test.afterAll(async () => {
    await user1Context.close();
    await user2Context.close();
  });

  test('User2 cannot see User1 server via API', async () => {
    const page = await user2Context.newPage();

    // Try to fetch User1's server via API
    const response = await page.request.get(`/api/servers/${user1ServerId}`);

    // Expect 403 Forbidden or 404 Not Found (RLS blocks access)
    expect([403, 404]).toContain(response.status());

    await page.close();
  });

  test('User2 cannot access User1 channels via UI', async () => {
    const page = await user2Context.newPage();

    // Try to directly navigate to User1's channel
    await page.goto(`/servers/${user1ServerId}/channels/${user1ChannelId}`);

    // Should redirect to /servers or show error
    await expect(page).not.toHaveURL(new RegExp(`/servers/${user1ServerId}/channels/${user1ChannelId}`));

    await page.close();
  });

  test('User2 cannot post messages in User1 channel via API', async () => {
    const page = await user2Context.newPage();

    // Try to post a message to User1's channel
    const response = await page.request.post(`/api/channels/${user1ChannelId}/messages`, {
      data: {
        content: 'Unauthorized message from User2',
      },
    });

    // Expect 403 Forbidden (RLS blocks unauthorized insert)
    expect([403, 401]).toContain(response.status());

    await page.close();
  });

  test('User2 cannot delete User1 server via API', async () => {
    const page = await user2Context.newPage();

    // Try to delete User1's server
    const response = await page.request.delete(`/api/servers/${user1ServerId}`);

    // Expect 403 Forbidden (only owner can delete)
    expect([403, 401]).toContain(response.status());

    await page.close();
  });

  test('User1 can access their own server and channels', async () => {
    const page = await user1Context.newPage();
    await page.goto('/servers');

    // Navigate to User1's server
    await page.getByText('User1 Private Server').click();
    await expect(page).toHaveURL(new RegExp(`/servers/${user1ServerId}`));

    // Navigate to channel
    await page.getByText('private-channel').click();
    await expect(page).toHaveURL(new RegExp(`/channels/${user1ChannelId}`));

    // Post a message
    const messageInput = page.getByPlaceholder(/type a message/i);
    await messageInput.fill('User1 authorized message');
    await messageInput.press('Enter');
    await expect(page.getByText('User1 authorized message')).toBeVisible();

    await page.close();
  });

  test('User1 can fetch their server list via API', async () => {
    const page = await user1Context.newPage();

    // Fetch server list
    const response = await page.request.get('/api/servers');

    // Expect 200 OK
    expect(response.status()).toBe(200);

    const servers = await response.json();
    expect(Array.isArray(servers.data)).toBe(true);
    expect(servers.data.some((s: any) => s.id === user1ServerId)).toBe(true);

    await page.close();
  });

  test('Unauthenticated user cannot access protected routes', async ({ page }) => {
    // Try to access server API without authentication
    const response = await page.request.get('/api/servers');

    // Expect 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('Unauthenticated user redirected from protected pages', async ({ page }) => {
    // Try to access /servers page
    await page.goto('/servers');

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Server Membership RLS', () => {
  test('User can only see servers in their server list API', async ({ page }) => {
    const timestamp = Date.now();

    // Sign up and create a server
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill(`member-test-${timestamp}@example.com`);
    await page.getByLabel(/password/i).first().fill('TestPassword123!');
    await page.getByLabel(/username/i).fill(`membertest${timestamp}`);
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/servers/);

    // Create first server
    await page.getByRole('button', { name: /create server/i }).click();
    await page.getByLabel(/server name/i).fill('My First Server');
    await page.getByRole('dialog').getByRole('button', { name: /create/i }).click();
    await expect(page.getByText('My First Server')).toBeVisible();

    // Fetch servers via API
    const response1 = await page.request.get('/api/servers');
    expect(response1.status()).toBe(200);
    const servers1 = await response1.json();
    expect(servers1.data).toHaveLength(1);
    expect(servers1.data[0].name).toBe('My First Server');

    // Create second server
    await page.goto('/servers');
    await page.getByRole('button', { name: /create server/i }).click();
    await page.getByLabel(/server name/i).fill('My Second Server');
    await page.getByRole('dialog').getByRole('button', { name: /create/i }).click();
    await expect(page.getByText('My Second Server')).toBeVisible();

    // Fetch servers again
    const response2 = await page.request.get('/api/servers');
    expect(response2.status()).toBe(200);
    const servers2 = await response2.json();
    expect(servers2.data).toHaveLength(2);
    expect(servers2.data.map((s: any) => s.name)).toContain('My First Server');
    expect(servers2.data.map((s: any) => s.name)).toContain('My Second Server');
  });
});
