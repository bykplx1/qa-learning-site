// /review — three alternate card-layout explorations.
// Each preserves the load-bearing rules: answer area dominant, no
// "Show answer" pre-attempt, no progress bar, no streak.
// They vary the SPATIAL relationship between prompt and answer field.

// Alt A — "Page". Prompt is a thin serif header band; the rest of the
// viewport is one large ruled paper area. Maximally editorial.
const ReviewAltPage = () => (
  <Frame>
    <div style={{
      height: 56, display:'flex', alignItems:'center', padding:'0 32px',
      borderBottom:'1px solid var(--hairline-soft)', justifyContent:'space-between'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review · card 14a3</span>
      </div>
      <button className="qa-btn qa-btn-ghost qa-btn-sm" style={{color:'var(--muted)'}}>End session</button>
    </div>

    {/* The prompt header band — quiet, single line, serif */}
    <div style={{
      padding:'28px 64px 22px', borderBottom:'1px solid var(--hairline-soft)',
      background:'var(--surface-soft)'
    }}>
      <div className="caption-up" style={{fontSize:10, marginBottom:6, color:'var(--muted)'}}>Test design · interleaved from cluster 3</div>
      <div className="display" style={{fontSize:22, lineHeight:1.3, color:'var(--ink)', maxWidth:920}}>
        Why does a test suite that depends on a fixed seeded dataset get more
        brittle as the codebase grows? Name the mechanism.
      </div>
    </div>

    {/* The page. Ruled paper. No textarea chrome, no "send" button visible above the fold. */}
    <div style={{flex:1, padding:'0 64px', display:'flex', justifyContent:'center'}}>
      <div style={{
        flex:1, maxWidth: 900, padding:'36px 0',
        backgroundImage:'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, var(--hairline-soft) 31px, var(--hairline-soft) 32px)',
        position:'relative'
      }}>
        <div style={{
          fontFamily:'var(--body-font)', fontSize:16.5, lineHeight:'32px',
          color:'var(--muted-soft)', fontStyle:'italic'
        }}>
          <span style={{display:'inline-block', width:2, height:18, background:'var(--ink)', verticalAlign:'-3px'}}></span>
          <span style={{marginLeft:4}}>Closed book. Start anywhere — partial recall counts.</span>
        </div>
      </div>
    </div>

    <div style={{
      padding:'18px 64px', borderTop:'1px solid var(--hairline-soft)',
      display:'flex', justifyContent:'space-between', alignItems:'center',
      background:'var(--canvas)'
    }}>
      <button className="qa-btn qa-btn-ghost" style={{color:'var(--muted)', paddingLeft:0}}>
        I don't know <span style={{color:'var(--muted-soft)', marginLeft:6}}>· recorded as failed retrieval</span>
      </button>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <span className="caption" style={{color:'var(--muted-soft)'}}>⌘ + Enter</span>
        <button className="qa-btn qa-btn-primary">Submit</button>
      </div>
    </div>

    <div style={{padding:'14px 64px 18px'}}>
      <Rationale items={[
        {what:"Prompt as a thin band; answer page fills the viewport.", why:"answer is the focal element"},
        {what:"Ruled paper instead of a textarea — encodes \"document, not form\".", why:"recall-first design language"},
        {what:"Submit lives in a fixed bottom rail, not next to the prompt.", why:"deliberate, not one-tap"},
      ]}/>
    </div>
  </Frame>
);

// Alt B — "Stage". The page inverts to dark navy; the answer slab is the
// only lit surface. Inversion of figure/ground for radical focus.
const ReviewAltStage = () => (
  <Frame dark>
    <div style={{
      height: 56, display:'flex', alignItems:'center', padding:'0 32px',
      borderBottom:'1px solid rgba(255,255,255,0.06)', justifyContent:'space-between',
      background:'var(--surface-dark)'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--on-dark-soft)'}}>
        <Spike size={12} color="var(--on-dark-soft)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em', color:'var(--on-dark-soft)'}}>QA · Review</span>
      </div>
      <button className="qa-btn qa-btn-on-dark qa-btn-sm">End session</button>
    </div>

    <div style={{
      flex:1, background:'var(--surface-dark)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'56px 0'
    }}>
      <div style={{width:'min(720px, 86%)'}}>
        {/* Prompt floats in the dark. */}
        <div className="caption-up" style={{color:'var(--on-dark-soft)', marginBottom:12, fontSize:10}}>
          Test design
        </div>
        <div className="display" style={{
          fontSize:24, lineHeight:1.3, color:'var(--on-dark)', marginBottom:28, fontWeight:400
        }}>
          Why does a test suite that depends on a fixed seeded dataset get more
          brittle as the codebase grows? Name the mechanism.
        </div>

        {/* Lit slab — the only cream surface. The answer field. */}
        <div style={{
          background:'var(--canvas)', borderRadius:'var(--r-lg)',
          minHeight: 280, padding:'22px 26px',
          boxShadow:'0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)'
        }}>
          <div className="caption-up" style={{fontSize:10, color:'var(--primary)', marginBottom:10}}>
            Write here
          </div>
          <div style={{
            fontFamily:'var(--body-font)', fontSize:16, lineHeight:1.7,
            color:'var(--muted-soft)', fontStyle:'italic'
          }}>
            <span style={{display:'inline-block', width:2, height:18, background:'var(--ink)', verticalAlign:'-3px'}}></span>
            <span style={{marginLeft:4}}>Closed book.</span>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20}}>
          <button className="qa-btn qa-btn-ghost" style={{color:'var(--on-dark-soft)', paddingLeft:0}}>
            I don't know
          </button>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <span className="caption" style={{color:'var(--on-dark-soft)'}}>⌘ + Enter</span>
            <button className="qa-btn qa-btn-primary">Submit</button>
          </div>
        </div>
      </div>
    </div>

    <div style={{padding:'14px 64px 18px', background:'var(--canvas)'}}>
      <Rationale items={[
        {what:"Inverts figure/ground: dark room, lit page.", why:"focus mode for tired learners"},
        {what:"Removes peripheral chrome to a minimum.", why:"build-doc §3.2 closed-book separation"},
        {what:"Same state machine; only visual register changes.", why:"reuses primary's affordances"},
      ]}/>
    </div>
  </Frame>
);

// Alt C — "Notebook spread". Two-column: narrow context column on left,
// dominant answer page on right. Echoes a real notebook spread.
const ReviewAltSpread = () => (
  <Frame>
    <div style={{
      height: 56, display:'flex', alignItems:'center', padding:'0 32px',
      borderBottom:'1px solid var(--hairline-soft)', justifyContent:'space-between'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--muted)'}}>
        <Spike size={12} color="var(--muted)"/>
        <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA · Review</span>
      </div>
      <button className="qa-btn qa-btn-ghost qa-btn-sm" style={{color:'var(--muted)'}}>End session</button>
    </div>

    <div style={{
      flex:1, display:'grid', gridTemplateColumns:'minmax(260px, 360px) 1fr',
      borderTop:'1px solid var(--hairline-soft)'
    }}>
      {/* Left page — context + prompt */}
      <div style={{
        padding:'56px 36px', background:'var(--surface-soft)',
        borderRight:'1px solid var(--hairline-soft)'
      }}>
        <div className="caption-up" style={{fontSize:10, color:'var(--muted)', marginBottom:10}}>
          Card · test design
        </div>
        <div className="display" style={{fontSize:21, lineHeight:1.3, color:'var(--ink)', marginBottom:24, fontWeight:400}}>
          Why does a test suite that depends on a fixed seeded dataset get more
          brittle as the codebase grows? Name the mechanism.
        </div>

        <div style={{borderTop:'1px solid var(--hairline)', paddingTop:18, marginTop:24}}>
          <div className="caption-up" style={{fontSize:10, color:'var(--muted)', marginBottom:6}}>Last seen</div>
          <div className="body-sm" style={{color:'var(--body)', marginBottom:14}}>14 days ago · stability 9.4d</div>
          <div className="caption-up" style={{fontSize:10, color:'var(--muted)', marginBottom:6}}>From</div>
          <div className="body-sm" style={{color:'var(--body)'}}>
            test-design/seed-coupling.mdx
          </div>
        </div>
      </div>

      {/* Right page — the answer */}
      <div style={{padding:'56px 56px 24px', display:'flex', flexDirection:'column'}}>
        <div className="caption-up" style={{fontSize:10, color:'var(--primary)', marginBottom:14}}>
          Write your answer · closed book
        </div>
        <div style={{
          flex:1, minHeight: 380,
          backgroundImage:'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, var(--hairline-soft) 31px, var(--hairline-soft) 32px)'
        }}>
          <div style={{
            fontFamily:'var(--body-font)', fontSize:16, lineHeight:'32px',
            color:'var(--muted-soft)', fontStyle:'italic'
          }}>
            <span style={{display:'inline-block', width:2, height:18, background:'var(--ink)', verticalAlign:'-3px'}}></span>
            <span style={{marginLeft:4}}>Spell it out. Partial recall counts.</span>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16}}>
          <button className="qa-btn qa-btn-ghost" style={{color:'var(--muted)', paddingLeft:0}}>
            I don't know
          </button>
          <button className="qa-btn qa-btn-primary">Submit</button>
        </div>
      </div>
    </div>

    <div style={{padding:'14px 36px 18px'}}>
      <Rationale items={[
        {what:"Context permanent on left, work happens on right.", why:"separation reinforces \"closed book\""},
        {what:"Card metadata visible without crowding the answer area.", why:"chrome stays recognition-first"},
        {what:"~70% of width belongs to the answer page.", why:"dominant focal element rule"},
      ]}/>
    </div>
  </Frame>
);

Object.assign(window, { ReviewAltPage, ReviewAltStage, ReviewAltSpread });
