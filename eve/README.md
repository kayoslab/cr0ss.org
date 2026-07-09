# Eve recall agent

The private query interface for the contact-memory system. This is a **separate
Vercel deployment** from the main site — it connects back to the site's MCP
server (`/api/mcp/mcp`) to search your contacts, and is locked to **you only**.

This folder is excluded from the main site's TypeScript build (`tsconfig.json`),
because the Eve agent has its own project + tooling.

## What's here

- `connections/contacts.ts` — the Vercel Connect–brokered MCP connection to the
  site's `search_contacts` tool.
- `agents/recall.md` — the system prompt for the recall agent.

## One-time setup (interactive — run these yourself)

These steps create cloud resources and open a browser for consent, so they can't
be automated here.

1. **Scaffold the Eve project** (in this folder or a sibling repo):

   ```bash
   npx eve@latest init recall-agent
   ```

   Drop `connections/contacts.ts` and the `agents/recall.md` prompt into the
   generated project (see `vercel-labs/personal-agent-template` for a reference
   layout: web chat + Better Auth + Vercel Connect).

2. **Deploy the main site** so the MCP endpoint is live at
   `https://<your-domain>/api/mcp/mcp`, and set `MCP_BEARER_TOKEN` in the site's
   Vercel env (used by the baseline hard gate).

3. **Create the Vercel Connect connector** pointing at the MCP endpoint (run from
   this agent folder so Vercel auto-wires project access):

   ```bash
   vercel connect create https://<your-domain>/api/mcp/mcp --name contacts
   ```

   Capture the printed connector id (e.g. `mcp.<your-domain>/contacts`) and use
   it in `connections/contacts.ts`.

4. **Lock the agent to you only.** In the Eve project, gate the web chat behind
   **Sign in with Vercel** (or Better Auth) allowlisting a single identity
   (`hello@cr0ss.org`). The connection's `connect(...)` per-user OAuth flow means
   only your brokered identity can obtain a token to reach the MCP server.

5. **Deploy the agent** (`vercel deploy`) and open its web chat. Ask:
   *"who did I meet building AI agents in London?"*

## Security layers (defense in depth)

1. **Vercel Connect / Sign in with Vercel** — brokered OIDC identity, single
   subject allowlisted. The model never sees the URL or credentials.
2. **`MCP_BEARER_TOKEN`** — baseline hard gate on `/api/mcp/*` (returns 401
   without it). See `app/api/mcp/[transport]/route.ts` → `withMcpAuth`.
3. **Vercel Firewall (WAF)** — optionally restrict `/api/mcp/*` by IP / add a
   rule; the public capture endpoint (`/api/capture`) stays open.

The public **capture** surface is open by design; the **query** surface is fully
private.
