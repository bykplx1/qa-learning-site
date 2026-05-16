// /review — Retrieval Surface. The most important screen in the system.
// Design tenet: closed-book recall. Answer area dominates; prompt is secondary.
// No "Show answer" pre-attempt. No streaks. No progress bar.

// ─── Primary state ─────────────────────────────────────────────────────────
// The prompt-and-empty-page state. Answer field is the dominant element.
const ReviewPrimary = () => (
  <Frame>
    {/* Spare nav: brand + "End session" only. No progress, no streak, no count. */}
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 32px', borderBottom: '1px solid var(--hairline-soft)',
      justifyContent: 'space-between', background: 'var(--canvas)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review</span>
      </div>
      <div style={{display:'flex', gap:18, alignItems:'center'}}>
        <span className="caption" style={{color:'var(--muted-soft)'}}>21 min in session</span>
        <button className="qa-btn qa-btn-ghost qa-btn-sm" style={{color:'var(--muted)'}}>End session</button>
      </div>
    </div>

    <Body pad={0} style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'56px 0 40px'}}>
      <div style={{width:'min(760px, 88%)'}}>
        {/* Quiet metadata so the prompt is secondary */}
        <div style={{display:'flex', gap:8, marginBottom:18, alignItems:'center'}}>
          <span className="qa-badge" style={{background:'transparent', border:'1px solid var(--hairline)', color:'var(--muted)'}}>
            Test design
          </span>
          <span className="caption" style={{color:'var(--muted-soft)'}}>last seen 14 days ago · stability 9.4d</span>
        </div>

        {/* Prompt — restrained. Serif but at a modest size relative to the answer area. */}
        <div className="display display-sm" style={{marginBottom:36, color:'var(--ink)'}}>
          Why does a test suite that depends on a fixed seeded dataset get more
          brittle as the codebase grows? Name the mechanism, not just the term.
        </div>

        {/* The answer area — DOMINANT. Large, paper-like, the unmistakable focal element. */}
        <div style={{
          background: 'var(--canvas)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--r-lg)',
          minHeight: 320,
          padding: '24px 28px',
          position: 'relative',
          boxShadow: '0 0 0 4px rgba(204,120,92,0.06)'
        }}>
          <div style={{
            position:'absolute', top: -10, left: 18,
            background: 'var(--canvas)', padding: '0 8px',
            fontFamily:'var(--body-font)', fontSize: 11, fontWeight:500,
            letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--primary)'
          }}>
            Write your answer
          </div>
          <div style={{
            fontFamily:'var(--body-font)', fontSize: 16, lineHeight: 1.7,
            color:'var(--muted-soft)', fontStyle: 'italic'
          }}>
            <span style={{
              display:'inline-block', width:2, height:18, background:'var(--ink)',
              verticalAlign:'-3px', marginRight:1, animation:'none'
            }}></span>
            <span style={{marginLeft:2}}>Closed book. Spell it out — partial recall counts.</span>
          </div>
        </div>

        {/* Action row — no "show answer" button. The skip path is deliberate. */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20}}>
          <button className="qa-btn qa-btn-ghost" style={{color:'var(--muted)', paddingLeft:0}}>
            I don't know <span style={{color:'var(--muted-soft)', marginLeft:6}}>· recorded as a failed retrieval</span>
          </button>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <span className="caption" style={{color:'var(--muted-soft)'}}>⌘ + Enter</span>
            <button className="qa-btn qa-btn-primary">Submit answer</button>
          </div>
        </div>

        <Rationale items={[
          {what: "Answer area dominates; prompt is secondary serif.", why: "brief §4.1 · closed-book affordance"},
          {what: "No \"Show answer\" pre-attempt; skip is its own button & recorded.", why: "brief §4.1 · refuse list #1"},
          {what: "No progress bar (\"3 of 14\"), no streak counter.", why: "brief §4.1 · build-doc §10/§13"},
          {what: "No autocomplete; placeholder copy is honest, not helpful.", why: "build-doc §8 recall-first"},
        ]}/>
      </div>
    </Body>
  </Frame>
);

