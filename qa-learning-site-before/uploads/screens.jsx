/* global React, Nav, Icon */

/* ===== Lesson reader artboard ===== */
function Lesson() {
  return (
    <div className="ab">
      <Nav active="lessons" />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 240px", gap: 0, minHeight: "calc(100% - 67px)" }}>
        {/* sidebar — siblings */}
        <aside style={{ borderRight: "1px solid var(--rule)", padding: "32px 24px" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>01 · Fundamentals</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 2, fontSize: 13 }}>
            {[
              ["Testing Principles", true],
              ["SDLC & STLC", false],
              ["Test Levels", false],
              ["Test Types", false],
              ["Test Design Techniques", false],
              ["Defect Lifecycle", false],
              ["Test Documentation", false],
            ].map(([t, on]) => (
              <li key={t}>
                <a style={{
                  display: "block",
                  padding: "8px 10px",
                  borderRadius: 6,
                  color: on ? "var(--ink)" : "var(--ink-2)",
                  background: on ? "var(--paper-2)" : "transparent",
                  borderLeft: on ? "2px solid var(--accent)" : "2px solid transparent",
                  fontWeight: on ? 500 : 400,
                }}>{t}</a>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 28, padding: "16px", background: "var(--paper-2)", borderRadius: 8, border: "1px solid var(--rule)" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>continue</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 16, letterSpacing: "-0.01em" }}>SDLC & STLC</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--mono)" }}>up next · 8 min</div>
          </div>
        </aside>

        {/* main */}
        <main style={{ padding: "44px 56px", maxWidth: 760 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 8, marginBottom: 18 }}>
            <span>QA Learning</span><span>/</span>
            <span>Fundamentals</span><span>/</span>
            <span style={{ color: "var(--ink-2)" }}>Testing Principles</span>
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: 52, fontWeight: 400, letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.05 }}>
            Testing <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Principles</em>
          </h1>
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            <span className="pill"><Icon.clock/> 7 min read</span>
            <span className="pill" style={{ background: "var(--pass-soft)", color: "oklch(40% 0.07 180)", borderColor: "transparent" }}><span className="dot"/>beginner</span>
            <span className="pill">istqb</span>
            <span className="pill">fundamentals</span>
            <span className="pill">principles</span>
          </div>

          <blockquote style={{ borderLeft: "2px solid var(--accent)", padding: "4px 0 4px 18px", margin: "0 0 28px", fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.4, color: "var(--ink-2)", letterSpacing: "-0.01em" }}>
            Seven ISTQB principles. The foundation of all QA work.
          </blockquote>

          <h2 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 450, letterSpacing: "-0.02em", margin: "32px 0 16px" }}>The 7 Principles</h2>
          <ol style={{ paddingLeft: 0, listStyle: "none", margin: 0, display: "grid", gap: 12, counterReset: "p" }}>
            {[
              ["Testing shows presence of defects, not absence", "Cannot prove software bug-free."],
              ["Exhaustive testing is impossible", "Use risk + priority instead."],
              ["Early testing saves time and money", "Shift-left. Bug in design 10× cheaper than in prod."],
              ["Defects cluster", "Pareto: 80% of bugs in 20% of modules."],
              ["Pesticide paradox", "Same tests stop finding new bugs. Rotate, refresh."],
              ["Testing is context-dependent", "Banking ≠ game ≠ medical. Approach differs."],
              ["Absence-of-errors fallacy", "Bug-free ≠ useful. Must meet user needs."],
            ].map(([t, d], i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 14, padding: "12px 0", borderTop: i ? "1px solid var(--rule)" : "none" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", paddingTop: 3 }}>{String(i+1).padStart(2,"0")}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 3 }}>{d}</div>
                </div>
              </li>
            ))}
          </ol>

          <h2 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 450, letterSpacing: "-0.02em", margin: "36px 0 14px" }}>Verification vs Validation</h2>
          <p style={{ margin: "0 0 10px", color: "var(--ink-2)", lineHeight: 1.65 }}>
            The classic distinction: <strong style={{ color: "var(--ink)" }}>verification</strong> asks
            "are we building it right?" — does the artefact match the spec?
            <strong style={{ color: "var(--ink)" }}> Validation</strong> asks
            "are we building the right thing?" — does it meet the user's actual need?
          </p>

          <h2 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 450, letterSpacing: "-0.02em", margin: "32px 0 14px" }}>Related</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["SDLC-STLC","Test-Levels","Risk-Based-Testing","01-Foundation-CTFL"].map(s => (
              <a key={s} style={{ padding: "6px 12px", borderRadius: 6, background: "var(--accent-soft)", color: "oklch(45% 0.16 35)", fontSize: 13, fontFamily: "var(--mono)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon.link/> {s}
              </a>
            ))}
          </div>

          {/* Wikilink hover preview demo */}
          <div style={{ marginTop: 36, padding: 18, border: "1px dashed var(--rule-2)", borderRadius: 10, background: "var(--paper-2)", fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>
            ↓ Wikilink hover preview (build-time excerpt from <code>slugs.json</code>)
          </div>
          <div style={{ position: "relative", marginTop: -8, marginLeft: 80 }}>
            <div style={{ position: "absolute", top: 18, left: 0, width: 320, padding: 16, background: "var(--paper)", border: "1px solid var(--rule-2)", borderRadius: 10, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.18)" }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>02.3 · Risk-Based Testing</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>Risk-Based Testing</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
                Prioritise tests by risk = likelihood × impact. Spend more on what
                fails most often and hurts most when it does.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 220, display: "flex", justifyContent: "space-between", paddingTop: 24, borderTop: "1px solid var(--rule)" }}>
            <button className="btn btn--ghost">← SDLC overview</button>
            <button className="btn btn--accent">Take the quiz · 20 Q <Icon.arrow/></button>
          </div>
        </main>

        {/* TOC */}
        <aside style={{ borderLeft: "1px solid var(--rule)", padding: "44px 24px", position: "sticky", top: 67, alignSelf: "start" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>on this page</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8, fontSize: 12, borderLeft: "1px solid var(--rule)" }}>
            {[
              ["The 7 Principles", true],
              ["Why It Matters", false],
              ["Quality Attributes (ISO 25010)", false],
              ["Verification vs Validation", false],
              ["Static vs Dynamic", false],
              ["Related", false],
            ].map(([t, on]) => (
              <li key={t} style={{ paddingLeft: 12, marginLeft: -1, borderLeft: on ? "2px solid var(--accent)" : "2px solid transparent", color: on ? "var(--ink)" : "var(--ink-3)", lineHeight: 1.5 }}>
                {t}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>progress</div>
            <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "38%", height: "100%", background: "var(--accent)" }}/>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>section 1 of 6</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ===== Quiz Runner artboard ===== */
function Quiz() {
  const q = window.QUIZ.questions[0];
  const selected = 1;
  const correct = selected === q.answer;
  return (
    <div className="ab">
      <Nav active="quiz" />
      <div style={{ padding: "44px 60px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <span className="eyebrow">practice mode · sessionStorage</span>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", margin: "8px 0 0" }}>Testing Principles</h1>
          </div>
          <span className="pill" style={{ padding: "5px 12px", fontSize: 12 }}>question 7 of 20</span>
        </div>

        {/* progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
              background: i < 6 ? "var(--ink)" : i === 6 ? "var(--accent)" : "var(--paper-3)" }}/>
          ))}
        </div>

        {/* question */}
        <div className="card" style={{ padding: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Q07 · single choice</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1.3, letterSpacing: "-0.015em", margin: "0 0 28px" }}>
            {q.q}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {q.options.map((opt, i) => {
              const isSelected = i === selected;
              const isAnswer = i === q.answer;
              const state = isSelected && correct ? "correct" : isSelected && !correct ? "wrong" : isAnswer ? "reveal" : "idle";
              const colors = {
                correct: { bg: "var(--pass-soft)", border: "var(--pass)", color: "oklch(35% 0.07 180)" },
                wrong:   { bg: "var(--accent-soft)", border: "var(--accent)", color: "oklch(40% 0.16 35)" },
                reveal:  { bg: "var(--paper-2)", border: "var(--ink-3)", color: "var(--ink)" },
                idle:    { bg: "var(--paper)", border: "var(--rule)", color: "var(--ink)" },
              }[state];
              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "28px 1fr 24px", alignItems: "center", gap: 14,
                  padding: "14px 18px", borderRadius: 10,
                  border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.color, fontSize: 14,
                }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, opacity: 0.6 }}>{String.fromCharCode(65+i)}</span>
                  <span style={{ fontWeight: state==="correct" ? 500 : 400 }}>{opt}</span>
                  <span>
                    {state==="correct" && <Icon.check/>}
                    {state==="wrong" && <Icon.x/>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* feedback */}
          <div style={{ marginTop: 24, padding: 18, borderRadius: 10, background: "var(--pass-soft)", border: "1px solid transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--pass)", color: "white", display: "grid", placeItems: "center" }}><Icon.check/></span>
              <span style={{ fontWeight: 600, color: "oklch(35% 0.07 180)" }}>Correct.</span>
              <span className="pill" style={{ marginLeft: "auto", fontSize: 11 }}>+1 · 6/7</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
              <strong>Why:</strong> {q.why}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>
              ↳ See <u>The 7 Principles · item 1</u>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="btn btn--ghost">← previous</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn--ghost">skip</button>
            <button className="btn btn--primary">next question <Icon.arrow/></button>
          </div>
        </div>

        {/* anonymous banner */}
        <div style={{ marginTop: 28, padding: "12px 18px", border: "1px dashed var(--rule-2)", borderRadius: 8, fontSize: 13, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }}/>
          You're playing anonymously. <a style={{ color: "var(--ink)", textDecoration: "underline" }}>Log in with GitHub</a> to save this attempt to your profile.
          <button className="btn btn--ghost" style={{ marginLeft: "auto", padding: "4px 10px" }}>dismiss</button>
        </div>
      </div>
    </div>
  );
}

/* ===== Exam Mode artboard (dark, focused) ===== */
function Exam() {
  return (
    <div className="ab ab--dark">
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid var(--rule)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="nav__mark" style={{ background: "var(--paper-2)", color: "var(--ink)" }}>qa</span>
          <div>
            <div className="eyebrow" style={{ color: "var(--accent)" }}>EXAM MODE · ISTQB-CTFL</div>
            <div style={{ fontSize: 13 }}>40 questions · 60 min · no feedback until submit</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em" }}>TIME REMAINING</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 500, letterSpacing: "0.02em", color: "var(--accent)" }}>43:12</div>
          </div>
          <button className="btn btn--ghost" style={{ borderColor: "var(--rule-2)" }}>submit early</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 0, height: "calc(100% - 73px)" }}>
        <main style={{ padding: "56px 80px", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 44, color: "var(--ink-3)", letterSpacing: "-0.02em" }}>14<span style={{ color: "var(--ink-4)" }}>/40</span></span>
            <span className="pill" style={{ background: "transparent", borderColor: "var(--rule-2)" }}>Strategies · Risk</span>
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 400, lineHeight: 1.25, letterSpacing: "-0.02em", maxWidth: "32ch", marginBottom: 36 }}>
            A team estimates that a payment-gateway outage has a 30% likelihood and a critical impact. According to risk-based testing, this defect should be:
          </div>
          <div style={{ display: "grid", gap: 10, maxWidth: 640 }}>
            {[
              ["A","Deferred until a later release",false],
              ["B","Treated with priority and tested first",true],
              ["C","Logged but not investigated further",false],
              ["D","Replaced by exhaustive functional testing",false],
            ].map(([k, t, sel]) => (
              <div key={k} style={{
                display: "grid", gridTemplateColumns: "32px 1fr", alignItems: "center", gap: 14,
                padding: "16px 20px", borderRadius: 10,
                border: `1.5px solid ${sel ? "var(--accent)" : "var(--rule)"}`,
                background: sel ? "oklch(28% 0.06 35)" : "transparent",
                fontSize: 15,
              }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: sel ? "var(--accent)" : "var(--ink-3)" }}>{k}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 56, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn btn--ghost" style={{ borderColor: "var(--rule-2)" }}>← previous</button>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-3)", display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" defaultChecked /> flag for review
              </label>
              <button className="btn" style={{ background: "var(--accent)", color: "white" }}>next <Icon.arrow/></button>
            </div>
          </div>
        </main>

        <aside style={{ borderLeft: "1px solid var(--rule)", padding: "32px 24px" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>question grid</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const st = i < 13 ? "done" : i === 13 ? "current" : i === 5 || i === 9 ? "flag" : "todo";
              const styles = {
                done:    { bg: "var(--paper-3)", color: "var(--ink-2)" },
                current: { bg: "var(--accent)", color: "white" },
                flag:    { bg: "transparent", color: "var(--warn)", border: "1px solid var(--warn)" },
                todo:    { bg: "transparent", color: "var(--ink-4)", border: "1px solid var(--rule)" },
              }[st];
              return (
                <div key={i} style={{
                  aspectRatio: "1", display: "grid", placeItems: "center",
                  fontFamily: "var(--mono)", fontSize: 11, borderRadius: 4,
                  ...styles
                }}>{i+1}</div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-3)", display: "grid", gap: 6 }}>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--paper-3)", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }}/> answered · 13</div>
            <div><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--accent)", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }}/> current · 1</div>
            <div><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid var(--warn)", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }}/> flagged · 2</div>
            <div><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid var(--rule)", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }}/> remaining · 24</div>
          </div>
          <div style={{ marginTop: 24, padding: 14, background: "var(--paper-2)", borderRadius: 8, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
            Pass threshold: <strong style={{ color: "var(--ink-2)" }}>65%</strong> · 26 of 40 correct.
            Auto-submits at 00:00.
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ===== Profile artboard (v2) ===== */
function Profile() {
  // 53 weeks × 7 days
  const heatmap = Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const seed = (w * 7 + d) * 9301 + 49297;
      const r = (seed % 233280) / 233280;
      // recent weeks denser
      const intensity = w > 36 ? Math.floor(r * 5) : w > 20 ? Math.floor(r * 4) : Math.floor(r * 3);
      return Math.max(0, intensity - (r > 0.6 ? 0 : 1));
    })
  );
  const colors = ["var(--paper-3)","oklch(85% 0.06 35)","oklch(75% 0.13 35)","oklch(65% 0.17 35)","oklch(55% 0.18 35)"];

  const cats = [
    ["Fundamentals", 71, 5, 7],
    ["Strategies", 60, 3, 5],
    ["Specialised", 22, 2, 9],
    ["Programming", 67, 4, 6],
    ["Frameworks", 11, 1, 9],
    ["CI/CD", 0, 0, 3],
    ["ISTQB", 0, 0, 8],
    ["Soft Skills", 33, 1, 3],
  ];

  return (
    <div className="ab">
      <Nav active="profile" />
      <main style={{ padding: "44px 56px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {/* identity */}
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "end", justifyContent: "space-between", paddingBottom: 24, borderBottom: "1px solid var(--rule)" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>EK</div>
            <div>
              <span className="eyebrow">profile · private</span>
              <div style={{ fontFamily: "var(--serif)", fontSize: 38, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 4 }}>Elena Kovac</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--mono)", marginTop: 4 }}>@elena-kovac · joined Mar 2026 · GitHub</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 44, letterSpacing: "-0.03em", display: "inline-flex", alignItems: "center", gap: 6 }}>
                23 <Icon.flame/>
              </div>
              <div className="eyebrow">day streak</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 44, letterSpacing: "-0.03em" }}>16<span style={{ color: "var(--ink-3)", fontSize: 26 }}>/50</span></div>
              <div className="eyebrow">lessons done</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 44, letterSpacing: "-0.03em" }}>78<span style={{ color: "var(--ink-3)", fontSize: 26 }}>%</span></div>
              <div className="eyebrow">quiz accuracy</div>
            </div>
          </div>
        </div>

        {/* heatmap */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <span className="eyebrow">activity · last 365 days</span>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, letterSpacing: "-0.015em", marginTop: 2 }}>147 active days · longest streak 41</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
              less {colors.map((c, i) => <span key={i} style={{ width: 11, height: 11, background: c, borderRadius: 2 }}/>)} more
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, overflowX: "hidden" }}>
            {heatmap.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateRows: "repeat(7, 1fr)", gap: 3 }}>
                {week.map((v, di) => (
                  <div key={di} style={{
                    width: 11, height: 11, borderRadius: 2,
                    background: colors[v],
                  }}/>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
            <span>May 2025</span><span>Aug</span><span>Nov</span><span>Feb 2026</span><span>May 2026</span>
          </div>
        </div>

        {/* category progress */}
        <div className="card" style={{ gridColumn: "1 / 3" }}>
          <span className="eyebrow">progress by track</span>
          <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
            {cats.map(([n, pct, d, t]) => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "160px 1fr 60px", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                <div style={{ height: 8, background: "var(--paper-3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct > 50 ? "var(--accent)" : pct > 0 ? "oklch(75% 0.13 35)" : "transparent" }}/>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>{d}/{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* recent activity */}
        <div className="card">
          <span className="eyebrow">recent activity</span>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 14 }}>
            {[
              ["quiz", "Risk-Based Testing", "scored 18/20", "2h"],
              ["lesson", "Test Pyramid", "completed", "5h"],
              ["quiz", "BDD · TDD · ATDD", "scored 15/20", "1d"],
              ["project", "Submitted starter brief", "TodoMVC E2E", "2d"],
              ["lesson", "Defect Lifecycle", "completed", "3d"],
              ["quiz", "SDLC & STLC", "scored 19/20", "4d"],
            ].map(([type, t, m, ago], i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", alignItems: "center", gap: 12, paddingBottom: 10, borderBottom: i < 5 ? "1px solid var(--rule)" : "none" }}>
                <span className="pill" style={{ fontSize: 10, padding: "2px 8px", justifyContent: "center" }}>{type}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{m}</div>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>{ago}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* accuracy by topic */}
        <div className="card" style={{ gridColumn: "1 / 3" }}>
          <span className="eyebrow">quiz accuracy · weakest first</span>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {[
              ["Test Design Techniques", 52, 24, 46],
              ["Risk-Based Testing", 68, 26, 38],
              ["BDD · TDD · ATDD", 71, 27, 38],
              ["Test Pyramid", 80, 16, 20],
              ["Testing Principles", 92, 37, 40],
              ["SDLC & STLC", 95, 19, 20],
            ].map(([n, pct, c, t]) => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "180px 50px 1fr 80px", alignItems: "center", gap: 14, fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{n}</span>
                <span style={{ fontFamily: "var(--mono)", color: pct < 70 ? "var(--accent)" : "var(--ink-2)" }}>{pct}%</span>
                <div style={{ height: 6, background: "var(--paper-3)", borderRadius: 3, position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct < 70 ? "var(--accent)" : "var(--pass)", borderRadius: 3 }}/>
                  <div style={{ position: "absolute", left: "65%", top: -3, height: 12, width: 1, background: "var(--ink-3)" }}/>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>{c}/{t}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
            ↳ vertical line: ISTQB pass threshold · 65%
          </div>
        </div>

        <div className="card">
          <span className="eyebrow">portfolio · projects shipped</span>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 12 }}>
            {[
              ["TodoMVC E2E suite", "Playwright · 14 specs", "starter"],
              ["Flaky-test bisector", "Bash + GH Actions", "mid"],
              ["Pact contract harness", "Node + Pact", "mid"],
            ].map(([t, s, tier]) => (
              <li key={t} style={{ padding: 12, border: "1px solid var(--rule)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{t}</span>
                  <span className="pill" style={{ fontSize: 10 }}>{tier}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)", marginTop: 4 }}>{s}</div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

/* ===== Build (project briefs) artboard ===== */
function Build() {
  return (
    <div className="ab">
      <Nav active="build" />
      <section className="hero" style={{ paddingTop: 48, paddingBottom: 36 }}>
        <div>
          <span className="eyebrow">v2 · build pillar</span>
          <h1 style={{ fontSize: 56 }}>Read less.<br/><em>Build more.</em></h1>
          <p className="hero__lead">
            Three tiers of self-directed project briefs. Each one ships with a
            scoped acceptance-criteria list, a self-attest checklist, and an
            optional GitHub URL + reflection on submission.
          </p>
        </div>
        <div style={{ alignSelf: "end", border: "1px solid var(--rule)", borderRadius: 12, padding: 22, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, background: "var(--paper-2)" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>tiers</div>
          <div><strong style={{ color: "var(--ink)" }}>Starter</strong> · ~1–2 hours · pick a tool, ship a tiny suite</div>
          <div style={{ marginTop: 6 }}><strong style={{ color: "var(--ink)" }}>Mid</strong> · ~1 day · combine two concepts, harness real CI</div>
          <div style={{ marginTop: 6 }}><strong style={{ color: "var(--ink)" }}>Capstone</strong> · ~1 week · production-grade artefact</div>
        </div>
      </section>

      <section className="section">
        {[
          ["Starter", "1–2 hr", [
            ["TodoMVC end-to-end", "Pick Playwright or Cypress. Cover the four canonical user paths. CI must run green."],
            ["A bash flaky-test bisector", "Re-run a Playwright spec N times, exit non-zero on any failure, print pass-rate."],
            ["Bug-report sandbox", "Triage 5 ambiguous bug reports. Rewrite each to STAR-format."],
          ]],
          ["Mid", "~1 day", [
            ["Contract testing in anger", "Producer + consumer with Pact. Pact-broker locally via Docker, CI green on both sides."],
            ["Jenkins → GH Actions migration", "Port a real pipeline. Document trade-offs. Bonus: matrix on three Node versions."],
            ["Performance budget for a SPA", "k6 or JMeter. Define a budget, write a check, fail the build when it regresses."],
          ]],
          ["Capstone", "~1 week", [
            ["A full QA strategy doc", "Pick an OSS app. Author risk register, test pyramid, environment plan, exit criteria."],
            ["Mobile + accessibility audit", "Appium + axe-core. Catalogue 10+ findings with severity, repro, fix."],
            ["Mini test-management tool", "Track suites, runs, flakiness. Drizzle + Astro. Deploy. Tests test the tester."],
          ]],
        ].map(([tier, time, items]) => (
          <div key={tier} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>{tier}</h2>
              <span className="pill">{time}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {items.map(([t, d], i) => (
                <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
                  <div className="eyebrow">brief · {String(i+1).padStart(2,"0")}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 22, letterSpacing: "-0.015em", lineHeight: 1.2 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{d}</div>
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>5 acceptance · 8 attest</span>
                    <a style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)", textDecoration: "underline" }}>open brief →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

window.Lesson = Lesson;
window.Quiz = Quiz;
window.Exam = Exam;
window.Profile = Profile;
window.Build = Build;
