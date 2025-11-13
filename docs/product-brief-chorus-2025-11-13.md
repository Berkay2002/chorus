# Product Brief: Chorus

**Date:** 2025-11-13
**Author:** Berkay
**Context:** Passion Project (AI Architecture + DevOps + Fullstack)

---

## Executive Summary

**Chorus** is a real-time collaborative chat platform where AI participates as a social peer, not a productivity assistant. Think "Discord, but the AI is actually one of your friends who has perfect memory and can research anything instantly while you chat."

The platform amplifies collective human intelligence by solving the fundamental problem that friend groups create emergent insights no individual would reach alone, but human memory is lossy—so that collective intelligence evaporates. Chorus gives groups an AI companion with perfect memory, pattern recognition, and parallel research capabilities, creating a flywheel where every conversation makes the system smarter.

**Core Innovation:** Three-tier memory architecture (short-term + vector embeddings + knowledge graph) enables the AI to act as collective memory, neutral mediator, and parallel researcher—transforming casual social chat into a living knowledge base.

**Philosophy:** Fun-first. This is Discord-like social experience, not a work productivity tool. Every technical decision serves one purpose: amplify human collective intelligence while keeping it genuinely fun.

---

## Core Vision

### Problem Statement

Friend groups and communities chat constantly across platforms like Discord, Slack, and group messaging apps. These conversations generate valuable collective intelligence—emergent insights, connections between ideas, shared context, and collaborative thinking that no individual would reach alone.

**But this intelligence evaporates.** Human memory is lossy. Key insights get buried in chat history. Patterns across conversations go unnoticed. Someone asks a question that was answered three weeks ago. The group discusses an idea they explored months earlier but forgot about. Context is constantly rebuilt from scratch.

Current solutions either:
- Treat AI as a **productivity tool** (Notion AI, ChatGPT plugins) - disrupting the social, fun nature of group chat
- Provide **isolated AI instances** without memory of group conversations
- Lack **contextual awareness** of relationships, topics, and conversation threads over time
- Require **explicit query mode** rather than natural participation

The moment of frustration: **"I know we talked about this before... but I can't remember what we decided"** or **"Wait, how does this relate to that other thing we discussed?"**

### Proposed Solution

**Chorus is a real-time chat platform with integrated AI that feels like a friend with perfect memory.**

The AI participates in group conversations when @mentioned, maintains context across all discussions through a three-tier memory architecture, and can work on background research quests while humans continue chatting.

**Key Differentiators:**

1. **AI as Social Participant, Not Assistant**
   - @mention activation creates natural "friend" interaction model
   - AGENTS.md per-channel personality engineering (fun, casual, domain-specific)
   - Natural language understanding, no slash commands
   - AI earns its place in the conversation through value, not forced integration

2. **Three-Tier Memory Architecture** (The Core Innovation)
   - **Short-term:** Last 15 messages + Gemini prompt caching for conversation flow
   - **Vector embeddings:** Semantic search across all conversation history (Supabase pgvector)
   - **Knowledge graph:** Structural relationships between people, topics, decisions, projects (Neo4j)
   - Smart context selection: last 10 messages + vector top 5 + AI's own responses

3. **Parallel Intelligence Model**
   - Humans discuss while AI researches asynchronously (background research quests)
   - AI subagents as specialized tools (@ResearchBot, @DevilsAdvocate, @Organizer, @Hype)
   - New collaboration primitive: synchronous chat + asynchronous AI work

4. **Progressive Context Building (Flywheel Effect)**
   - Every conversation automatically builds embeddings
   - Entity extraction populates knowledge graph (people, decisions, topics, projects)
   - System gets smarter over time without manual effort
   - Value compounds with use

5. **Zero-Config Simplicity**
   - Discord-style familiar UI (channels, servers)
   - Just start chatting, AI figures out the rest
   - AGENTS.md file-based configuration (simple, version-controllable)
   - No complex setup or onboarding friction

**What This Means in Practice:**

A dev community discussing architecture can @mention the AI to explore trade-offs while the group continues debating. The AI remembers every technical decision, can pull up "what did we say about X three months ago?", and connects dots between today's discussion and previous conversations. It feels less like querying a database and more like having a friend who genuinely never forgets anything.

---

## Target Users

### Primary Users: Tech-Savvy Friend Groups & Communities

**Who they are:**
- Developer communities discussing tech stacks, architecture, side projects
- Friend groups planning trips, discussing ideas, sharing interests
- Hobbyist communities (D&D groups, gaming clans, creative collaborators)
- Small teams working on passion projects or open source

**Current behavior:**
- Already use Discord, Slack, or group chats extensively
- Comfortable with @mention conventions and channel organization
- Generate lots of valuable discussion but lose context over time
- Appreciate fun, casual social interaction over formal productivity tools