// ─── Reveal + self-grade state ─────────────────────────────────────────────
// After submit. Answer appears on a new screen state. Self-grade is the
// only rating UI. Reveal is intentionally delayed — not an inline diff.
const ReviewReveal = () => (
  <Frame>
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 32px', borderBottom: '1px solid var(--hairline-soft)',
      justifyContent: 'space-between'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review</span>
      </div>
      <span className="caption" style={{color:'var(--muted-soft)'}}>card 14a3 · seed coupling</span>
    </div>

    <Body pad={0} style={{padding:'48px 0 40px'}}>
      <div style={{width:'min(760px, 88%)', margin:'0 auto'}}>
        {/* The prompt — even quieter on reveal. */}
        <div className="caption-up" style={{color:'var(--muted-soft)', marginBottom:8, fontSize:10}}>The question</div>
        <div className="display display-sm" style={{marginBottom:32, fontSize:22, color:'var(--body-strong)'}}>
          Why does a test suite that depends on a fixed seeded dataset get more
          brittle as the codebase grows?
        </div>

        {/* What the user wrote — kept visible & honest */}
        <div style={{
          borderLeft: '2px solid var(--hairline)',
          padding: '6px 0 6px 18px',
          marginBottom: 32
        }}>
          <div className="caption-up" style={{fontSize:10, marginBottom:6, color:'var(--muted)'}}>You wrote</div>
          <div style={{
            fontFamily:'var(--body-font)', fontSize:15, lineHeight:1.65, color:'var(--body)'
          }}>
            Tests get coupled to the seed data, so changing the seed breaks them.
            Adding a new column or relationship cascades.
          </div>
        </div>

        {/* Reference answer — coral marker; spelled out so the user can compare their own depth. */}
        <div style={{marginBottom:36}}>
          <div className="caption-up" style={{fontSize:10, marginBottom:8, color:'var(--primary)'}}>The answer</div>
          <div className="display" style={{fontSize:19, lineHeight:1.5, color:'var(--ink)', marginBottom:14}}>
            Each test silently couples to the <em>shape</em> of the seed —
            IDs, column names, FK relationships, ordering.
          </div>
          <div className="body-md" style={{color:'var(--body)'}}>
            When the schema or seed changes, <em>every</em> dependent test breaks
            at once, and the failure surface is far from the cause. The mechanism
            is hidden coupling, not "tests need updating." The fix: seed only the
            rows each test needs, scoped to that test — never a global fixture
            shared across the suite.
          </div>
        </div>

        {/* 4-point self-grade. One tap. No confirm. */}
        <div className="caption-up" style={{fontSize:10, marginBottom:12, color:'var(--muted)'}}>
          How honestly did you recall this?
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {[
            {label:'Again', sub:'< 1 day', tone:'#c64545'},
            {label:'Hard', sub:'~ 3 days', tone:'#d4a017'},
            {label:'Good', sub:'~ 9 days', tone:'#3d3d3a'},
            {label:'Easy', sub:'~ 21 days', tone:'#5db872'},
          ].map(g => (
            <button key={g.label} className="qa-btn-secondary qa-btn" style={{
              height: 64, flexDirection:'column', gap:4,
              borderColor:'var(--hairline)', background:'var(--canvas)',
              padding:'0 14px'
            }}>
              <span style={{fontSize:15, fontWeight:500, color:g.tone}}>{g.label}</span>
              <span style={{fontSize:11.5, fontWeight:400, color:'var(--muted-soft)'}}>next · {g.sub}</span>
            </button>
          ))}
        </div>
        <div className="caption" style={{color:'var(--muted-soft)', marginTop:10, textAlign:'center'}}>
          Press 1 · 2 · 3 · 4
        </div>

        <div style={{marginTop:28}}>
          <Rationale items={[
            {what:"Reveal on a separate state, not inline diff.", why:"brief §4.1 · delay is the design"},
            {what:"4-point self-grade is the only rating UI.", why:"brief §4.1 · no thumbs/stars/%"},
            {what:"Pick is the entire interaction — no confirm modal.", why:"brief §4.1 step 5"},
            {what:"User's own answer kept visible for honest comparison.", why:"build-doc §3.2 retrieval"},
          ]}/>
        </div>
      </div>
    </Body>
  </Frame>
);

// ─── Empty-queue celebration ───────────────────────────────────────────────
// Small, dignified, REFUSES to serve more. Offers production routes.
const ReviewEmpty = () => (
  <Frame>
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 32px', borderBottom: '1px solid var(--hairline-soft)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review</span>
      </div>
    </div>

    <Body pad={0} style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0'}}>
      <div style={{width:'min(620px, 86%)', textAlign:'left'}}>
        <Spike size={20} color="var(--primary)"/>
        <div className="display display-md" style={{marginTop:24, marginBottom:18, color:'var(--ink)'}}>
          That's today's review.
        </div>
        <div className="body-md" style={{color:'var(--body)', fontSize:16, lineHeight:1.65, marginBottom:14}}>
          Your due queue is empty. The cards that were ready for retrieval today
          have been graded. Forcing more reviews now would re-encode material
          that's already at peak retrievability — it would <em>cost</em> stability,
          not build it.
        </div>
        <div className="body-md" style={{color:'var(--muted)', fontSize:15, marginBottom:36}}>
          Come back tomorrow. The interval is doing its job.
        </div>

        {/* The refusal: NO "review more" CTA. Only production / explanation routes. */}
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          <button className="qa-btn qa-btn-secondary">Explain a concept →</button>
          <button className="qa-btn qa-btn-secondary">Open a project →</button>
        </div>

        <div style={{marginTop:36, padding:'14px 16px', background:'var(--surface-soft)', borderRadius:'var(--r-md)'}}>
          <div className="caption" style={{color:'var(--muted)'}}>
            Next card releases in <strong style={{color:'var(--body-strong)'}}>14h 22m</strong>
            <span style={{margin:'0 8px', color:'var(--muted-soft)'}}>·</span>
            stability across your deck has grown <strong style={{color:'var(--body-strong)'}}>+3.1 days</strong> this week
          </div>
        </div>

        <div style={{marginTop:24}}>
          <Rationale items={[
            {what:"Refuses to serve more cards — small, dignified.", why:"brief §4.1 · build-doc §10"},
            {what:"Alternatives point to production/explanation, not \"review more\".", why:"brief §4.1 empty-queue rule"},
            {what:"One honest metric (stability growth), no streak.", why:"brief §4.3 · build-doc §12"},
          ]}/>
        </div>
      </div>
    </Body>
  </Frame>
);

