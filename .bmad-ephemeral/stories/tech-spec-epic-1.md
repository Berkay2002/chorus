# Epic Technical Specification: Foundation Infrastructure

Date: 2025-11-13
Author: Berkay
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the core infrastructure for Chorus, a Discord-like real-time chat platform. This epic delivers the foundational authentication, server/channel management, and real-time messaging capabilities required for users to create communities and communicate. The implementation provides a familiar Discord-style UX while leveraging Next.js 16, Supabase for backend services, and Zustand for efficient state management. This epic enables Stories 1-6 (user authentication, server creation, channel management, invitations, messaging, and message history).

## Objectives and Scope

**In Scope:**
- Complete authentication flow (email/password + Google OAuth)
- Server CRUD operations with ownership model
- Channel CRUD operations within servers
- Invite code generation and redemption system
- Real-time message sending and receiving via Supabase Broadcast
- Message history with pagination and infinite scroll
- Row-Level Security (RLS) policies for all database operations
- Discord-inspired UI components (server sidebar, channel list, message list)
- Responsive layout supporting desktop and mobile
- Automatic profile creation on user signup

**Out of Scope:**
- AI integration (Epic 2)
- Vector embeddings and semantic search (Epic 3)
- Advanced UI features like Mermaid diagrams or code highlighting (Epic 4)
- Voice/video capabilities
- Thread support
- User presence indicators beyond basic online/offline
- Server discovery or public server listings
- Rich text editing (plain text only for MVP)

## System Architecture Alignment

**Technology Stack:**
- **Frontend**: Next.js 16.0.2 App Router, React 19.2.0, TypeScript
- **Styling**: Tailwind CSS 4.x with Radix UI primitives
- **Backend**: Supabase (PostgreSQL, Auth, Realtime Broadcast)
- **State Management**: Zustand 5.0.8 with persistence middleware
- **Utilities**: date-fns for timestamps, clsx + tailwind-merge for styling

**Architecture Constraints:**
- All routes under `/servers/*` require authentication (middleware enforcement)
- Database access controlled via Supabase RLS policies (no manual permission checks)
- Server Components for initial data fetching (SSR), Client Components for real-time features
- Realtime Broadcast channels follow naming convention: `broadcast:channel:{channelId}`
- HTTP-only cookies for session tokens (XSS prevention)

**Component Structure:**
- `app/(auth)/` - Authentication pages (login, signup)
- `app/(main)/servers/[serverId]/channels/[channelId]/` - Main chat interface
- `components/auth/` - Auth forms
- `components/chat/` - Message components
- `components/server/` - Server/channel navigation
- `lib/supabase/` - Supabase client factories
- `lib/realtime/` - Broadcast helpers and React hooks
- `store/` - Zustand stores for messages, UI state, user session

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|----------------|--------|---------|-------|
| **Authentication Service** | User signup, login, session management | Email/password or OAuth token | User session (JWT in cookie) | Supabase Auth |
| **Server Management** | CRUD operations for servers | Server name, owner_id | Server record with invite code | Next.js API routes + Supabase |
| **Channel Management** | CRUD operations for channels | Channel name, server_id | Channel record | Next.js API routes + Supabase |
| **Message Service** | Create, read messages | Message content, channel_id, user_id | Message record | Next.js API routes + Supabase |
| **Realtime Broadcast** | WebSocket message delivery | Message payload, channel_id | Broadcast event to subscribers | Supabase Realtime |
| **Invite System** | Generate and validate invite codes | Server_id | Invite code (7-char alphanumeric) | Next.js API routes |
| **UI State Store** | Manage sidebar, modals, active selections | User actions | UI state (persisted to localStorage) | Zustand store |
| **Message Store** | Cache messages per channel | Channel_id | Messages array indexed by channel | Zustand store |
| **Middleware** | Session validation and refresh | Request cookies | Refreshed session or redirect | Next.js middleware |

### Data Models and Contracts

**Database Schema (PostgreSQL):**

