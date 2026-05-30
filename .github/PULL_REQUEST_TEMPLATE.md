## What and why

<!-- One or two sentences. Link to the issue(s) this closes. -->
Closes #

## Test gates

- [ ] `npm test` (unit) passes
- [ ] `npm run test:integration` passes (needs a throwaway Neon branch — see CONTRIBUTING.md)
- [ ] `npm run test:e2e` passes
- [ ] `npx astro check` clean (type errors surface here, not in build)

## Manual a11y

- [ ] Keyboard navigation: all interactive elements reachable and operable by keyboard alone; no focus traps except intentional dialogs
- [ ] Focus order: visible focus indicator present; tab order matches visual reading order
- [ ] Screen-reader smoke: page/section headings announced; interactive controls have accessible names; live regions fire for dynamic content (quiz feedback, exam timer, toast messages)
- [ ] Colour is not the only signal: error states, status badges, and highlights also use text or shape

## Cross-browser

- [ ] Chrome / Chromium (CI gate — Playwright)
- [ ] Safari / WebKit
- [ ] Firefox

## Notes for reviewer

<!-- Anything that needs extra eyes, known caveats, or follow-up issues. -->
