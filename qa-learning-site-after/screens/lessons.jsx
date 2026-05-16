// /lessons/<cluster>/<slug> — Encoding surface, upgraded.
// Mayer principles: coherence (no decorative hero), segmenting (chunked +
// explicit continue), signaling (one takeaway per section), spatial
// contiguity (diagrams next to the prose they explain).
// End-of-lesson CTA: review due / explain / project — NEVER "next lesson".

// Informational SVG: contract-testing flow. Two-side CI + a shared broker.
const ContractDiagram = () => (
  <svg width="100%" viewBox="0 0 460 280" style={{display:'block'}}>
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/>
      </marker>
      <marker id="arrCoral" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--primary)"/>
      </marker>
    </defs>

    {/* Consumer side */}
    <rect x="14" y="36" width="140" height="120" rx="10"
          fill="var(--canvas)" stroke="var(--hairline)"/>
    <text x="84" y="22" textAnchor="middle" fontSize="10.5" fontWeight="600"
          fill="var(--muted)" fontFamily="Inter, sans-serif"
          letterSpacing="0.14em" style={{textTransform:'uppercase'}}>CONSUMER · BUYER WEB</text>
    <text x="30" y="70" fontSize="12.5" fontFamily="Inter, sans-serif" fill="var(--ink)" fontWeight="500">Test stubs the API</text>
    <text x="30" y="92" fontSize="12.5" fontFamily="Inter, sans-serif" fill="var(--body)">expects:</text>
    <text x="30" y="112" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--body)">{`{ status: 200,`}</text>
    <text x="30" y="126" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--body)">{`  id, total }`}</text>
    <text x="30" y="146" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--primary)">→ writes contract</text>

    {/* Broker — center */}
    <rect x="170" y="86" width="120" height="84" rx="10"
          fill="var(--surface-dark)" stroke="var(--surface-dark)"/>
    <text x="230" y="118" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13"
          fontWeight="500" fill="var(--on-dark)">Pact Broker</text>
    <text x="230" y="138" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11"
          fill="var(--on-dark-soft)">stores the contract</text>
    <text x="230" y="154" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11"
          fill="var(--on-dark-soft)">+ verification status</text>

    {/* Producer side */}
    <rect x="306" y="36" width="140" height="120" rx="10"
          fill="var(--canvas)" stroke="var(--hairline)"/>
    <text x="376" y="22" textAnchor="middle" fontSize="10.5" fontWeight="600"
          fill="var(--muted)" fontFamily="Inter, sans-serif"
          letterSpacing="0.14em" style={{textTransform:'uppercase'}}>PRODUCER · ORDER API</text>
    <text x="322" y="70" fontSize="12.5" fontFamily="Inter, sans-serif" fill="var(--ink)" fontWeight="500">CI replays</text>
    <text x="322" y="92" fontSize="12.5" fontFamily="Inter, sans-serif" fill="var(--body)">verifies real</text>
    <text x="322" y="108" fontSize="12.5" fontFamily="Inter, sans-serif" fill="var(--body)">response still fits</text>
    <text x="322" y="132" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--success)">✓ contract holds</text>
    <text x="322" y="146" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--error)">✗ red on merge</text>

    {/* Arrows */}
    <path d="M156 110 L168 110" stroke="var(--primary)" strokeWidth="1.8" fill="none" markerEnd="url(#arrCoral)"/>
    <path d="M292 132 L304 132" stroke="var(--ink)" strokeWidth="1.8" fill="none" markerEnd="url(#arr)"/>

    {/* The point */}
    <line x1="40" y1="200" x2="420" y2="200" stroke="var(--hairline)" strokeDasharray="3 3"/>
    <text x="40" y="226" fontFamily="Inter, sans-serif" fontSize="12.5"
          fill="var(--ink)" fontWeight="500">The failure surfaces in EACH side's own CI —</text>
    <text x="40" y="244" fontFamily="Inter, sans-serif" fontSize="12.5"
          fill="var(--body)">before merge, on the side that caused it.</text>
    <text x="40" y="265" fontFamily="Inter, sans-serif" fontSize="12.5"
          fill="var(--muted)">Not in staging. Not after deploy. Not in a Slack thread Friday at 6 pm.</text>
  </svg>
);

