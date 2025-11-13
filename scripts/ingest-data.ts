/**
 * Script to ingest data into Neo4j remotely
 * 
 * Usage:
 *   npx tsx scripts/ingest-data.ts
 * 
 * Connected to Neo4j at Digital Ocean:
 *   bolt://104.248.31.194:7687
 * 
 * Credentials are in .env.local:
 *   NEO4J_URI=bolt://104.248.31.194:7687
 *   NEO4J_USER=neo4j
 *   NEO4J_PASSWORD=Starlight021212
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local BEFORE importing anything
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import neo4j from 'neo4j-driver';

/**
 * Ingest sample Discord-like messages and build knowledge graph
 */
async function ingestSampleData() {
  // Create driver directly with env vars
  const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
  
  const session = driver.session();
  
  try {
    console.log('🚀 Starting data ingestion to Neo4j at 104.248.31.194...\n');
    
    // Example 1: Create Discord users
    console.log('📝 Creating users...');
    await session.run(`
      UNWIND [
        {id: 'user_alice_123', name: 'Alice'},
        {id: 'user_bob_456', name: 'Bob'},
        {id: 'user_charlie_789', name: 'Charlie'},
        {id: 'user_diana_012', name: 'Diana'}
      ] AS user
      MERGE (u:User {id: user.id})
      SET u.name = user.name,
          u.created_at = datetime()
    `);
    console.log('✅ Users created\n');
    
    // Example 2: Create realistic Chorus messages
    console.log('📝 Creating messages...');
    await session.run(`
      UNWIND [
        {
          id: 'msg_001', 
          content: 'Has anyone tried the new Vercel AI SDK? Looking to integrate streaming responses.',
          userId: 'user_alice_123', 
          channel: 'dev-discussion',
          timestamp: datetime('2025-11-13T10:30:00Z')
        },
        {
          id: 'msg_002', 
          content: 'Yes! I used it with Next.js 15. The useChat hook is amazing for real-time streaming.',
          userId: 'user_bob_456', 
          channel: 'dev-discussion',
          timestamp: datetime('2025-11-13T10:32:00Z')
        },
        {
          id: 'msg_003', 
          content: 'We should build a knowledge graph to track all these tech discussions. Neo4j would be perfect.',
          userId: 'user_charlie_789', 
          channel: 'dev-discussion',
          timestamp: datetime('2025-11-13T10:35:00Z')
        },
        {
          id: 'msg_004', 
          content: 'Anyone up for a game night this Friday? Thinking Among Us or Jackbox.',
          userId: 'user_diana_012', 
          channel: 'random',
          timestamp: datetime('2025-11-13T14:20:00Z')
        }
      ] AS msg
      MERGE (m:Message {id: msg.id})
      SET m.content = msg.content,
          m.channel = msg.channel,
          m.timestamp = msg.timestamp
      WITH m, msg
      MATCH (u:User {id: msg.userId})
      MERGE (u)-[:SENT]->(m)
    `);
    console.log('✅ Messages created\n');
    
    // Example 3: Extract and link entities (topics/technologies mentioned)
    console.log('📝 Creating entities and relationships...');
    await session.run(`
      UNWIND [
        {id: 'tech_vercel_ai', name: 'Vercel AI SDK', type: 'Technology'},
        {id: 'tech_nextjs', name: 'Next.js 15', type: 'Framework'},
        {id: 'tech_neo4j', name: 'Neo4j', type: 'Database'},
        {id: 'concept_streaming', name: 'Real-time Streaming', type: 'Concept'},
        {id: 'concept_knowledge_graph', name: 'Knowledge Graph', type: 'Concept'}
      ] AS entity
      MERGE (e:Entity {id: entity.id})
      SET e.name = entity.name,
          e.type = entity.type
    `);
    
    // Link messages to entities they mention
    await session.run(`
      // Alice's message mentions Vercel AI SDK and streaming
      MATCH (m:Message {id: 'msg_001'})
      MATCH (e1:Entity {id: 'tech_vercel_ai'})
      MATCH (e2:Entity {id: 'concept_streaming'})
      MERGE (m)-[:MENTIONS]->(e1)
      MERGE (m)-[:MENTIONS]->(e2)
    `);
    
    await session.run(`
      // Bob's message mentions Next.js and streaming
      MATCH (m:Message {id: 'msg_002'})
      MATCH (e1:Entity {id: 'tech_nextjs'})
      MATCH (e2:Entity {id: 'concept_streaming'})
      MERGE (m)-[:MENTIONS]->(e1)
      MERGE (m)-[:MENTIONS]->(e2)
    `);
    
    await session.run(`
      // Charlie's message mentions Neo4j and knowledge graphs
      MATCH (m:Message {id: 'msg_003'})
      MATCH (e1:Entity {id: 'tech_neo4j'})
      MATCH (e2:Entity {id: 'concept_knowledge_graph'})
      MERGE (m)-[:MENTIONS]->(e1)
      MERGE (m)-[:MENTIONS]->(e2)
    `);
    
    // Create relationships between related entities
    await session.run(`
      MATCH (e1:Entity {id: 'tech_vercel_ai'})
      MATCH (e2:Entity {id: 'concept_streaming'})
      MERGE (e1)-[:ENABLES]->(e2)
      
      WITH e1, e2
      MATCH (e3:Entity {id: 'tech_nextjs'})
      MERGE (e1)-[:INTEGRATES_WITH]->(e3)
      
      WITH e1, e3
      MATCH (e4:Entity {id: 'tech_neo4j'})
      MATCH (e5:Entity {id: 'concept_knowledge_graph'})
      MERGE (e4)-[:IMPLEMENTS]->(e5)
    `);
    console.log('✅ Entities and relationships created\n');
    
    // Example 4: Create topics (conversation threads)
    console.log('📝 Creating topics...');
    await session.run(`
      MERGE (t:Topic {name: 'AI Development'})
      SET t.created_at = datetime()
      WITH t
      MATCH (m:Message)
      WHERE m.channel = 'dev-discussion'
      MERGE (m)-[:ABOUT]->(t)
    `);
    console.log('✅ Topics created\n');
    
    // Verification and stats
    console.log('📊 Database Statistics:\n');
    
    const userCount = await session.run('MATCH (u:User) RETURN count(u) as count');
    console.log(`   👥 Users: ${userCount.records[0].get('count')}`);
    
    const msgCount = await session.run('MATCH (m:Message) RETURN count(m) as count');
    console.log(`   💬 Messages: ${msgCount.records[0].get('count')}`);
    
    const entityCount = await session.run('MATCH (e:Entity) RETURN count(e) as count');
    console.log(`   🏷️  Entities: ${entityCount.records[0].get('count')}`);
    
    const topicCount = await session.run('MATCH (t:Topic) RETURN count(t) as count');
    console.log(`   📌 Topics: ${topicCount.records[0].get('count')}`);
    
    const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
    console.log(`   🔗 Relationships: ${relCount.records[0].get('count')}\n`);
    
    // Show sample queries
    console.log('🔍 Sample Query - Messages mentioning technologies:');
    const techMessages = await session.run(`
      MATCH (u:User)-[:SENT]->(m:Message)-[:MENTIONS]->(e:Entity)
      WHERE e.type = 'Technology' OR e.type = 'Framework'
      RETURN u.name as user, m.content as message, collect(e.name) as technologies
      LIMIT 3
    `);
    
    techMessages.records.forEach(record => {
      console.log(`   - ${record.get('user')}: "${record.get('message').substring(0, 50)}..."`);
      console.log(`     Technologies: ${record.get('technologies').join(', ')}\n`);
    });
    
    console.log('✨ Ingestion complete!');
    console.log('🌐 View in Neo4j Browser: http://104.248.31.194:7474');
    console.log('   Try: MATCH (n) RETURN n LIMIT 25\n');
    
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

/**
 * Bulk import from JSON file
 */
async function ingestFromJSON(filePath: string) {
  const fs = await import('fs/promises');
  const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  
  // Create driver directly with env vars
  const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
  
  const session = driver.session();
  
  try {
    console.log(`📦 Importing from ${filePath}...`);
    
    // Assuming JSON structure: { users: [], messages: [], entities: [] }
    if (data.users) {
      await session.run(`
        UNWIND $users AS user
        MERGE (u:User {id: user.id})
        SET u = user
      `, { users: data.users });
      console.log(`✅ Imported ${data.users.length} users`);
    }
    
    if (data.messages) {
      await session.run(`
        UNWIND $messages AS msg
        MERGE (m:Message {id: msg.id})
        SET m = msg,
            m.timestamp = datetime(msg.timestamp)
        WITH m, msg
        MATCH (u:User {id: msg.userId})
        MERGE (u)-[:SENT]->(m)
      `, { messages: data.messages });
      console.log(`✅ Imported ${data.messages.length} messages`);
    }
    
    console.log('✨ JSON import complete!');
  } catch (error) {
    console.error('❌ JSON import failed:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0 && args[0].endsWith('.json')) {
  ingestFromJSON(args[0])
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  ingestSampleData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
