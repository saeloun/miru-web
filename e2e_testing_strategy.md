# E2E Testing Strategy for Miru Web

## Current State Analysis

### Existing System Specs
- **40+ system specs** covering login, time tracking, invoices, clients, projects, teams
- Using **Rails + Capybara + Chrome/ChromeDriver** 
- Currently **excluded from CI** (commented out)
- Tests are **brittle** with selector issues after React/Webpack migration

### Problems with Current Approach
- Specs break due to React component rendering changes
- Brittle selectors that don't adapt to modern React patterns
- Slow execution in CI (Chrome startup, page loads)
- Complex test data setup with Rails factories
- System specs run serially, not in parallel

---

## Strategy Comparison: Rails vs Playwright

### Option 1: Fix Rails System Specs ⚡
**Recommended for immediate stability**

#### Pros
✅ **Faster to implement** - existing infrastructure  
✅ **Integrated with Rails** - same database, factories, auth helpers  
✅ **Familiar to Rails devs** - RSpec syntax, existing patterns  
✅ **Shared test data** - can reuse factories and AR models  
✅ **Built-in debugging** - Rails logger, database introspection  

#### Cons
❌ **Tight coupling** - tests depend on Rails internals  
❌ **Slower startup** - Rails boot time per test  
❌ **Limited browser testing** - Chrome only  
❌ **Complex CI setup** - needs Rails + DB + webpack  

#### Implementation Plan
1. **Modernize selectors** - use data-testid attributes
2. **Fix React component detection** - wait for React hydration
3. **Improve test helpers** - better authentication flows
4. **Parallel execution** - split specs across CI nodes

### Option 2: Playwright E2E Tests 🚀
**Best for long-term scalability and modern practices**

#### Pros  
✅ **Modern & fast** - V8 engine, parallel execution  
✅ **Multi-browser** - Chrome, Firefox, Safari, Edge  
✅ **Better reliability** - auto-wait, retry mechanisms  
✅ **Rich debugging** - screenshots, videos, traces  
✅ **Isolated tests** - each test gets fresh browser context  
✅ **CI optimized** - Docker containers, parallel matrix  

#### Cons
❌ **More setup** - new tooling, patterns to learn  
❌ **Data isolation** - need API calls or separate DB setup  
❌ **Initial time investment** - rewrite existing specs  
❌ **Additional complexity** - app + test containers coordination  

#### Implementation Plan
1. **Containerized app** - Rails app in Docker with seeded data
2. **Playwright tests** - TypeScript tests external to Rails
3. **CI pipeline** - Docker Compose with app + test containers
4. **Test data strategy** - API calls or shared test database

---

## Recommended Approach: **Hybrid Strategy** 🎯

### Phase 1: Quick Wins (1-2 days)
**Fix Rails system specs for immediate CI stability**

```ruby
# Add to spec/support/system_helpers.rb
module SystemHelpers
  def wait_for_react_load
    expect(page).to have_css('[data-testid="app-loaded"]', wait: 10)
  end
  
  def login_as(user)
    visit "/login"
    fill_in "email", with: user.email
    fill_in "password", with: user.password
    click_button "Sign In"
    wait_for_react_load
  end
end
```

**Update components with test IDs:**
```jsx
// app/javascript/src/components/App.jsx
<div data-testid="app-loaded" className="app">
  <Routes>
    ...
  </Routes>
</div>
```

### Phase 2: Modern E2E (Future)
**Migrate to Playwright for comprehensive coverage**

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - name: Start application
        run: docker-compose -f docker-compose.ci.yml up -d
      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.browser }}
```

---

## Implementation Details

### Rails System Specs Fix (Immediate)

#### 1. Add React-aware test helpers
```ruby
# spec/support/react_helpers.rb
module ReactHelpers
  def wait_for_react
    # Wait for React to finish rendering
    page.has_css?('[data-react-component]', wait: 5)
  end
  
  def within_react_component(component_name)
    within("[data-component='#{component_name}']") do
      wait_for_react
      yield
    end
  end
end
```

#### 2. Update component markup
```erb
<!-- app/views/home/index.html.erb -->
<div 
  id="react-component-<%= SecureRandom.uuid %>" 
  data-component="App" 
  data-testid="main-app"
  data-props="<%= @props.to_json %>"
></div>
```

#### 3. Improve CI configuration
```yaml
# .github/workflows/validations.yml - Add system specs
- name: Run system specs
  if: matrix.ci_node_index == 0  # Run on single node to avoid conflicts
  env:
    RAILS_ENV: test
    CAPYBARA_APP_HOST: http://localhost:3000
  run: |
    bin/rails assets:precompile
    bundle exec rspec spec/system --format progress
```

### Playwright E2E Tests (Future)

#### 1. Project structure
```
e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── signup.spec.ts
│   ├── time-tracking/
│   │   ├── create-entry.spec.ts
│   │   └── edit-entry.spec.ts
│   └── invoices/
│       ├── generate-invoice.spec.ts
│       └── send-invoice.spec.ts
├── fixtures/
│   ├── users.json
│   └── companies.json
├── page-objects/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── TimeTrackingPage.ts
└── playwright.config.ts
```

#### 2. Example test
```typescript
// e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Authentication', () => {
  test('user can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.loginWith('vipul@example.com', 'welcome22');
    
    await expect(page).toHaveURL('/time-tracking');
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });
});
```

#### 3. Docker setup for CI
```yaml
# docker-compose.e2e.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - RAILS_ENV=test
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/miru_test
    ports:
      - "3000:3000"
    depends_on:
      - db
      - webpack
    
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: miru_test
    
  webpack:
    build: .
    command: bin/shakapacker-dev-server
    ports:
      - "3035:3035"
    
  playwright:
    image: mcr.microsoft.com/playwright:latest
    volumes:
      - ./e2e:/e2e
    working_dir: /e2e
    command: npx playwright test
    depends_on:
      - app
```

---

## Performance Comparison

| Metric | Rails System Specs | Playwright E2E |
|--------|-------------------|----------------|
| **Setup Time** | ~30s Rails boot | ~5s container start |
| **Test Execution** | 2-5s per test | 1-3s per test |
| **Parallel Tests** | Limited by DB | Full parallelization |
| **CI Time** | 10-15 minutes | 5-8 minutes |
| **Debugging** | Rails logs | Screenshots + videos |
| **Maintenance** | High (brittle) | Low (stable selectors) |

---

## Recommendation: **Start with Rails, Migrate to Playwright**

### Immediate Actions (This Week)
1. ✅ **Fix current system specs** - update selectors, add test IDs
2. ✅ **Enable in CI** - uncomment and run system specs  
3. ✅ **Add React helpers** - wait for component mounting

### Future Migration (Next Month)  
1. 🎯 **Set up Playwright** - new e2e directory and config
2. 🎯 **Migrate critical flows** - login, time tracking, invoicing
3. 🎯 **Parallel CI** - Docker-based E2E pipeline
4. 🎯 **Deprecate Rails specs** - once Playwright coverage is complete

This hybrid approach gives us **immediate stability** while building toward **best-in-class E2E testing**.

---

## Next Steps

**Ready to implement Phase 1** - shall we start by fixing the Rails system specs to get CI green?

The approach will be:
1. Fix selectors and add React-aware helpers
2. Enable system specs in CI 
3. Ensure all tests pass reliably
4. Plan Phase 2 Playwright migration

**Estimated timeline:** 2-3 days for stable Rails system specs, 1-2 weeks for full Playwright migration.