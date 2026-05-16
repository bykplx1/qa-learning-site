// /me/retention — Private learner dashboard.
// The ONLY honest metric for learning: forgetting less over time.
// Private. No leaderboard. No percentile. No social comparison.

// Inline SVG forgetting-curve chart — shows several weekly cohorts,
// where each curve flattens over the previous (the story).
const ForgettingCurves = () => {
  // x: days since last review (0..28). y: retention probability (0..1).
  // 5 weekly cohorts; each later one decays slower (higher stability).
  const W = 560, H = 280, PADL = 44, PADR = 16, PADT = 18, PADB = 36;
  const PW = W - PADL - PADR, PH = H - PADT - PADB;
  const cohorts = [
    {label:'Apr 4',  stab: 3.0,  color:'rgba(60,60,58,0.30)'},
    {label:'Apr 18', stab: 5.5,  color:'rgba(60,60,58,0.46)'},
    {label:'May 2',  stab: 8.6,  color:'rgba(60,60,58,0.62)'},
    {label:'May 9',  stab: 12.4, color:'rgba(204,120,92,0.55)'},
    {label:'this week', stab: 19.0, color:'var(--primary)', emphasized: true},
  ];
  // exp decay: R(t) = exp(-t / stab)
  const xMax = 28;
  const xToPx = x => PADL + (x / xMax) * PW;
  const yToPx = y => PADT + (1 - y) * PH;
  const curvePath = (stab) => {
    const pts = [];
    for (let x = 0; x <= xMax; x += 0.5) {
      const y = Math.exp(-x / stab);
      pts.push(`${xToPx(x).toFixed(1)},${yToPx(y).toFixed(1)}`);
    }
    return 'M' + pts.join(' L');
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block'}}>
      {/* axes */}
      {[0, 0.25, 0.5, 0.75, 1].map(y => (
        <g key={y}>
          <line x1={PADL} x2={W - PADR} y1={yToPx(y)} y2={yToPx(y)}
                stroke="var(--hairline-soft)" strokeWidth="1"/>
          <text x={PADL - 8} y={yToPx(y) + 4} textAnchor="end"
                fontSize="11" fill="var(--muted-soft)" fontFamily="Inter, sans-serif">
            {Math.round(y*100)}%
          </text>
        </g>
      ))}
      {/* 7d threshold line — the metric is retention at ≥ 7d */}
      <line x1={xToPx(7)} x2={xToPx(7)} y1={PADT} y2={PADT + PH}
            stroke="var(--hairline)" strokeWidth="1" strokeDasharray="3 3"/>
      <text x={xToPx(7) + 6} y={PADT + 12} fontSize="10" fontFamily="Inter, sans-serif"
            fill="var(--muted)" fontWeight="500" letterSpacing="0.1em">
        7-DAY DELAY
      </text>

      {/* x labels */}
      {[0, 7, 14, 21, 28].map(d => (
        <text key={d} x={xToPx(d)} y={H - 14} textAnchor="middle"
              fontSize="11" fill="var(--muted-soft)" fontFamily="Inter, sans-serif">
          {d}d
        </text>
      ))}

      {/* curves */}
      {cohorts.map((c, i) => (
        <path key={i} d={curvePath(c.stab)} fill="none"
              stroke={c.color}
              strokeWidth={c.emphasized ? 2.5 : 1.4}
              strokeLinecap="round"/>
      ))}

      {/* legend */}
      <g transform={`translate(${W - PADR - 130}, ${PADT + 12})`}>
        {cohorts.slice().reverse().map((c, i) => (
          <g key={c.label} transform={`translate(0, ${i * 16})`}>
            <line x1={0} x2={18} y1={0} y2={0} stroke={c.color}
                  strokeWidth={c.emphasized ? 2.5 : 1.4}/>
            <text x={24} y={3} fontSize="10.5" fill="var(--body)"
                  fontFamily="Inter, sans-serif"
                  fontWeight={c.emphasized ? 600 : 400}>
              {c.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

// Stability growth — log-linear over time.
const StabilityGrowth = () => {
  const W = 460, H = 220, PADL = 40, PADR = 14, PADT = 16, PADB = 32;
  const PW = W - PADL - PADR, PH = H - PADT - PADB;
  // weeks 0..16, stability grows ~log-linearly with noise
  const data = [
    1.2, 1.6, 2.0, 2.6, 3.1, 3.4, 4.2, 5.0,
    5.8, 6.7, 7.4, 8.6, 9.8, 10.9, 12.5, 14.1, 17.2
  ];
  const xMax = data.length - 1;
  const yMax = 24;
  const xToPx = x => PADL + (x / xMax) * PW;
  const yToPx = y => PADT + (1 - y / yMax) * PH;
  const path = 'M' + data.map((d, i) => `${xToPx(i).toFixed(1)},${yToPx(d).toFixed(1)}`).join(' L');
  const areaPath = path +
    ` L${xToPx(xMax).toFixed(1)},${yToPx(0).toFixed(1)} L${xToPx(0).toFixed(1)},${yToPx(0).toFixed(1)} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block'}}>
      {[0, 5, 10, 15, 20].map(y => (
        <g key={y}>
          <line x1={PADL} x2={W - PADR} y1={yToPx(y)} y2={yToPx(y)}
                stroke="var(--hairline-soft)" strokeWidth="1"/>
          <text x={PADL - 6} y={yToPx(y) + 4} textAnchor="end"
                fontSize="10.5" fill="var(--muted-soft)" fontFamily="Inter, sans-serif">
            {y}d
          </text>
        </g>
      ))}
      {[0, 4, 8, 12, 16].map(x => (
        <text key={x} x={xToPx(x)} y={H - 12} textAnchor="middle"
              fontSize="10.5" fill="var(--muted-soft)" fontFamily="Inter, sans-serif">
          {x === 0 ? 'wk 0' : `wk ${x}`}
        </text>
      ))}
      <path d={areaPath} fill="var(--primary-tint)"/>
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => i % 4 === 0 || i === data.length - 1 ? (
        <circle key={i} cx={xToPx(i)} cy={yToPx(d)} r="3"
                fill="var(--canvas)" stroke="var(--primary)" strokeWidth="2"/>
      ) : null)}
    </svg>
  );
};

const Retention = () => (
  <Frame>
    <TopNav active=""/>

    <div style={{padding:'48px 64px 12px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div className="caption-up" style={{color:'var(--muted)', marginBottom:10}}>
        Retention · private
      </div>
      <div style={{display:'flex', alignItems:'baseline', gap:18, marginBottom:8, flexWrap:'wrap'}}>
        <div className="display display-lg" style={{color:'var(--ink)', fontWeight:400}}>
          You are forgetting less.
        </div>
      </div>
      <div className="body-md" style={{color:'var(--muted)', maxWidth:760, fontSize:15}}>
        The only progress metric in a learning app worth optimizing for. Visible
        only to you. Not shared, not ranked, not compared.
      </div>
    </div>

    {/* Top stat row */}
    <div style={{
      padding:'28px 64px 0', maxWidth: 1200, margin:'0 auto', width:'100%',
      display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:18
    }}>
      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>Retention at ≥ 7 days</div>
        <div style={{display:'flex', alignItems:'baseline', gap:14}}>
          <div className="display" style={{fontSize:46, color:'var(--ink)', fontWeight:400, letterSpacing:'-0.02em'}}>
            81<span style={{fontSize:24, color:'var(--muted)'}}>%</span>
          </div>
          <div className="body-sm" style={{color:'var(--success)'}}>+6.3% vs 4 weeks ago</div>
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginTop:8}}>
          of cards correctly retrieved on first attempt after at least a week of delay
        </div>
      </div>

      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>Average stability</div>
        <div style={{display:'flex', alignItems:'baseline', gap:14}}>
          <div className="display" style={{fontSize:46, color:'var(--ink)', fontWeight:400, letterSpacing:'-0.02em'}}>
            17.2<span style={{fontSize:24, color:'var(--muted)', marginLeft:4}}>d</span>
          </div>
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginTop:8}}>
          across 184 active cards · FSRS S, log-linear growth
        </div>
      </div>

      <div style={{
        background:'var(--surface-card)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:8, fontSize:10}}>Due today</div>
        <div style={{display:'flex', alignItems:'baseline', gap:14}}>
          <div className="display" style={{fontSize:46, color:'var(--ink)', fontWeight:400, letterSpacing:'-0.02em'}}>
            14
          </div>
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginTop:8}}>
          one number · not a guilt-trip
        </div>
      </div>
    </div>

    {/* Charts */}
    <div style={{
      padding:'28px 64px 0', maxWidth: 1200, margin:'0 auto', width:'100%',
      display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18
    }}>
      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px 18px'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6}}>
          <div className="title-md">Forgetting curve, flattening</div>
          <div className="caption" style={{color:'var(--muted)'}}>weekly cohorts</div>
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginBottom:14, maxWidth:520}}>
          Each line is one week's review activity, plotted as
          retention vs days-since-review. Lower curves = forgetting fast.
          Higher and flatter curves = holding more, longer.
        </div>
        <ForgettingCurves/>
      </div>

      <div style={{
        background:'var(--canvas)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'22px 26px 18px'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6}}>
          <div className="title-md">Stability over time</div>
          <div className="caption" style={{color:'var(--muted)'}}>FSRS S, weekly avg</div>
        </div>
        <div className="body-sm" style={{color:'var(--muted)', marginBottom:14}}>
          The interval at which you'll retrieve a card correctly 90% of the
          time. Should climb log-linearly.
        </div>
        <StabilityGrowth/>
      </div>
    </div>

    {/* Demoted metrics — visible refusal */}
    <div style={{padding:'28px 64px 0', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <div style={{
        background:'var(--surface-soft)', border:'1px solid var(--hairline)',
        borderRadius:'var(--r-lg)', padding:'20px 26px'
      }}>
        <div className="caption-up" style={{color:'var(--muted)', marginBottom:10, fontSize:10}}>
          What we don't show here, and why
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:18}}>
          {[
            {label:'Streak length', why:'Punishes correct spacing.'},
            {label:'Lessons completed', why:'A reading count, not a learning signal.'},
            {label:'Time on site', why:'Rewards staying, not retrieving.'},
            {label:'Percentile rank', why:'No social comparison. Ever.'},
          ].map(d => (
            <div key={d.label} style={{borderLeft:'2px solid var(--hairline)', paddingLeft:14}}>
              <div className="title-sm" style={{
                color:'var(--muted-soft)', textDecoration:'line-through',
                textDecorationColor:'var(--muted-soft)', marginBottom:4
              }}>{d.label}</div>
              <div className="body-sm" style={{color:'var(--muted)', fontSize:13}}>{d.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{padding:'24px 64px 32px', maxWidth: 1200, margin:'0 auto', width:'100%'}}>
      <Rationale items={[
        {what:"Headline frames the chart's story: \"forgetting less\".", why:"brief §4.3 · the right metric"},
        {what:"Forgetting curve as primary visual; coral = this week.", why:"brief §4.3 · flattening over time"},
        {what:"No share button, no public-profile mode, no comparison.", why:"brief §4.3 private only"},
        {what:"Demoted metrics shown crossed-out + explained.", why:"brief §4.3 · build-doc §12"},
      ]}/>
    </div>
  </Frame>
);

Object.assign(window, { Retention });
