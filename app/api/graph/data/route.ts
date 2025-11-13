import { NextResponse } from 'next/server';
import neo4jClient from '@/lib/neo4j/client';

export async function GET() {
  const session = neo4jClient.getSession();
  
  try {
    // Get all nodes and relationships
    const result = await session.run(`
      MATCH (n)-[r]->(m)
      RETURN 
        id(n) as sourceId,
        labels(n)[0] as sourceLabel,
        properties(n) as sourceProps,
        type(r) as relationshipType,
        properties(r) as relationshipProps,
        id(m) as targetId,
        labels(m)[0] as targetLabel,
        properties(m) as targetProps
      LIMIT 100
    `);

    // Build nodes and links
    const nodesMap = new Map();
    const links: Link[] = [];

    interface Link {
      source: string;
      target: string;
      type: string;
      properties: Record<string, unknown>;
    }

    result.records.forEach(record => {
      // Source node
      const sourceId = record.get('sourceId').toString();
      const sourceLabel = record.get('sourceLabel');
      const sourceProps = record.get('sourceProps');
      
      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          id: sourceId,
          label: sourceLabel,
          name: sourceProps.name || sourceProps.content?.substring(0, 50) || sourceLabel,
          properties: sourceProps,
        });
      }

      // Target node
      const targetId = record.get('targetId').toString();
      const targetLabel = record.get('targetLabel');
      const targetProps = record.get('targetProps');
      
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          id: targetId,
          label: targetLabel,
          name: targetProps.name || targetProps.content?.substring(0, 50) || targetLabel,
          properties: targetProps,
        });
      }

      // Relationship
      links.push({
        source: sourceId,
        target: targetId,
        type: record.get('relationshipType'),
        properties: record.get('relationshipProps'),
      });
    });

    const nodes = Array.from(nodesMap.values());

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}