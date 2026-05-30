# Contributing

## Visual regression baselines

Visual snapshots are produced by Playwright `toHaveScreenshot()` against a
**pinned** `@playwright/test` version (see `package.json`). The pin fixes the
bundled chromium build, which is what makes pixel diffs deterministic.

### Why baselines live in CI only

Cross-OS font rendering (macOS / Windows / Linux) diverges enough to invalidate
baselines on every contributor's machine. The visual job runs on
`ubuntu-latest` only and the spec calls `test.skip()` on non-Linux platforms.
**Do not generate or commit baselines from your laptop.** They will be wrong.

### How the job behaves

- `npm run test:visual` runs against `playwright.visual.config.ts`.
- Any unexpected pixel diff fails the PR.
- There is **no auto-update path**. Baselines change only by deliberate action.

### Updating baselines (deliberate workflow)

When a visual change is intentional (redesign, copy edit, token change):

1. Push the PR. The `visual` job will fail and upload `playwright-visual-report`
   as a workflow artifact — download it and review the diff inline.
2. If the diff is correct, regenerate baselines on Linux. Two options:
   - **Via GitHub Actions `workflow_dispatch`** (recommended — same env as CI):
     Run the **CI** workflow manually on your branch with
     `update_visual_baselines = true`. Download the `visual-baselines`
     artifact and copy its contents into `tests/visual/`.
   - **Locally via the official Playwright container** (matches CI exactly):
     ```bash
     docker run --rm -it \
       -v "$PWD":/work -w /work \
       -e CI=1 \
       mcr.microsoft.com/playwright:v1.59.1-jammy \
       sh -c "npm ci --legacy-peer-deps && npm run test:visual:update"
     ```
3. Commit the regenerated PNGs under `tests/visual/visual.spec.ts-snapshots/`
   in the **same PR** as the change that caused the diff. Reviewers see the
   visual diff and the baseline update together.
4. Never use `--update-snapshots` in CI on `main` automatically. Baselines
   are evidence; auto-updating them defeats the gate.

### Visual job is a hard gate

The `visual` CI job blocks merge on unexpected pixel diffs. Before merging any
PR whose changes affect the rendered output (layout, colours, fonts, content
width), you **must** regenerate baselines first:

1. Push the branch.
2. Trigger the **CI** workflow manually via `workflow_dispatch` on that branch
   with `update_visual_baselines = true`.
3. Download the `visual-baselines` artifact and copy the PNGs into
   `tests/visual/visual.spec.ts-snapshots/`.
4. Commit the updated baselines in the same PR.
