// Vercel AI SDK streaming helpers
// Most streaming logic is handled by the SDK itself
// This file is for custom streaming utilities if needed

export async function* streamResponse(
  response: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = response.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      yield chunk
    }
  } finally {
    reader.releaseLock()
  }
}
