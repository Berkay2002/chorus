import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jClient {
  private driver: Driver | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    try {
      this.driver = neo4j.driver(
        uri,
        neo4j.auth.basic(user, password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        }
      );
      console.log('✅ Neo4j driver created successfully');
    } catch (error) {
      console.error('❌ Failed to create Neo4j driver:', error);
      throw error;
    }
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.driver.session();
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log('Neo4j driver closed');
    }
  }

  async verifyConnection(): Promise<boolean> {
    const session = this.getSession();
    try {
      const result = await session.run('RETURN 1 as test');
      return result.records.length > 0;
    } catch (error) {
      console.error('Failed to verify Neo4j connection:', error);
      return false;
    } finally {
      await session.close();
    }
  }
}

// Singleton instance
const neo4jClient = new Neo4jClient();

export default neo4jClient;