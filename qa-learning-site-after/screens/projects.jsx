// /projects/<slug> — Production surface, upgraded.
// Concept gate ABOVE the project intro. Rubric visible BEFORE submit
// (unlike Feynman). Submissions private by default; opt-in publish.

// Small bar showing per-concept stability vs threshold.
const ConceptRow = ({ name, stability, threshold = 7, blocked = false }) => {
  const max = 18;
  const pct = Math.min(100, (stability / max) * 100);
  const thrPct = (threshold / max) * 100;
  return (
    <div style={{display:'grid', gridTemplateColumns:'200px 1fr 110px', alignItems:'center', gap:18, padding:'10px 0'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
        <span style={{
          width:8, height:8, borderRadius:'50%',
          background: blocked ? 'var(--error)' : 'var(--success)'
        }}></span>
        <span className="body-sm" style={{
          color:'var(--ink)', fontWeight:500, whiteSpace:'nowrap',
          overflow:'hidden', textOverflow:'ellipsis'
        }}>{name}</span>
      </div>
      <div style={{position:'relative', height:6, background:'var(--surface-soft)', borderRadius:3}}>
        <div style={{
          position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`,
          background: blocked ? 'var(--error)' : 'var(--success)', borderRadius:3
        }}></div>
        <div style={{
          position:'absolute', left:`${thrPct}%`, top:-3, bottom:-3, width:1,
          background:'var(--ink)'
        }}></div>
        <div style={{
          position:'absolute', left:`${thrPct}%`, top:-16,
          fontSize:9.5, color:'var(--muted)', fontWeight:500,
          letterSpacing:'0.1em', textTransform:'uppercase', transform:'translateX(-50%)'
        }}>threshold</div>
      </div>
      <div style={{textAlign:'right'}}>
        <span className="body-sm" style={{color: blocked ? 'var(--error)' : 'var(--body)', fontVariantNumeric:'tabular-nums'}}>
          {stability.toFixed(1)}d
        </span>
        <span className="caption" style={{color:'var(--muted-soft)', marginLeft:6}}>stability</span>
      </div>
    </div>
  );
};

const RubricRow = ({ label, prompt, score = null }) => (
  <div style={{padding:'18px 0', borderBottom:'1px solid var(--hairline-soft)'}}>
    <div style={{display:'grid', gridTemplateColumns:'1fr 220px', gap:24, alignItems:'start'}}>
      <div>
        <div className="title-sm" style={{color:'var(--ink)', marginBottom:4}}>{label}</div>
        <div className="body-sm" style={{color:'var(--muted)', fontSize:13.5, lineHeight:1.55}}>{prompt}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6}}>
        {['0','1','2','3'].map(v => (
          <div key={v} style={{
            height:32, borderRadius:'var(--r-sm)',
            border:'1px solid ' + (score === parseInt(v) ? 'var(--primary)' : 'var(--hairline)'),
            background: score === parseInt(v) ? 'var(--primary)' : 'transparent',
            color: score === parseInt(v) ? 'var(--on-primary)' : 'var(--body)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:500, fontFamily:'var(--body-font)'
          }}>{v}</div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Primary state — concepts pass, project active ────────────────────────
const ProjectsPrimary = () => (
  <Frame>
    <TopNav active="projects"/>

    <div style={{padding:'48px 64px 12px', maxWidth: 1180, margin:'0 auto', width:'100%'}}>
      <div style={{display:'flex', gap:8, marginBottom:12, alignItems:'center'}}>
        <span className="qa-badge">Cluster 3 · Exploration</span>
        <span className="qa-badge qa-badge-outline">~ 2h project</span>
      </div>
      <div className="display display-lg" style={{marginBottom:14, color:'var(--ink)', fontWeight:400, maxWidth:900}}>
        Write an exploration charter for a new payment-method onboarding flow.
      </div>
      <div className="body-md" style={{color:'var(--body)', maxWidth:760, fontSize:16, lineHeight:1.7}}>
        You're handed a Figma file for adding Apple Pay to checkout, a half-finished
        backend, and three days. Write the charter that gets the worst bugs found
        first. Submit as a markdown artifact.
      </div>
    </div>

    {/* Concept gate */}
    <div style={{padding:'32px 64px 0', maxWidth: 1180, margin:'0 auto', width:'100%'}}>
      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16}}>
          <div>
            <div className="caption-up" style={{color:'var(--success)', marginBottom:6, fontSize:10}}>
              All four concepts above threshold
            </div>
            <div className="title-md" style={{color:'var(--ink)'}}>
              Concept gate · what this project requires
            </div>
          </div>
          <div className="caption" style={{color:'var(--muted)'}}>retention shown · not lessons completed</div>
        </div>

        <div style={{marginTop:18}}>
          <ConceptRow name="exploration vs scripted" stability={11.4}/>
          <ConceptRow name="charter format (Bach)" stability={9.2}/>
          <ConceptRow name="heuristics: FEW HICCUPPS" stability={14.6}/>
          <ConceptRow name="bug isolation" stability={8.1}/>
        </div>
      </div>
    </div>

    {/* Body — rubric visible BEFORE submit; submission area */}
    <div style={{
      padding:'32px 64px 32px', maxWidth: 1180, margin:'0 auto', width:'100%',
      display:'grid', gridTemplateColumns:'1fr 360px', gap:28
    }}>
      <div>
        {/* Submission area */}
        <div style={{
          background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'24px 28px'
        }}>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:14, fontSize:10}}>
            Your artifact
          </div>
          <div style={{
            background:'var(--surface-dark)', borderRadius:'var(--r-md)',
            padding:'18px 20px', color:'var(--on-dark)',
            fontFamily:'var(--mono)', fontSize:13, lineHeight:1.6,
            border:'1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{color:'var(--accent-amber)', marginBottom:8}}># Charter — Apple Pay at checkout</div>
            <div style={{color:'var(--on-dark-soft)', marginBottom:4}}>**Mission**</div>
            <div style={{color:'var(--on-dark)', marginBottom:10}}>Find the worst-impact bugs in the first 3 hours.</div>
            <div style={{color:'var(--on-dark-soft)', marginBottom:4}}>**Areas (in priority order)**</div>
            <div style={{color:'var(--on-dark)', marginBottom:2}}>1. Wallet handshake failures (network, timing, cancel)</div>
            <div style={{color:'var(--on-dark)', marginBottom:2}}>2. Currency + amount mismatch on multi-region…</div>
            <div style={{color:'var(--muted-soft)'}}>▎</div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:16, alignItems:'center'}}>
            <button className="qa-btn qa-btn-secondary qa-btn-sm">Upload .md instead</button>
            <span className="caption" style={{color:'var(--muted-soft)'}}>1,043 words · last saved 2m ago</span>
          </div>
        </div>

        {/* Rubric — visible BEFORE submit (unlike Feynman) */}
        <div style={{
          marginTop:24, background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'8px 28px 18px'
        }}>
          <div style={{padding:'18px 0 8px'}}>
            <div className="caption-up" style={{color:'var(--muted)', marginBottom:4, fontSize:10}}>
              Rubric · visible up front
            </div>
            <div className="title-md" style={{color:'var(--ink)', marginBottom:4}}>
              You'll self-score against these criteria.
            </div>
            <div className="body-sm" style={{color:'var(--muted)'}}>
              Production benefits from criteria clarity. (Explanation, on /explain,
              hides the rubric until submit — different surface, different reason.)
            </div>
          </div>

          <RubricRow label="Mission framed in user/customer terms" score={2}
            prompt="Not 'test the payment flow' — what bug shape would actually hurt a real buyer?"/>
          <RubricRow label="Areas prioritized by risk × novelty, not by ordering"
            prompt="The order of areas reflects where defects are most likely AND most costly."/>
          <RubricRow label="At least one heuristic referenced by name"
            prompt="FEW HICCUPPS, SFDIPOT, Pesticide Paradox — name one and apply it."/>
          <RubricRow label="Stop conditions are concrete and time-bound"
            prompt="Not 'when I'm confident' — a real budget, e.g. 90 min/area or N defects."/>
          <RubricRow label="Debrief plan exists" 
            prompt="What happens to the notes after — who reads them, in what form?"/>
        </div>
      </div>

      {/* Right rail — visibility, submit */}
      <div>
        <div style={{
          background:'var(--surface-soft)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'22px 24px'
        }}>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:10, fontSize:10}}>
            Visibility
          </div>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 14px', background:'var(--canvas)', borderRadius:'var(--r-md)',
            border:'1px solid var(--hairline)', marginBottom:10
          }}>
            <div>
              <div className="title-sm">Keep private</div>
              <div className="caption" style={{color:'var(--muted)'}}>only you can see it</div>
            </div>
            <div style={{
              width:36, height:20, borderRadius:10, background:'var(--primary)',
              position:'relative'
            }}>
              <div style={{
                position:'absolute', right:2, top:2, width:16, height:16,
                borderRadius:'50%', background:'var(--canvas)'
              }}></div>
            </div>
          </div>
          <div className="body-sm" style={{color:'var(--muted)', fontSize:13}}>
            Opt in to publish to your portfolio. Public artifacts build the
            <em> relatedness </em>leg of motivation; private is fine too.
          </div>
        </div>

        <div style={{
          marginTop:18, background:'var(--canvas)', border:'1px solid var(--hairline)',
          borderRadius:'var(--r-lg)', padding:'22px 24px'
        }}>
          <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>
            On submit
          </div>
          <div className="body-sm" style={{color:'var(--body)', marginBottom:14, fontSize:13.5}}>
            Your rubric scores are written alongside the artifact. There is no
            pass/fail and no overall grade.
          </div>
          <button className="qa-btn qa-btn-primary" style={{width:'100%'}}>Submit artifact + scores</button>
        </div>
      </div>
    </div>

    <div style={{padding:'0 64px 32px', maxWidth: 1180, margin:'0 auto', width:'100%'}}>
      <Rationale items={[
        {what:"Concept gate above the project — required concepts shown first.", why:"brief §4.4 · concept-gap callout"},
        {what:"Rubric visible BEFORE submit (asymmetric vs /explain).", why:"brief §4.4 · criteria-clarity"},
        {what:"Per-row scores; no pass/fail, no overall grade.", why:"brief §4.4 · rubric not pass/fail"},
        {what:"Private by default; opt-in publish, not opt-out.", why:"brief §4.4 visibility toggle"},
      ]}/>
    </div>
  </Frame>
);

// ─── Concept-gap state — blocks the project, deep-links to review ─────────
const ProjectsConceptGap = () => (
  <Frame>
    <TopNav active="projects"/>

    <div style={{padding:'48px 64px 12px', maxWidth: 1180, margin:'0 auto', width:'100%'}}>
      <div style={{display:'flex', gap:8, marginBottom:12, alignItems:'center'}}>
        <span className="qa-badge">Cluster 3 · Exploration</span>
        <span className="qa-badge qa-badge-outline">~ 2h project</span>
      </div>
      <div className="display display-lg" style={{marginBottom:14, color:'var(--ink)', fontWeight:400, maxWidth:900, opacity:0.55}}>
        Write an exploration charter for a new payment-method onboarding flow.
      </div>
      <div className="body-md" style={{color:'var(--muted)', maxWidth:760, fontSize:16, lineHeight:1.7}}>
        We're holding off on opening this one — two of the four required concepts
        are below the threshold where the project would actually exercise them.
      </div>
    </div>

    <div style={{padding:'32px 64px 0', maxWidth: 1180, margin:'0 auto', width:'100%'}}>
      <div style={{
        background:'var(--canvas)', border:'1px solid var(--primary)',
        borderRadius:'var(--r-lg)', padding:'24px 28px',
        boxShadow:'0 0 0 4px var(--primary-tint)'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:18}}>
          <div>
            <div className="caption-up" style={{color:'var(--primary)', marginBottom:6, fontSize:10}}>
              Two concepts below threshold
            </div>
            <div className="title-md" style={{color:'var(--ink)'}}>
              The gap, plainly stated.
            </div>
          </div>
          <button className="qa-btn qa-btn-primary qa-btn-sm">Review these now →</button>
        </div>

        <ConceptRow name="exploration vs scripted" stability={11.4}/>
        <ConceptRow name="charter format (Bach)" stability={3.4} blocked/>
        <ConceptRow name="heuristics: FEW HICCUPPS" stability={14.6}/>
        <ConceptRow name="bug isolation" stability={4.1} blocked/>

        <div style={{
          marginTop:20, padding:'14px 16px', background:'var(--surface-soft)',
          borderRadius:'var(--r-md)', display:'flex', gap:14, alignItems:'flex-start'
        }}>
          <span style={{
            width:18, height:18, borderRadius:'50%', background:'var(--primary)',
            color:'var(--on-primary)', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:600, flexShrink:0, marginTop:1
          }}>!</span>
          <div className="body-sm" style={{color:'var(--body)', fontSize:13.5, lineHeight:1.55}}>
            Doing the project now means producing an artifact you don't actually
            understand the criteria for — which is the failure mode this gate exists
            to prevent. <a className="qa-link">Open 9 cards in /review?cluster=exploration</a> first.
            ~15 minutes.
          </div>
        </div>
      </div>
    </div>

    <div style={{
      padding:'24px 64px 0', maxWidth: 1180, margin:'0 auto', width:'100%',
      display:'grid', gridTemplateColumns:'1fr 1fr', gap:18
    }}>
      <div style={{
        background:'var(--surface-soft)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>Or — alternative</div>
        <div className="title-md" style={{color:'var(--ink)', marginBottom:6}}>
          Override and start anyway
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginBottom:12}}>
          The block is soft. You can open the project without reviewing — your
          submission will be tagged "below threshold" so you know later.
        </div>
        <button className="qa-btn qa-btn-secondary qa-btn-sm">Open anyway</button>
      </div>

      <div style={{
        background:'var(--surface-soft)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>Or — explain it first</div>
        <div className="title-md" style={{color:'var(--ink)', marginBottom:6}}>
          Write it back to consolidate
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginBottom:12}}>
          Charter format is below threshold and eligible for /explain — writing
          it back is often faster than another review pass.
        </div>
        <button className="qa-btn qa-btn-secondary qa-btn-sm">Explain charter format →</button>
      </div>
    </div>

    <div style={{padding:'24px 64px 32px', maxWidth: 1180, margin:'0 auto', width:'100%'}}>
      <Rationale items={[
        {what:"Concept gap stops the project before the intro is read.", why:"brief §4.4 · gate above intro"},
        {what:"Deep-links to /review?cluster=… with concrete card count + time.", why:"brief §5 concept-gap callout"},
        {what:"Override is offered and tagged — not silently blocked.", why:"trust through honesty"},
        {what:"Routes to /explain as an alternative — concept reuse.", why:"build-doc §6 self-explanation"},
      ]}/>
    </div>
  </Frame>
);

Object.assign(window, { ProjectsPrimary, ProjectsConceptGap });