**What they value most:**
- **Natural interaction** - AI that feels like a participant, not a chatbot
- **Memory that works** - Never losing track of good ideas or decisions
- **Fun factor** - This enhances their social experience, doesn't formalize it
- **Technical curiosity** - Appreciation for clever architecture and AI capabilities

**Technical comfort level:** High - these users understand what embeddings and knowledge graphs do, appreciate the architecture, and will tolerate early-stage rough edges for innovative features

### User Journey

1. **Discovery:** Friend in the group sets up Chorus, invites others (familiar Discord-like invite flow)

2. **First Session:** 
   - Users see Discord-familiar interface, immediately comfortable
   - Someone @mentions the AI in conversation
   - AI responds naturally, contextually - "Oh, this is actually useful"
   - Zero learning curve, zero configuration

3. **Early Value (First Week):**
   - AI starts remembering conversation threads
   - Users discover they can ask "what did we say about X?" and get real answers
   - Background research quest creates "wow" moment - AI pings group with research results while they were chatting about something else

4. **Flywheel Engagement (First Month):**
   - Knowledge graph builds automatically from conversations
   - AI gets noticeably better at connecting ideas across discussions
   - Users start trusting AI as genuine conversation participant
   - Group becomes dependent on collective memory feature

5. **Deep Integration (Ongoing):**
   - AI becomes "part of the crew"
   - AGENTS.md customization per channel (different personalities for different topics)
   - Group organically uses AI for research, devil's advocate, hype, organization
   - Conversations become living knowledge base

---

## MVP Scope

### Core Features (Must-Have for Launch)

**Foundation:**
1. **Discord-Style UI** - Familiar channels/servers interface, real-time updates
2. **Basic Chat Infrastructure** - Next.js + Supabase real-time subscriptions
3. **User Authentication** - Simple auth flow, user profiles

**AI Integration:**
4. **@Mention AI Activation** - AI only responds when explicitly called
5. **Gemini API Integration** - Via Vercel AI SDK for AI responses
6. **Short-Term Memory (15 messages)** - Basic conversation flow with prompt caching
7. **AGENTS.md Per Channel** - File-based personality configuration
8. **Natural Language Understanding** - Conversational interaction, no slash commands

**Smart Context:**
9. **Hybrid Context Selection** - Last 10 messages + vector top 5 relevant + AI's own responses
10. **Supabase pgvector Integration** - Semantic search across conversation history
11. **Auto-Embedding Pipeline** - Every message automatically embedded

**Enhanced Experience:**
12. **Mermaid Diagram Rendering** - Built-in visualization for architecture discussions
13. **Code Syntax Highlighting** - Proper rendering for technical discussions
14. **Basic Exports** - Export conversations to markdown

### Phase 2 Features (Post-MVP)

**Advanced Memory:**
- Neo4j knowledge graph in Docker on Digital Ocean
- Entity extraction system (people, decisions, topics, projects)
- Time travel search (semantic + structural)

**AI Capabilities:**
- AI subagents (@ResearchBot, @DevilsAdvocate, @Organizer, @Hype)
- Background research quests (async task queue + notifications)
- Living summaries and auto-organization

**Enhanced UX:**
- Smart exports (PDF, formatted docs)
- Voice-first mode (speech-to-text, TTS responses)
- Mobile apps (currently web-only)

### Out of Scope for MVP

- ❌ Work-focused features (PRDs, meeting notes, task management)
- ❌ Enterprise features (SSO, compliance, audit logs)
- ❌ Attention token gamification (future monetization exploration)
- ❌ Custom agent builder GUI (moonshot feature)
- ❌ Graph-based UI visualization (experimental, unclear value)
- ❌ AI initiative mode (proactive conversation starting)
- ❌ Multi-model support (locked to Gemini for MVP)

### MVP Success Criteria

**Technical Success:**
- AI response latency < 3 seconds (p95)
- Prompt caching working (cost < $0.01 per AI interaction)
- Vector search returns relevant results 80%+ of queries
- Real-time chat feels smooth (< 200ms message delivery)

**User Success:**
- Users return 3+ times in first week
- Users @mention AI at least 5 times per session
- Users report "AI actually remembered context" moments
- Net Promoter Score > 7 from early testers

**The "Aha Moment":**
When a user asks "what did we say about X last week?" and the AI pulls up the exact context, connecting it to today's discussion—and the user feels like they have a friend with perfect memory.

---

## Technical Preferences

### Architecture Stack

**Frontend:**
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React with modern hooks
- **Styling:** Tailwind CSS (Discord-inspired design system)
- **Real-time:** Supabase real-time subscriptions

**Backend:**
- **Database:** Supabase (PostgreSQL + real-time + auth + pgvector)
- **AI Integration:** Vercel AI SDK → Gemini API
- **Embeddings:** Gemini API embedding model
- **Knowledge Graph:** Neo4j (Docker container on Digital Ocean VM - Phase 2)

