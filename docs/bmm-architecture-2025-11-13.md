# Chorus - Architecture Document

**Project**: Chorus  
**Epic**: MVP - Core Chat Platform  
**Date**: 2025-11-13  
**Status**: Active Development  

## Technology Stack

### Core Framework
- **Next.js**: `16.0.2` (Latest stable as of 2025-11-13)
  - App Router with TypeScript
  - Turbopack bundler (default)
  - Tailwind CSS for styling

### Backend & Database
- **Supabase**: PostgreSQL with integrated services
  - `@supabase/supabase-js`: `^2.47.10` - Client library (Auth, Database, Realtime, Storage)
  - `@supabase/ssr`: `^0.5.2` - Server-side rendering helpers for Next.js
  - **pgvector**: Vector similarity search extension
  - **Realtime Broadcast**: Scalable real-time messaging (chosen over Postgres Changes)

### AI Integration
- **Gemini API**: `@google/generative-ai@^0.21.0`
  - Embedding Model: `text-embedding-004` (768 dimensions)
  - Distance Metric: Cosine distance (`<=>`) for vector search
- **Vercel AI SDK**: `ai@^4.0.17` - Streaming response handling

### State Management
- **Zustand**: `^5.0.2` - Global state management
  - Chosen over React Context for selective re-rendering performance
  - DevTools integration for debugging
  - Persistence middleware for UI preferences

### Rendering & UI
- **react-markdown**: `^9.0.1` + **remark-gfm**: `^4.0.0` - Message rendering with GitHub Flavored Markdown
- **Shiki**: `^1.22.2` - Syntax highlighting using VS Code's TextMate engine
- **Mermaid**: `^11.4.1` - Diagram rendering in messages
- **clsx**: `^2.1.1` + **tailwind-merge**: `^2.5.5` - Tailwind class merging utilities
- **date-fns**: `^4.1.0` - Date formatting and manipulation

### Development Tools
- **Supabase CLI**: `^1.232.0` (dev dependency) - Local development, migrations, type generation

## Project Structure

