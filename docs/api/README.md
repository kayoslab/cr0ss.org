# CR0SS.org API Documentation

OpenAPI 3.0 specification for the CR0SS.org API.

## Viewing the Documentation

### Option 1: Swagger UI (Recommended)

Visit the online Swagger Editor with your spec:
```bash
https://editor.swagger.io/
```

Then:
1. Click **File → Import file**
2. Select `openapi.yaml`
3. View interactive documentation with Try-It-Out features

### Option 2: Swagger UI Locally

Install Swagger UI:
```bash
npm install -g swagger-ui-watcher
```

Run from this directory:
```bash
swagger-ui-watcher openapi.yaml
```

Open http://localhost:8080 in your browser.

### Option 3: VS Code Extension

Install the "Swagger Viewer" extension and open `openapi.yaml` to preview.

### Option 4: Redoc

For a clean documentation view:
```bash
npx @redocly/cli preview-docs openapi.yaml
```

## API Overview

### Base URLs
- **Production:** `https://cr0ss.org/api`
- **Development:** `http://localhost:3000/api`

### Authentication

Most endpoints require the `X-Secret` header:
```bash
curl -H "X-Secret: your-secret-token" https://cr0ss.org/api/dashboard
```

Public endpoints (no auth required):
- `/chat` - AI chat
- `/algolia/search` - Search
- `/algolia/analytics` - Analytics tracking
- `/featured-posts` - Featured blog posts

### Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| AI Chat | 10 requests | 12 hours |
| Search | 100 requests | 60 seconds |
| Habits (coffee, workouts, goals) | 30 requests | 60 seconds |
| Revalidation | 5 requests | 5 minutes |
| Location | 10 requests | 60 seconds |
| Dashboard | 10 requests | 60 seconds |

When rate limited, the `Retry-After` header indicates seconds until retry.

## API Categories

### 🤖 AI
- `POST /chat` - Chat with AI assistant (RAG-powered)
- `POST /ai/reindex-blog` - Reindex blog for vector search
- `POST /ai/reindex-knowledge` - Reindex knowledge base

### 🔍 Search
- `GET /algolia/search` - Search blog posts
- `POST /algolia/analytics` - Track search analytics

### 📊 Habits
- `GET/POST /habits/coffee` - Coffee consumption tracking
- `POST /habits/workout` - Workout logging
- `POST /habits/day` - Daily habit tracking
- `GET/POST /habits/goal` - Monthly goal management
- `GET/POST /habits/body` - Body profile tracking

### 📝 Content
- `GET /featured-posts` - Get trending/recent posts
- `POST /revalidate` - Trigger cache revalidation

### 📈 Dashboard
- `GET /dashboard` - Comprehensive analytics data

### 📍 Location
- `POST /location` - Update location
- `POST /location/clear` - Clear location

### 🔐 Auth
- `GET /auth/check` - Verify authentication

## Example Requests

### Chat with AI
```bash
curl -X POST https://cr0ss.org/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your thoughts on TypeScript?"}'
```

### Search Blog Posts
```bash
curl "https://cr0ss.org/api/algolia/search?q=typescript"
```

### Log Coffee Consumption
```bash
curl -X POST https://cr0ss.org/api/habits/coffee \
  -H "Content-Type: application/json" \
  -H "X-Secret: your-secret" \
  -d '{
    "date": "2025-01-15",
    "time": "14:30",
    "type": "v60",
    "amount_ml": 250
  }'
```

### Log Workout
```bash
curl -X POST https://cr0ss.org/api/habits/workout \
  -H "Content-Type: application/json" \
  -H "X-Secret: your-secret" \
  -d '{
    "date": "2025-01-15",
    "workout_type": "running",
    "duration_min": 45,
    "intensity": "moderate",
    "details": {"distance_km": 8.5}
  }'
```

### Update Monthly Goals
```bash
curl -X POST https://cr0ss.org/api/habits/goal \
  -H "Content-Type: application/json" \
  -H "X-Secret: your-secret" \
  -d '{
    "running_distance_km": 100,
    "reading_minutes": 600,
    "steps": 200000
  }'
```

### Get Dashboard Data
```bash
curl -H "X-Secret: your-secret" https://cr0ss.org/api/dashboard
```

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": 1706184000000
}
```

### Common Error Codes
- `UNAUTHORIZED` - Missing or invalid authentication
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Validation

The API uses Zod schemas for validation. See the OpenAPI spec for detailed field requirements.

## Caching

- **Dashboard data**: Cached for 5 minutes
- **Featured posts**: Cached with CDN (3600s max-age, 7200s stale-while-revalidate)
- **Coffee data**: NOT cached (real-time)

## Contributing

To update the API documentation:

1. Modify `openapi.yaml`
2. Validate the spec:
   ```bash
   npx @redocly/cli lint openapi.yaml
   ```
3. Preview changes locally
4. Commit both `openapi.yaml` and this README

## Tools

### Validation
```bash
# Install Redocly CLI
npm install -g @redocly/cli

# Validate spec
npx @redocly/cli lint openapi.yaml

# Bundle spec (if using refs)
npx @redocly/cli bundle openapi.yaml -o openapi-bundled.yaml
```

### Code Generation

Generate client SDKs from the OpenAPI spec:

```bash
# TypeScript/JavaScript client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/client

# Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client
```

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Redoc Documentation](https://redocly.com/docs/)
- [OpenAPI Generator](https://openapi-generator.tech/)