**Infrastructure:**
- **Hosting:** Vercel (Next.js deployment)
- **Database:** Supabase cloud
- **Graph DB:** Self-hosted Neo4j on Digital Ocean (Phase 2)
- **Asset Storage:** Supabase Storage

**AI/ML:**
- **LLM:** Google Gemini (via Vercel AI SDK)
- **Embeddings:** Gemini embedding API
- **Vector Search:** Supabase pgvector extension
- **Prompt Caching:** Gemini prompt caching for cost efficiency

### Key Architectural Decisions

1. **@mention Activation Pattern**
   - Limits AI API calls (cost efficiency)
   - Enables prompt caching viability
   - Creates natural "friend" interaction model
   - Prevents AI spam in channels

2. **AGENTS.md File-Based Config**
   - Simple, version-controllable
   - Zero-config user experience
   - Per-channel personality customization
   - Familiar pattern for technical users

3. **Hybrid Context Selection**
   - Last 10 messages (recency)
   - Vector top 5 (semantic relevance)
   - AI's own responses (continuity)
   - Balance: comprehensive context without token bloat

4. **Supabase as Foundation**
   - Single platform: DB + real-time + auth + vector + storage
   - Fast MVP velocity
   - Proven scalability path
   - Cost-effective for early stage

5. **Neo4j for Phase 2**
   - Knowledge graph overkill for MVP
   - Critical for advanced features (entity relationships, time travel)
   - Docker deployment keeps costs low
   - Complement to vector search (structural + semantic)

---

## Risks and Assumptions

### Key Risks

**Cost Risk:**
- AI API calls could get expensive at scale
- **Mitigation:** @mention activation limits calls, prompt caching reduces costs, monitor usage closely

**Technical Complexity:**
- Three-tier memory architecture is ambitious
- **Mitigation:** MVP starts with 2-tier (short-term + vector), add graph in Phase 2

**Product-Market Fit:**
- Is "fun AI chat" compelling enough for adoption?
- **Mitigation:** Target tech-savvy early adopters who appreciate the architecture, iterate based on feedback

**Competition:**
- Discord/Slack could add similar AI features
- **Mitigation:** Move fast, focus on memory architecture as differentiator, build loyal community

### Critical Assumptions

✅ **Tech-savvy users will value memory architecture** - High confidence (these users understand the value)

✅ **@mention interaction feels natural** - High confidence (proven pattern in Discord/Slack)

⚠️ **Vector search alone provides enough memory for MVP** - Medium confidence (need to validate, may need graph sooner)

⚠️ **Users want AI in social chat (not just work)** - Medium confidence (unproven, needs user testing)

❓ **Gemini API cost sustainable at scale** - Unknown (depends on usage patterns, caching effectiveness)

---

## Timeline Constraints

**MVP Target:** 8-12 weeks

**Phase Breakdown:**
1. **Weeks 1-2:** Foundation (Next.js + Supabase + Auth + Basic Chat)
2. **Weeks 3-4:** AI Integration (Gemini + Vercel AI SDK + @mention pattern)
3. **Weeks 5-6:** Memory Systems (pgvector + embeddings + context selection)
4. **Weeks 7-8:** Polish (AGENTS.md + Mermaid + exports + UX refinements)
5. **Weeks 9-10:** Testing & Bug Fixes (internal testing, performance optimization)
6. **Weeks 11-12:** Beta Launch (invite tech community, gather feedback)

**Critical Milestones:**
- Week 4: First AI response working in chat
- Week 6: Vector search returning relevant history
- Week 8: Feature-complete MVP
- Week 12: Beta launch with 10-20 users

**Dependencies:**
- Gemini API access (already available)
- Supabase account with pgvector enabled (quick setup)
- Digital Ocean VM for Neo4j (Phase 2, not blocking MVP)

---

## Supporting Materials

This Product Brief incorporates insights from:

**Brainstorming Session Results (2025-11-12):**
- First Principles Thinking: WHY (amplify collective intelligence)
- What If Scenarios: WHAT (memory systems, subagents, parallel processing)
- SCAMPER Method: HOW (AGENTS.md, @mention, zero-config)
- Advanced Elicitation: System architecture, dependency mapping, flywheel effects

**Key Insights Carried Forward:**
- Fun-first philosophy drives all technical decisions
- Memory architecture is the core differentiator
- Simplicity through architecture (complex backend, simple UX)
- Cost-efficiency loop (@mention → caching → accessible)
- Flywheel effect (use builds value builds more use)

---

_This Product Brief captures the vision and requirements for **Chorus**._

_It was created as a passion project combining AI architecture, DevOps, and fullstack development—built for the joy of creating something technically sophisticated and genuinely fun._

_Next: The PRD workflow will transform this brief into detailed product requirements with epics and user stories._
