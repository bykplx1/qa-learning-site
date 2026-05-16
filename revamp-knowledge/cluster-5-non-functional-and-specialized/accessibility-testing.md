# Research: Accessibility Testing

> Upstream research for `revamp-doc/clusters-and-topics.md` → Cluster 5 → topic **Accessibility Testing**.
> Recommended layer: **systems** — accessibility is taught as a *system of standards-bound disciplines* (WCAG conformance levels, automated checks, manual keyboard and screen-reader passes, the limit between automation and human judgement, accessibility-tree reasoning), not a "run axe and ship" exercise. Exercises every surface: encoding, retrieval, Feynman, projects.
> Purpose: knowledge inputs the author will compress into the topic template.

---

## 1. Core concept — the canonical framing

Accessibility testing is **the practice of verifying that a system can be used by people with disabilities — *as well as* by people who happen to use the system in non-standard ways (keyboard-only, voice control, screen magnifier, low-bandwidth, no JavaScript).** It is not a checklist; it is *conformance to the WCAG standard* plus *empathy-driven coverage of the gaps WCAG doesn't specify.*

The standard, in one paragraph: **WCAG 2.2 (Oct 2023)** organises requirements under four principles (POUR):

- **Perceivable** — content presented in ways users can sense (alt text for images, captions for video, sufficient contrast).
- **Operable** — interaction works for all input modalities (keyboard reachable, no time-trap, no seizure triggers).
- **Understandable** — content and operation are predictable (clear language, consistent navigation, error identification).
- **Robust** — content survives across user agents and assistive tech (valid HTML, ARIA used correctly, name/role/value exposed).

Each principle decomposes into success criteria. Each success criterion is graded **A · AA · AAA**:

- **Level A** — must. Failing A makes a site unusable for some users (no alt text, no keyboard access).
- **Level AA** — the standard most jurisdictions cite as legal baseline (EU EAA, US ADA via Section 508, UK PSBAR). Covers contrast, focus visible, sufficient labels.
- **Level AAA** — aspirational. Some criteria conflict with other design goals; AAA is rarely a target for whole sites.

The four testing modalities — **all required for honest coverage**:

| Modality | What it catches | What it misses |
|---|---|---|
| **Automated (axe-core, Lighthouse, pa11y)** | ~30–40% of WCAG violations: missing alt, low contrast, missing labels, ARIA misuse. | Cognitive load, screen-reader narrative quality, keyboard trap that requires interaction, real assistive-tech behaviour. |
| **Keyboard-only manual pass** | Focus order, focus visibility, keyboard trap, custom widget interaction, skip links. | Anything not behind keyboard interaction. |
| **Screen-reader manual pass** (NVDA / JAWS / VoiceOver) | Reading order, semantic structure, ARIA exposure, live-region updates, name/role/value correctness. | Visual-only issues. |
| **Real-user testing with disabled users** | Cognitive accessibility, real workflows, fatigue, real assistive-tech configurations. | Coverage — small sample sizes. |

