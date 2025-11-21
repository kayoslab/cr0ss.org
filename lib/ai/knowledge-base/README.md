# AI Knowledge Base

This directory contains structured information about Simon Krüger that will be used by the AI chat assistant.

## How It Works

Each markdown file is:
1. **Chunked** into smaller pieces (if needed)
2. **Embedded** using OpenAI's embedding model
3. **Stored** in a vector database (PostgreSQL with pgvector)
4. **Retrieved** when relevant to a user's question
5. **Provided** as context to the LLM

## File Structure

### Core Information
- `about-me.md` - Personal bio, background, story
- `professional.md` - Career timeline, roles, companies, achievements
- `skills.md` - Technical skills, tools, frameworks, specializations
- `philosophy.md` - Work philosophy, values, approaches to software
- `projects.md` - Notable projects and contributions

**Note:** Topic-specific content (like composable commerce, architecture, etc.) comes from your blog posts in Contentful and will be automatically indexed.

## Writing Guidelines

### Style
- Write in **third person** (e.g., "Simon has experience in..." not "I have experience in...")
- Be **specific** with examples, numbers, and concrete details
- Keep paragraphs **focused** on one topic
- Use **markdown formatting** (headers, lists, bold)

### What to Include
- ✅ Specific achievements and metrics
- ✅ Real examples and projects
- ✅ Opinions and perspectives
- ✅ Technical details
- ✅ Timeline information (years, durations)

### What to Avoid
- ❌ Vague statements ("extensive experience")
- ❌ Marketing fluff
- ❌ Redundant information across files
- ❌ Very long paragraphs (keep under ~200 words)

## Updating Content

After updating any files:

```bash
# Re-index the knowledge base (command will be created)
pnpm ai:index
```

This will regenerate embeddings and update the vector database.

## File Length

Each file can be as long as needed. The indexing process will automatically chunk long files into appropriate sizes (~1000 characters per chunk) for optimal retrieval.

## Content Sources

The AI assistant has access to two types of content:

1. **Personal Information** - From markdown files in this directory (about-me, professional, etc.)
2. **Blog Posts** - Automatically pulled from Contentful and indexed

This provides a comprehensive knowledge base covering both personal background and technical expertise.