// ─── Primary state — reading the lesson ────────────────────────────────────
const LessonsPrimary = () => (
  <Frame>
    <TopNav active="lessons"/>

    {/* Breadcrumb + lesson meta */}
    <div style={{padding:'28px 64px 6px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div className="caption-up" style={{color:'var(--muted)', fontSize:10}}>
        Lessons · Cluster 3 — Integration & API testing · 02 of 06
      </div>
    </div>

    {/* No hero image. Title + intro carry the lesson. */}
    <div style={{padding:'12px 64px 24px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div className="display display-lg" style={{
        marginBottom:14, color:'var(--ink)', fontWeight:400, maxWidth:900, lineHeight:1.12
      }}>
        Contract testing — catching integration drift before it ships.
      </div>
      <div className="body-md" style={{color:'var(--body)', maxWidth:760, fontSize:16, lineHeight:1.7, marginBottom:18}}>
        ~ 14 minutes to read · 3 segments · 6 retrieval prompts at the end.
      </div>
      <div style={{display:'flex', gap:10, alignItems:'center'}}>
        <span className="qa-badge qa-badge-outline">prerequisites · unit tests, mocking</span>
        <span className="qa-badge qa-badge-outline">layer · patterns</span>
      </div>
    </div>

    {/* Section 1 — Core Idea */}
    <div style={{padding:'24px 64px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div className="caption-up" style={{color:'var(--primary)', marginBottom:10, fontSize:10}}>
        Segment 1 of 3 · Core Idea
      </div>
      <div className="display display-md" style={{marginBottom:18, color:'var(--ink)', fontWeight:400, lineHeight:1.2, maxWidth:880}}>
        Why unit tests and E2E both miss it.
      </div>

      {/* Two-column: prose left, diagram right — spatial contiguity */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:36, alignItems:'start'}}>
        <div className="body-md" style={{color:'var(--body)', fontSize:16, lineHeight:1.75, maxWidth:540}}>
          <p style={{margin:'0 0 16px'}}>
            Unit tests verify a function against its mocks. The consumer team
            writes a mock for the producer's API and tests pass against it. The
            mock is, by definition, what the consumer <em>thinks</em> the producer
            returns — not what the producer actually ships after the next refactor.
          </p>
          <p style={{margin:'0 0 16px'}}>
            E2E catches the real shape but only on staging, after both sides
            deploy, and usually by a different team in a different time zone.
            Cost of the failure is highest there.
          </p>
          <p style={{margin:0}}>
            A contract test sits in between. Each side independently verifies
            its half of a shared, machine-readable agreement, in its own CI,
            before merge.
          </p>
        </div>

        <div style={{
          background:'var(--surface-soft)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'18px 22px'
        }}>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:10, fontSize:10}}>
            Fig 1 · the loop
          </div>
          <ContractDiagram/>
        </div>
      </div>

      {/* Signaling: explicit blockquote takeaway under Core Idea */}
      <div style={{
        marginTop:32, padding:'18px 22px 18px 24px',
        borderLeft:'3px solid var(--primary)', background:'var(--surface-soft)',
        borderRadius:'0 var(--r-md) var(--r-md) 0', maxWidth:780
      }}>
        <div className="caption-up" style={{color:'var(--primary)', marginBottom:6, fontSize:10}}>The one takeaway</div>
        <div className="display" style={{fontSize:20, lineHeight:1.4, color:'var(--ink)'}}>
          Contract tests move the moment of catching API drift from
          <em> after merge </em>to <em>before merge</em>, on the side that caused it.
        </div>
      </div>
    </div>

    {/* Segment break — explicit user control */}
    <div style={{
      padding:'12px 64px', maxWidth: 1200, margin:'0 auto', width:'100%',
      display:'flex', alignItems:'center', gap:18
    }}>
      <div style={{flex:1, height:1, background:'var(--hairline)'}}></div>
      <button className="qa-btn qa-btn-secondary qa-btn-sm" style={{whiteSpace:'nowrap'}}>
        Continue to segment 2 · worked example →
      </button>
      <div style={{flex:1, height:1, background:'var(--hairline)'}}></div>
    </div>

    {/* Segment 2 preview — collapsed */}
    <div style={{padding:'18px 64px 24px', maxWidth: 1200, margin:'0 auto', width:'100%', opacity:0.42}}>
      <div className="caption-up" style={{color:'var(--muted)', marginBottom:10, fontSize:10}}>
        Segment 2 of 3 · Worked example — adding `customer.tier` without breaking buyer-web
      </div>
      <div className="display display-sm" style={{color:'var(--ink)', maxWidth:880}}>
        We add a new field to the producer's response. Watch where it breaks.
      </div>
    </div>

    <div style={{padding:'12px 64px 32px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <Rationale items={[
        {what:"No decorative hero — every figure carries information.", why:"brief §4.5 coherence · refuse #4"},
        {what:"Diagram sits NEXT to the prose it explains, not below.", why:"brief §4.5 spatial contiguity"},
        {what:"One signaled takeaway per section (left-rule blockquote).", why:"brief §4.5 signaling"},
        {what:"Explicit \"continue to segment 2\" — no autoscroll/autoplay.", why:"brief §4.5 segmenting · refuse #8/#12"},
        {what:"No completion bar; segments are surfaced by content.", why:"refuse #5 \"100% complete\" badge"},
      ]}/>
    </div>
  </Frame>
);

// ─── End-of-lesson CTA state ──────────────────────────────────────────────
// The three options, in priority order, replacing "Next lesson".
const LessonsEndCTA = () => (
  <Frame>
    <TopNav active="lessons"/>

    {/* Top: tiny breadcrumb showing the user finished reading */}
    <div style={{padding:'28px 64px 6px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div className="caption-up" style={{color:'var(--muted)', fontSize:10}}>
        Lessons · Cluster 3 · Contract testing · all 3 segments read
      </div>
    </div>

    {/* The "you finished reading" tone — no checkmark, no badge, no confetti */}
    <div style={{padding:'8px 64px 28px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div className="display display-lg" style={{
        marginBottom:12, color:'var(--ink)', fontWeight:400, lineHeight:1.15, maxWidth:900
      }}>
        You've encoded the idea. Reading was the easy part.
      </div>
      <div className="body-md" style={{color:'var(--body)', maxWidth:760, fontSize:16, lineHeight:1.7}}>
        What you do in the next ten minutes determines whether you'll still
        have this in a fortnight. Pick one.
      </div>
    </div>

    {/* The three options, in priority order */}
    <div style={{padding:'0 64px 24px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:18}}>
        {/* Priority 1 — Review due (highest leverage) */}
        <div style={{
          background:'var(--surface-dark)', borderRadius:'var(--r-lg)',
          padding:'26px 28px', color:'var(--on-dark)',
          display:'flex', flexDirection:'column', minHeight:240
        }}>
          <div className="caption-up" style={{color:'var(--accent-amber)', marginBottom:10, fontSize:10}}>
            Priority 1 · highest retention
          </div>
          <div className="display" style={{fontSize:24, color:'var(--on-dark)', marginBottom:10, lineHeight:1.25}}>
            Review the cards you have due.
          </div>
          <div className="body-md" style={{color:'var(--on-dark-soft)', fontSize:14.5, marginBottom:20, flex:1}}>
            You have <strong style={{color:'var(--on-dark)'}}>9 cards</strong> due in this cluster.
            Closed-book recall on what you just read is the single thing most
            likely to keep it.
          </div>
          <button className="qa-btn qa-btn-primary" style={{alignSelf:'flex-start'}}>
            Open review · ~12 min →
          </button>
        </div>

        {/* Priority 2 — Explain it back */}
        <div style={{
          background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'26px 28px',
          display:'flex', flexDirection:'column', minHeight:240
        }}>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:10, fontSize:10}}>
            Priority 2 · eligible
          </div>
          <div className="display" style={{fontSize:22, color:'var(--ink)', marginBottom:10, lineHeight:1.25}}>
            Explain it back, in your own words.
          </div>
          <div className="body-md" style={{color:'var(--body)', fontSize:14.5, marginBottom:20, flex:1}}>
            You've reviewed contract testing 3 times. You're past the eligibility
            gate. Self-explanation is where the hand-waves show up.
          </div>
          <button className="qa-btn qa-btn-secondary" style={{alignSelf:'flex-start'}}>
            Open /explain · ~15 min →
          </button>
        </div>

        {/* Priority 3 — Start a project */}
        <div style={{
          background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'26px 28px',
          display:'flex', flexDirection:'column', minHeight:240
        }}>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:10, fontSize:10}}>
            Priority 3 · keyed to this cluster
          </div>
          <div className="display" style={{fontSize:22, color:'var(--ink)', marginBottom:10, lineHeight:1.25}}>
            Use it on a real artifact.
          </div>
          <div className="body-md" style={{color:'var(--body)', fontSize:14.5, marginBottom:20, flex:1}}>
            "Write contract tests between the buyer-web and order-api repos in
            the demo monorepo." Rubric-graded.
          </div>
          <button className="qa-btn qa-btn-secondary" style={{alignSelf:'flex-start'}}>
            Open project · ~ 2h →
          </button>
        </div>
      </div>

      {/* The explicit refusal of "next lesson" */}
      <div style={{
        marginTop:22, padding:'16px 22px',
        background:'var(--surface-soft)', border:'1px dashed var(--hairline)',
        borderRadius:'var(--r-md)',
        display:'flex', justifyContent:'space-between', alignItems:'center', gap:16
      }}>
        <div className="body-sm" style={{color:'var(--muted)', fontSize:13.5}}>
          There is no "Continue to next lesson" button on this page on purpose.
          Reading one lesson after another feels productive and produces almost no retention.
        </div>
        <a className="caption" style={{color:'var(--muted)', whiteSpace:'nowrap'}}>
          Browse cluster index →
        </a>
      </div>
    </div>

    <div style={{padding:'12px 64px 32px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <Rationale items={[
        {what:"Three end-options in priority order; no fourth.", why:"brief §4.5 end-CTA pattern"},
        {what:"\"Review due cards\" is priority 1 — dark surface = voltage.", why:"brief §4.5 priority order"},
        {what:"No \"Next lesson\" CTA exists; refusal stated in copy.", why:"refuse list #9"},
        {what:"No completed-checkmark or 100% badge.", why:"refuse list #5"},
      ]}/>
    </div>
  </Frame>
);

Object.assign(window, { LessonsPrimary, LessonsEndCTA });
