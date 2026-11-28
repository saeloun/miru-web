# Company address save verification

[Saved address after reopening Company Settings](recovery-20261128/company-address-saved.png), captured locally in headless Brave at source revision `87a12db856878b86efad22f149121f82d01c463b` on 28 November 2026. All names, contact information and address values are synthetic test fixtures.

The regression types `12 Example Street` and `Suite 3`, saves, reopens Settings and checks both persisted values. All nine Company Settings browser examples passed at this source revision with console-error assertions. The required 30-second Vite build, relevant lint, runtime dependency checks and isolated gem/Ruby advisory checks also passed.

The source revision normally merges public security revision `80bdaecffc6740bb77de60ea5fa86aa2c994d311` into the original address fix `e63a66c2c9f5954b91193958d3f745341b7810af`; the address component and regression spec remain byte-identical to that fix. This screenshot verifies the local synthetic flow, not hosted CI, production configuration or deployment.