// ─── Session-cap nudge (modal overlay) ─────────────────────────────────────
const ReviewSessionCap = () => (
  <Frame>
    {/* Behind: a faded version of the primary state */}
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 32px', borderBottom: '1px solid var(--hairline-soft)',
      opacity: 0.5
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review</span>
      </div>
    </div>
    <Body pad={0} style={{position:'relative', padding:'56px 0', opacity: 0.35, pointerEvents:'none'}}>
      <div style={{width:'min(760px, 88%)', margin:'0 auto'}}>
        <div className="display display-sm">
          Why does contract testing surface integration breakage that unit and
          E2E both miss?
        </div>
        <div style={{
          marginTop: 32, height: 280,
          background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)'
        }}></div>
      </div>
    </Body>

    {/* Overlay — warm, dismissable. NOT modal-blocking; the user is trusted. */}
    <div style={{
      position:'absolute', inset:0,
      background: 'rgba(20,20,19,0.18)',
      backdropFilter: 'blur(2px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24
    }}>
      <div style={{
        width:'min(480px, 100%)',
        background:'var(--canvas)',
        border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)',
        padding: 28,
        boxShadow: '0 12px 48px rgba(20,20,19,0.18)'
      }}>
        <div className="caption-up" style={{color:'var(--primary)', marginBottom:10, fontSize:10}}>
          A note — not a wall
        </div>
        <div className="display" style={{fontSize:24, lineHeight:1.25, marginBottom:14, color:'var(--ink)'}}>
          Take a five-minute walk. The cards will still be here.
        </div>
        <div className="body-md" style={{color:'var(--body)', marginBottom:22}}>
          You've been at this for 25 minutes unbroken. Consolidation happens in
          the gap, not in the next ten cards. We're not trying to be your parent
          — but the science is unambiguous here.
        </div>
        <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
          <button className="qa-btn qa-btn-ghost qa-btn-sm" style={{color:'var(--muted)'}}>I'll keep going</button>
          <button className="qa-btn qa-btn-primary qa-btn-sm">Pause for five</button>
        </div>
      </div>
    </div>
  </Frame>
);

// ─── First-time visitor disclaimer ─────────────────────────────────────────
const ReviewFirstTime = () => (
  <Frame>
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 32px', borderBottom: '1px solid var(--hairline-soft)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review</span>
      </div>
    </div>

    <Body pad={0} style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'72px 0'}}>
      <div style={{width:'min(620px, 86%)'}}>
        <div className="caption-up" style={{color:'var(--primary)', marginBottom:14, fontSize:10}}>
          Before your first session — read once
        </div>
        <div className="display display-md" style={{marginBottom:24, color:'var(--ink)', lineHeight:1.18}}>
          Mixed practice feels worse than blocked practice — and produces better
          retention.
        </div>
        <div className="body-md" style={{color:'var(--body)', fontSize:16, lineHeight:1.7, marginBottom:14}}>
          The cards here are pulled across topics on purpose. Two consecutive
          cards will rarely come from the same cluster. You'll feel like you're
          getting <em>worse</em> than you did in the lesson reader — slower,
          more wrong, more frustrated.
        </div>
        <div className="body-md" style={{color:'var(--body)', fontSize:16, lineHeight:1.7, marginBottom:14}}>
          That feeling is the design working. Blocked review feels fluent and
          predicts <em>nothing</em> about whether you'll remember the material
          in two weeks. Interleaved review feels harder and is the only signal
          that maps to long-term memory.
        </div>
        <div className="body-md" style={{color:'var(--muted)', fontSize:15, marginBottom:36}}>
          Shown once. Not shown again.
        </div>

        <div style={{display:'flex', gap:10}}>
          <button className="qa-btn qa-btn-primary">Begin first session</button>
          <button className="qa-btn qa-btn-ghost" style={{color:'var(--muted)'}}>Read the principles first</button>
        </div>

        <div style={{marginTop: 36}}>
          <Rationale items={[
            {what:"Honest disclaimer copy — warm, never punitive or hype-y.", why:"brief §5 row 1"},
            {what:"Spells out the perception-vs-performance gap explicitly.", why:"build-doc §5 interleaving"},
            {what:"\"Shown once, not again\" — no daily-nag pattern.", why:"refuse list #3"},
          ]}/>
        </div>
      </div>
    </Body>
  </Frame>
);

Object.assign(window, {
  ReviewPrimary, ReviewReveal, ReviewEmpty, ReviewSessionCap, ReviewFirstTime
});