```sql
-- profiles table (auto-created from auth.users trigger)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- servers table
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  icon_url TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT generate_invite_code(), -- 7-char alphanumeric
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- server_members junction table
CREATE TABLE server_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- messages table (embedding column for Epic 3, nullable for now)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 4000),
  is_ai BOOLEAN DEFAULT FALSE,
  embedding VECTOR(768), -- For Epic 3, nullable in Epic 1
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX messages_channel_id_idx ON messages(channel_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX channels_server_id_idx ON channels(server_id);
CREATE INDEX server_members_user_id_idx ON server_members(user_id);
```

**TypeScript Types (generated via Supabase CLI):**

```typescript
// types/database.ts (auto-generated)
export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Server = {
  id: string
  name: string
  description: string | null
  owner_id: string
  icon_url: string | null
  invite_code: string
  created_at: string
  updated_at: string
}

export type Channel = {
  id: string
  server_id: string
  name: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  channel_id: string
  user_id: string | null
  content: string
  is_ai: boolean
  embedding: number[] | null
  created_at: string
  updated_at: string
}

export type ServerMember = {
  id: string
  server_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}
```

**Zustand Store Types:**

```typescript
// store/use-chat-store.ts
interface ChatStore {
  messages: Record<string, Message[]> // Keyed by channelId
  addMessage: (channelId: string, message: Message) => void
  setMessages: (channelId: string, messages: Message[]) => void
  clearMessages: (channelId: string) => void
}

// store/use-ui-store.ts
interface UIStore {
  sidebarOpen: boolean
  memberListOpen: boolean
  activeServerId: string | null
  activeChannelId: string | null
  setSidebarOpen: (open: boolean) => void
  setActiveServer: (serverId: string | null) => void
  setActiveChannel: (channelId: string | null) => void
}

// store/use-user-store.ts
interface UserStore {
  user: User | null
  profile: Profile | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  clearSession: () => void
}
```

### APIs and Interfaces

**Authentication Endpoints:**

```
POST /api/auth/signup
Request: { email: string, password: string, username: string }
Response: { data: { user: User, session: Session }, error: null }
Notes: Creates auth.users entry, triggers profile creation, sets session cookie

POST /api/auth/signin
Request: { email: string, password: string }
Response: { data: { user: User, session: Session }, error: null }

GET /api/auth/callback (OAuth callback)
Query: { code: string }
Response: Redirect to /servers or /login with error

POST /api/auth/signout
Response: { data: null, error: null }
Notes: Clears session cookie
```

**Server Endpoints:**

```
POST /api/servers
Request: { name: string, description?: string }
Response: { data: Server, error: null }
Notes: Auto-generates invite_code, creates server_members entry with role='owner'

GET /api/servers
Response: { data: Server[], error: null }
Notes: Returns only servers where user is a member (via RLS)

GET /api/servers/[id]
Response: { data: Server, error: null }

PUT /api/servers/[id]
Request: { name?: string, description?: string, icon_url?: string }
Response: { data: Server, error: null }
Notes: Only owner can update

DELETE /api/servers/[id]
Response: { data: null, error: null }
Notes: Only owner can delete, cascades to channels/messages

POST /api/servers/join/[inviteCode]
Response: { data: { server: Server, member: ServerMember }, error: null }
Notes: Creates server_members entry if code valid and not already a member
```

**Channel Endpoints:**

```
POST /api/servers/[serverId]/channels
Request: { name: string, description?: string }
Response: { data: Channel, error: null }
Notes: Only server members can create channels

GET /api/servers/[serverId]/channels
Response: { data: Channel[], error: null }
Notes: Ordered by position ASC

PUT /api/channels/[id]
Request: { name?: string, description?: string, position?: number }
Response: { data: Channel, error: null }

DELETE /api/channels/[id]
Response: { data: null, error: null }
Notes: Only server owner can delete
```

**Message Endpoints:**

