---
name: miru-modern-web-audit
description: |
  Audit Miru web surfaces against Google Chrome Modern Web Guidance. Use for
  performance, accessibility, privacy, security, Core Web Vitals, console,
  network, and modern browser API reviews of app.miru.so, miru.so, Saeloun
  blog/website surfaces, or local frontend repos. Always consult the installed
  modern-web-guidance skill first.
---

# Miru Modern Web Audit

Use this skill when auditing Miru web properties or implementing frontend fixes
that should follow Chrome Modern Web Guidance.

## Required Source

Load the official generated skill first:

```sh
npx -y modern-web-guidance@latest search "<audit or implementation query>" --skill-version 2026_05_16-c5e7870
```

For broad Miru audits, retrieve these guide IDs before judging findings:

```sh
npx -y modern-web-guidance@latest retrieve "performance,accessibility,security,privacy"
```

Use narrower guides when a finding points to a specific fix, for example:

```sh
npx -y modern-web-guidance@latest search "improve LCP INP long tasks image priority"
npx -y modern-web-guidance@latest search "accessible form errors focus keyboard navigation"
npx -y modern-web-guidance@latest search "content security policy permissions policy referrer policy cookies"
```

## Targets

- App: `https://app.miru.so`
- Authenticated app page: prefer `/time-tracking`, `/dashboard`, or the reported
  broken route. Use production Saeloun test credentials from local env only when
  available; never print secrets.
- Marketing: `https://miru.so`
- Docs, when requested or relevant: `https://docs.miru.so`
- Saeloun blog, when requested: `https://blog.saeloun.com`
- Saeloun website, when requested: prefer `https://www.saeloun.com`, then confirm
  canonical behavior from redirects.

## Repositories

- Miru app: `/Users/sward/saeloun/miru-web`
- Miru marketing: `/Users/sward/saeloun/miru-marketing-website`
- Saeloun blog: `/Users/sward/saeloun/blog`
- Saeloun website: `/Users/sward/saeloun/website`

## Audit Workflow

1. Confirm the relevant live URLs respond.
2. For app pages, authenticate with a safe production test account if needed.
3. Capture browser evidence with Playwright or Chrome DevTools:
   console errors, page errors, failed requests, 4xx/5xx responses, page text,
   screenshots, and key loaded URLs.
4. Run Lighthouse or equivalent Chrome audit evidence for public pages. For
   authenticated app pages, use a persistent browser context or a scripted login.
5. Map each finding to Chrome guide themes:
   performance and Core Web Vitals, accessibility, security, privacy, and modern
   browser API usage.
6. Classify findings:
   P0 production breakage, P1 user-visible or security issue, P2 measurable
   quality/performance issue, P3 cleanup or opportunity.
7. Fix only clearly scoped issues when the user asks for implementation. For
   broader audits, report findings first and avoid speculative rewrites.

## Evidence Standard

Do not claim a production page is healthy unless the live page was loaded in a
real browser and checked for console errors, page errors, failed requests, and
HTTP 4xx/5xx responses. For JS/TS fixes in this repo, run:

```sh
rtk mise exec -- timeout 30 bin/vite build
```

Run focused lint/tests for touched files before handoff.
