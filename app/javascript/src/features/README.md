# Feature-Based Architecture for Vite + Rails

This structure is optimized for Vite + Rails applications, inspired by modern patterns from Remix, Next.js App Router, and feature-sliced design.

## Directory Structure

```
src/
├── features/              # Feature-based modules
│   ├── invoices/
│   │   ├── api/          # API layer
│   │   │   ├── index.ts  # API client & types
│   │   │   └── mocks.ts  # Mock data for testing
│   │   ├── components/   # Shared invoice components
│   │   │   ├── InvoiceCard.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   └── InvoicePreview.tsx
│   │   ├── hooks/        # Custom hooks
│   │   │   ├── index.ts
│   │   │   └── useInvoice.ts
│   │   ├── routes/       # Route modules
│   │   │   ├── dashboard/
│   │   │   │   ├── route.tsx      # Main route component
│   │   │   │   ├── loader.ts      # Data fetching
│   │   │   │   ├── actions.ts     # Mutations
│   │   │   │   ├── context.tsx    # Route-specific context
│   │   │   │   └── components/    # Route-specific components
│   │   │   ├── edit.$id/
│   │   │   │   ├── route.tsx
│   │   │   │   ├── loader.ts
│   │   │   │   └── actions.ts
│   │   │   └── new/
│   │   │       ├── route.tsx
│   │   │       └── actions.ts
│   │   ├── store/        # Feature state (if needed)
│   │   │   └── invoiceStore.ts
│   │   └── utils/        # Feature utilities
│   │       └── validation.ts
│   └── [other-features]/
├── components/            # Global shared components
│   └── ui/               # shadcn/ui components
├── lib/                  # Global utilities
│   ├── api-client.ts     # Base API client
│   ├── utils.ts          # Utility functions
│   └── constants.ts      # Global constants
├── hooks/                # Global hooks
└── styles/              # Global styles
```

## Key Concepts

### 1. Feature Modules
Each feature is self-contained with its own API, components, hooks, and routes.

### 2. Route Modules
Inspired by Remix, each route has:
- `route.tsx`: Main component
- `loader.ts`: Data fetching (can be used for SSR or prefetching)
- `actions.ts`: Mutations and form submissions
- `context.tsx`: Route-specific state management

### 3. Data Fetching Strategy
- Use React Query for client-side data fetching
- Loaders can be used for prefetching or SSR
- Actions handle mutations with optimistic updates

### 4. Type Safety
- Full TypeScript support
- Shared types in API modules
- Strict typing for API responses

### 5. Code Splitting
Vite automatically code-splits at the route level, ensuring optimal bundle sizes.

## Benefits

1. **Scalability**: Features can be developed independently
2. **Maintainability**: Clear separation of concerns
3. **Type Safety**: End-to-end type safety
4. **Performance**: Automatic code splitting and lazy loading
5. **Testing**: Easy to test individual features in isolation
6. **Team Collaboration**: Teams can work on different features without conflicts

## Usage Example

```typescript
// In your main router
import { lazy } from 'react';

const InvoiceDashboard = lazy(() => 
  import('@/features/invoices/routes/dashboard/route')
);

const InvoiceEdit = lazy(() => 
  import('@/features/invoices/routes/edit.$id/route')
);

// Routes configuration
const routes = [
  {
    path: '/invoices',
    element: <InvoiceDashboard />,
  },
  {
    path: '/invoices/:id/edit',
    element: <InvoiceEdit />,
  },
];
```

## Rails Integration

This structure works seamlessly with Rails:

1. **API Routes**: Rails controllers provide the API endpoints
2. **Authentication**: Handled by Rails with CSRF tokens
3. **Assets**: Vite serves the frontend assets
4. **Development**: Vite dev server proxies API requests to Rails

## Best Practices

1. **Keep features isolated**: Don't import from other features directly
2. **Use the API layer**: All backend communication through the API module
3. **Leverage TypeScript**: Define types for all API responses
4. **Optimize bundles**: Use dynamic imports for large components
5. **Test thoroughly**: Unit test hooks, integration test routes