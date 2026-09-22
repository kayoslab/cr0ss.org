import { defineMcpClientConnection } from "eve/connections";
import { connect } from "@vercel/connect/eve";

/**
 * Connection from the Eve agent to this site's private contact-memory MCP server.
 *
 * The URL points at the Streamable HTTP endpoint exposed by
 * `app/api/mcp/[transport]/route.ts` in the main site. Vercel Connect brokers
 * the auth so the model never sees the URL or credentials.
 *
 * The connector id
 * (`mcp.<host>/<name>`) is created with:
 *
 *   vercel connect create https://cr0ss.org/api/mcp/mcp --name contacts
 */
export default defineMcpClientConnection({
  url: "https://cr0ss.org/api/mcp/mcp",
  description:
    "Private contact memory — semantic recall over the people I've met.",
  // Per-user OAuth flow via Vercel Connect (owner identity only).
  auth: connect("mcp.cr0ss.org/contacts"),
});
