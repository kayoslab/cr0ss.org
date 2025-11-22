# AI Chat Assistant

An AI chat assistant using Vercel AI Gateway with RAG (Retrieval-Augmented Generation) to answer questions about Simon's professional background, expertise, and blog posts.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Question                               │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Vector Search (RAG)                         │   │
│  │  OpenAI text-embedding-3-small → pgvector similarity    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LLM Generation                              │   │
│  │  Vercel AI Gateway (OpenAI/Anthropic) + Context         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│                      AI Response                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Details |
|-----------|------------|---------|
| **LLM** | Vercel AI Gateway | OpenAI GPT-4o-mini, Anthropic Claude, etc. |
| **Embeddings** | text-embedding-3-small | 384-dimension vectors (truncated) |
| **Vector DB** | pgvector | PostgreSQL extension on Neon |
| **Runtime** | Vercel Serverless | Node.js runtime |
| **UI** | React | ChatGPT-style interface |

## Key Features

- **Multi-Provider Support** - Switch between OpenAI, Anthropic via AI Gateway
- **Unified API** - Single interface for multiple AI providers
- **Cost-Effective** - 0% token markup via AI Gateway
- **Auto-Failover** - Automatic retry to other providers if one fails
- **Auto-Updating Index** - Content re-indexed on Contentful webhooks

## File Structure

```
lib/ai/
├── knowledge-base/           # Personal information (markdown)
│   ├── about-me.md
│   ├── professional.md
│   ├── skills.md
│   ├── philosophy.md
│   └── projects.md
├── embeddings.ts             # Embedding generation via AI Gateway
├── retrieval.ts              # RAG context retrieval
├── llm.ts                    # LLM text generation via AI Gateway
├── index-blog-post.ts        # Single blog post indexing
└── system-prompt.ts          # System prompt template

scripts/
└── index-embeddings.ts       # Full content indexing

app/api/
├── chat/route.ts             # Chat API endpoint
└── ai/reindex-blog/route.ts  # Blog re-indexing endpoint

components/chat/
├── chat-interface.tsx        # Main chat UI
├── message.tsx               # Message bubble component
└── suggested-questions.tsx   # Initial question suggestions
```

## Model Configuration

Models are configured in `lib/ai/llm.ts` and accessed via Vercel AI Gateway:

```typescript
const MODELS = {
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    maxTokens: 500,
  },
  "claude-3-haiku": {
    id: "anthropic/claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    maxTokens: 500,
  },
  // ... more models
};
```

### Switching Models

Set `AI_MODEL` environment variable:

```bash
AI_MODEL=gpt-4o-mini    # OpenAI GPT-4o Mini (default)
AI_MODEL=gpt-4o         # OpenAI GPT-4o
AI_MODEL=claude-3-haiku # Anthropic Claude 3 Haiku
AI_MODEL=claude-3-5-sonnet # Anthropic Claude 3.5 Sonnet
```

## Scripts

### Index All Content

```bash
pnpm ai:index
```

Indexes all knowledge base files and blog posts into pgvector.

### Setup Database

```bash
pnpm ai:setup
```

Creates the `chat_embeddings` table with pgvector extension.

## API Endpoint

### `POST /api/chat`

**Rate Limit**: 10 requests per minute

**Request**:
```json
{
  "message": "What is Simon's experience with TypeScript?"
}
```

**Response**:
```json
{
  "response": "Simon has extensive experience with TypeScript...",
  "model": {
    "name": "GPT-4o Mini",
    "provider": "openai"
  },
  "timestamp": 1700000000000
}
```

**Error Codes**:
- `429` - Rate limit exceeded
- `400` - Invalid request (message too long/short)
- `503` - AI service unavailable
- `500` - Generation error

## Environment Variables

Required:
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key
- `DATABASE_URL` - PostgreSQL database URL (for storing embeddings)

Optional:
- `AI_MODEL` - Model to use (default: `gpt-4o-mini`)

## Data Sources

### Knowledge Base

Markdown files containing personal information:
- Background and education
- Professional experience
- Technical skills
- Work philosophy
- Notable projects

### Blog Posts

All blog posts from Contentful are indexed:
- Title and summary
- Excerpt from content
- Category metadata

## Embedding Cache

Stored in PostgreSQL via pgvector. Re-indexed on:
- Contentful webhook (single post)
- Manual `pnpm ai:index` (full)

## Troubleshooting

### Empty Responses

1. Check knowledge base files have content
2. Run `pnpm ai:index` to rebuild embeddings
3. Verify `DATABASE_URL` is correct

### API Key Errors

1. Verify `AI_GATEWAY_API_KEY` is set
2. Check Vercel AI Gateway configuration in dashboard
3. Ensure BYOK (Bring Your Own Key) is configured if using direct provider keys

### Rate Limit Errors

1. Check Vercel AI Gateway usage in dashboard
2. Verify rate limit settings
3. Consider upgrading AI Gateway plan if needed
