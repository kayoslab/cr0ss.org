# AI Agent Guardrails & Specifications

This directory contains architectural decision records (ADRs) and coding standards for AI agents working on the cr0ss.org codebase.

## Purpose

These documents ensure consistency, quality, and adherence to established patterns when AI agents generate or modify code in this repository.

## Documents

- **[architecture.md](architecture.md)** - High-level architecture patterns and principles
- **[coding-standards.md](coding-standards.md)** - Code style, naming conventions, and best practices
- **[tech-stack.md](tech-stack.md)** - Technology choices and when to use them
- **[api-patterns.md](api-patterns.md)** - API route design patterns and conventions
- **[component-patterns.md](component-patterns.md)** - React component patterns and organization
- **[database-patterns.md](database-patterns.md)** - Database query patterns, migrations, and JSONB usage
- **[testing.md](testing.md)** - Testing approach and requirements
- **[security.md](security.md)** - Security guidelines and requirements

## Quick Reference

### Key Principles

1. **Type Safety First** - Always use TypeScript with strict mode
2. **DRY (Don't Repeat Yourself)** - Extract common patterns to shared utilities
3. **Consistent Patterns** - Follow existing patterns in the codebase
4. **Progressive Enhancement** - Start with working code, then optimize
5. **Document Decisions** - Update these files when patterns change

### Before Making Changes

- ✅ Read the relevant specification documents
- ✅ Check existing code for similar patterns
- ✅ Ensure TypeScript compiles without errors
- ✅ Update documentation if patterns change
- ✅ Consider backward compatibility

### File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `blog-grid.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `metadata.ts`)
- **Types**: `kebab-case.ts` (e.g., `blog.ts`)
- **API Routes**: `route.ts` (Next.js convention)
- **Constants**: `SCREAMING_SNAKE_CASE` for values

### Import Paths

Always use path aliases:
```typescript
// ✅ Good
import { BlogProps } from '@/lib/contentful/api/props/blog';

// ❌ Bad
import { BlogProps } from '../../../lib/contentful/api/props/blog';
```

## Change Process

When modifying patterns:

1. **Discuss** - Consider if the change improves the codebase
2. **Document** - Update relevant ADR documents
3. **Refactor** - Apply the change consistently across the codebase
4. **Test** - Ensure TypeScript and linting pass
5. **Commit** - Include ADR updates in the commit

## Questions?

These documents are living specifications. If patterns are unclear or missing, add them!
