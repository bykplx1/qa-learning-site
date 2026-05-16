/* global React */

/* ===== Real curriculum data, sourced from the qa-vault ===== */
const CATEGORIES = [
  { id: "fundamentals", num: "01", title: "Fundamentals", count: 7, done: 5,
    blurb: "Test design, levels, types, principles, defect lifecycle." },
  { id: "strategies", num: "02", title: "Testing Strategies", count: 5, done: 3,
    blurb: "TDD, BDD, exploratory, risk-based, shift-left/right, the pyramid." },
  { id: "specialized", num: "03", title: "Specialized Testing", count: 9, done: 2,
    blurb: "API, performance, security, accessibility, mobile, chaos, AI." },
  { id: "programming", num: "04", title: "Programming for QA", count: 6, done: 4,
    blurb: "Bash, Git, Java, JavaScript/TS, Python, SQL — for testers." },
  { id: "frameworks", num: "05", title: "Frameworks", count: 9, done: 1,
    blurb: "Playwright, Cypress, Selenium, Pytest, JUnit, Cucumber, K6." },
  { id: "ci-cd", num: "06", title: "CI / CD & DevOps", count: 3, done: 0,
    blurb: "Docker, Jenkins & GitHub Actions, test reporting." },
  { id: "istqb", num: "07", title: "ISTQB", count: 8, done: 0,
    blurb: "Foundation, Agile, Advanced (Manager / Analyst / Technical), Expert." },
  { id: "soft-skills", num: "08", title: "Soft Skills", count: 3, done: 1,
    blurb: "Bug reporting, communication with devs, career path." },
];

const LESSONS = [
  { idx: "01.1", slug: "testing-principles", title: "Testing Principles", sub: "7 ISTQB principles · ISO 25010", min: 7, diff: "b", cat: "fundamentals" },
  { idx: "01.2", slug: "sdlc-stlc", title: "SDLC & STLC", sub: "Lifecycle phases · entry/exit", min: 8, diff: "b", cat: "fundamentals" },
  { idx: "01.3", slug: "test-levels", title: "Test Levels", sub: "Unit · Integration · System · UAT", min: 6, diff: "b", cat: "fundamentals" },
  { idx: "01.4", slug: "test-types", title: "Test Types", sub: "Functional · non-functional · structural", min: 9, diff: "b", cat: "fundamentals" },
  { idx: "01.5", slug: "test-design-techniques", title: "Test Design Techniques", sub: "BVA, equivalence, decision tables", min: 12, diff: "i", cat: "fundamentals" },
  { idx: "01.6", slug: "defect-lifecycle", title: "Defect Lifecycle", sub: "Workflow, severity vs priority", min: 6, diff: "b", cat: "fundamentals" },
  { idx: "02.1", slug: "test-pyramid", title: "The Test Pyramid", sub: "Unit-heavy · ice-cream antipattern", min: 8, diff: "i", cat: "strategies" },
  { idx: "02.2", slug: "bdd-tdd-atdd", title: "BDD · TDD · ATDD", sub: "Red-green-refactor · Gherkin", min: 11, diff: "i", cat: "strategies" },
  { idx: "02.3", slug: "risk-based-testing", title: "Risk-Based Testing", sub: "Likelihood × impact matrices", min: 9, diff: "i", cat: "strategies" },
  { idx: "02.4", slug: "shift-left-right", title: "Shift Left / Right", sub: "Earlier defect detection", min: 7, diff: "i", cat: "strategies" },
];

const QUIZ = {
  slug: "testing-principles",
  title: "Testing Principles — Practice Quiz",
  total: 20,
  questions: [
    {
      id: "tp-001",
      q: "Which principle states tests cannot prove a system is defect-free?",
      options: [
        "Pesticide paradox",
        "Testing shows presence of defects",
        "Exhaustive testing is impossible",
        "Defect clustering",
      ],
      answer: 1,
      hint: "Read principle #1 literally.",
      why: "Tests reveal failures only when they trigger them. A passing test means no detected bugs in the run paths — untested input may still hide a defect.",
    },
    {
      id: "tp-002",
      q: "What is the pesticide paradox?",
      options: [
        "Bugs accumulate in old code",
        "Repeated tests stop finding new defects",
        "Test data poisons production",
        "Too many tests slow regression",
      ],
      answer: 1,
      hint: "Like real pesticide — pests adapt.",
      why: "A static test set covers fixed paths. Once those paths are clean, new bugs live elsewhere. Rotate, refresh, add new tests.",
    },
  ],
};

/* ===== Tiny iconography (line, original) ===== */
const Icon = {
  search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  arrow: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5 9-11"/></svg>,
  x: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6 6 18"/></svg>,
  link: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1 1"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1-1"/></svg>,
  clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  flame: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-6-6-11-6-11z"/></svg>,
  github: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.12 3.04.73.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.07.78 2.16v3.2c0 .31.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>,
};

