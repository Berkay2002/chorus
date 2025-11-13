import { NextResponse } from 'next/server';
import neo4jClient from '@/lib/neo4j/client';

export async function GET() {
  try {
    const isConnected = await neo4jClient.verifyConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { success: false, message: 'Failed to connect to Neo4j' },
        { status: 500 }
      );
    }

    // Get some stats
    const session = neo4jClient.getSession();
    try {
      const result = await session.run(
        'MATCH (n) RETURN labels(n) as label, count(*) as count'
      );

      const stats = result.records.map(record => ({
        label: record.get('label'),
        count: record.get('count').toNumber(),
      }));

      return NextResponse.json({
        success: true,
        message: 'Connected to Neo4j successfully!',
        stats,
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j test error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}