# AI Chat Assistant

A fully open-source, privacy-focused AI chat assistant that runs locally using Transformers.js. Uses RAG (Retrieval-Augmented Generation) to answer questions about Simon's professional background, expertise, and blog posts.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Question                               │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Vector Search (RAG)                         │   │
│  │  all-MiniLM-L6-v2 embeddings → pgvector similarity      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LLM Generation                              │   │
│  │  Qwen3 0.6B (Transformers.js) + Retrieved Context       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│                      AI Response                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Details |
|-----------|------------|---------|
| **LLM** | Qwen3 0.6B | ONNX model via Transformers.js |
| **Embeddings** | all-MiniLM-L6-v2 | 384-dimension vectors |
| **Vector DB** | pgvector | PostgreSQL extension on Neon |
| **Runtime** | Node.js | Server-side inference |
| **UI** | React | ChatGPT-style interface |

## Key Features

- **100% Open Source** - No OpenAI/Anthropic API dependencies
- **Privacy-First** - All processing happens on your servers
- **Cost-Effective** - No per-token API costs
- **Build-Time Model Download** - Models cached before deployment
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
├── embeddings.ts             # Embedding generation (all-MiniLM-L6-v2)
├── retrieval.ts              # RAG context retrieval
├── llm.ts                    # LLM text generation
├── models.ts                 # Model configuration
├── index-blog-post.ts        # Single blog post indexing
└── system-prompt.ts          # System prompt template

scripts/
├── download-llm.ts           # Build-time model download
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

### Current Model: Qwen3 0.6B

```typescript
// lib/ai/models.ts
{
  id: "onnx-community/Qwen3-0.6B-ONNX",
  name: "Qwen3 0.6B",
  size: "600M",
  quality: "medium",
  speed: "fast",
  maxContext: 4096,
  config: {
    max_new_tokens: 300,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    repetition_penalty: 1.15,
    do_sample: true,
  },
}
```

### Performance Optimizations

1. **`/no_think` Directive** - Disables Qwen3's internal reasoning mode for faster responses
2. **Reduced Token Limit** - 300 tokens balances quality with speed (~10-20s response time)
3. **Build-Time Download** - Models pre-cached during build, no cold start delays

### Alternative Models (Configured)

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| Qwen3 0.6B | 600M | Medium | Fast |
| Qwen 1.5 0.5B | 500M | Medium | Fast |
| TinyLlama 1.1B | 1.1B | Medium | Medium |
| Phi-3 Mini | 3.8B | High | Slow |
| SmolLM 135M | 135M | Low | Fast |

## Scripts

### Download Models (Build Time)

```bash
pnpm ai:download
```

Downloads configured models (LLM + embedding) to `.transformers-cache/`. Runs automatically via `prebuild` hook.

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

## Indexing Strategy

### Build Time (Production)

```bash
pnpm build  # Runs: ai:download → build → ai:index
```

### Manual Re-indexing

```bash
pnpm ai:index  # Full re-index of all content
```

### Automatic (Webhooks)

When content is published in Contentful:
```
Contentful Publish → /api/revalidate → /api/ai/reindex-blog
```

Single blog posts are re-indexed automatically without blocking the webhook.

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
    "name": "Qwen3 0.6B",
    "size": "600M"
  },
  "timestamp": 1700000000000
}
```

**Error Codes**:
- `429` - Rate limit exceeded
- `400` - Invalid request (message too long/short)
- `503` - Model loading (retry in a moment)
- `500` - Generation error

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

## Environment Variables

No additional environment variables required. Uses existing:
- `DATABASE_URL` - For storing embeddings
- `CONTENTFUL_*` - For fetching blog posts
- `HF_TOKEN` (optional) - For gated Hugging Face models

## Caching

### Model Cache

```
.transformers-cache/     # Local development
```

Models are downloaded once and cached. In production (Vercel), cached in build container.

### Embedding Cache

Stored in PostgreSQL via pgvector. Re-indexed on:
- Build time (full)
- Contentful webhook (single post)
- Manual `pnpm ai:index` (full)

## Troubleshooting

### Slow Response Times

If responses take >30 seconds:
1. Check `max_new_tokens` in `lib/ai/models.ts` (should be ~300)
2. Verify `/no_think` is in the prompt format (`lib/ai/llm.ts`)
3. Consider switching to a smaller model

### Model Download Fails

1. Check internet connection
2. Verify Hugging Face is accessible
3. For gated models, set `HF_TOKEN` environment variable

### Empty Responses

1. Check knowledge base files have content
2. Run `pnpm ai:index` to rebuild embeddings
3. Verify `DATABASE_URL` is correct

### "Model is loading" Errors

First request after cold start may show this. Model loading takes 10-30 seconds. Subsequent requests are fast.

## Performance Benchmarks

| Metric | Value |
|--------|-------|
| Model load time | 10-30s (first request) |
| Embedding generation | 2-5ms per chunk |
| Vector search | <50ms |
| LLM generation | 10-20s |
| Full re-index | ~10-15s |
| Single post index | ~100-300ms |

## Future Improvements

- [ ] Streaming responses
- [ ] Conversation memory
- [ ] Source citations
- [ ] Model selection at runtime
- [ ] WebGPU acceleration (when browser support improves)
