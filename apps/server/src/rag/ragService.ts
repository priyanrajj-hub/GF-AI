import { ragStore } from './vectorStore.js'

export interface RagContextResult {
  contextText: string
  matchedDocs: Array<{
    id: string
    topic: string
    category: string
    score: number
  }>
}

/**
 * Builds an injected RAG context block based on user query and active character.
 * Retrives top semantic matches from the in-memory vector database.
 */
export async function buildRagContext(
  userQuery: string,
  character: string = 'ada',
  topK: number = 4
): Promise<RagContextResult> {
  if (!userQuery || userQuery.trim().length === 0) {
    return { contextText: '', matchedDocs: [] }
  }

  // Query vector store with user prompt
  const matches = ragStore.query(userQuery, topK)

  if (matches.length === 0) {
    return { contextText: '', matchedDocs: [] }
  }

  const matchedDocs = matches.map((m) => ({
    id: m.doc.id,
    topic: m.doc.metadata?.topic || m.doc.metadata?.character || 'General',
    category: m.doc.metadata?.category || 'Knowledge',
    score: Math.round(m.score * 100) / 100,
  }))

  const contextText = [
    `\n--- RETRIEVED KNOWLEDGE BASE CONTEXT (RAG VECTOR DB) ---`,
    ...matches.map(
      (m, idx) =>
        `[Document ${idx + 1}] Category: ${m.doc.metadata?.category || 'general'} | Topic: ${m.doc.metadata?.topic || m.doc.metadata?.character || 'general'}\n${m.doc.text}`
    ),
    `--- END RETRIEVED CONTEXT ---\n`,
  ].join('\n')

  return {
    contextText,
    matchedDocs,
  }
}