```
POST /api/channels/[channelId]/messages
Request: { content: string }
Response: { data: Message, error: null }
Notes: Validates user is server member, broadcasts message via Realtime

GET /api/channels/[channelId]/messages
Query: { limit?: number, before?: string (messageId) }
Response: { data: Message[], error: null }
Notes: Pagination via cursor (before), defaults to 50 most recent
```

**Realtime Broadcast Events:**

```
Channel: broadcast:channel:{channelId}

Event: message
Payload: {
  messageId: string
  content: string
  userId: string
  username: string
  createdAt: string
}
```

### Workflows and Sequencing

**User Signup Flow:**

1. User fills signup form (email, password, username)
2. Client calls `POST /api/auth/signup`
3. Supabase Auth creates `auth.users` entry
4. Database trigger creates `profiles` entry with username
5. Server sets session cookie (HTTP-only)
6. Client redirects to `/servers`
7. Client fetches user's servers via `GET /api/servers`

**Create Server and First Channel:**

1. User clicks "Create Server" button
2. Modal opens with server name input
3. Client calls `POST /api/servers` with name
4. Server creates `servers` record with generated invite_code
5. Database trigger creates `server_members` entry (owner)
6. Client calls `POST /api/servers/{serverId}/channels` with name="#general"
7. Server creates `channels` record
8. Client navigates to `/servers/{serverId}/channels/{channelId}`

**Send Message Flow:**

1. User types message in MessageInput component
2. User presses Enter
3. Client optimistically adds message to Zustand store (pending state)
4. Client calls `POST /api/channels/{channelId}/messages`
5. Server validates user membership (RLS check)
6. Server inserts message into database
7. Server broadcasts message via Supabase Realtime channel
8. All subscribed clients receive broadcast event
9. Clients update Zustand store with confirmed message
10. Optimistic message replaced with confirmed message (same ID)

**Invite User Flow:**

1. Server owner copies invite link (`/invite/{inviteCode}`)
2. Invitee clicks link (unauthenticated)
3. Redirected to `/signup?invite={inviteCode}`
4. After signup/login, client calls `POST /api/servers/join/{inviteCode}`
5. Server validates code exists and not expired
6. Server creates `server_members` entry
7. Client redirects to `/servers/{serverId}`

**Message History Pagination:**

1. User opens channel, loads initial 50 messages
2. User scrolls to top of message list
3. Intersection Observer triggers "load more"
4. Client calls `GET /api/channels/{channelId}/messages?before={oldestMessageId}`
5. Server returns next 50 messages before cursor
6. Client prepends messages to Zustand store
7. Scroll position maintained via React ref

## Non-Functional Requirements

### Performance

**Targets (p95):**
- Page load time (SSR): < 2s (on 3G network)
- Message send latency (POST → Broadcast): < 300ms
- Message receive latency (Broadcast → UI update): < 100ms
- Initial message history load: < 500ms (50 messages)
- Pagination load: < 300ms (50 messages)
- Realtime connection establishment: < 2s

**Optimizations:**
- Server Components for initial SSR (reduces client bundle)
- Zustand selective re-rendering (only affected components update)
- Database indexes on `channel_id`, `created_at`
- Realtime Broadcast (no database polling overhead)
- Optimistic UI updates (instant feedback before server confirmation)

**Load Targets:**
- Support 100 concurrent users per server
- Handle 1000 messages/hour per channel
- Maintain < 500ms latency with 50 active channels

### Security

**Authentication:**
- Passwords hashed via bcrypt (Supabase default)
- Session tokens in HTTP-only cookies (XSS prevention)
- CSRF protection via SameSite=Lax cookie attribute
- Session expiration: 7 days, auto-refresh via middleware

**Authorization:**
- Row-Level Security (RLS) on all tables
- Users can only access servers they're members of
- Only server owners can delete servers/channels
- Only members can post messages in channels

**RLS Policy Examples:**

