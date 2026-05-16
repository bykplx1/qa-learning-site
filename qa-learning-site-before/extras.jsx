/* global React, Nav, Icon */

/* ===== Search modal overlay ===== */
function SearchOverlay() {
  return (
    <div className="ab">
      <Nav active="lessons" />
      {/* dimmed underlay showing the home page faintly */}
      <div style={{ position: "absolute", inset: "67px 0 0 0", background: "rgba(20, 20, 18, 0.45)", backdropFilter: "blur(2px)", display: "grid", placeItems: "start center", paddingTop: 88 }}>
        <div style={{ width: 720, maxWidth: "90%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 14, boxShadow: "0 30px 80px -20px rgba(0,0,0,0.4)", overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", gap: 14 }}>
            <Icon.search/>
            <input
              defaultValue="risk based"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--sans)", fontSize: 17, color: "var(--ink)" }}
            />
            <span className="kbd" style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "2px 6px", border: "1px solid var(--rule)", borderRadius: 4, color: "var(--ink-3)" }}>esc</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "60% 1fr", gap: 0, maxHeight: 460 }}>
            {/* results */}
            <div style={{ padding: "8px 8px", borderRight: "1px solid var(--rule)", overflow: "auto" }}>
              <div className="eyebrow" style={{ padding: "10px 14px 6px" }}>lessons · 3</div>
              {[
                ["Risk-Based Testing", "02 Strategies", "…tests by risk = likelihood × impact. Spend more on what fails most…", true],
                ["Test Pyramid", "02 Strategies", "…risk profile of unit vs integration vs E2E…", false],
                ["Defect Lifecycle", "01 Fundamentals", "…severity vs priority and how risk shifts triage…", false],
              ].map(([t, c, snip, on], i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: on ? "var(--paper-2)" : "transparent", display: "grid", gridTemplateColumns: "1fr auto", gap: 4, marginBottom: 2, borderLeft: on ? "2px solid var(--accent)" : "2px solid transparent" }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{c}</div>
                  <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    {snip.split(/(risk)/i).map((s, j) => i === 0 || true ?
                      (s.toLowerCase() === "risk" ? <mark key={j} style={{ background: "var(--accent-soft)", color: "oklch(45% 0.16 35)", padding: "0 2px", borderRadius: 2 }}>{s}</mark> : <span key={j}>{s}</span>) : s
                    )}
                  </div>
                </div>
              ))}
              <div className="eyebrow" style={{ padding: "16px 14px 6px" }}>quiz questions · 11</div>
              {[
                ["Risk = likelihood × impact. True or false?", "Risk-Based Testing · Q3"],
                ["Which test types reduce risk earliest?", "Shift Left/Right · Q9"],
              ].map(([t, c], i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
                  <span>{t}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{c}</span>
                </div>
              ))}
            </div>
            {/* preview */}
            <div style={{ padding: 22 }}>
              <div className="eyebrow">preview</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 450, letterSpacing: "-0.02em", marginTop: 6 }}>Risk-Based Testing</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span className="pill" style={{ fontSize: 10 }}>9 min</span>
                <span className="pill" style={{ fontSize: 10 }}>intermediate</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 14 }}>
                Risk-based testing prioritises tests by <em>risk</em> — the product of likelihood and impact.
                Test the things most likely to break that hurt most when they do.
              </p>
              <div style={{ height: 1, background: "var(--rule)", margin: "16px 0" }}/>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", lineHeight: 1.7 }}>
                ↑↓ navigate · ↵ open · ⌘↵ open in new tab
              </div>
            </div>
          </div>

          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--rule)", background: "var(--paper-2)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
            <span>Pagefind · static index · 24 KB</span>
            <span>1.2 ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Exam Summary artboard (post-submit) ===== */
