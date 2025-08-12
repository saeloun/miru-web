# Architecture Decision: Miru Web Modernization

## Decision: Hybrid Modern Rails with React Islands

### Current State
- Rails 8.0.2 monolith with React components
- Custom token authentication
- Vite for frontend bundling
- Significant investment in React components

### Recommendation: Keep Monolith, Modernize Incrementally

## Why We're NOT Separating Frontend/Backend

1. **Complexity Cost**: Two repos, two deployments, CORS management, API versioning
2. **Jumpstart Pro Success**: Proves modern Rails monoliths work well
3. **Existing Investment**: Significant React codebase already integrated
4. **Team Efficiency**: Single codebase easier to maintain

## Modernization Strategy

### Phase 1: Authentication (Immediate)
- Migrate to JWT with devise-jwt
- Maintain backward compatibility
- Add token refresh mechanism

### Phase 2: UI Modernization (Q1 2025)
```bash
# Add shadcn/ui Rails components
rails g shadcn_ui init
rails g shadcn_ui add button card dialog
```

- Integrate shadcn/ui with Violet theme
- Replace components progressively
- Keep React for complex interactions
- Use ViewComponents for simpler UI

### Phase 3: Performance Optimization
- Deploy main app on Fly.io
- Static assets on Cloudflare CDN
- Optional: Marketing pages on Cloudflare Pages

## Architecture Principles

1. **Progressive Enhancement**: Start with Rails, enhance with React where needed
2. **Island Architecture**: React components as islands in Rails views
3. **Design System**: shadcn/ui for consistent, modern UI
4. **API-Ready**: JWT auth makes future API extraction possible

## Benefits

- ✅ Maintains development velocity
- ✅ Reduces complexity
- ✅ Modern UI without full rewrite
- ✅ Future flexibility for API/mobile
- ✅ Lower operational overhead

## Migration Path

If future separation needed:
1. JWT auth already in place
2. Extract API controllers
3. Deploy frontend separately
4. No authentication rewrite needed

## Decision Date: August 2025
## Review Date: Q2 2025