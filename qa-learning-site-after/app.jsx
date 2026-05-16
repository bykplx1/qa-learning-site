// Main canvas — assembles all five screens + the /review alternates.
const { useState } = React;

const IntroBoard = () => (
  <div style={{
    width:'100%', height:'100%',
    background:'var(--canvas)', padding:'56px 64px',
    fontFamily:'var(--body-font)', color:'var(--ink)',
    display:'flex', flexDirection:'column'
  }} className="qa">
    <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
      <Spike size={16}/>
      <span className="caption-up" style={{fontSize:11, letterSpacing:'0.18em'}}>QA Learning Site · Revamp v1 · Handoff</span>
    </div>
    <div className="display display-lg" style={{maxWidth:780, lineHeight:1.1, marginBottom:18}}>
      Five screens. Two design languages inside one product.
    </div>
    <div className="body-md" style={{color:'var(--body)', maxWidth:720, fontSize:16, lineHeight:1.65, marginBottom:26}}>
      Per the brief: chrome is recognition-first, practice is recall-first.
      That split is what differentiates this from every other content-reader-bolted-to-a-quiz.
      Every artboard below carries a short rationale strip — one line per major
      design call, mapped to the principle it serves.
    </div>

    <div style={{
      display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:1040
    }}>
      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 24px'
      }}>
        <div className="caption-up" style={{color:'var(--primary)', marginBottom:8, fontSize:10}}>
          Practice surfaces · recall-first
        </div>
        <div className="title-md" style={{marginBottom:10}}>/review · /explain</div>
        <div className="body-sm" style={{color:'var(--body)', lineHeight:1.6}}>
          Closed-book affordance is the focal element. Prompt is secondary.
          No "Show answer" pre-attempt. No streak, no progress bar, no autocomplete,
          no AI grade. Reveal and rubric live on separate states from the attempt.
        </div>
      </div>
      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 24px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>
          Chrome surfaces · recognition-first
        </div>
        <div className="title-md" style={{marginBottom:10}}>/lessons · /projects · /me/retention</div>
        <div className="body-sm" style={{color:'var(--body)', lineHeight:1.6}}>
          Editorial warmth, clear nav, criteria-clarity. Concept gates show
          forgetting state honestly before opening a project. The retention
          dashboard is private — no leaderboard, no share button, no percentile.
        </div>
      </div>
    </div>

    <div style={{marginTop:28, padding:'18px 24px', background:'var(--surface-card)',
                  borderRadius:'var(--r-lg)', maxWidth:1040}}>
      <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>
        Refuse-list check · clean
      </div>
      <div className="body-sm" style={{color:'var(--body)', lineHeight:1.6}}>
        None of these surfaces contain: pre-attempt "Show answer", streak counter on
        practice surfaces, decorative imagery on lessons, leaderboards, AI single-number
        grades on free text, autoplay, "100% complete" badges, daily-goal nags,
        MCQ as primary practice, confetti on correct answers, or
        infinite-queue beyond the FSRS-due set. (Brief §6.)
      </div>
    </div>

    <div style={{marginTop:'auto', paddingTop:32}}>
      <div className="caption" style={{color:'var(--muted)', maxWidth:720, lineHeight:1.55}}>
        Aesthetic system: Anthropic / Claude tokens from <code className="mono" style={{
          background:'var(--surface-soft)', padding:'1px 6px', borderRadius:4, fontSize:12
        }}>claude-design.md</code>.
        Cream canvas, coral primary, dark navy product surfaces. Serif display
        (EB Garamond as the open Copernicus substitute) paired with Inter sans body.
      </div>
    </div>
  </div>
);

const App = () => (
  <DesignCanvas>
    <DCSection id="intro" title="QA Learning Site · Revamp Handoff" subtitle="Five screens with required states; three /review alternates">
      <DCArtboard id="intro" label="0 · Approach" width={1100} height={780}>
        <IntroBoard/>
      </DCArtboard>
    </DCSection>

    <DCSection id="review" title="/review · Retrieval surface (highest priority)" subtitle="Primary + every required state from the brief">
      <DCArtboard id="r-primary" label="A · Primary — prompt & empty page" width={1280} height={920}>
        <ReviewPrimary/>
      </DCArtboard>
      <DCArtboard id="r-reveal" label="B · After submit — reveal + self-grade" width={1280} height={920}>
        <ReviewReveal/>
      </DCArtboard>
      <DCArtboard id="r-empty" label="C · Empty queue — celebration & refusal" width={1280} height={780}>
        <ReviewEmpty/>
      </DCArtboard>
      <DCArtboard id="r-cap" label="D · 25-min session cap" width={1280} height={780}>
        <ReviewSessionCap/>
      </DCArtboard>
      <DCArtboard id="r-first" label="E · First-time disclaimer" width={1280} height={820}>
        <ReviewFirstTime/>
      </DCArtboard>
    </DCSection>

    <DCSection id="review-alts" title="/review · three alternate card layouts" subtitle="Same state machine; different spatial relationship between prompt & answer">
      <DCArtboard id="alt-page" label="Alt A · Page — prompt as header band, paper below" width={1280} height={900}>
        <ReviewAltPage/>
      </DCArtboard>
      <DCArtboard id="alt-stage" label="Alt B · Stage — inverted: dark room, lit page" width={1280} height={840}>
        <ReviewAltStage/>
      </DCArtboard>
      <DCArtboard id="alt-spread" label="Alt C · Notebook spread — context left, answer right" width={1280} height={820}>
        <ReviewAltSpread/>
      </DCArtboard>
    </DCSection>

    <DCSection id="explain" title="/explain/[slug] · Feynman / self-explanation" subtitle="Rubric hidden until submit. No AI score, no number, no green check.">
      <DCArtboard id="e-primary" label="A · Writing — rubric not yet revealed" width={1280} height={920}>
        <ExplainPrimary/>
      </DCArtboard>
      <DCArtboard id="e-post" label="B · Post-submit — rubric revealed for self-score" width={1280} height={980}>
        <ExplainPostSubmit/>
      </DCArtboard>
      <DCArtboard id="e-block" label="C · Soft block — not enough reviews yet" width={1280} height={840}>
        <ExplainSoftBlock/>
      </DCArtboard>
    </DCSection>

    <DCSection id="retention" title="/me/retention · Private learner dashboard" subtitle="The only honest progress metric: forgetting less over time. No leaderboard.">
      <DCArtboard id="ret" label="A · Retention dashboard" width={1280} height={1080}>
        <Retention/>
      </DCArtboard>
    </DCSection>

    <DCSection id="projects" title="/projects/<slug> · Production surface, upgraded" subtitle="Concept gate above the intro. Rubric visible up front. Private by default.">
      <DCArtboard id="p-primary" label="A · Concepts pass — project active" width={1280} height={1240}>
        <ProjectsPrimary/>
      </DCArtboard>
      <DCArtboard id="p-gap" label="B · Concept gap — review first, override offered" width={1280} height={980}>
        <ProjectsConceptGap/>
      </DCArtboard>
    </DCSection>

    <DCSection id="lessons" title="/lessons/<cluster>/<slug> · Encoding surface, upgraded" subtitle={'Coherence · segmenting · signaling · spatial contiguity. No "Next lesson".'}>
      <DCArtboard id="l-primary" label="A · Reading view — Core Idea segment" width={1280} height={1200}>
        <LessonsPrimary/>
      </DCArtboard>
      <DCArtboard id="l-end" label="B · End of lesson — three options, no fourth" width={1280} height={920}>
        <LessonsEndCTA/>
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