function ExamSummary() {
  return (
    <div className="ab">
      <Nav active="exam" />
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 40px" }}>
        {/* result hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "stretch", marginBottom: 32 }}>
          <div>
            <span className="eyebrow">EXAM RESULT · ISTQB-CTFL · practice</span>
            <div style={{ fontFamily: "var(--serif)", fontSize: 88, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1, margin: "10px 0 4px" }}>
              31<span style={{ color: "var(--ink-3)", fontSize: 48 }}>/40</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 999, background: "var(--pass-soft)", color: "oklch(35% 0.07 180)", fontWeight: 500, fontSize: 14 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--pass)", color: "white", display: "grid", placeItems: "center" }}><Icon.check/></span>
              Passed · 77.5% · threshold 65%
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 24, lineHeight: 1.6, maxWidth: "52ch" }}>
              Your strongest area was <strong style={{ color: "var(--ink)" }}>Test Levels</strong>; the weakest was{" "}
              <strong style={{ color: "var(--accent)" }}>Test Design Techniques</strong> — review boundary-value and decision-table sections.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 1, background: "var(--rule)", border: "1px solid var(--rule)", borderRadius: 12, overflow: "hidden" }}>
            {[
              ["38:42", "time taken", "of 60:00"],
              ["31", "correct", "of 40"],
              ["7", "wrong", "review below"],
              ["2", "skipped", "marked 'unsure'"],
            ].map(([n, l, s], i) => (
              <div key={i} style={{ background: "var(--paper)", padding: "18px 16px" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1 }}>{n}</div>
                <div className="eyebrow" style={{ marginTop: 6 }}>{l}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)", marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* per-category breakdown */}
        <div className="card" style={{ marginBottom: 32 }}>
          <span className="eyebrow">accuracy · per syllabus area</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--rule)", marginTop: 16, border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
            {[
              ["Fundamentals of Testing", 9, 10, 90],
              ["Lifecycle & SDLC", 7, 8, 87],
              ["Test Levels & Types", 6, 6, 100],
              ["Test Design", 4, 8, 50],
              ["Test Mgmt", 3, 4, 75],
              ["Tools & Automation", 2, 4, 50],
            ].map(([t, c, total, pct], i) => (
              <div key={i} style={{ background: "var(--paper)", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{t}</div>
                <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{c}/{total} · {pct}%</div>
                <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 2, marginTop: 8 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 65 ? "var(--pass)" : "var(--accent)", borderRadius: 2 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* per-question review */}
        <span className="eyebrow">review · 7 missed</span>
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {[
            {
              n: 4, q: "A boundary value at the lower edge of [10, 99] is:",
              your: "9 only", correct: "9 and 10",
              why: "Boundary value analysis tests just below, on, and just above the boundary — both 9 and 10 are required.",
            },
            {
              n: 11, q: "Decision-table testing primarily mitigates:",
              your: "Performance risk", correct: "Combinatorial business-rule risk",
              why: "Decision tables enumerate combinations of input conditions to ensure rule coverage, not performance.",
            },
            {
              n: 19, q: "Which is NOT a static testing activity?",
              your: "Code walkthrough", correct: "Unit test execution",
              why: "Static testing happens without executing the code; running unit tests is dynamic.",
            },
          ].map(({ n, q, your, correct, why }) => (
            <div key={n} className="card" style={{ padding: "18px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>Q{String(n).padStart(2, "0")}</span>
                <span className="pill" style={{ background: "var(--accent-soft)", color: "oklch(45% 0.16 35)", borderColor: "transparent" }}>incorrect</span>
                <span style={{ flex: 1 }}/>
                <a style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)", textDecoration: "underline" }}>open lesson →</a>
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 18, letterSpacing: "-0.01em", marginBottom: 14 }}>{q}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: "10px 14px", border: "1px solid oklch(75% 0.16 35)", borderRadius: 8, background: "var(--accent-soft)" }}>
                  <div className="eyebrow" style={{ color: "oklch(45% 0.16 35)" }}>your answer</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: "oklch(40% 0.16 35)" }}>{your}</div>
                </div>
                <div style={{ padding: "10px 14px", border: "1px solid var(--pass)", borderRadius: 8, background: "var(--pass-soft)" }}>
                  <div className="eyebrow" style={{ color: "oklch(35% 0.07 180)" }}>correct</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: "oklch(35% 0.07 180)" }}>{correct}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--ink)" }}>Why:</strong> {why}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", padding: 24, borderTop: "1px solid var(--rule)" }}>
          <button className="btn btn--ghost">retake exam</button>
          <button className="btn btn--ghost">study Test Design</button>
          <button className="btn btn--primary">return to profile <Icon.arrow/></button>
        </div>
      </main>
    </div>
  );
}

window.SearchOverlay = SearchOverlay;
window.ExamSummary = ExamSummary;