```
chorus/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (main)/                   # Main app routes (authenticated)
│   │   └── servers/
│   │       └── [serverId]/
│   │           ├── channels/
│   │           │   └── [channelId]/
│   │           │       └── page.tsx
│   │           └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth endpoints
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   ├── ai/                   # AI endpoints
│   │   │   ├── chat/
│   │   │   │   └── route.ts
│   │   │   └── memory/
│   │   │       └── route.ts
│   │   └── messages/             # Message endpoints
│   │       └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── auth/                     # Auth components
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── chat/                     # Chat components
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── Message.tsx
│   │   └── TypingIndicator.tsx
│   ├── server/                   # Server/channel components
│   │   ├── ServerSidebar.tsx
│   │   ├── ChannelList.tsx
│   │   └── MemberList.tsx
│   ├── ai/                       # AI-specific components
│   │   ├── AIMessage.tsx
│   │   └── MemoryIndicator.tsx
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Avatar.tsx
│       └── Modal.tsx
│
├── lib/                          # Core utilities and integrations
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server-side client
│   │   └── middleware.ts         # Auth middleware
│   ├── ai/                       # AI utilities
│   │   ├── gemini.ts             # Gemini API client
│   │   ├── embeddings.ts         # Embedding generation
│   │   └── chat.ts               # Chat completion logic
│   ├── realtime/                 # Realtime utilities
│   │   ├── broadcast.ts          # Broadcast helpers
│   │   └── hooks.ts              # React hooks (useChannel, useTypingIndicator)
│   └── utils/                    # General utilities
│       ├── cn.ts                 # Class name merging
│       ├── date.ts               # Date formatting
│       └── mentions.ts           # @mention parsing
│
├── store/                        # Zustand stores
│   ├── use-chat-store.ts         # Message state
│   ├── use-ui-store.ts           # UI state (sidebar, modals)
│   └── use-user-store.ts         # User/session state
│
├── types/                        # TypeScript types
│   ├── database.ts               # Supabase database types
│   └── index.ts                  # Global types
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   │   └── 20251113000000_initial_schema.sql
│   ├── seed.sql                  # Test data
│   └── config.toml               # Local dev config
│
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (gitignored)
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Database Architecture

### Schema Overview

The database follows a Discord-like structure with servers, channels, and messages. All tables use Row-Level Security (RLS) to ensure users can only access servers they're members of.

#### Tables

**profiles**
- Maps Supabase Auth users to application profiles
- Auto-created via trigger on `auth.users` insert
- Fields: `id` (uuid, PK), `username`, `display_name`, `avatar_url`, `created_at`, `updated_at`

**servers**
- Represents Discord-like servers (communities)
- Fields: `id` (uuid, PK), `name`, `description`, `owner_id` (FK to profiles), `icon_url`, `created_at`, `updated_at`

**server_members**
- Junction table for server membership
- Fields: `id` (uuid, PK), `server_id` (FK), `user_id` (FK), `role` (member/admin/owner), `joined_at`
- Unique constraint on `(server_id, user_id)`

**channels**
- Text channels within servers
- Fields: `id` (uuid, PK), `server_id` (FK), `name`, `description`, `position` (int for ordering), `created_at`, `updated_at`

**messages**
- Chat messages in channels
- Fields: `id` (uuid, PK), `channel_id` (FK), `user_id` (FK), `content` (text), `is_ai` (boolean), `embedding` (vector(768)), `created_at`, `updated_at`
- Vector index: `CREATE INDEX messages_embedding_idx USING hnsw (embedding vector_cosine_ops)`
- **HNSW Index**: Hierarchical Navigable Small World graph for fast approximate nearest neighbor search
- **Cosine Distance**: `<=>` operator for similarity (safe for non-normalized embeddings)

#### Functions

**match_messages(query_embedding vector(768), match_threshold float, match_count int, filter_channel_id uuid)**
- Semantic search function using cosine similarity
- Returns messages with similarity score > threshold
- Ordered by similarity (most relevant first)
- Limited to `match_count` results
- Optional channel filter

#### Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only read/write data for servers they're members of
- Server owners have additional admin permissions
- Profiles are publicly readable but only owner-writable

#### Triggers

- **Auto-create profile**: Creates profile row when new user signs up
- **Auto-add owner as member**: Adds server creator to `server_members` automatically
- **Updated_at triggers**: Automatically updates `updated_at` timestamp on row modification

### Vector Search Strategy

**Three-Tier Memory Architecture**:

1. **Short-term Memory** (Current conversation)
   - Last N messages in channel (stored in Zustand)
   - No database query needed
   - Used for immediate context in AI responses

2. **Mid-term Memory** (Semantic search)
   - pgvector with HNSW index
   - Query user's message embedding against past messages
   - Returns top K most semantically similar messages
   - Provides thematic context across time

3. **Long-term Memory** (Future: Knowledge graph)
   - Not implemented in MVP
   - Future enhancement: Extract entities/relationships from conversations
   - Store in graph structure for complex reasoning

**Embedding Generation**:
- Model: Gemini `text-embedding-004` (768 dimensions)
- Generated server-side on message creation
- Stored in `messages.embedding` column
- Async process (doesn't block message posting)

**Distance Metric Decision**:
- **Cosine Distance** (`<=>`) chosen over inner product
- Reasoning: Gemini embeddings are not normalized to unit length
- Cosine distance is magnitude-invariant (better for non-normalized vectors)
- Inner product would be faster but requires normalized embeddings

## Real-time Architecture

### Supabase Realtime Broadcast

**Why Broadcast over Postgres Changes?**
- **Scalability**: Postgres Changes uses database triggers; broadcast is a dedicated service
- **Flexibility**: Can send arbitrary payloads (typing indicators, presence) without database overhead
- **Performance**: No need to poll/subscribe to database changes for ephemeral events

**Channel Naming Convention**:
```
broadcast:channel:{channelId}
```

**Broadcast Events**:
- `message` - New chat message posted
- `typing` - User is typing indicator
- `presence` - User join/leave events (future)

**Implementation Pattern**:
```typescript
// Create channel
const channel = createBroadcastChannel(supabase, channelId)

// Send message
await channel.send({
  type: 'broadcast',
  event: 'message',
  payload: { messageId, content, userId }
})

