# Invoice address layout QA

Target: public invoice view, signed-in client invoice detail and admin invoice detail at 1400px and 390px. Base branch: `main` is not assumed; PR #2488 targets `develop`.

Contract: full company and client legal names, addresses and tax identifier remain visible, wrap within their document sections and do not overlap later invoice content. Mobile must include billed-to details. Payment controls and amounts are unchanged by this unit.

Isolation: dedicated Razorpay linked worktree, its synthetic PostgreSQL container on localhost:55449, a test-only Rails server on localhost:3117, and the existing headless Brave/Capybara harness. External network access is denied. No production data, personal Brave session, bank connection, transfer or email delivery is permitted.

Method: native RSpec browser regression with actual DOM geometry, desktop/mobile screenshots and console-error checks; source-only local Qwen proposals are reviewed before applying. No browser or test framework installation is needed. Aside is absent; browser verification uses the already configured Brave executable, not a different browser.

Value: protects=invoice identity and billing details; fails_when=text is clipped, escapes its local document containers or mobile billing is omitted; why_new=payment-hold captures checked controls but not full legal-address geometry; seam=none; no_claim=PDF layout, live provider acceptance or production readiness.

Exit: the regression and adjacent invoice/payment browser flows pass on the final source, required Vite builds and focused lint pass, and all retained screenshots are inspected. Any unverified surface remains explicitly open. This is a scoped visual/console check, not a whole-application health score.
