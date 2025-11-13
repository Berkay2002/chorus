import { NextRequest, NextResponse } from 'next/server';
import { knowledgeGraph } from '@/lib/neo4j/knowledge-graph';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { content, channel, userId } = await request.json();

    // Store message
    await knowledgeGraph.storeMessage({
      id: uuidv4(),
      content,
      timestamp: new Date(),
      channel,
      userId,
    });

    // Here you would call your AI entity extraction
    // For now, let's create a simple example:
    // const entities = await extractEntities(content);
    // await knowledgeGraph.storeEntities(messageId, entities);

    return NextResponse.json({
      success: true,
      message: 'Message stored in knowledge graph',
    });
  } catch (error) {
    console.error('Error storing message:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}