// Listen for messages
channel.on('broadcast', { event: 'message' }, (payload) => {
  // Update local state
})
```

**React Hooks**:
- `useChannel(channelId)` - Manages channel lifecycle (subscribe/unsubscribe)
- `useTypingIndicator(channelId)` - Manages typing status broadcast

## State Management

### Zustand Architecture

**Why Zustand over React Context?**
- **Performance**: Selective re-rendering (components only re-render when their specific slice changes)
- **Simplicity**: No Provider wrapper needed, easier testing
- **DevTools**: Built-in Redux DevTools integration
- **Persistence**: Easy localStorage integration for UI preferences

### Store Structure

**use-chat-store.ts** (Message state)
```typescript
{
  messages: Record<string, Message[]>, // Indexed by channelId
  addMessage: (channelId, message) => void,
  setMessages: (channelId, messages) => void,
  clearMessages: (channelId) => void
}
```

**use-ui-store.ts** (UI state)
```typescript
{
  sidebarOpen: boolean,
  memberListOpen: boolean,
  activeServerId: string | null,
  activeChannelId: string | null,
  // ... actions
}
```
- **Persisted to localStorage** for user preference retention

**use-user-store.ts** (User/session state)
```typescript
{
  user: User | null,
  profile: Profile | null,
  setUser: (user) => void,
  setProfile: (profile) => void,
  clearSession: () => void
}
```

### Data Flow

1. **Server Component** fetches initial data (SSR)
2. **Client Component** hydrates Zustand store
3. **Realtime Broadcast** updates store on new events
4. **Optimistic Updates** for better UX (update store before server confirmation)

## Authentication & Authorization

### Supabase Auth

**Auth Flow**:
1. User signs up/logs in via Supabase Auth
2. Session stored in HTTP-only cookie (secure, prevents XSS)
3. Middleware refreshes session on each request
4. Server components access session via `createClient(cookies())`
5. Client components access session via `createClient()` (reads cookie)

**Protected Routes**:
- Middleware checks session for routes matching `/servers/*`
- Redirects to `/login` if unauthenticated
- Refreshes session token automatically

**RLS Integration**:
- Database queries automatically filtered by `auth.uid()`
- No manual permission checks needed in application code
- Security enforced at database level

## API Design Patterns

### Response Format

**Success Response**:
```typescript
{
  data: T,
  error: null
}
```

**Error Response**:
```typescript
{
  data: null,
  error: {
    message: string,
    code?: string,
    details?: any
  }
}
```

### Streaming AI Responses

**Using Vercel AI SDK**:
```typescript
// Route handler
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const result = await streamText({
    model: gemini('gemini-pro'),
    messages,
  })
  
  return result.toDataStreamResponse()
}

// Client component
import { useChat } from 'ai/react'

const { messages, input, handleSubmit } = useChat({
  api: '/api/ai/chat'
})
```

### Error Handling Strategy

**Levels**:
1. **Database Errors**: Caught by Supabase client, logged server-side
2. **API Errors**: Return structured error response
3. **Client Errors**: Display user-friendly toast notification
4. **Network Errors**: Retry with exponential backoff

**Logging**:
- Server-side: `console.error` with structured context
- Client-side: Error boundaries for React component errors
- Future: Sentry/LogRocket integration for production

## Implementation Patterns

### Naming Conventions

**Files**:
- Components: PascalCase (`MessageList.tsx`)
- Utilities: kebab-case (`cn.ts`, `date-utils.ts`)
- Stores: kebab-case with prefix (`use-chat-store.ts`)
- API routes: kebab-case (`route.ts` in nested folders)

**Functions**:
- React components: PascalCase (`MessageList`)
- Hooks: camelCase with `use` prefix (`useChannel`)
- Utilities: camelCase (`formatMessageTime`)
- Database functions: snake_case (`match_messages`)

**Variables**:
- Constants: SCREAMING_SNAKE_CASE (`MAX_MESSAGE_LENGTH`)
- State variables: camelCase (`isLoading`)
- Props: camelCase (`userId`, `channelId`)

### Component Patterns

**Server Components** (default in Next.js App Router):
```typescript
// app/servers/[serverId]/channels/[channelId]/page.tsx
export default async function ChannelPage({
  params
}: {
  params: { serverId: string; channelId: string }
}) {
  const supabase = createClient(cookies())
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', params.channelId)
  
  return <MessageList initialMessages={messages} />
}
```

**Client Components** (use 'use client' directive):
```typescript
// components/chat/MessageInput.tsx
'use client'

export function MessageInput({ channelId }: { channelId: string }) {
  const [content, setContent] = useState('')
  const addMessage = useChatStore(s => s.addMessage)
  
  // ... implementation
}
```

### Date Handling

**Formatting**:
- Recent messages (<24h): Relative time ("2 minutes ago")
- Older messages: Absolute time ("Nov 13, 2025 at 3:45 PM")
- Use `formatMessageTime()` utility for consistency

**Storage**:
- Database: `timestamptz` (PostgreSQL timestamp with timezone)
- TypeScript: `string` (ISO 8601 format from Supabase)
- Display: Convert to user's local timezone using `date-fns`

### @Mention Handling

**Parsing**:
```typescript
const mentions = extractMentions(message.content)
// Returns: [{ type: 'user', id: '123', username: 'alice' }, ...]

const hasAI = mentionsAI(message.content)
// Returns: true if @chorus or @ai detected
```

**AI Detection**:
- Triggers AI response if `mentionsAI()` returns true
- Case-insensitive matching (`@Chorus`, `@CHORUS`, `@ai`)
- Future: Support custom AI names per server

## Novel Architectural Decisions

### 1. Realtime Broadcast over Postgres Changes

**Rationale**: Traditional chat apps use database triggers (Postgres Changes) to broadcast new messages. Chorus uses Supabase Realtime Broadcast instead, which is a dedicated WebSocket service.

**Benefits**:
- No database overhead for ephemeral events (typing indicators)
- Better scalability (broadcast service scales independently)
- Lower latency (no database round-trip)

**Trade-offs**:
- Need to manage message persistence separately (broadcast doesn't auto-persist)
- Requires manual sync between broadcast and database state

### 2. Three-Tier Memory Architecture

**Rationale**: AI chat assistants struggle with context length limits. Traditional approaches use sliding windows or summarization. Chorus uses a three-tier system.

**Benefits**:
- Short-term: Instant access to recent context (no latency)
- Mid-term: Semantic search finds relevant past messages (thematic context)
- Long-term: Future knowledge graph enables complex reasoning

**Trade-offs**:
- Embedding generation adds latency (mitigated by async processing)
- Vector search has cost (HNSW index reduces this)
- More complex than simple context window

### 3. Zustand for State Management

**Rationale**: React Context is the default for Next.js apps, but causes unnecessary re-renders in complex apps.

**Benefits**:
- Selective re-rendering (components subscribe to specific slices)
- No Provider wrapper needed (cleaner code)
- Built-in DevTools (easier debugging)

**Trade-offs**:
- Additional dependency (small bundle size impact)
- Less familiar to React beginners

## Security Considerations

### Row-Level Security (RLS)

All database access is filtered by RLS policies. Key rules:
- Users can only see servers they're members of
- Users can only post messages in channels of their servers
- Server owners can modify server settings
- Profiles are public (read-only for non-owners)

### Authentication

- Session tokens stored in HTTP-only cookies (prevents XSS)
- Middleware refreshes tokens automatically (prevents expiration issues)
- No client-side token storage (more secure)

### Input Validation

- Client-side: Basic validation (length, format)
- Server-side: Strict validation before database write
- Database: Constraints (NOT NULL, FOREIGN KEY, CHECK)

### API Security

- All API routes check authentication via `createClient(cookies())`
- Rate limiting (future): Implement per-user/IP rate limits
- CORS: Configured in `next.config.ts` (allow same-origin only)

## Performance Optimization

### Database

- **Indexes**: HNSW index on `messages.embedding` for fast vector search
- **Partial Indexes**: Index on `messages.channel_id` for message queries
- **Foreign Keys**: Indexed automatically by Postgres

### Caching

- **Server Components**: Cache initial data fetches
- **Zustand**: In-memory cache for messages (no re-fetch on navigation)
- **React Query** (future): Add for automatic cache invalidation

### Rendering

- **Server Components**: Render static content on server (reduces client bundle)
- **Client Components**: Only for interactive elements (inputs, real-time updates)
- **Code Splitting**: Automatic via Next.js App Router

### Real-time

- **Single Broadcast Channel**: One WebSocket per chat channel (not per message)
- **Debounced Typing**: Only send typing indicator every 3s max
- **Unsubscribe**: Clean up channels when user navigates away

## Testing Strategy (Future)

### Unit Tests
- **Utilities**: Test `cn()`, `formatMessageTime()`, `extractMentions()`
- **Stores**: Test Zustand actions (add/remove messages)
- **Framework**: Vitest (faster than Jest)

### Integration Tests
- **API Routes**: Test endpoints with mock Supabase client
- **Database**: Test RLS policies with different user contexts
- **Framework**: Playwright for API testing

### E2E Tests
- **Critical Flows**: Login → Join server → Send message → AI responds
- **Framework**: Playwright

## Deployment

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

### Vercel Deployment

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Supabase Setup

1. Create project on supabase.com
2. Run migrations: `supabase db push`
3. Enable pgvector extension
4. Configure Auth providers (email, OAuth)

## Monitoring & Observability (Future)

- **Error Tracking**: Sentry for client/server errors
- **Logging**: Structured logs with request IDs
- **Metrics**: Vercel Analytics for page views, API latency
- **Database**: Supabase Dashboard for query performance

## Future Enhancements

### Knowledge Graph (Long-term Memory)
- Extract entities (people, topics, dates) from conversations
- Store relationships in graph structure
- Enable complex queries ("What did we discuss about X last month?")

### Voice Messages
- Record audio in browser
- Transcribe with Gemini API
- Store audio in Supabase Storage

### Thread Support
- Reply to specific messages (like Discord threads)
- Nested message structure in database
- Separate broadcast channels per thread

### AI Personas
- Multiple AI characters per server
- Each with custom system prompts
- Different knowledge bases per persona

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Author**: Chorus Development Team  
**Epic**: MVP - Core Chat Platform
