import neo4jClient from './client';
import neo4j, { Record } from 'neo4j-driver';

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  channel: string;
  userId: string;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
}

export interface User {
  id: string;
  name: string;
}

export interface ConversationContext {
  userName: string;
  content: string;
  timestamp: string;
  entities: string[];
}

export interface RelatedConcept {
  name: string;
  type: string;
}

export interface UserHistoryItem {
  content: string;
  timestamp: string;
  channel: string;
  entities: string[];
}

export class KnowledgeGraphService {
  
  // Store a message in the knowledge graph
  async storeMessage(message: Message): Promise<void> {
    const session = neo4jClient.getSession();
    try {
      await session.run(
        `
        MERGE (m:Message {id: $id})
        SET m.content = $content,
            m.timestamp = datetime($timestamp),
            m.channel = $channel
        WITH m
        MERGE (u:User {id: $userId})
        MERGE (u)-[:SENT]->(m)
        RETURN m
        `,
        {
          id: message.id,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          channel: message.channel,
          userId: message.userId,
        }
      );
    } finally {
      await session.close();
    }
  }

  // Extract and store entities from a message
  async storeEntities(messageId: string, entities: Entity[]): Promise<void> {
    const session = neo4jClient.getSession();
    try {
      for (const entity of entities) {
        await session.run(
          `
          MATCH (m:Message {id: $messageId})
          MERGE (e:Entity {id: $entityId})
          SET e.name = $name,
              e.type = $type
          MERGE (m)-[:MENTIONS]->(e)
          RETURN e
          `,
          {
            messageId,
            entityId: entity.id,
            name: entity.name,
            type: entity.type,
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  // Get conversation context (recent messages with entities)
  async getConversationContext(
    channel: string,
    limit: number = 10
  ): Promise<ConversationContext[]> {
    const session = neo4jClient.getSession();
    try {
      const result = await session.run(
        `
        MATCH (u:User)-[:SENT]->(m:Message {channel: $channel})
        OPTIONAL MATCH (m)-[:MENTIONS]->(e:Entity)
        WITH u, m, collect(e.name) as entities
        ORDER BY m.timestamp DESC
        LIMIT $limit
        RETURN u.name as userName, 
               m.content as content, 
               m.timestamp as timestamp,
               entities
        `,
        { channel, limit: neo4j.int(limit) }
      );

      return result.records.map((record: Record): ConversationContext => ({
        userName: record.get('userName'),
        content: record.get('content'),
        timestamp: record.get('timestamp'),
        entities: record.get('entities'),
      }));
    } finally {
      await session.close();
    }
  }

  // Search for related concepts
  async findRelatedConcepts(entityName: string, depth: number = 2): Promise<RelatedConcept[]> {
    const session = neo4jClient.getSession();
    try {
      const result = await session.run(
        `
        MATCH path = (e:Entity {name: $entityName})-[:RELATED_TO*1..$depth]-(related:Entity)
        RETURN DISTINCT related.name as name, related.type as type
        LIMIT 10
        `,
        { entityName, depth: neo4j.int(depth) }
      );

      return result.records.map((record: Record): RelatedConcept => ({
        name: record.get('name'),
        type: record.get('type'),
      }));
    } finally {
      await session.close();
    }
  }

  // Get user's message history
  async getUserHistory(userId: string, limit: number = 20): Promise<UserHistoryItem[]> {
    const session = neo4jClient.getSession();
    try {
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:SENT]->(m:Message)
        OPTIONAL MATCH (m)-[:MENTIONS]->(e:Entity)
        WITH m, collect(e.name) as entities
        ORDER BY m.timestamp DESC
        LIMIT $limit
        RETURN m.content as content,
               m.timestamp as timestamp,
               m.channel as channel,
               entities
        `,
        { userId, limit: neo4j.int(limit) }
      );

      return result.records.map((record: Record): UserHistoryItem => ({
        content: record.get('content'),
        timestamp: record.get('timestamp'),
        channel: record.get('channel'),
        entities: record.get('entities'),
      }));
    } finally {
      await session.close();
    }
  }
}

export const knowledgeGraph = new KnowledgeGraphService();