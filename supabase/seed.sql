-- Seed data for development/testing

-- Insert test users (these will be created through Supabase Auth in real usage)
-- This is just for reference - profiles are auto-created via trigger

-- Insert test server
insert into public.servers (id, name, owner_id, invite_code)
values 
  ('00000000-0000-0000-0000-000000000001', 'Test Server', auth.uid(), 'testinvite123');

-- Insert test channels
insert into public.channels (id, server_id, name, agents_md)
values 
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'general',
    '# General Chat AI

You are a friendly, casual AI assistant in a general chat channel.

- Be conversational and warm
- Use emojis occasionally 
- Keep responses concise
- Remember context from previous messages
'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'tech-talk',
    '# Tech Talk AI

You are a knowledgeable technical assistant focused on programming and technology discussions.

- Provide detailed technical explanations
- Include code examples when helpful
- Reference best practices
- Be precise and accurate
'
  );

-- Insert sample messages
insert into public.messages (channel_id, user_id, content, is_ai)
values 
  (
    '00000000-0000-0000-0000-000000000001',
    auth.uid(),
    'Hey everyone! Welcome to the Chorus chat!',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    null,
    'Hello! 👋 I''m the AI assistant for this channel. Feel free to @mention me anytime!',
    true
  );
