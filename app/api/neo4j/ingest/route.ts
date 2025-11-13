import { NextRequest, NextResponse } from 'next/server';
import neo4jClient from '@/lib/neo4j/client';

export async function POST(request: NextRequest) {
  try {
    const { query, params } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const session = neo4jClient.getSession();
    
    try {
      const result = await session.run(query, params || {});
      
      return NextResponse.json({
        success: true,
        recordsAffected: result.summary.counters.updates(),
        records: result.records.map(record => record.toObject()),
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j ingestion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Example: Batch insert
export async function PUT(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data must be an array' },
        { status: 400 }
      );
    }

    const session = neo4jClient.getSession();
    
    try {
      // Example batch insert - customize for your data structure
      const result = await session.run(
        `
        UNWIND $data AS item
        CREATE (n:Node)
        SET n = item
        RETURN count(n) as created
        `,
        { data }
      );
      
      return NextResponse.json({
        success: true,
        created: result.records[0].get('created').toNumber(),
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j batch insert error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
