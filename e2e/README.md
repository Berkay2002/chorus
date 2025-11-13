# Chorus E2E Tests

This directory contains end-to-end (E2E) tests for Chorus using Playwright.

## Test Coverage

### Epic 1 (Foundation Infrastructure) - Critical Path Tests

**File:** `critical-path.spec.ts`

Tests the complete user journey from signup to messaging:

1. **User Authentication** (Story 1.1)
   - Sign up with email/password
   - Session persistence across page refreshes
   - Redirect to home view after auth

2. **Server Creation** (Story 1.2)
   - Create a named server
   - Server appears in user's server list
   - Proper ownership assignment

3. **Channel Creation** (Story 1.3)
   - Create channels within servers
   - Channels display in sidebar
   - Switch between channels

4. **Messaging** (Story 1.5)
   - Send messages via input field
   - Immediate optimistic UI update
   - Real-time message delivery
   - Display author name and timestamp

5. **Message History** (Story 1.6)
   - Load last 50 messages on channel open
   - Messages persist after page refresh
   - Proper chronological ordering

### RLS (Row-Level Security) Policy Tests

**File:** `rls-policies.spec.ts`

Verifies Supabase RLS policies correctly enforce authorization:

1. **Server Access Control**
   - Users can only see servers they're members of
   - Unauthorized users cannot access private servers via API
   - Unauthorized users cannot navigate to private server pages

2. **Message Authorization**
   - Users cannot post messages in channels they don't have access to
   - API endpoints return 403 Forbidden for unauthorized attempts

3. **Server Management**
   - Only server owners can delete servers
   - Non-owners receive 403 Forbidden on delete attempts

4. **Unauthenticated Access**
   - Unauthenticated users cannot access protected API endpoints
   - Unauthenticated users redirected to /login from protected pages

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install Playwright and its dependencies (defined in `package.json`).

### 2. Install Playwright Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers.

### 3. Set Up Environment

Ensure you have a `.env.local` file with the required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Start Local Supabase (Optional)

For local testing with a clean database:

```bash
supabase start
supabase db reset
```

## Running Tests

### Run All Tests (Headless)

```bash
npm run test:e2e
```

### Run Tests with UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

UI mode allows you to:
- See the browser during test execution
- Step through tests line by line
- View test results in real-time
- Debug failed tests interactively

### Run Tests with Visible Browser (Headed Mode)

```bash
npm run test:e2e:headed
```

### Run Specific Test File

```bash
npx playwright test critical-path.spec.ts
```

### Run Specific Test by Name

```bash
npx playwright test --grep "should complete full user journey"
```

### View Test Report

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

## Test Architecture

### Configuration

**File:** `playwright.config.ts` (project root)

- **Test Directory:** `./e2e`
- **Base URL:** `http://localhost:3000`
- **Browsers:** Chromium (default), Firefox and WebKit available
- **Web Server:** Auto-starts Next.js dev server before tests
- **Retries:** 2 retries on CI, 0 locally
- **Trace:** Captured on first retry (for debugging)
- **Screenshot:** Captured only on failure

### Test Data Strategy

Tests use unique identifiers (timestamps) for:
- User emails: `test-user-${timestamp}@example.com`
- Usernames: `testuser${timestamp}`
- Server names: `Test Server ${timestamp}`

This ensures tests can run in parallel without conflicts.

### Cleanup

Tests create real data in the database. For local development, reset the database periodically:

```bash
supabase db reset
```

For production/staging, implement a cleanup script or use a dedicated test database.

## Writing New Tests

### Test Structure

Follow this structure for new tests:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // 1. Setup
    await page.goto('/path');

    // 2. Action
    await page.getByRole('button', { name: /click me/i }).click();

    // 3. Assertion
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Semantic Selectors**
   - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
   - Makes tests resilient to DOM changes

2. **Use test.step() for Clarity**
   ```typescript
   await test.step('User signs up', async () => {
     // Signup logic
   });
   ```

3. **Generate Unique Test Data**
   - Use timestamps or UUIDs to avoid conflicts

4. **Clean Up After Tests**
   - Use `test.afterEach()` or `test.afterAll()` hooks

5. **Add Explicit Waits**
   - Use `await expect().toBeVisible()` instead of fixed delays

6. **Test Edge Cases**
   - Invalid inputs, unauthorized access, error states

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Vercel Integration

Add to `vercel.json`:

```json
{
  "buildCommand": "npm run build && npm run test:e2e",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./e2e"
}
```

## Troubleshooting

### Tests Timeout on Startup

**Cause:** Next.js dev server not starting in time.

**Solution:** Increase `webServer.timeout` in `playwright.config.ts`:

```typescript
webServer: {
  timeout: 180000, // 3 minutes
}
```

### Tests Fail with "Element Not Found"

**Cause:** Race condition between action and element visibility.

**Solution:** Add explicit waits:

```typescript
await expect(page.getByText('Expected')).toBeVisible({ timeout: 10000 });
```

### Database State Conflicts

**Cause:** Tests running in parallel creating conflicting data.

**Solution:** Use unique identifiers or disable parallel execution:

```typescript
// In playwright.config.ts
fullyParallel: false,
```

### Authentication Issues

**Cause:** Session cookies not persisting across page navigations.

**Solution:** Ensure middleware is correctly setting session cookies. Check Supabase SSR setup.

## Test Coverage Metrics

**Current Coverage (Epic 1):**

- [ ] Story 1.1: User Authentication (✅ Covered in `critical-path.spec.ts`)
- [ ] Story 1.2: Server Creation (✅ Covered in `critical-path.spec.ts`)
- [ ] Story 1.3: Channel Creation (✅ Covered in `critical-path.spec.ts`)
- [ ] Story 1.4: Invite System (⚠️ Partial coverage - invite link generation tested, redemption not yet tested)
- [ ] Story 1.5: Send Messages (✅ Covered in `critical-path.spec.ts`)
- [ ] Story 1.6: Message History (✅ Covered in `critical-path.spec.ts`)

**RLS Policy Coverage:**

- [x] Server access control
- [x] Message authorization
- [x] Server deletion authorization
- [x] Unauthenticated user restrictions

**Future Test Coverage (Epic 2+):**

- [ ] AI @mention activation
- [ ] AI response streaming
- [ ] Vector search functionality
- [ ] Mermaid diagram rendering
- [ ] Code syntax highlighting

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
