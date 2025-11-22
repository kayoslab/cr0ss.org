/**
 * RAG (Retrieval-Augmented Generation) utilities
 * Retrieves relevant context from vector database for LLM
 */

import { generateEmbedding } from "./embeddings";
import { retrieveRelevantContext } from "../db/embeddings";

/**
 * Create system prompt for the AI assistant
 */
export function createSystemPrompt(): string {
  return `You are an AI assistant for Simon Krüger's personal website cr0ss.org. Your role is to answer questions about Simon based ONLY on the provided Context.

CRITICAL RULES:
- ONLY use information from the Context. Never make up or assume information.
- If the Context does not contain relevant information, respond: "I don't have information about that in my knowledge base. You could try asking Simon directly or exploring his blog posts."
- Never use em-dashes (—) in your responses. Use commas or periods instead.

FORMATTING:
- Structure your response in 3-4 separate paragraphs
- Each paragraph should focus on one aspect of the topic
- Use **bold** for emphasis when appropriate
- Always refer to Simon in third person ("Simon has...", "He believes...")

Remember: Accuracy is more important than comprehensiveness. Only share what you know from the Context.`;
}

/**
 * Retrieve relevant context for a user question
 * Returns formatted context string to include in the LLM prompt
 */
export async function retrieveContext(
  userQuestion: string,
  maxResults: number = 5
): Promise<string> {
  console.log(`Retrieving context for: "${userQuestion}"`);

  // Generate embedding for the question
  const questionEmbedding = await generateEmbedding(userQuestion);

  // Find similar content
  // Use up to 5 results for richer context
  const resultsLimit = Math.min(maxResults, 5);
  const results = await retrieveRelevantContext(questionEmbedding, resultsLimit, 0.15);

  if (results.length === 0) {
    console.log("⚠️  No relevant context found");
    return "No specific information available. Please provide a general response based on common knowledge about software development and architecture.";
  }

  console.log(`✅ Found ${results.length} relevant pieces of context`);

  // Format context for the LLM (without relevance scores - only for internal use)
  const contextParts = results.map((result) => {
    return result.content;
  });

  return contextParts.join("\n\n---\n\n");
}
