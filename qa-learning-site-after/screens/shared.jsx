// Shared chrome + atoms for the QA learning site mockups.
// Anthropic/Claude-inspired tokens defined in styles.css.

const Spike = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 1.5 13.6 9.6 21.5 6.8 15.7 12.7 22.3 18 13.9 15.3 12 22.5 10.1 15.3 1.7 18 8.3 12.7 2.5 6.8 10.4 9.6 Z"
          fill={color} />
  </svg>
);

const TopNav = ({ active = '' }) => (
  <div className="qa-nav">
    <div className="qa-nav-brand">
      <Spike />
      <span>QA Learn</span>
    </div>
    <nav className="qa-nav-links">
      <a className={active === 'lessons' ? 'active' : ''}>Lessons</a>
      <a className={active === 'review' ? 'active' : ''}>Review</a>
      <a className={active === 'explain' ? 'active' : ''}>Explain</a>
      <a className={active === 'projects' ? 'active' : ''}>Projects</a>
    </nav>
    <div className="qa-nav-right">
      <a style={{color:'var(--body)', textDecoration:'none'}}>Search</a>
      <a style={{color:'var(--body)', textDecoration:'none'}}>Retention</a>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--surface-cream-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 500, color: 'var(--ink)'
      }}>m</div>
    </div>
  </div>
);

// A compact "rationale receipt" used at the bottom of each artboard.
// Maps each design call to the brief/build-doc principle it serves.
const Rationale = ({ items }) => (
  <div className="qa-rationale">
    <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:6}}>
      <span className="caption-up" style={{color:'var(--muted)', fontSize:10, letterSpacing:'0.14em'}}>
        Rationale · Refuse-list clean
      </span>
    </div>
    <ul style={{margin:0, padding:0, listStyle:'none', display:'grid', gap:4}}>
      {items.map((it, i) => (
        <li key={i} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:12}}>
          <span>{it.what}</span>
          <span style={{color:'var(--muted-soft)', whiteSpace:'nowrap'}}>{it.why}</span>
        </li>
      ))}
    </ul>
  </div>
);

// Frame wrapper — applies the .qa scope + sizes the artboard correctly.
const Frame = ({ children, dark = false, style = {} }) => (
  <div className="qa" style={{
    width: '100%',
    minHeight: '100%',
    background: dark ? 'var(--surface-dark)' : 'var(--canvas)',
    display: 'flex',
    flexDirection: 'column',
    ...style
  }}>
    {children}
  </div>
);

// Generic content container for artboard bodies.
const Body = ({ children, pad = 64, dark = false, style = {} }) => (
  <div style={{
    flex: 1,
    padding: pad,
    background: dark ? 'var(--surface-dark)' : 'var(--canvas)',
    color: dark ? 'var(--on-dark)' : 'var(--ink)',
    ...style
  }}>
    {children}
  </div>
);

// Section header used on the canvas itself (above artboards).
const CanvasSectionHeader = ({ eyebrow, title, blurb }) => (
  <div style={{
    fontFamily: 'var(--body-font, Inter, sans-serif)',
    maxWidth: 920,
    marginBottom: 8
  }}>
    <div style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: 'rgba(60,50,40,0.55)', marginBottom: 8
    }}>{eyebrow}</div>
    <div style={{
      fontFamily: 'EB Garamond, serif',
      fontSize: 32, fontWeight: 400, letterSpacing: '-0.018em',
      color: 'rgba(20,20,19,0.95)', marginBottom: 10, lineHeight: 1.15
    }}>{title}</div>
    {blurb && <div style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: 14, lineHeight: 1.55, color: 'rgba(60,50,40,0.75)', maxWidth: 720
    }}>{blurb}</div>}
  </div>
);

Object.assign(window, {
  Spike, TopNav, Rationale, Frame, Body, CanvasSectionHeader
});
