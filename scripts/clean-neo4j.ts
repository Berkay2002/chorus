/**
 * Script to clean all data from Neo4j database
 * 
 * Usage:
 *   npx tsx scripts/clean-neo4j.ts
 * 
 * WARNING: This will DELETE ALL nodes and relationships!
 * Connected to: bolt://104.248.31.194:7687
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local BEFORE importing anything
dotenv.config({ path: resolve(__dirname, '../.env.local') });

console.log('🔑 Loaded credentials:');
console.log(`   URI: ${process.env.NEO4J_URI}`);
console.log(`   User: ${process.env.NEO4J_USER}`);
console.log(`   Password: ${process.env.NEO4J_PASSWORD ? '***' + process.env.NEO4J_PASSWORD.slice(-4) : 'NOT SET'}\n`);

import neo4j from 'neo4j-driver';

async function cleanDatabase() {
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
    console.log('⚠️  WARNING: This will delete ALL data from Neo4j!');
    console.log('📍 Target: bolt://104.248.31.194:7687\n');
    
    // Get current counts before deletion
    console.log('📊 Current database state:');
    const nodeCount = await session.run('MATCH (n) RETURN count(n) as count');
    const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
    
    console.log(`   Nodes: ${nodeCount.records[0].get('count')}`);
    console.log(`   Relationships: ${relCount.records[0].get('count')}\n`);
    
    // Delete everything
    console.log('🗑️  Deleting all nodes and relationships...');
    await session.run('MATCH (n) DETACH DELETE n');
    
    // Verify deletion
    const finalCount = await session.run('MATCH (n) RETURN count(n) as count');
    console.log(`✅ Database cleaned! Remaining nodes: ${finalCount.records[0].get('count')}\n`);
    
    console.log('✨ Clean complete! Database is now empty.');
    console.log('💡 Run "npx tsx scripts/ingest-data.ts" to populate with fresh data.\n');
    
  } catch (error) {
    console.error('❌ Clean failed:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Execute
cleanDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
