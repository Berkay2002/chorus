import { genAI } from './gemini'

const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  try {
    const results = await Promise.all(texts.map((text) => generateEmbedding(text)))
    return results
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}
