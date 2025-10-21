import { getClientId } from "@/lib/rate/who";

export function getRequestId(req: Request): string {
  const h = new Headers(req.headers);
  // prefer upstream ids if present
  return (
    h.get("x-request-id") ||
    h.get("x-vercel-id") ||
    crypto.randomUUID()
  );
}

/** Wrap an Edge route handler to log route + duration + status + client id. */
export function wrapTrace(
  label: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const started = Date.now();
    const rid = getRequestId(req);
    const who = getClientId(req);
    try {
      const res = await handler(req);
      const ms = Date.now() - started;
      console.log(
        JSON.stringify({
          msg: "route",
          label,
          rid,
          who,
          method: req.method,
          status: res.status,
          ms,
        })
      );
      return res;
    } catch (err: unknown) {
      const ms = Date.now() - started;
      console.error(
        JSON.stringify({
          msg: "route_error",
          label,
          rid,
          who,
          method: req.method,
          ms,
          error: err instanceof Error ? err.message : String(err),
        })
      );
      throw err;
    }
  };
}