/* ===== Top nav (consistent across artboards) ===== */
function Nav({ active = "lessons", dark = false }) {
  return (
    <header className="nav">
      <div className="nav__brand">
        <span className="nav__mark">qa</span>
        <span>QA&nbsp;Learning</span>
        <span className="pill" style={{ marginLeft: 4 }}>v3 · ctfl</span>
      </div>
      <nav className="nav__links">
        <a className={active === "lessons" ? "is-active" : ""}>Lessons</a>
        <a className={active === "quiz" ? "is-active" : ""}>Quizzes</a>
        <a className={active === "exam" ? "is-active" : ""}>Exam mode</a>
        <a className={active === "build" ? "is-active" : ""}>Build</a>
        <a className={active === "profile" ? "is-active" : ""}>Profile</a>
      </nav>
      <div className="nav__right">
        <div className="search-trigger">
          <Icon.search />
          <span>Search lessons, quizzes…</span>
          <span className="kbd">⌘ K</span>
        </div>
        <button className="theme-btn" title="Theme">{dark ? <Icon.sun/> : <Icon.moon/>}</button>
        <div className="avatar">EK</div>
      </div>
    </header>
  );
}

/* ===== HOME / INDEX artboard ===== */
function Home() {
  const totalLessons = CATEGORIES.reduce((s, c) => s + c.count, 0);
  const totalDone = CATEGORIES.reduce((s, c) => s + c.done, 0);
  return (
    <div className="ab">
      <Nav active="lessons" />
      <section className="hero">
        <div>
          <span className="eyebrow">v3 · the test strategy is the artefact</span>
          <h1>
            A QA curriculum,<br/>
            built like <em>production code.</em>
          </h1>
          <p className="hero__lead">
            Fifty hand-written lessons, eleven hundred quiz questions, and a build pipeline that
            fails on a single broken wikilink. Open-source, statically generated, and shaped by
            the same engineering rigour it teaches.
          </p>
          <div className="hero__cta">
            <button className="btn btn--primary btn--lg">Start with Fundamentals <Icon.arrow/></button>
            <button className="btn btn--ghost btn--lg"><Icon.github/> View source</button>
          </div>
        </div>
        <div className="hero__stats">
          <div className="hero__stat"><div className="num">{totalLessons}</div><div className="lbl">Lessons across 8 tracks</div></div>
          <div className="hero__stat"><div className="num">1,142</div><div className="lbl">Quiz questions</div></div>
          <div className="hero__stat"><div className="num" style={{color:"var(--accent)"}}>{totalDone}</div><div className="lbl">You — completed</div></div>
          <div className="hero__stat"><div className="num">98<span style={{fontSize:24,color:"var(--ink-3)"}}>%</span></div><div className="lbl">Lighthouse · CI gated</div></div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div>
            <span className="eyebrow">curriculum</span>
            <h2>Eight tracks, one through the foundation.</h2>
          </div>
          <p>Each track is a directory in the vault. Lessons are MDX, quizzes are YAML, and every wikilink
            <code style={{fontFamily:"var(--mono)",fontSize:12}}> [[like-this]] </code>
            resolves at build time or fails CI.</p>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <div className="cat" key={c.id}>
              <div className="cat__num">{c.num} · TRACK</div>
              <div className="cat__title">{c.title}</div>
              <div style={{fontSize:13, color:"var(--ink-3)", lineHeight:1.45}}>{c.blurb}</div>
              <div className="cat__bar"><i style={{width: `${(c.done/c.count)*100}%`}}/></div>
              <div className="cat__meta">
                <span>{c.done}/{c.count} done</span>
                <span>{c.count * 8}m read</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div>
            <span className="eyebrow">recent · fundamentals + strategies</span>
            <h2>Latest lessons, ordered.</h2>
          </div>
          <button className="btn btn--ghost">All 50 lessons <Icon.arrow/></button>
        </div>
        <div className="lessons-list">
          {LESSONS.map(l => (
            <a className="lrow" key={l.slug}>
              <span className="lrow__idx">{l.idx}</span>
              <div className="lrow__title">{l.title}<small>{l.sub}</small></div>
              <span className="lrow__min"><Icon.clock/> &nbsp;{l.min}m</span>
              <span className={"lrow__diff diff-" + l.diff} title={l.diff}/>
            </a>
          ))}
        </div>
      </section>

      <footer style={{padding:"32px 40px", display:"flex", justifyContent:"space-between", color:"var(--ink-3)", fontSize:12, fontFamily:"var(--mono)"}}>
        <span>© 2026 · MIT · content from <u>qa-vault</u> @ a3f2e91</span>
        <span>build #284 · Lighthouse 99 / 100 / 95 / 100</span>
      </footer>
    </div>
  );
}

window.Home = Home;
window.Nav = Nav;
window.Icon = Icon;
window.QUIZ = QUIZ;
window.LESSONS = LESSONS;
window.CATEGORIES = CATEGORIES;