```sql
-- servers: Users can only see servers they're members of
CREATE POLICY "Users see member servers" ON servers
  FOR SELECT USING (
    id IN (
      SELECT server_id FROM server_members
      WHERE user_id = auth.uid()
    )
  );

-- messages: Users can read messages in channels of servers they're members of
CREATE POLICY "Users read member channel messages" ON messages
  FOR SELECT USING (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE sm.user_id = auth.uid()
    )
  );

-- messages: Users can insert messages in channels they're members of
CREATE POLICY "Users post in member channels" ON messages
  FOR INSERT WITH CHECK (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE sm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );
```

**Input Validation:**
- Max message length: 4000 characters (database constraint)
- Max server/channel name: 100 characters
- Username: 3-30 characters, alphanumeric + underscore
- Server invite codes: 7-character alphanumeric (auto-generated)

**API Security:**
- All API routes validate session via `createClient(cookies())`
- Rate limiting (future): 100 requests/min per user
- CORS: Same-origin only (Next.js default)

### Reliability/Availability

**Targets:**
- 99.9% uptime during beta (8.76 hours downtime/year acceptable)
- Zero data loss for messages (database constraints + replication)
- Graceful degradation if Realtime unavailable (polling fallback not implemented in MVP)

**Error Handling:**
- Database errors: Log server-side, return generic error to client
- Network errors: Client retries with exponential backoff (3 attempts max)
- Realtime disconnection: Auto-reconnect via Supabase client
- Auth session expiration: Middleware auto-refreshes or redirects to login

**Data Integrity:**
- Foreign key constraints prevent orphaned records
- ON DELETE CASCADE for server deletion (removes channels, messages, members)
- Unique constraints on username, invite_code, (server_id, user_id) pairs

### Observability

**Logging:**
- Server-side: `console.error` with structured context (userId, endpoint, error)
- Client-side: Error boundaries catch React errors, display fallback UI
- Supabase logs: Query performance, RLS policy failures (via dashboard)

**Metrics (via Vercel Analytics):**
- Page load times
- API endpoint latencies
- Error rates per endpoint
- Real-time connection success rate

**Required Signals:**
- User signup/login events
- Server/channel creation events
- Message send/receive events
- Realtime connection/disconnection events
- API errors with status codes

**Future Enhancements:**
- Sentry for error tracking
- LogRocket for session replay
- Custom dashboards for message volume, active users

## Dependencies and Integrations

**Runtime Dependencies (from package.json):**

| Package | Version | Purpose | Critical Path |
|---------|---------|---------|---------------|
| `next` | 16.0.2 | Framework | Yes |
| `react` | 19.2.0 | UI library | Yes |
| `react-dom` | 19.2.0 | React renderer | Yes |
| `@supabase/supabase-js` | ^2.81.1 | Supabase client | Yes |
| `@supabase/ssr` | ^0.7.0 | SSR helpers | Yes |
| `zustand` | ^5.0.8 | State management | Yes |
| `date-fns` | ^4.1.0 | Date formatting | Yes |
| `clsx` | ^2.1.1 | Class utilities | No |
| `tailwind-merge` | ^3.4.0 | Tailwind merging | No |
| `lucide-react` | ^0.553.0 | Icons | No |
| `@radix-ui/*` | Various | UI primitives | No |
| `zod` | ^4.1.12 | Form validation | No |
| `react-hook-form` | ^7.66.0 | Form management | No |

**Development Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `supabase` | ^2.58.5 | CLI for migrations, type generation |
| `typescript` | ^5 | Type checking |
| `tailwindcss` | ^4 | CSS framework |
| `eslint` | ^9 | Linting |

**External Services:**

- **Supabase Cloud**: PostgreSQL database, Auth, Realtime Broadcast, Storage
- **Vercel**: Next.js hosting, edge functions, analytics
- **Google OAuth**: Third-party authentication (optional)

**Integration Points:**

- Supabase Auth → Next.js middleware (session validation)
- Supabase Realtime → React components (WebSocket subscriptions)
- Supabase Database → Next.js API routes (data CRUD)
- Zustand stores → React components (state subscriptions)

## Acceptance Criteria (Authoritative)

### Story 1.1: Create Account

