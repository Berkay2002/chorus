import { GoogleGenerativeAI } from '@google/generative-ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set')
}

// For embeddings
export const genAI = new GoogleGenerativeAI(apiKey)

// For chat completions (Vercel AI SDK)
export const gemini = createGoogleGenerativeAI({
  apiKey,
})
