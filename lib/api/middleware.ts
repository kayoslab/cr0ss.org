import { NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Creates a standardized JSON error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: unknown,
  code?: string
): NextResponse<ApiError> {
  const response: ApiError = { error };
  if (details) response.details = details;
  if (code) response.code = code;

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized JSON success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse<ApiError> }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        response: createErrorResponse(
          'Validation failed',
          400,
          result.error.flatten(),
          'VALIDATION_ERROR'
        ),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: createErrorResponse(
        'Invalid JSON in request body',
        400,
        undefined,
        'INVALID_JSON'
      ),
    };
  }
}

/**
 * Wraps an API handler with standard error handling
 */
export function withErrorHandler(
  handler: (request: Request) => Promise<NextResponse | Response>
): (request: Request) => Promise<NextResponse | Response> {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      // If error is already a Response (from assertSecret), return it
      if (error instanceof Response) {
        return error;
      }

      // Log error for debugging
      console.error('API route error:', error);

      // Return generic error response
      if (error instanceof Error) {
        return createErrorResponse(
          'Internal server error',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return createErrorResponse('An unexpected error occurred', 500);
    }
  };
}

/**
 * Context passed to API route handlers
 */
export interface ApiContext {
  clientId?: string;
  requestId?: string;
}

/**
 * Type-safe API route handler builder with common middleware
 */
export class ApiRouteBuilder<TContext extends ApiContext = ApiContext> {
  private middlewares: Array<
    (request: Request, context: TContext) => Promise<void>
  > = [];
  private traceName?: string;

  /**
   * Add custom middleware to the chain
   */
  use(
    middleware: (request: Request, context: TContext) => Promise<void>
  ): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Add authentication middleware (uses assertSecret)
   */
  withAuth(): this {
    return this.use(async (request) => {
      const { assertSecret } = await import('@/lib/auth/secret');
      assertSecret(request);
    });
  }

  /**
   * Add rate limiting middleware
   *
   * @param bucket - Rate limit bucket name (e.g., "get-dashboard")
   * @param options - Rate limit options (windowSec, max)
   */
  withRateLimit(
    bucket: string,
    options: { windowSec: number; max: number }
  ): this {
    return this.use(async (request, context) => {
      const { rateLimit } = await import('@/lib/rate/limit');
      const { getClientId } = await import('@/lib/rate/who');
      const { tooManyRequests } = await import('@/lib/api/responses');

      const result = await rateLimit(request, bucket, options);
      if (!result.ok) {
        throw tooManyRequests(result.retryAfterSec);
      }

      // Store client ID in context
      context.clientId = getClientId(request);
    });
  }

  /**
   * Add observability tracing
   *
   * @param name - Trace name (e.g., "GET /api/dashboard")
   */
  withTrace(name: string): this {
    this.traceName = name;
    return this;
  }

  /**
   * Build the final handler with all middleware applied
   */
  handle(
    handler: (
      request: Request,
      context: TContext
    ) => Promise<NextResponse | Response>
  ): (request: Request) => Promise<NextResponse | Response> {
    const wrappedHandler = withErrorHandler(async (request: Request) => {
      const context = {} as TContext;

      // Run all middlewares
      for (const middleware of this.middlewares) {
        await middleware(request, context);
      }

      // Run the actual handler
      return await handler(request, context);
    });

    // Apply tracing if specified
    if (this.traceName) {
      return async (request: Request) => {
        const { wrapTrace } = await import('@/lib/obs/trace');
        return wrapTrace(this.traceName!, wrappedHandler)(request);
      };
    }

    return wrappedHandler;
  }
}

/**
 * Creates a new API route builder
 *
 * @example
 * ```ts
 * export const GET = createApiRoute()
 *   .withAuth()
 *   .withRateLimit("get-dashboard", { windowSec: 60, max: 30 })
 *   .withTrace("GET /api/dashboard")
 *   .handle(async (req, ctx) => {
 *     const data = await getDashboardData();
 *     return apiSuccess(data);
 *   });
 * ```
 */
export function createApiRoute<TContext extends ApiContext = ApiContext>(): ApiRouteBuilder<TContext> {
  return new ApiRouteBuilder<TContext>();
}