1. User can sign up with email + password
   - Form validates email format (RFC 5322)
   - Password requires 8+ characters
   - Username is unique (database constraint enforced)
   - User profile created automatically via trigger

2. User can sign in with Google OAuth
   - Google OAuth button redirects to consent screen
   - Callback creates session and redirects to /servers
   - Profile created if first login

3. User redirected to home view after successful auth
   - Authenticated users accessing /login redirect to /servers
   - Session persists across browser restarts (7-day expiration)

### Story 1.2: Create Server

4. User can create named server
   - Server name required (1-100 characters)
   - Server owner is current user
   - Invite code auto-generated (7-char alphanumeric)

5. Server appears in user's server list
   - GET /api/servers returns user's servers
   - Server sidebar displays servers in creation order
   - Active server highlighted

### Story 1.3: Create Channels

6. Server owner can create named channels
   - Channel name required (1-100 characters)
   - Default position is 0 (top of list)
   - Channels belong to specific server

7. Channels display in sidebar
   - Ordered by position ASC
   - Active channel highlighted
   - Channel count badge shows total channels

8. User can switch between channels
   - Clicking channel loads message history
   - URL updates to /servers/{serverId}/channels/{channelId}
   - Zustand store tracks activeChannelId

### Story 1.4: Invite Others

9. Server owner can generate invite link
   - Invite code visible in server settings
   - Copy-to-clipboard button provided
   - Link format: {baseUrl}/invite/{inviteCode}

10. Invited user can join via link
    - Link redirects to signup/login if unauthenticated
    - After auth, POST /api/servers/join/{inviteCode}
    - User becomes 'member' role in server_members

11. New member appears in server member list
    - GET /api/servers/{serverId}/members returns all members
    - Member list component displays usernames + avatars

### Story 1.5: Send Messages

12. User can type message in input field
    - MessageInput component with textarea
    - Max length 4000 characters enforced client-side
    - Enter key sends message (Shift+Enter for newline)

13. Message appears in channel immediately
    - Optimistic update to Zustand store
    - Pending indicator shown
    - Replaced with confirmed message on success

14. All channel members see new messages in real-time
    - Realtime Broadcast sends message event
    - Subscribed clients update Zustand store
    - Auto-scroll to bottom on new message (if already at bottom)

15. Messages display author name + timestamp
    - Author name from profiles.username
    - Timestamp formatted via date-fns (relative if <24h, absolute otherwise)
    - Author avatar displayed

### Story 1.6: View Message History

16. Last 50 messages load when opening channel
    - GET /api/channels/{channelId}/messages?limit=50
    - Messages ordered by created_at DESC
    - Displayed in chronological order (oldest at top)

17. User can scroll to load older messages (pagination)
    - Intersection Observer at top of list
    - Triggers GET /api/channels/{channelId}/messages?before={oldestMessageId}
    - Loading indicator shown
    - Scroll position maintained

18. Message timestamps render in user's local timezone
    - Supabase returns UTC timestamps
    - date-fns converts to browser timezone
    - Format: "Nov 13, 2025 at 3:45 PM"

## Traceability Mapping

| AC # | Spec Section | Components/APIs | Test Idea |
|------|--------------|-----------------|-----------|
| 1 | Authentication, Data Models (profiles) | `app/(auth)/signup/page.tsx`, `POST /api/auth/signup`, profiles trigger | E2E: Fill signup form → verify profile created in DB |
| 2 | Authentication, OAuth | `GET /api/auth/callback`, Supabase Auth Google provider | E2E: Click Google button → verify OAuth redirect → verify session |
| 3 | Authentication, Middleware | `middleware.ts`, session validation | Unit: Mock session → verify redirect logic |
| 4-5 | Server Management, Data Models (servers) | `POST /api/servers`, `GET /api/servers`, `ServerSidebar.tsx` | E2E: Create server → verify in sidebar |
| 6-8 | Channel Management, Data Models (channels) | `POST /api/servers/{id}/channels`, `ChannelList.tsx` | E2E: Create channel → verify in sidebar → click → verify active |
| 9-11 | Invite System, Server Members | `POST /api/servers/join/{code}`, invite code generation function | E2E: Generate invite → use in new session → verify membership |
| 12-15 | Message Service, Realtime Broadcast, Data Models (messages) | `POST /api/channels/{id}/messages`, `MessageInput.tsx`, `MessageList.tsx`, Broadcast event handler | E2E: Send message → verify in sender's UI → verify in other user's UI |
| 16-18 | Message Service, Pagination | `GET /api/channels/{id}/messages`, cursor logic, Intersection Observer | E2E: Load channel → scroll to top → verify older messages load |