The load-bearing claim: **automation catches a meaningful but small fraction of accessibility bugs.** Industry-standard estimates: ~30–40% (axe-core authors, Deque Systems' published studies). The other ~60% require human judgement — *can a screen reader user understand this form?*, *does keyboard tab order make sense?*, *can a low-vision user complete the flow?*. A team that ships "axe passes" as accessibility is shipping a partial story. The lesson must install this number deeply enough that it becomes a default reservation.

The companion claim: **accessibility is a property of the *deployed* artefact, not the source code.** A perfectly semantic React component can render as inaccessible HTML through a CSS-in-JS quirk, a hydration mismatch, or a dynamic ARIA attribute that breaks under route change. The test must run against rendered output, not against source intent.

---

## 2. Why it matters for QA — the QA lens

Accessibility is the non-functional concern with **the largest legal-and-ethical floor**: shipping inaccessible software excludes users, violates laws in major markets, and reveals a quality posture. The QA stakes:

1. **WCAG 2.2 AA is the operational target for most sites.** Don't aim higher in a checklist sense; the AAA criteria mix aspirational and contextual requirements (sign language for prerecorded video, AAA contrast 7:1). Many sites pass AA cleanly while failing real-user testing — which is what reveals AAA *should-haves*.
2. **WCAG 2.2 vs 2.1 differences are minor but important.** 2.2 (Oct 2023) added 9 success criteria. Target size (2.5.8) requires minimum touch targets; dragging movements (2.5.7) requires alternatives; consistent help (3.2.6); redundant entry (3.3.7); accessible authentication (3.3.8/3.3.9); focus appearance (2.4.11/2.4.12); focus not obscured (2.4.13). Several of these change SaaS-style components materially. Verify which version applies to your project — WCAG 2.1 AA is still the most common legal baseline; 2.2 AA is the modern target.
3. **The ARIA Authoring Practices Guide (APG) is a *guide*, not a spec.** APG patterns describe how *to author* common widgets. Implementing them by-the-book often produces over-aria'd code that screen readers handle worse than the simpler version. Rule of thumb (the "first rule of ARIA"): *don't use ARIA when a native element exists.* `<button>` beats `<div role="button" tabindex="0" onclick onkeydown>` in every measurable way.
4. **The accessibility tree is what the screen reader sees** (back-link to `[[frontend-prereqs-for-testers]]`). The DOM is what JavaScript sees. The render tree is what the user sees visually. Three trees, three audiences. The QA insight: testing *should target the accessibility tree* (which is what `getByRole` queries in Playwright/Testing Library; which is what axe-core inspects).
5. **Focus management is the silent killer of SPA accessibility.** When a route changes, where does focus go? When a modal opens, is focus trapped inside it? When the modal closes, does focus return to the trigger? These behaviours are invisible in source and obvious in keyboard-only testing. Most SPAs ship broken focus management; most automated tools don't catch it.
6. **Contrast is more nuanced than the calculator suggests.** WCAG 2.x uses a contrast formula that *under-counts* perceived contrast for dark-on-light vs light-on-dark. APCA (a new algorithm under WCAG 3.0 draft) corrects this. For now, use WCAG 2.x — but know it's imperfect; some pairs pass WCAG and still feel unreadable.
7. **Screen reader behaviour varies materially across NVDA / JAWS / VoiceOver / TalkBack.** A `aria-live="polite"` announcement that works in NVDA may be silent in JAWS; a `role="combobox"` pattern that works in VoiceOver may be unreadable in JAWS. Cross-screen-reader testing matters; the practical compromise is *NVDA on Windows (the most common globally), VoiceOver on macOS, VoiceOver on iOS, TalkBack on Android* — four tests, but no shortcut.
8. **Mobile accessibility is its own discipline.** Touch-target size (44×44 CSS px iOS, 48×48 dp Android), TalkBack swipe vs VoiceOver gesture differences, dynamic type / system font scaling, motion-reduce preferences. Many "accessible web" patterns break on mobile screen readers.
9. **Captions, audio descriptions, sign language are required for video content.** Most teams ship without thinking; legal exposure is severe (Netflix lawsuit precedent, university OCR settlements). The QA contribution: catch video-content shipments without captions before launch.
10. **Accessibility regressions are common after redesigns.** A theme refresh shrinks contrast; a modal rewrite breaks focus management; a "subtle" animation triggers vestibular issues; a custom dropdown loses screen-reader exposure. Accessibility tests in CI act as a regression net for these; without them, the next redesign undoes a year of remediation.

The QA-lens summary: **accessibility testing converts inclusion from intention into evidence.** Automation handles the floor; manual modalities handle the ceiling; real-user testing is the ground truth. The QA contribution is doing all three with discipline.

---

## 3. Authoritative sources

Foundational:

- **W3C — [WAI: Web Accessibility Initiative](https://www.w3.org/WAI/)** — authoritative source for WCAG, ARIA, ATAG, UAAG.
- **WCAG 2.2 Recommendation** ([w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/)) — the standard.
- **Understanding WCAG 2.2** — the W3C explainer doc; essential alongside the spec.
- **WAI-ARIA 1.2** — the accessibility-roles spec.
- **ARIA Authoring Practices Guide (APG)** ([w3.org/WAI/ARIA/apg](https://www.w3.org/WAI/ARIA/apg/)) — patterns and worked examples.
- **MDN Accessibility section** — practical, reference-quality docs on ARIA, accessibility-tree, screen-reader testing.

Practitioner writing:

- **Deque Systems blog** ([deque.com/blog](https://www.deque.com/blog/)) — the team behind axe-core; the most rigorous practitioner source.
- **Sara Soueidan — [sarasoueidan.com](https://www.sarasoueidan.com/)** — accessibility-deep front-end writing; her ARIA series is canonical.
- **Adrian Roselli — [adrianroselli.com](https://adrianroselli.com/)** — strongly-opinionated, evidence-heavy posts on widget patterns.
- **Heydon Pickering — *Inclusive Components*** — the patterns book.
- **Léonie Watson, TetraLogical** — screen-reader behavioural research.
- **Marcy Sutton — testing-focused posts** on axe + Cypress/Playwright integration.
- **a11yproject.com** — concise reference for common patterns.

Tooling:

- **axe-core** ([github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core)) — the de facto open-source accessibility engine.
- **`@axe-core/playwright`** — Playwright integration; what this site already uses (per `CLAUDE.md`).
- **Lighthouse — Accessibility audit** — based on axe-core; provides a score plus auditing breakdown.
- **pa11y / pa11y-ci** — CLI alternative; useful for site-wide crawls.
- **WAVE (WebAIM)** — browser extension; manual-friendly visualisation.
- **Storybook a11y addon** — component-level checks during development.
- **NVDA · JAWS · VoiceOver · TalkBack** — the screen readers themselves.
- **Accessibility Insights** — Microsoft's tool; pairs automated checks with guided manual tests.
- **Stark, axe DevTools** — browser extensions for design-time and runtime audits.

Legal context (jurisdiction-dependent):

- **EU Accessibility Act (EAA, June 2025 enforcement)** — sweeping requirement for digital products sold in EU.
- **US ADA + Section 508** — federal applies broadly through case law (Domino's, 2019 SCOTUS).
- **UK PSBAR (Public Sector Bodies Accessibility Regulations)** — WCAG 2.1 AA mandated.
- **EN 301 549** — EU harmonised standard, references WCAG.

---

## 4. Deep insights / non-obvious findings

1. **axe-core catches ~30–40% of WCAG issues by Deque's own publication.** This number should be repeated in every conversation about "automated accessibility coverage." Many teams hear it as 30%-of-bugs and discount the value; the right framing is "30% caught with zero human effort — that's high leverage *and* not enough." Both halves of the statement matter.
2. **"Accessible" ≠ "WCAG AA compliant."** A site can pass WCAG AA and still be unusable for a deaf-blind user; conversely a site can fail one AA criterion and be perfectly usable. Conformance is *a useful proxy*, not a destination.
3. **The first rule of ARIA: don't use it if a native element exists.** Native `<button>`, `<a href>`, `<input type="checkbox">` come with focus, keyboard handling, screen-reader exposure, and forms participation for free. `<div role="button" tabindex="0" onkeydown=...>` reproduces a fraction of this at best. The lesson must install the rule by force.
4. **`aria-label` overrides visible label for screen-reader name.** A button with text "Save" and `aria-label="Submit"` is announced as "Submit." This is occasionally correct (icon-only buttons need `aria-label`); often wrong (forces SR users to learn a different name than sighted users see). Voice-control users have an additional bug: they can't say "Save" to click the button because the accessible name is "Submit."
5. **`role="presentation"` on tables removes their semantics for screen readers** but leaves them visually as tables. The pattern is sometimes correct (layout tables, deprecated practice) and often wrong (data tables stripped of semantics for "cleaner" SR output). The test: tab through the table with a screen reader; does cell context get announced?
6. **Live regions (`aria-live`, `role="alert"`, `role="status"`) are subtle.** "Polite" vs "assertive" produce wildly different user experiences; setting `aria-live` *after* content insertion does not trigger announcement; setting it *on a live region container* before insertion does. The lesson must walk this with a worked example.
7. **Focus visible (WCAG 2.4.7) is one of the most-failed AA criteria.** Designers strip `:focus` outlines for "aesthetic reasons" and don't replace them. The test: tab through the site without using a mouse. Is the current element *always* visually distinguishable? If not, AA fail.
8. **Skip links (WCAG 2.4.1) require visible-on-focus implementation.** A `<a href="#main">Skip to main</a>` that is `display: none` until focused works; one that is permanently `display: none` does not (it's not in the focus order). One that is permanently visible works but designers hate it. The compromise is *positioned off-screen until focused*.
9. **Touch target size (WCAG 2.2 — 2.5.8) is a frequently-violated mobile requirement.** Minimum 24×24 CSS px (with exceptions for inline-text and inline-element spacing); iOS HIG recommends 44×44 pt; Android Material recommends 48×48 dp. Web designers routinely ship 16×16 icon buttons. The mobile test catches this.
10. **The "name, role, value" triplet is the screen-reader contract.** Every interactive element must expose: a *name* (what it's called), a *role* (what kind of thing it is), and a *value/state* (checked, expanded, current value). axe-core checks for the role mostly; manual screen-reader testing catches the name and value gaps.
11. **Headings outline the page; landmarks divide it.** A page with no `<h1>`, or with skipped heading levels (h2 → h4), or with no `<main>` landmark, fails navigation expectations for screen-reader users. The test: in NVDA, press H to jump headings or D to jump landmarks. Does the structure make sense?
12. **Form labels: `<label for="id">`, implicit `<label><input></label>`, or `aria-labelledby`.** Placeholder text is *not* a label (it disappears on focus, fails contrast, and isn't a programmatic label). Many forms ship with placeholder-only "labels"; the test catches.
13. **Dynamic content changes need announcements.** Adding a search result, opening a modal, validating a form field — each is an event the screen reader doesn't notice unless announced. `aria-live`, `role="alert"`, focus management (move focus to the new content) are the three solutions. The lesson must teach which to use when.
14. **Reduced-motion preference must be honoured.** `prefers-reduced-motion: reduce` is a system-level setting. Animations should respect it (CSS `@media (prefers-reduced-motion: reduce) { ...skip animations... }`). The test: enable reduced motion in OS settings; load the site; is the animation suppressed?
15. **Modal dialog accessibility is one of the highest-failure patterns.** Correct modal requires: focus trapped inside, focus moved to first focusable element on open, focus returned on close, ESC closes, background non-interactive, `aria-modal="true"`, `role="dialog"`, accessible name via `aria-labelledby`. Most modal libraries ship missing at least two of these. The lesson must walk a modal end-to-end as a stress test.
16. **`@axe-core/playwright`'s `analyze()` produces a `violations` array with severity tags.** Filtering by impact (`critical`, `serious`, `moderate`, `minor`) is required for budgets; "no violations of any severity" is unachievable at scale. The site's current axe assertions in e2e specs (per `CLAUDE.md`) are the existing anchor here.
17. **Some axe rules require user interaction to fire.** A modal's accessibility can't be tested in its closed state. The test must *open the modal* then run axe; otherwise the entire modal pattern is invisible to the scanner. This is the most common reason for "axe passes but the site is inaccessible."
18. **Screen-reader testing has a steep learning curve.** Most QA testers cannot pick up NVDA and produce useful test results in week 1. The discipline must be invested in; pairing with a blind tester for one session compresses months of learning. Companies that take a11y seriously hire blind/low-vision testers.
19. **The accessibility tree can be inspected in DevTools.** Chrome and Firefox both have accessibility panels. The QA insight: when a screen reader misreads an element, open the accessibility panel and see what role/name/value the browser computed. This is the bridge between "the SR is wrong" and "the markup is wrong."
20. **WCAG 3.0 is in draft (years from final).** Major changes: APCA contrast algorithm, scoring model replacing pass/fail, broader scope (mobile, cognitive). Don't author tests against 3.0 yet; do know it's coming.

---

## 5. Worked-example seeds

### Seed A — The three-trees demonstration

Take a `<button>` and an `aria-button` `<div>` side-by-side. Open DevTools → Accessibility panel. Compare the computed role, name, value, focusable state. Run axe on both. Tab between them. Activate each with the spacebar and the Enter key. Discover: the `<button>` works with both keys natively; the `<div>` requires `onkeydown` handling for both, and probably only handles one. The exercise installs "use native elements" by demonstration, not lecture.

### Seed B — Keyboard-only navigation pass

Take the deployed site. Disconnect the mouse (or hide it). Navigate the homepage with Tab / Shift+Tab / Enter / Space / Escape / arrow keys. Try to complete the primary user flow (sign in, browse a lesson, take a quiz). Record every failure: focus invisible, focus order illogical, focus trap, keyboard-inaccessible widget, escape doesn't dismiss modal. Produce the bug list. Pedagogical payoff: every team that does this exercise on their own site finds bugs.

### Seed C — Screen-reader pass on a custom widget

Take a custom dropdown (combobox) on the site. Open NVDA (Windows free download). Tab to the dropdown. Listen to the announcement. Open it. Listen. Navigate options. Listen. Compare to a native `<select>` element doing the same job. The exercise teaches the cost of custom widgets — and the rule "use native unless you must."

### Seed D — Contrast audit and remediation

Pick the site's primary brand colour. Compute its contrast against the page background using axe DevTools / Stark / WebAIM contrast checker. If it fails WCAG AA (4.5:1 for body text, 3:1 for large/UI), produce a minimal palette adjustment (darken the brand by N steps) that brings it to AA. Discuss the design tradeoff: brand colour rigidity vs accessibility floor. Produce a rationale the design team would accept.

### Seed E — Modal dialog accessibility checklist walkthrough

Take a modal in the codebase. Walk the checklist:
- Focus moves to first focusable element on open?
- Focus trapped inside (Tab cycles within)?
- Esc closes?
- Background `inert` or `aria-hidden` while open?
- `role="dialog"` and `aria-modal="true"`?
- Accessible name via `aria-labelledby` pointing to the heading?
- Focus returns to the trigger on close?

Test each. Likely ≥3 fail on first audit. Produce code fixes. The exercise also surfaces the per-clause source of the issue from `[[playwright]]`/`[[frontend-prereqs-for-testers]]` substrate.

### Seed F — Live region demonstration

Add a form with inline validation. Type an invalid value. The error appears. Does NVDA announce it? Without an `aria-live` region around the error container, no. Add `role="alert"` to the error. Re-test. Announced. Now: what about the moment the error *resolves* — is that announced? Discuss the discrimination between *alert* (one-time) and *status* (continuous). The exercise teaches live regions by progressive failure recovery.

---

## 6. Pitfall seeds

- **Treating axe-core results as the accessibility test.** → Pair automated with keyboard + screen-reader manual passes; budget time for both. → Because automation catches ~30–40%; the rest is invisible to the tools.
- **Adding ARIA to "improve" accessibility.** → First rule: don't add ARIA if a native element exists. → Because over-aria'd widgets fail more screen readers than well-marked native ones.
- **Using placeholder text as label.** → Use `<label>` (visible) or `aria-label` (icon-only). Placeholders are not labels. → Because placeholders disappear on focus, fail contrast, and are not programmatic labels.
- **Removing focus outlines for design.** → Replace, don't remove; or use `:focus-visible` to scope to keyboard users only. → Because WCAG 2.4.7 (focus visible) is one of the most-failed AA criteria.
- **Trapping focus permanently (not just inside a modal).** → Trap inside modals; release on close; never trap on the page. → Because keyboard-only users can't escape and SR users hit a dead end.
- **Skipping the modal-closed state in tests.** → Run axe at every interactive state (modal open, dropdown open, error state, hover-revealed). → Because static-page scans miss interactive-state issues.
- **Forgetting `prefers-reduced-motion`.** → Honour the media query in all animations. → Because vestibular-disorder users get sick from motion; the OS setting is the user's signalled need.
- **Ignoring mobile accessibility.** → Test with TalkBack (Android) and VoiceOver (iOS); verify touch targets and dynamic type. → Because mobile a11y is its own discipline; web a11y doesn't transfer wholesale.
- **Trusting a Lighthouse score of 100.** → 100 doesn't mean accessible; it means no axe-detected issues at testable states. → Because Lighthouse Accessibility is axe under the hood, so it inherits the 30-40% ceiling.
- **No alt text vs decorative-only.** → Decorative images use `alt=""` (explicit empty); informative images use descriptive alt text. Either is correct; `alt` attribute absent is always wrong. → Because missing `alt` causes SRs to fall back to filename; explicit `alt=""` tells the SR to skip.
- **Auto-playing video without controls.** → Disable autoplay or make controls available; honour `prefers-reduced-motion`. → Because autoplay disorients SR users and triggers vestibular issues.
- **Using colour alone to convey meaning.** → Pair colour with text, icon, or pattern. → Because colour-blind users can't distinguish red-from-green error states.

---

## 7. Retrieval prompt seeds

- WCAG defines four principles (POUR). Name them and give one success criterion under each.
- Distinguish WCAG conformance levels A, AA, AAA. Which is the typical legal/operational target, and why?
- What percentage of WCAG violations does axe-core catch, per Deque's own published numbers? What is the consequence for QA planning?
- Name three things you can only catch via keyboard-only manual testing.
- *(Diagram prompt)* Sketch the three trees of the browser (DOM, render tree, accessibility tree). For an `<a role="button">` element, mark where each tree gets a different answer.
- State the "first rule of ARIA." Give an example where breaking it produces worse accessibility, not better.
- A modal dialog opens but focus stays on the trigger button. Name three downstream accessibility failures this causes.
- Distinguish `aria-live="polite"` and `role="alert"`. When do you use each?
- What is the minimum touch-target size under WCAG 2.2 (2.5.8)? How does this relate to iOS HIG and Android Material recommendations?
- Why is `<input placeholder="Email">` not an accessible label, even though the placeholder text is visible?
- Name two ways focus management fails in a typical SPA route change. How do you test each?
- A user reports the site is unusable with NVDA on a custom dropdown. The dropdown passes axe-core. What is your next test, and what are you trying to discover?

---

## 8. Practice task seed

**Task — "End-to-end accessibility audit of one user flow":** Pick a single user flow on the site (suggested: sign-in via OAuth, since multiple interactive states are involved). Produce:

- **Automated baseline:** run `@axe-core/playwright` at every state of the flow (initial, focused, opened, error). Capture the violations array. Categorise by impact.
- **Keyboard-only pass:** complete the flow with keyboard only. Document every failure (focus invisible, illogical order, missing keyboard handler, trap, ESC behaviour).
- **Screen-reader pass:** complete the flow with NVDA (or VoiceOver if Mac). Capture the announcement transcript for key moments. Note any silent state changes.
- **Heuristic audit:** evaluate against POUR — for each principle, name one concrete pass and one concrete fail.
- **Remediation plan:** for the top-3 issues by severity, propose a fix (code-level if possible, design-level if not). Include a regression test for each fix.

**Rubric (revealed after submission):**

- Did the candidate test *interactive states* with axe (modal-open, dropdown-open), not just the static page?
- Did the keyboard pass identify *at least one* issue automation missed?
- Did the screen-reader pass identify *at least one* issue both automation and keyboard missed? (If not, are you really running the SR or just observing the screen?)
- Did the remediation plan include *regression tests*, not just fixes?
- Did the candidate distinguish A/AA/AAA conformance levels correctly when describing each issue?
- Bonus: did the candidate notice a `prefers-reduced-motion`, contrast, or touch-target issue *not* directly part of the flow but visible during the audit?

---

## 9. Wikilink candidates

- `[[frontend-prereqs-for-testers]]` *(Cluster 4)* — the accessibility tree is one of the three trees; this topic operationalises it.
- `[[playwright]]` *(Cluster 4)* — `@axe-core/playwright` is the integration; `getByRole` queries the accessibility tree.
- `[[ci-cd-for-testing]]` *(Cluster 4)* — axe assertions run in CI per `CLAUDE.md`; the budget lives there.
- `[[performance-testing]]` *(this cluster)* — Lighthouse covers both perf and a11y audits in one tool.
- `[[security-testing]]` *(this cluster)* — accessible-authentication (WCAG 2.2 — 3.3.8) overlaps with auth UX security.
- `[[mobile-testing-overview]]` *(Cluster 4)* — mobile a11y (TalkBack, VoiceOver, touch targets) is a specialisation.
- `[[test-types-smoke-sanity-regression-uat]]` *(Cluster 3)* — a11y regression suite belongs in the regression-test type.
- `[[defect-lifecycle-and-bug-reporting]]` *(Cluster 3)* — a11y bugs need WCAG-criterion-cited reports.
- `[[exploratory-testing]]` *(Cluster 2)* — keyboard-only exploration is a focused exploratory mode.
- `[[shift-left-and-shift-right]]` *(Cluster 2)* — design-system a11y is shift-left; in-prod a11y telemetry is shift-right.

---

## 10. Open questions / what to verify before authoring

- **WCAG 2.2 adoption state.** Verify which jurisdictions cite 2.1 vs 2.2 currently. EU EAA enforcement (June 2025) — has reference standard moved to 2.2?
- **axe-core current version.** API has evolved; verify the current `analyze()` shape, `violations[].nodes`, impact levels.
- **`@axe-core/playwright` version compatibility** with the site's pinned Playwright 1.59.1. Verify integration still works.
- **NVDA · JAWS · VoiceOver versions for current behaviour.** Screen-reader behaviour shifts across versions; the lesson should name "as of date X."
- **Accessibility Insights** state — Microsoft's tool has shifted scope; verify whether it's still the recommended guided-test tool.
- **APCA / WCAG 3.0 status.** Has APCA been adopted by any official standard yet? Verify before referencing.
- **EU EAA (Accessibility Act).** June 2025 enforcement — verify the current state and what it requires beyond WCAG.
- **Storybook a11y addon current state** — useful for component-level checks during development.
- **Lighthouse accessibility audit current rules** — verify which axe rules it includes, since it's not the full set.
- **Practice task SR choice.** NVDA on Windows (free, recommended). Verify whether VoiceOver-on-Mac instructions remain accurate; Apple has changed gesture defaults.
- **`@axe-core/playwright` exclusion options** — for shadow-DOM components, third-party widgets the team doesn't own. Verify current API for `.exclude()`.

---

## Sources

- [W3C — WAI](https://www.w3.org/WAI/)
- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN — Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [axe-core](https://github.com/dequelabs/axe-core)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Deque blog](https://www.deque.com/blog/)
- [a11yproject.com](https://www.a11yproject.com/)
- [Sara Soueidan — accessibility writing](https://www.sarasoueidan.com/blog/)
- [Adrian Roselli](https://adrianroselli.com/)
- [Heydon Pickering — Inclusive Components](https://inclusive-components.design/)
- [TetraLogical](https://tetralogical.com/blog/)
- [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)
- [Microsoft Accessibility Insights](https://accessibilityinsights.io/)
- [pa11y](https://pa11y.org/)
- [NVDA](https://www.nvaccess.org/)
- [EN 301 549](https://www.etsi.org/standards#page=1&search=EN%20301%20549)
- [European Accessibility Act](https://ec.europa.eu/social/main.jsp?catId=1202)
