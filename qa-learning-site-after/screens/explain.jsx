// /explain/[slug] — Feynman / Self-Explanation surface.
// Tenet: rubric NOT visible before submit. Cognitive work is in noticing
// one's own hand-wave AFTER trying. No AI score, no green check, no percent.

// ─── Primary state — writing in progress ───────────────────────────────────
const ExplainPrimary = () => (
  <Frame>
    <TopNav active="explain"/>

    <div style={{padding:'56px 64px 24px', maxWidth: 1100, margin:'0 auto', width:'100%'}}>
      <div className="caption-up" style={{color:'var(--muted)', marginBottom:10}}>
        Explain · cluster 3 / contract testing
      </div>
      <div className="display display-md" style={{marginBottom:16, color:'var(--ink)', fontWeight:400, lineHeight:1.18, maxWidth:880}}>
        Explain contract testing to a backend engineer who thinks unit + E2E is enough.
      </div>
      <div className="body-md" style={{color:'var(--body)', maxWidth:760, marginBottom:24}}>
        Plain language. Name the mechanism — what the contract is, what it
        prevents, where the brittleness it replaces actually lives. A diagram in
        words is fine (and often the test of whether you understand it).
      </div>

      {/* Meta strip */}
      <div style={{display:'flex', gap:24, alignItems:'center', padding:'14px 18px',
        background:'var(--surface-soft)', borderRadius:'var(--r-md)', marginBottom:32}}>
        <div>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:2, fontSize:10}}>Target</div>
          <div className="title-sm">~150 words</div>
        </div>
        <div style={{width:1, height:28, background:'var(--hairline)'}}></div>
        <div>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:2, fontSize:10}}>You've reviewed this</div>
          <div className="title-sm">4 times · last 6 days ago</div>
        </div>
        <div style={{width:1, height:28, background:'var(--hairline)'}}></div>
        <div style={{flex:1, color:'var(--muted)'}} className="body-sm">
          The rubric isn't shown until you submit. Notice your own gap, then score it.
        </div>
      </div>
    </div>

    <div style={{padding:'0 64px 32px', maxWidth: 1100, margin:'0 auto', width:'100%'}}>
      {/* The writing surface */}
      <div style={{
        background:'var(--canvas)', border:'2px solid var(--primary)',
        borderRadius:'var(--r-lg)', boxShadow:'0 0 0 4px var(--primary-tint)',
        padding:'28px 32px', minHeight: 380
      }}>
        <div style={{
          fontFamily:'var(--body-font)', fontSize:16, lineHeight:1.75, color:'var(--ink)'
        }}>
          <p style={{margin:'0 0 14px'}}>
            A contract is a shared agreement between the consumer and the
            producer of an API: the consumer says "I expect this shape, this
            field, these statuses," and the producer's CI verifies it can still
            satisfy that exact shape.
          </p>
          <p style={{margin:'0 0 14px'}}>
            Unit tests don't catch this because they mock the producer — the
            mock is whatever the consumer team wrote down, not what the producer
            actually ships. E2E catches it, but only on staging, and only after
            both sides are deployed, when the cost of the failure is highest.
            Contract tests move that catch into <em>each side's own CI</em>,
            before anything is merged.
          </p>
          <p style={{margin:'0 0 14px', color:'var(--muted)'}}>
            <span style={{display:'inline-block', width:2, height:16, background:'var(--ink)', verticalAlign:'-2px'}}></span>
            <span style={{marginLeft:4}}>So the brittleness it replaces is —</span>
          </p>
        </div>
      </div>

      {/* Footer row */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18}}>
        <div className="caption" style={{color:'var(--muted-soft)'}}>
          <strong style={{color:'var(--body)', fontWeight:500}}>112</strong> / ~150 words
          <span style={{margin:'0 12px', color:'var(--hairline)'}}>·</span>
          informational, not a gate
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <button className="qa-btn qa-btn-ghost" style={{color:'var(--muted)'}}>Save draft</button>
          <button className="qa-btn qa-btn-primary">Submit & reveal rubric</button>
        </div>
      </div>

      <div style={{marginTop:28}}>
        <Rationale items={[
          {what:"Rubric is NOT visible before submit.", why:"brief §4.2 · core principle"},
          {what:"Word counter is informational, not a gate.", why:"brief §4.2 step 2"},
          {what:"Submit copy is honest: \"submit & reveal rubric\".", why:"sets expectation truthfully"},
          {what:"No AI-generated model answer shown anywhere.", why:"brief §4.2 refuse list"},
        ]}/>
      </div>
    </div>
  </Frame>
);