## Risks, Assumptions, Open Questions

### Risks

1. **Risk**: Realtime Broadcast connection failures on poor networks
   - **Impact**: Users miss messages, degraded experience
   - **Mitigation**: Implement auto-reconnect logic (Supabase client handles this), consider polling fallback in future
   - **Probability**: Medium (mobile networks unreliable)

2. **Risk**: RLS policies misconfigured, allowing unauthorized access
   - **Impact**: Critical security vulnerability
   - **Mitigation**: Comprehensive policy testing with different user contexts, automated tests for RLS
   - **Probability**: Low (well-defined patterns)

3. **Risk**: Zustand store grows too large with many messages, causing memory issues
   - **Impact**: Performance degradation, browser crashes
   - **Mitigation**: Implement store pruning (keep only last 100 messages per channel), load more on-demand
   - **Probability**: Low (beta users unlikely to hit limits)

4. **Risk**: Invite code collisions (7 characters = 62^7 = 3.5 trillion combinations, but still possible)
   - **Impact**: User can't join server with duplicate code
   - **Mitigation**: Database unique constraint prevents duplicates, retry logic in generation function
   - **Probability**: Very low

### Assumptions

1. **Assumption**: Users are familiar with Discord UX patterns (servers, channels, @mentions)
   - **Validation**: Beta user testing, measure time-to-first-message
   - **Fallback**: Add tooltips or onboarding tour if users struggle

2. **Assumption**: Supabase Realtime Broadcast scales to 100 concurrent users per server
   - **Validation**: Load testing before beta launch
   - **Fallback**: Consider dedicated WebSocket service if Broadcast doesn't scale

3. **Assumption**: 7-day session expiration is acceptable UX
   - **Validation**: Track re-login frequency in beta
   - **Fallback**: Extend to 30 days if users complain

4. **Assumption**: Plain text messages are sufficient for MVP (no rich text, embeds, reactions)
   - **Validation**: User feedback during beta
   - **Fallback**: Add markdown rendering in Epic 4 if requested

### Open Questions