// ─── Post-submit — rubric revealed for self-scoring ────────────────────────
const ExplainPostSubmit = () => (
  <Frame>
    <TopNav active="explain"/>

    <div style={{padding:'48px 64px 16px', maxWidth: 1100, margin:'0 auto', width:'100%'}}>
      <div className="caption-up" style={{color:'var(--muted)', marginBottom:10}}>
        Explain · submitted · 2 min ago
      </div>
      <div className="display display-md" style={{marginBottom:8, color:'var(--ink)', fontWeight:400, lineHeight:1.18, maxWidth:880}}>
        You wrote it. Now score where it bent.
      </div>
      <div className="body-md" style={{color:'var(--body)', maxWidth:760, marginBottom:32}}>
        No AI grade, no number, no green check. The grading is the noticing.
      </div>
    </div>

    <div style={{
      padding:'0 64px 32px', maxWidth: 1100, margin:'0 auto', width:'100%',
      display:'grid', gridTemplateColumns:'1fr 380px', gap: 28
    }}>
      {/* Left — what they wrote */}
      <div>
        <div className="caption-up" style={{fontSize:10, color:'var(--muted)', marginBottom:12}}>Your explanation</div>
        <div style={{
          background:'var(--surface-soft)', borderRadius:'var(--r-lg)',
          padding:'24px 28px', fontSize:15, lineHeight:1.75, color:'var(--body-strong)'
        }}>
          <p style={{margin:'0 0 14px'}}>
            A contract is a shared agreement between the consumer and the
            producer of an API: the consumer says "I expect this shape, this
            field, these statuses," and the producer's CI verifies it can still
            satisfy that exact shape.
          </p>
          <p style={{margin:'0 0 14px'}}>
            Unit tests don't catch this because they mock the producer — the
            mock is whatever the consumer team wrote down, not what the producer
            actually ships. E2E catches it, but only on staging, and only after
            both sides are deployed, when the cost of the failure is highest.
            Contract tests move that catch into <em>each side's own CI</em>,
            before anything is merged.
          </p>
          <p style={{margin:0}}>
            So the brittleness it replaces is the gap between "what the consumer
            assumed the producer would always return" and "what the producer
            actually returns after a refactor."
          </p>
        </div>

        {/* Gap callouts — questions only, never resolutions */}
        <div style={{marginTop:24}}>
          <div className="caption-up" style={{fontSize:10, color:'var(--primary)', marginBottom:10}}>
            Gap prompts — questions, not answers
          </div>
          <div style={{display:'grid', gap:10}}>
            {[
              "You used the word \"mock\" once — what specifically does Pact's broker store, and how is that different from a hand-written mock?",
              "\"Each side's own CI\" — what happens when the consumer's contract changes and the producer hasn't merged the new version yet?",
            ].map((q, i) => (
              <div key={i} style={{
                padding:'12px 16px', background:'var(--canvas)', border:'1px solid var(--hairline)',
                borderRadius:'var(--r-md)', fontSize:14, lineHeight:1.5, color:'var(--body)',
                display:'flex', gap:10
              }}>
                <span style={{color:'var(--primary)', fontWeight:600, marginTop:1}}>?</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — rubric (now revealed) */}
      <div>
        <div className="caption-up" style={{fontSize:10, color:'var(--muted)', marginBottom:12}}>
          Self-score · 0 / 1 / 2
        </div>
        <div style={{
          background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'8px 0', overflow:'hidden'
        }}>
          {[
            {q:"Did you name the mechanism, not just the term?", picked: 2},
            {q:"Did you avoid jargon, or define it where you used it?", picked: 1},
            {q:"Did you say where the brittleness it replaces lives?", picked: 2},
            {q:"Did you note at least one failure mode of the technique itself?", picked: 0},
            {q:"Where did you hand-wave?", picked: 1},
          ].map((r, i) => (
            <div key={i} style={{
              padding:'14px 18px',
              borderBottom: i < 4 ? '1px solid var(--hairline-soft)' : 'none'
            }}>
              <div style={{fontSize:13.5, lineHeight:1.5, color:'var(--ink)', marginBottom:10}}>{r.q}</div>
              <div style={{display:'flex', gap:6}}>
                {[0,1,2].map(v => (
                  <button key={v} style={{
                    flex:1, height:30, borderRadius:'var(--r-sm)',
                    border:'1px solid ' + (v === r.picked ? 'var(--primary)' : 'var(--hairline)'),
                    background: v === r.picked ? 'var(--primary)' : 'transparent',
                    color: v === r.picked ? 'var(--on-primary)' : 'var(--body)',
                    fontFamily:'var(--body-font)', fontSize:13, fontWeight:500, cursor:'pointer'
                  }}>{['No','Sort of','Yes'][v]}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop:14, padding:'14px 16px', background:'var(--surface-soft)',
          borderRadius:'var(--r-md)', fontSize:13, lineHeight:1.55, color:'var(--muted)'
        }}>
          Scores are kept privately. They are not totaled, ranked, or compared.
          What you noticed is the artifact, not the number.
        </div>

        <div style={{marginTop:18, display:'flex', gap:10}}>
          <button className="qa-btn qa-btn-primary" style={{flex:1}}>Save self-score</button>
        </div>
      </div>
    </div>

    <div style={{padding:'0 64px 32px', maxWidth:1100, margin:'0 auto', width:'100%'}}>
      <Rationale items={[
        {what:"Rubric appears AFTER submit — never before.", why:"brief §4.2 · the cognitive work"},
        {what:"3-point self-score per row; no overall grade, no percent.", why:"brief §4.2 · refuse list #7"},
        {what:"Gap callouts are questions only, never resolutions.", why:"brief §4.2 · build-doc §6"},
        {what:"\"No AI grade\" stated in copy, not just implied.", why:"trust through honesty"},
      ]}/>
    </div>
  </Frame>
);

// ─── Soft-block — not enough reviews yet ───────────────────────────────────
const ExplainSoftBlock = () => (
  <Frame>
    <TopNav active="explain"/>

    <div style={{
      padding:'72px 64px', maxWidth: 760, margin:'0 auto', width:'100%'
    }}>
      <div className="caption-up" style={{color:'var(--primary)', marginBottom:14, fontSize:10}}>
        Not yet · soft block
      </div>
      <div className="display display-md" style={{marginBottom:18, color:'var(--ink)', fontWeight:400, lineHeight:1.18}}>
        Review this twice before explaining it back.
      </div>
      <div className="body-md" style={{color:'var(--body)', fontSize:16, lineHeight:1.65, marginBottom:14}}>
        Self-explanation only works when there's something in working memory to
        explain <em>from</em>. You've reviewed <strong>flakiness root causes</strong> once,
        eight days ago. Try at least one more retrieval first.
      </div>
      <div className="body-md" style={{color:'var(--muted)', fontSize:15, marginBottom:36}}>
        This isn't a paywall. You can override it if you really want.
      </div>

      {/* Eligibility progress — honest, no badges */}
      <div style={{
        padding:'20px 24px', background:'var(--surface-soft)',
        borderRadius:'var(--r-md)', marginBottom:24
      }}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14}}>
          <div className="title-sm" style={{color:'var(--ink)'}}>Eligibility</div>
          <div className="caption" style={{color:'var(--muted)'}}>1 of 2 reviews</div>
        </div>
        <div style={{display:'flex', gap:6}}>
          <div style={{flex:1, height:4, background:'var(--primary)', borderRadius:2}}></div>
          <div style={{flex:1, height:4, background:'var(--hairline)', borderRadius:2}}></div>
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginTop:14}}>
          Next review available in <strong style={{color:'var(--body-strong)', fontWeight:500}}>2h 14m</strong> ·
          this concept has 3 cards in your deck.
        </div>
      </div>

      <div style={{display:'flex', gap:10}}>
        <button className="qa-btn qa-btn-primary">Review the concept first →</button>
        <button className="qa-btn qa-btn-ghost" style={{color:'var(--muted)'}}>Explain anyway</button>
      </div>

      <div style={{marginTop:32}}>
        <Rationale items={[
          {what:"Soft block — overridable; warm copy, not a paywall.", why:"brief §4.2 eligibility gate"},
          {what:"Primary CTA is \"review first\", not \"explain anyway\".", why:"steer to higher-value action"},
          {what:"\"This isn't a paywall\" stated explicitly.", why:"trust through naming the tradeoff"},
        ]}/>
      </div>
    </div>
  </Frame>
);

Object.assign(window, { ExplainPrimary, ExplainPostSubmit, ExplainSoftBlock });