1. **Question**: Should we allow users to edit/delete their own messages?
   - **Recommendation**: Yes, implement edit/delete (mark as edited/deleted, don't remove from DB)
   - **Decision Needed By**: Before Story 1.5 implementation
   - **Impact**: Affects message schema (needs edited_at, deleted_at columns)

2. **Question**: How should we handle invite code expiration?
   - **Options**: (a) No expiration, (b) 7-day expiration, (c) Configurable by server owner
   - **Recommendation**: Option (a) for MVP simplicity, add expiration in Phase 2
   - **Decision Needed By**: Before Story 1.4 implementation

3. **Question**: Should channel creation be restricted to server owners/admins only?
   - **Current Spec**: Any server member can create channels
   - **Recommendation**: Allow all members for MVP, add permission system later
   - **Decision Needed By**: Before Story 1.3 implementation

4. **Question**: What happens when server owner deletes their account?
   - **Options**: (a) Cascade delete server, (b) Transfer ownership to another admin
   - **Recommendation**: Option (a) for MVP, warn owner before deletion
   - **Decision Needed By**: Before Story 1.2 implementation

5. **Question**: Should we implement rate limiting on message sending?
   - **Recommendation**: Not for MVP (trusted beta users), add for public launch
   - **Future Implementation**: 10 messages/min per user

## Test Strategy Summary

### Unit Tests

**Target**: Utility functions, Zustand stores, validation logic

- `lib/utils/mentions.ts`: Test @mention parsing (various formats, edge cases)
- `lib/utils/date.ts`: Test timestamp formatting (relative vs absolute)
- `store/use-chat-store.ts`: Test message add/remove/clear actions
- `store/use-ui-store.ts`: Test sidebar/modal state transitions
- Validation schemas (Zod): Test form validation rules

**Framework**: Vitest (faster than Jest, better Next.js integration)

**Coverage Target**: 80% for utility functions

### Integration Tests

**Target**: API routes with mock database

- `POST /api/auth/signup`: Test profile creation trigger
- `POST /api/servers`: Test invite code generation, membership creation
- `POST /api/channels/{id}/messages`: Test RLS policy enforcement
- `GET /api/channels/{id}/messages`: Test pagination cursor logic

**Framework**: Vitest with mock Supabase client

**Coverage Target**: All API endpoints

### E2E Tests

**Target**: Critical user flows

**Priority 1 (Must Have):**
1. Signup → Create Server → Create Channel → Send Message → Receive Message
2. Login → Join Server via Invite → Send Message

**Priority 2 (Should Have):**
3. Message History Pagination (scroll to load more)
4. Channel Switching (verify message history per channel)
5. OAuth Login (Google)

**Framework**: Playwright

**Execution**: Run before each deploy to staging/production

### RLS Policy Tests

**Target**: Verify authorization rules

- User can only see servers they're members of
- User cannot post messages in channels of servers they're not members of
- User cannot delete servers they don't own
- Deleted users cascade delete their data

**Method**: Create test users with different permissions, attempt unauthorized actions, verify failures

### Performance Tests

**Target**: Load targets

- 100 concurrent users sending messages
- 1000 messages/hour per channel
- Verify < 500ms message latency under load

**Framework**: Artillery or k6

**Execution**: Before beta launch

---

## Implementation Status (as of November 13, 2025)

### ✅ Completed Components (~35% Overall)

#### Database Layer (100%)
- ✅ All tables created with proper schema (profiles, servers, server_members, channels, messages)
- ✅ All indexes implemented (messages_channel_id_idx, messages_created_at_idx, etc.)
- ✅ All triggers working (profile auto-creation, server owner auto-membership, updated_at)
- ✅ Vector similarity search function implemented
- ✅ All RLS policies configured and tested

#### Type System (100%)
- ✅ Auto-generated TypeScript types from Supabase schema
- ✅ Type aliases exported (Message, Channel, Profile, Server, ServerMember)

#### State Management (100%)
- ✅ `use-chat-store.ts` with full message CRUD operations
- ✅ `use-ui-store.ts` with sidebar/member list toggles and localStorage persistence
- ✅ `use-user-store.ts` with user/profile management
- ✅ All stores using devtools middleware

#### Utilities (100%)
- ✅ `lib/utils/date.ts` with relative/absolute timestamp formatting
- ✅ `lib/utils/mentions.ts` with @mention extraction, detection, stripping
- ✅ Supabase client factories (browser, server, middleware helper)

#### UI Components - Partially Complete (40%)
- ✅ Auth forms: LoginForm, SignupForm (basic functionality)
- ✅ Chat components: MessageList, MessageItem, MessageInput (structure only)
- ✅ Sidebar components: ServerList, ChannelList, MemberList (hardcoded data)
- ✅ TypingIndicator, MentionAutocomplete components

### ⚠️ In Progress / Incomplete

#### API Routes (0% - Critical Gap)
**Authentication:**
- ❌ `POST /api/auth/signup` - Not implemented
- ❌ `POST /api/auth/signin` - Not implemented  
- ❌ `GET /api/auth/callback` - Not implemented
- ❌ `POST /api/auth/signout` - Not implemented

**Server Management:**
- ❌ `POST /api/servers` - Not implemented
- ❌ `GET /api/servers` - Not implemented
- ❌ `GET /api/servers/[id]` - Not implemented
- ❌ `PUT /api/servers/[id]` - Not implemented
- ❌ `DELETE /api/servers/[id]` - Not implemented
- ❌ `POST /api/servers/join/[inviteCode]` - Not implemented

**Channel Management:**
- ❌ `POST /api/servers/[serverId]/channels` - Not implemented
- ❌ `GET /api/servers/[serverId]/channels` - Not implemented
- ❌ `PUT /api/channels/[id]` - Not implemented
- ❌ `DELETE /api/channels/[id]` - Not implemented

**Message Management:**
- ❌ `POST /api/channels/[channelId]/messages` - Not implemented
- ❌ `GET /api/channels/[channelId]/messages` - Not implemented (pagination logic needed)

#### Middleware (50%)
- ✅ Middleware helper exists in `lib/supabase/middleware.ts`
- ❌ Root `middleware.ts` file missing (auth enforcement not active)
- ❌ Session auto-refresh logic incomplete

#### Page Routes (0%)
- ❌ `/servers/[serverId]/channels/[channelId]` pages - Not created
- ❌ `/invite/[inviteCode]` page - Not created
- ❌ Server settings page - Not created

#### Realtime Features (20%)
- ✅ Broadcast hooks created (`useChannel`, `useTypingIndicator`)
- ✅ `use-messages` hook with Postgres Changes subscription (not Broadcast as spec requires)
- ❌ Need to switch from Postgres Changes to Broadcast channels
- ❌ Message broadcasting on send not implemented
- ❌ Typing indicators not wired up

#### UI Functionality (30%)
- ❌ MessageInput doesn't actually send messages (TODO in code)
- ❌ Sidebar components use hardcoded data, not fetching from API
- ❌ No server/channel creation modals
- ❌ No active server/channel highlighting
- ❌ No optimistic UI updates
- ❌ Shift+Enter for newline not implemented
- ❌ 4000 character limit not enforced
- ❌ No error toast notifications

#### OAuth Integration (0%)
- ❌ Google OAuth button not in UI
- ❌ OAuth provider not configured
- ❌ Callback route not implemented

#### Pagination (0%)
- ❌ Cursor-based pagination not implemented
- ❌ Intersection Observer not implemented
- ❌ Scroll position preservation not implemented

### 🚫 Not Started

#### Testing (0%)
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No RLS policy tests
- ❌ No performance tests

#### Invite System (0%)
- ❌ Invite link generation UI
- ❌ Invite redemption flow
- ❌ Invite code validation

### Critical Blockers for MVP

**Priority 1 (Must Complete):**
1. Implement all API routes (auth, servers, channels, messages)
2. Create root `middleware.ts` for authentication enforcement
3. Build `/servers/[serverId]/channels/[channelId]` pages
4. Wire MessageInput to actually send messages via API
5. Update sidebar components to fetch real data from APIs

**Priority 2 (Required for Stories 1-6):**
6. Switch realtime from Postgres Changes to Broadcast
7. Implement message pagination with cursor
8. Add invite system (UI + API)
9. Add OAuth integration
10. Implement error handling and toast notifications

**Priority 3 (Polish):**
11. Wire up typing indicators
12. Add server/channel creation modals
13. Implement optimistic UI updates
14. Add user avatar display throughout UI

### Schema Discrepancies

**Note:** Current database schema differs slightly from spec:
- ✅ Spec: `server_members.role` enum - Implemented correctly
- ⚠️ Spec: `servers.invite_code` auto-generation function - Uses `encode(gen_random_bytes(8), 'hex')` instead of custom 7-char alphanumeric function
- ⚠️ Spec: `channels.description` and `channels.position` - Missing in migration, has `agents_md` instead
- ⚠️ Spec: `profiles.display_name` - Missing in migration

**Recommendation:** Update migration to match spec exactly before implementing Stories 1-6.

---

**Document Status**: Implementation Validated - ~35% Complete
**Next Step**: Implement Priority 1 blockers (API routes, middleware, pages)
