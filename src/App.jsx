import { useState, useEffect, useRef } from "react";
import * as d3 from "d3-force";

const TCOLORS = ["#4ECDC4","#C77DFF","#FF6B6B","#4D96FF","#6BCB77","#FFD93D","#FF8C42","#E0AAFF","#00B4D8","#FF477E"];

const TYPE_ICONS = { thematic:"◆", craft:"◎", philosophy:"◈", lineage:"↝" };
const TYPE_LABELS = { thematic:"shared feeling", craft:"craft signature", philosophy:"creative philosophy", lineage:"cinematic lineage" };

const GUIDE = [
  { q:"How do you want to spend tonight?", dim:"Mode of engagement", opts:[
    { label:"I want to disappear into something — forget my name for two hours", icon:"🌊" },
    { label:"I want something to chew on — layers I'll still be unpacking tomorrow", icon:"🧩" },
    { label:"I want to feel like I'm watching someone's real life unfold", icon:"🕯" },
    { label:"I want something so visually overwhelming I can't look away", icon:"✦" },
  ]},
  { q:"What do you want the experience to do to you?", dim:"Emotional arc", opts:[
    { label:"Build slowly, then break me — I want the ending to rearrange something inside me", icon:"🔥" },
    { label:"Keep me on the knife's edge — I want my body to remember watching this", icon:"⚡" },
    { label:"Make me laugh at something I shouldn't, then make me feel it", icon:"◗" },
    { label:"Leave me with more questions than I started with", icon:"🌀" },
  ]},
  { q:"What kind of filmmaking is calling to you?", dim:"Craft sensibility", opts:[
    { label:"Silence and patience — every frame given room to breathe", icon:"◇" },
    { label:"The soundtrack tells the story — music that crawls under your skin", icon:"♫" },
    { label:"Raw and real — shaky hands, lived-in spaces, performances that feel stolen", icon:"🎞" },
    { label:"Every frame deliberate — obsessive precision, nothing accidental", icon:"⬡" },
  ]},
];

// === AI ENGINE ===
async function fetchConstellation(prompt, searchType = 'title') {
  const res = await fetch("/api/constellation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, searchType }),
  });

  if (!res.ok) {
    const text = await res.text();
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { error: text };
    }
    const error = new Error(errorData.error || 'API request failed');
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  return res.json();
}

// === FETCH TEASERS ===
async function fetchTeasers(prompt) {
  try {
    const res = await fetch("/api/teasers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.teasers || null;
  } catch {
    return null;
  }
}

// === FETCH SHARED CONSTELLATION ===
async function fetchSharedConstellation(shareId) {
  const res = await fetch(`/api/shared?shareId=${shareId}`);

  if (!res.ok) {
    const text = await res.text();
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { error: text };
    }

    const error = new Error(errorData.error || 'Failed to load constellation');
    error.status = res.status;
    throw error;
  }

  return res.json();
}


// === GUIDE PROMPT BUILDER ===
function buildGuidePrompt(sels) {
  const dims = ["mode of engagement", "emotional arc", "craft sensibility"];
  const descs = [
    [
      "films that demand total immersion — worldbuilding so complete you forget yourself",
      "films that demand active engagement — puzzle-box narratives with layers to unpack",
      "intimate, performance-driven stories that feel overheard rather than constructed",
      "visually overwhelming sensory cinema where the medium itself is the experience",
    ],
    [
      "a devastating slow-burn crescendo — patient construction with a gut-punch payoff",
      "sustained visceral intensity — embodied tension where suspense becomes physical",
      "tonal complexity that blends dark humor with genuine devastation",
      "an existential experience that shifts perception and lingers because it changed something fundamental",
    ],
    [
      "meditative pacing with silence and patience — wide shots, ambient soundscapes, a camera that observes",
      "musical architecture where the score is inseparable from emotion",
      "naturalistic vérité filmmaking — handheld, improvised, lived-in",
      "formalist auteur precision — symmetrical compositions, controlled palette, nothing accidental",
    ],
  ];
  const parts = sels.map((idx, step) => `For ${dims[step]}: ${descs[step][idx]}`);
  return `A user described what they want to watch tonight:\n${parts.join("\n")}\n\nBased on these preferences, recommend 8-12 films and TV shows connected by thematic, craft signature, creative philosophy, and cinematic lineage threads. Include hidden gems alongside recognized works.`;
}

// === GEOMETRIC BACKGROUND ===
function FilamentBG({ intensity = 1 }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef([]);
  const animRef = useRef(null);
  const dimRef = useRef({ w: 800, h: 600 });
  const timeRef = useRef(0);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { dimRef.current = { w:window.innerWidth, h:window.innerHeight }; cvs.width=dimRef.current.w; cvs.height=dimRef.current.h; };
    resize();
    window.addEventListener("resize", resize);

    const spacing = 90, nodes = [];
    const { w, h } = dimRef.current;
    for (let row=-1; row<h/spacing+2; row++) {
      for (let col=-1; col<w/spacing+2; col++) {
        const isOff = row%2===1;
        const bx = col*spacing+(isOff?spacing*0.5:0), by = row*spacing;
        if (Math.random()<0.18) continue;
        nodes.push({ bx, by, x:bx, y:by, ox:(Math.random()-.5)*12, oy:(Math.random()-.5)*12, r:1.4+Math.random()*1.7, color:TCOLORS[Math.floor(Math.random()*TCOLORS.length)], phase:Math.random()*Math.PI*2, breathSpeed:0.008+Math.random()*0.012, baseAlpha:0.22+Math.random()*0.28 });
      }
    }
    nodesRef.current = nodes;

    const onMove = e => { const r=cvs.getBoundingClientRect(); mouseRef.current={x:e.clientX-r.left,y:e.clientY-r.top}; };
    const onTouch = e => { if(e.touches.length>0){const r=cvs.getBoundingClientRect(); mouseRef.current={x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top};} };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch);

    const maxLD = spacing*1.3;
    const draw = () => {
      timeRef.current+=1; const {w,h}=dimRef.current; ctx.clearRect(0,0,w,h);
      const mx=mouseRef.current.x, my=mouseRef.current.y, t=timeRef.current;
      for(let n of nodes){const b=Math.sin(t*n.breathSpeed+n.phase); n.x=n.bx+n.ox+b*3; n.y=n.by+n.oy+Math.cos(t*n.breathSpeed*0.7+n.phase)*3;}
      for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy); if(d>maxLD)continue; const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2,mdx=mx-midX,mdy=my-midY,md=Math.sqrt(mdx*mdx+mdy*mdy),prox=Math.max(0,1-md/200),fade=1-d/maxLD,alpha=(0.06+fade*0.06+prox*0.12)*intensity; ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=a.color;ctx.globalAlpha=alpha;ctx.lineWidth=0.5+prox*0.5;ctx.stroke();}
      for(let n of nodes){const dx=mx-n.x,dy=mx>-500?my-n.y:1000,d=Math.sqrt(dx*dx+dy*dy),prox=Math.max(0,1-d/180),breath=Math.sin(t*n.breathSpeed+n.phase)*0.5+0.5,alpha=(n.baseAlpha*0.4+breath*0.30+prox*0.7)*intensity,radius=n.r+prox*2; if(prox>0.1){ctx.beginPath();ctx.arc(n.x,n.y,radius+8*prox,0,Math.PI*2);const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,radius+8*prox);g.addColorStop(0,n.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.globalAlpha=prox*0.35*intensity;ctx.fill();} ctx.beginPath();ctx.arc(n.x,n.y,radius,0,Math.PI*2);ctx.fillStyle=n.color;ctx.globalAlpha=alpha;ctx.fill();}
      ctx.globalAlpha=1; animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onMove);window.removeEventListener("touchmove",onTouch);};
  }, [intensity]);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// === LOADING ANIMATION ===
const GENERIC_PHRASES = [
  "Pulling on thematic threads",
  "Mapping hidden connections",
  "Diving beneath the surface",
  "Consulting the cinematic unconscious",
  "Tracing shared mythologies",
  "Finding the films between the films",
  "Listening for echoes across stories",
  "Connecting distant constellations",
  "Unearthing hidden gems",
  "Weaving your discovery map",
];

const ESCALATING_PHRASES = [
  "Almost there...",
  "Searching across a century of cinema...",
  "Exploring every frame in every archive...",
];

const INITIAL_STATUS_HOLD = 6000;
const TEASER_TRIGGER_DELAY = 1200;
const SENTENCE_INTERVAL = 4500;
const FADE_DURATION = 400;

function LoadingView({ searchQuery, isGuided, teasers }) {
  const [text, setText] = useState("Finding your constellation...");
  const [fade, setFade] = useState(true);
  const [isTeaser, setIsTeaser] = useState(false);

  const queueRef = useRef([]);
  const posRef = useRef(-1);
  const teasersAppliedRef = useRef(false);
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const teaserSetRef = useRef(new Set());
  const genRef = useRef(0);

  const clearAllTimers = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (fadeTimerRef.current) { clearTimeout(fadeTimerRef.current); fadeTimerRef.current = null; }
  };

  const startQueue = (queue, teaserSet) => {
    clearAllTimers();
    const gen = ++genRef.current;
    queueRef.current = queue;
    posRef.current = -1;
    teaserSetRef.current = teaserSet;

    const advance = () => {
      if (!mountedRef.current || genRef.current !== gen) return;
      const nextPos = posRef.current + 1;
      if (nextPos >= queueRef.current.length) return;

      setFade(false);
      fadeTimerRef.current = setTimeout(() => {
        if (!mountedRef.current || genRef.current !== gen) return;
        posRef.current = nextPos;
        const nextText = queueRef.current[nextPos];
        setText(nextText);
        setIsTeaser(teaserSetRef.current.has(nextText));
        setFade(true);

        if (nextPos < queueRef.current.length - 1) {
          timerRef.current = setTimeout(advance, SENTENCE_INTERVAL);
        }
      }, FADE_DURATION);
    };

    return advance;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current || teasersAppliedRef.current) return;
      const advance = startQueue([...GENERIC_PHRASES, ...ESCALATING_PHRASES], new Set());
      advance();
    }, INITIAL_STATUS_HOLD);
    return () => clearAllTimers();
  }, []);

  useEffect(() => {
    if (!teasers || teasersAppliedRef.current) return;
    teasersAppliedRef.current = true;

    const teaserSet = new Set(teasers);
    const advance = startQueue([
      "Here's a taste of what's coming...",
      ...teasers,
      ...ESCALATING_PHRASES,
    ], teaserSet);

    timerRef.current = setTimeout(advance, TEASER_TRIGGER_DELAY);
  }, [teasers]);

  const textStyle = isTeaser
    ? { color: "#bbb", fontSize: 15.5, opacity: 0.9 }
    : { color: "#777", fontSize: 14.5, opacity: 0.75 };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',-apple-system,sans-serif", position:"relative", zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth: 400, padding: "0 20px" }}>
        {isGuided ? (
          <p style={{ color:"#777", fontSize:14, fontWeight:300, letterSpacing:0.5, margin:"0 0 28px" }}>
            Mapping your constellation...
          </p>
        ) : searchQuery ? (
          <div style={{ margin:"0 0 28px" }}>
            <p style={{ color:"#666", fontSize:13, fontWeight:300, margin:"0 0 6px", letterSpacing:0.3 }}>
              Mapping the constellation around
            </p>
            <p style={{ color:"#ddd", fontSize:22, fontWeight:200, margin:0, letterSpacing:1 }}>
              {searchQuery}
            </p>
          </div>
        ) : null}

        <div style={{ width: 72, height: 72, margin: "0 auto 28px", position: "relative" }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <defs>
              <radialGradient id="irisGlowGrad">
                <stop offset="0%" stopColor="#C77DFF" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#C77DFF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#C77DFF" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="36" cy="36" r="18" fill="url(#irisGlowGrad)" style={{ animation: "irisGlow 3.5s ease-in-out infinite" }} />
            {[0,1,2,3,4,5].map(i => {
              const a = i * Math.PI / 3;
              const cs = Math.cos(a), sn = Math.sin(a);
              const rot = (x, y) => {
                const dx = x - 36, dy = y - 36;
                return [+(36 + dx*cs - dy*sn).toFixed(1), +(36 + dx*sn + dy*cs).toFixed(1)];
              };
              const v = [rot(36,3), rot(18,32), rot(30,50), rot(44,16)];
              const pv = rot(36,3);
              return (
                <path
                  key={i}
                  d={`M${v[0][0]},${v[0][1]} L${v[1][0]},${v[1][1]} L${v[2][0]},${v[2][1]} L${v[3][0]},${v[3][1]} Z`}
                  fill="#C77DFF"
                  fillOpacity="0.15"
                  stroke="#C77DFF"
                  strokeWidth="0.5"
                  strokeOpacity="0.35"
                  style={{
                    transformOrigin: `${pv[0]}px ${pv[1]}px`,
                    animation: "irisBladeAnim 3.5s ease-in-out infinite",
                  }}
                />
              );
            })}
            <circle cx="36" cy="36" r="2.5" fill="#C77DFF" style={{ animation: "irisDot 3.5s ease-in-out infinite" }} />
            <circle cx="36" cy="36" r="34" fill="none" stroke="#C77DFF" strokeWidth="0.8" style={{ animation: "irisRing 3.5s ease-in-out infinite" }} />
          </svg>
        </div>

        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 400,
          letterSpacing: 0.3,
          minHeight: 28,
          margin: "0 0 12px",
          lineHeight: 1.5,
          ...textStyle,
          opacity: fade ? textStyle.opacity : 0,
          transform: fade ? "translateY(0)" : "translateY(6px)",
          transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
        }}>
          {text}
        </p>

        <p style={{ color:"#555", fontSize:12, fontWeight:300, margin:"0 0 20px", letterSpacing:0.3 }}>
          This can take up to a minute — we're doing the deep work.
        </p>

      </div>
      <style>{`
        @keyframes irisBladeAnim {
          0%, 12%  { transform: rotate(0deg); }
          30%      { transform: rotate(32deg); }
          65%      { transform: rotate(32deg); }
          83%      { transform: rotate(0deg); }
          100%     { transform: rotate(0deg); }
        }
        @keyframes irisGlow {
          0%, 12%  { opacity: 0.05; transform: scale(0.7); }
          30%      { opacity: 1; transform: scale(1.15); }
          65%      { opacity: 1; transform: scale(1.15); }
          83%      { opacity: 0.05; transform: scale(0.7); }
          100%     { opacity: 0.05; transform: scale(0.7); }
        }
        @keyframes irisDot {
          0%, 12%  { opacity: 0.05; }
          30%      { opacity: 1; }
          65%      { opacity: 1; }
          83%      { opacity: 0.05; }
          100%     { opacity: 0.05; }
        }
        @keyframes irisRing {
          0%, 12%  { opacity: 0.3; stroke-width: 0.8; }
          30%      { opacity: 0.7; stroke-width: 1.2; }
          65%      { opacity: 0.7; stroke-width: 1.2; }
          83%      { opacity: 0.3; stroke-width: 0.8; }
          100%     { opacity: 0.3; stroke-width: 0.8; }
        }
      `}</style>
    </div>
  );
}

// === PAYWALL MODAL ===
function MonthlyCard() {
  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:16}}>
      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
        <span style={{fontSize:30,fontWeight:600,color:"#fff"}}>$6</span>
        <span style={{fontSize:14,color:"#888"}}>/month</span>
      </div>
      <p style={{fontSize:12,color:"#666",margin:"2px 0 14px"}}>Monthly</p>
      <button
        onClick={()=>window.location.href='/checkout/monthly'}
        style={{width:"100%",padding:"10px 0",borderRadius:6,background:"rgba(199,125,255,0.10)",border:"1px solid rgba(199,125,255,0.30)",color:"#C77DFF",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(199,125,255,0.18)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(199,125,255,0.10)"}
      >Start Monthly →</button>
    </div>
  );
}

function AnnualCard() {
  return (
    <div style={{background:"rgba(199,125,255,0.07)",border:"1px solid rgba(199,125,255,0.28)",borderRadius:10,padding:16,position:"relative"}}>
      <span style={{position:"absolute",top:-1,right:12,background:"#C77DFF",color:"#0a0a0f",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"3px 7px",borderRadius:"0 0 5px 5px"}}>BEST VALUE</span>
      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
        <span style={{fontSize:30,fontWeight:600,color:"#fff"}}>$49</span>
        <span style={{fontSize:14,color:"#888"}}>/year</span>
      </div>
      <p style={{fontSize:11,color:"#666",margin:"2px 0 0"}}>($4.08 / month)</p>
      <p style={{fontSize:12,color:"#888",margin:"0 0 14px"}}>Annual</p>
      <button
        onClick={()=>window.location.href='/checkout/annual'}
        style={{width:"100%",padding:"10px 0",borderRadius:6,background:"#C77DFF",color:"#0a0a0f",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}
        onMouseEnter={e=>e.currentTarget.style.background="#b56ef0"}
        onMouseLeave={e=>e.currentTarget.style.background="#C77DFF"}
      >Start Annual →</button>
    </div>
  );
}

function PaywallModal({ context, onClose }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const subheadline = context === 'blocked'
    ? "You've used your 3 free searches for today. Come back tomorrow — or join Pro for unlimited exploration."
    : "Pro members search without limits. Here's everything that's included.";

  const inner = (
    <div style={{position:"relative"}}>
      <button
        onClick={onClose}
        style={{position:"absolute",top:isMobile?0:-24,right:isMobile?0:-20,fontSize:20,color:"#444",cursor:"pointer",background:"none",border:"none",lineHeight:1,padding:4,fontFamily:"inherit"}}
        onMouseEnter={e=>e.currentTarget.style.color="#888"}
        onMouseLeave={e=>e.currentTarget.style.color="#444"}
      >×</button>

      {/* Header */}
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:isMobile?20:22,fontWeight:600,color:"#fff",margin:"0 0 8px"}}>Unlock Filament Pro</h2>
        <p style={{fontSize:isMobile?13:14,fontWeight:400,color:"#999",margin:0,lineHeight:1.55}}>{subheadline}</p>
      </div>

      {/* Features */}
      <div style={{marginBottom:24}}>
        <p style={{fontSize:11,fontWeight:500,color:"#555",letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 12px"}}>What's Included</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {text:"Unlimited constellation searches"},
            {text:"Saved constellations (personal library)",suffix:" — coming soon"},
            {text:"Priority generation speed",suffix:" — coming soon"},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <span style={{fontSize:14,color:"#C77DFF",fontWeight:600,flexShrink:0,marginTop:1}}>✓</span>
              <span style={{fontSize:14,fontWeight:400,color:"#fff"}}>
                {f.text}{f.suffix&&<span style={{fontSize:12,color:"#555",fontStyle:"italic"}}>{f.suffix}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing cards */}
      <div style={{display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr 1fr",gap:10,marginBottom:10}}>
        {isMobile && <AnnualCard />}
        <MonthlyCard />
        {!isMobile && <AnnualCard />}
      </div>

      {/* Lifetime */}
      <div
        onClick={()=>window.location.href='/checkout/lifetime'}
        style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"all 150ms"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(199,125,255,0.16)";e.currentTarget.style.background="rgba(255,255,255,0.035)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.background="rgba(255,255,255,0.02)";}}
      >
        <div>
          <p style={{fontSize:14,fontWeight:500,color:"#fff",margin:0}}>Lifetime Access</p>
          <p style={{fontSize:12,color:"#888",margin:"2px 0 0"}}>One-time payment, yours forever.</p>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <p style={{fontSize:20,fontWeight:600,color:"#fff",margin:0}}>$79</p>
          <span style={{fontSize:11,color:"#C77DFF",display:"block",marginTop:2}}>Limited seats remaining</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{marginTop:24,textAlign:"center"}}>
        <button
          onClick={onClose}
          style={{fontSize:13,fontWeight:400,color:"#555",cursor:"pointer",background:"none",border:"none",fontFamily:"inherit",transition:"color 150ms",padding:isMobile?"16px 0":undefined,width:isMobile?"100%":undefined}}
          onMouseEnter={e=>e.currentTarget.style.color="#999"}
          onMouseLeave={e=>e.currentTarget.style.color="#555"}
        >← Return to constellation</button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",backdropFilter:"blur(6px)",zIndex:400,animation:"payOverlayIn 200ms ease"}} />
      {isMobile ? (
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:401,maxHeight:"88vh",overflowY:"auto",background:"rgba(12,12,20,0.98)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(199,125,255,0.18)",borderRadius:"20px 20px 0 0",padding:"0 20px env(safe-area-inset-bottom, 24px)",animation:"payMobUp 260ms cubic-bezier(0.32,0.72,0,1)"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.18)",margin:"12px auto 20px"}} />
          {inner}
        </div>
      ) : (
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,width:480,background:"rgba(12,12,20,0.97)",backdropFilter:"blur(24px)",border:"1px solid rgba(199,125,255,0.18)",borderRadius:16,padding:"40px 36px 32px",boxShadow:"0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(199,125,255,0.08)",animation:"payDeskIn 200ms ease-out"}}>
          {inner}
        </div>
      )}
      <style>{`
        @keyframes payOverlayIn { from{opacity:0} to{opacity:1} }
        @keyframes payDeskIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes payMobUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </>
  );
}

// === CONSTELLATION VIEW ===
function ConstellationView({ data, onBack, searchesRemaining, searchQuery, coldVisitorBannerDismissed, onDismissColdBanner, searchWarningToastDismissed, onDismissWarningToast, onOpenPaywall }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTheme, setActiveTheme] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [dims, setDims] = useState({w:800,h:520});
  const [showOnboard, setShowOnboard] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [hint, setHint] = useState(true);

  // Share sheet
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'failed'

  // Cold visitor banner
  const isSharedView = !!data.isShared;
  const [bannerMounted, setBannerMounted] = useState(false);
  const [bannerDismissing, setBannerDismissing] = useState(false);

  // Warning toast
  const [toastMounted, setToastMounted] = useState(false);
  const [toastFading, setToastFading] = useState(false);

  const simRef = useRef(null);
  const dragRef = useRef(null);
  const dragStartRef = useRef(null);
  const didDragRef = useRef(false);
  const touchStartRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Banner appear: 300ms delay
  useEffect(() => {
    if (isSharedView && !coldVisitorBannerDismissed) {
      const t = setTimeout(() => setBannerMounted(true), 300);
      return () => clearTimeout(t);
    }
  }, [isSharedView, coldVisitorBannerDismissed]);

  // Toast appear: 2500ms after render when searchesRemaining === 1
  useEffect(() => {
    if (searchesRemaining === 1 && !searchWarningToastDismissed) {
      const t = setTimeout(() => setToastMounted(true), 2500);
      return () => clearTimeout(t);
    }
  }, [searchesRemaining, searchWarningToastDismissed]);

  // Toast auto-dismiss after 9000ms
  useEffect(() => {
    if (!toastMounted) return;
    const t = setTimeout(() => dismissToast(), 9000);
    return () => clearTimeout(t);
  }, [toastMounted]);

  // Escape key closes share sheet
  useEffect(() => {
    if (!showShareSheet) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowShareSheet(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showShareSheet]);

  const themeMap = {};
  const themeColors = {};
  const themeTypes = {};
  const themeExpl = {};
  data.themes.forEach((t,i) => {
    themeMap[t.id]=t.name;
    themeColors[t.id]=TCOLORS[i%TCOLORS.length];
    themeTypes[t.id]=t.type;
    themeExpl[t.id]=t.explanation;
  });

  useEffect(() => {
    const w = Math.min(window.innerWidth - 32, 920);
    const h = Math.min(window.innerHeight - 140, 560);
    setDims({ w, h });

    const simNodes = data.movies.map((m, i) => ({ ...m, index: i, radius: isMobile ? 22 + m.themes.length * 3 : 17 + m.themes.length * 3 }));
    const simLinks = [];
    for (let i = 0; i < data.movies.length; i++)
      for (let j = i + 1; j < data.movies.length; j++) {
        const shared = data.movies[i].themes.filter(t => data.movies[j].themes.includes(t));
        if (shared.length >= 1) simLinks.push({ source: i, target: j, themes: shared, strength: shared.length });
      }

    const sim = d3.forceSimulation(simNodes)
      .force("center", d3.forceCenter(w / 2, h / 2).strength(0.05))
      .force("charge", d3.forceManyBody().strength(-180))
      .force("collision", d3.forceCollide().radius(d => d.radius + 28))
      .force("link", d3.forceLink(simLinks).distance(d => 140 - d.strength * 15).strength(d => 0.2 + d.strength * 0.05))
      .force("x", d3.forceX(w / 2).strength(0.03))
      .force("y", d3.forceY(h / 2).strength(0.03))
      .alphaDecay(0.015)
      .on("tick", () => {
        simNodes.forEach(n => {
          n.x = Math.max(n.radius + 4, Math.min(w - n.radius - 4, n.x));
          n.y = Math.max(n.radius + 4, Math.min(h - n.radius - 4, n.y));
        });
        setNodes([...simNodes]);
        setLinks(simLinks.map(l => ({
          ...l,
          sx: l.source.x, sy: l.source.y,
          tx: l.target.x, ty: l.target.y,
          sourceId: l.source.id, targetId: l.target.id,
        })));
      });

    simRef.current = sim;
    return () => sim.stop();
  }, [data]);

  const isLinked = nid => selected && links.some(l => (l.sourceId === selected.id && l.targetId === nid) || (l.targetId === selected.id && l.sourceId === nid));
  const inTheme = n => !activeTheme || n.themes.includes(activeTheme);
  const nOp = n => { if (activeTheme && !inTheme(n)) return 0.08; if (selected && n.id !== selected.id && !isLinked(n.id)) return 0.15; return 1; };
  const lOp = l => { if (activeTheme && !l.themes.includes(activeTheme)) return 0.02; if (selected && l.sourceId !== selected.id && l.targetId !== selected.id) return 0.03; return 0.5; };
  const lColor = l => { const t = activeTheme && l.themes.includes(activeTheme) ? activeTheme : l.themes[0]; return themeColors[t] || "#666"; };

  const onPD = (e, n) => {
    if (isMobile) return;
    e.stopPropagation(); e.preventDefault();
    dragRef.current = n;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
    const sim = simRef.current;
    if (sim) { sim.alphaTarget(0.1).restart(); }
    const sn = sim?.nodes().find(x => x.id === n.id);
    const moveFn = ev => {
      if (!dragRef.current || !sn) return;
      const dx = ev.clientX - dragStartRef.current.x, dy = ev.clientY - dragStartRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) didDragRef.current = true;
      const svg = document.querySelector('#fil-svg');
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      sn.fx = ev.clientX - r.left;
      sn.fy = ev.clientY - r.top;
    };
    const upFn = () => {
      if (sn) { sn.fx = null; sn.fy = null; }
      if (sim) sim.alphaTarget(0);
      dragRef.current = null;
      window.removeEventListener('pointermove', moveFn);
      window.removeEventListener('pointerup', upFn);
    };
    window.addEventListener('pointermove', moveFn);
    window.addEventListener('pointerup', upFn);
  };

  const onNodeClick = (e, movie) => {
    e.stopPropagation();
    if (didDragRef.current) return;
    setSelected(prev => prev?.id === movie.id ? null : movie);
    setHint(false);
  };

  // === SHARE HELPERS ===
  const shareUrl = data.shareId ? `${window.location.origin}/c/${data.shareId}` : null;
  const searchedTitle = searchQuery || data.movies?.[0]?.title || 'a film';
  const firstThread = data.themes?.[0];

  const buildTweetUrl = () => {
    if (!shareUrl) return null;
    let tweetText;
    if (firstThread) {
      tweetText = `just mapped "${searchedTitle}" on Filament and got a constellation connected by "${firstThread.name}" — this thing is uncanny ${shareUrl} #FilmTwitter`;
      const titleHashtag = '#' + searchedTitle.replace(/[^a-zA-Z0-9]/g, '');
      if (280 - tweetText.length - 1 - titleHashtag.length >= 0) {
        tweetText += ` ${titleHashtag}`;
      }
    } else {
      tweetText = `just mapped "${searchedTitle}" on Filament — the connections it found are uncanny ${shareUrl} #FilmTwitter`;
    }
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  // Banner dismiss
  const handleDismissBanner = () => {
    setBannerDismissing(true);
    setTimeout(() => {
      onDismissColdBanner();
      setBannerMounted(false);
      setBannerDismissing(false);
    }, 200);
  };

  // Toast dismiss
  const dismissToast = (cb) => {
    setToastFading(true);
    setTimeout(() => {
      setToastMounted(false);
      setToastFading(false);
      if (cb) cb();
    }, 300);
  };

  // SVG icons
  const IconTwitter = ({color}) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} style={{flexShrink:0}}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  const IconLink = ({color}) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C77DFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  // Share sheet row renderer
  const SheetRow = ({onClick, icon, label, labelColor="#fff"}) => {
    const [hov, setHov] = useState(false);
    return (
      <div
        onClick={onClick}
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{height:44,display:"flex",alignItems:"center",gap:10,padding:"0 12px",borderRadius:6,cursor:"pointer",background:hov?"rgba(255,255,255,0.06)":"transparent",transition:"background 150ms ease"}}
      >
        {icon}
        <span style={{fontSize:14,fontWeight:400,color:labelColor,fontFamily:"'Inter',-apple-system,sans-serif"}}>{label}</span>
      </div>
    );
  };

  // === ONBOARDING OVERLAY ===
  if (showOnboard) {
    const tc = data.themes.length, mc = data.movies.length;
    return (
      <div style={{minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:8,marginBottom:32}}>
          {data.themes.map((th,i) => (
            <div key={th.id} style={{width:10,height:10,borderRadius:"50%",background:TCOLORS[i%TCOLORS.length],opacity:0.8}}/>
          ))}
        </div>
        <h2 style={{fontSize:28,fontWeight:300,color:"#fff",margin:"0 0 40px",textAlign:"center",lineHeight:1.4,maxWidth:480}}>
          We found {mc} films connected by {tc} invisible threads
        </h2>
        <button onClick={()=>setShowOnboard(false)}
          style={{background:"#C77DFF18",border:"1px solid #C77DFF44",borderRadius:10,padding:"12px 36px",color:"#C77DFF",fontSize:14,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",transition:"all 0.3s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#C77DFF28";e.currentTarget.style.borderColor="#C77DFF66";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#C77DFF18";e.currentTarget.style.borderColor="#C77DFF44";}}>
          Start exploring
        </button>
      </div>
    );
  }

  const tweetUrl = buildTweetUrl();
  const shareButtonBorderColor = showShareSheet ? "rgba(199,125,255,0.45)" : "#333";

  return (
    <div style={{background:"transparent",minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e0e0e0",position:"relative",zIndex:1}}>

      {/* Header */}
      <div style={{padding:"16px 20px 6px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"#0a0a0f99",backdropFilter:"blur(8px)",border:"1px solid #333",color:"#888",borderRadius:8,padding:isMobile?"8px 16px":"6px 14px",fontSize:12,cursor:"pointer",letterSpacing:0.5}}>← Back</button>
        <h1 style={{fontSize:22,fontWeight:200,letterSpacing:5,margin:0,color:"#fff",textTransform:"uppercase"}}>Filament</h1>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          {searchesRemaining !== null && searchesRemaining !== undefined && (
            <span style={{fontSize:11,color:"#666",letterSpacing:0.5}}>
              {searchesRemaining} search{searchesRemaining !== 1 ? 'es' : ''} remaining today
            </span>
          )}
          {data.shareId && (
            <div style={{position:"relative"}}>
              <button
                onClick={()=>setShowShareSheet(s=>!s)}
                style={{background:"#0a0a0f99",backdropFilter:"blur(8px)",border:`1px solid ${shareButtonBorderColor}`,color:"#888",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",letterSpacing:0.5,transition:"border-color 150ms"}}
              >
                Share
              </button>
              {/* Desktop share sheet */}
              {showShareSheet && !isMobile && (
                <>
                  {/* Click-catcher */}
                  <div
                    onClick={()=>setShowShareSheet(false)}
                    style={{position:"fixed",inset:0,zIndex:199}}
                  />
                  {/* Popover */}
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:200,width:220,background:"rgba(10,10,15,0.96)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",padding:6,animation:"shareSheetIn 150ms ease-out"}}>
                    <SheetRow
                      onClick={()=>{ if(tweetUrl){ setShowShareSheet(false); window.open(tweetUrl,'_blank'); } }}
                      icon={<IconTwitter color={tweetUrl?"#888":"#555"}/>}
                      label="Tweet This"
                    />
                    <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"0 6px"}}/>
                    <SheetRow
                      onClick={handleCopyLink}
                      icon={copyState==='copied' ? <IconCheck/> : <IconLink color={copyState==='copied'?"#C77DFF":"#888"}/>}
                      label={copyState==='copied' ? "✓ Copied!" : copyState==='failed' ? "Failed — try again" : "Copy Link"}
                      labelColor={copyState==='copied' ? "#C77DFF" : copyState==='failed' ? "#ff6b6b" : "#fff"}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <button onClick={()=>setShowHelp(h=>!h)}
            style={{background:showHelp?"#C77DFF22":"#0a0a0f99",backdropFilter:"blur(8px)",border:`1px solid ${showHelp?"#C77DFF44":"#333"}`,color:showHelp?"#C77DFF":"#666",borderRadius:"50%",width:isMobile?40:30,height:isMobile?40:30,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"inherit"}}>
            ?
          </button>
        </div>
      </div>

      {/* Help card */}
      {showHelp && (
        <div style={{margin:"0 20px 8px",background:"#0e0e18cc",backdropFilter:"blur(12px)",border:"1px solid #333",borderRadius:10,padding:"12px 16px",maxWidth:580}}>
          <p style={{fontSize:12,color:"#888",margin:"0 0 6px",lineHeight:1.6}}>Each circle is a film or show. The colored lines between them are <em>threads</em> — shared feelings, craft techniques, creative philosophies, and cinematic lineages that connect stories at a deeper level than genre.</p>
          <p style={{fontSize:12,color:"#666",margin:0,lineHeight:1.6}}>Click any movie or TV show to see why it belongs here. Use the thread pills above the map to isolate specific connections. Drag nodes to rearrange.</p>
        </div>
      )}

      {/* Cold visitor banner */}
      {bannerMounted && !coldVisitorBannerDismissed && (
        <div style={{
          width:"100%",
          padding:isMobile?"10px 16px":"13px 24px",
          background:"rgba(199,125,255,0.05)",
          borderBottom:"1px solid rgba(199,125,255,0.12)",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          gap:isMobile?10:16,
          overflow:"hidden",
          animation:bannerDismissing?"bannerOut 200ms ease-in forwards":"bannerIn 200ms ease-out",
          boxSizing:"border-box",
        }}>
          {isMobile ? (
            <p style={{fontSize:13,color:"#aaaaaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>
              Films connected to {data.movies?.[0]?.title || "this constellation"} — make your own.
            </p>
          ) : (
            <p style={{fontSize:14,fontWeight:400,color:"#fff",margin:0,flex:1}}>
              Someone mapped the films connected to {data.movies?.[0]?.title || "this constellation"}.
              <span style={{color:"#999"}}> Explore their constellation — or generate your own.</span>
            </p>
          )}
          <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            <button
              onClick={()=>{ window.location.href='/?ref=shared'; }}
              style={{background:"#C77DFF",color:"#0a0a0f",fontSize:isMobile?12:13,fontWeight:500,padding:isMobile?"7px 12px":"8px 16px",borderRadius:6,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"background 150ms"}}
              onMouseEnter={e=>e.currentTarget.style.background="#b56ef0"}
              onMouseLeave={e=>e.currentTarget.style.background="#C77DFF"}
              onMouseDown={e=>e.currentTarget.style.background="#a060e0"}
              onMouseUp={e=>e.currentTarget.style.background="#b56ef0"}
            >{isMobile?"Generate →":"Generate yours →"}</button>
            <button
              onClick={handleDismissBanner}
              style={{fontSize:isMobile?16:18,color:"#555555",cursor:"pointer",padding:4,background:"none",border:"none",flexShrink:0,fontFamily:"inherit",transition:"color 150ms",lineHeight:1}}
              onMouseEnter={e=>e.currentTarget.style.color="#999999"}
              onMouseLeave={e=>e.currentTarget.style.color="#555555"}
            >×</button>
          </div>
        </div>
      )}

      {/* Thread filters */}
      <div style={{padding:"6px 20px 4px"}}>
        <p style={{fontSize:10,color:"#555",margin:"0 0 6px",letterSpacing:1,textTransform:"uppercase"}}>What connects them</p>
        <div style={{display:"flex",flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",WebkitOverflowScrolling:isMobile?"touch":undefined,scrollbarWidth:isMobile?"none":undefined,gap:isMobile?5:6,paddingBottom:isMobile?4:0}}>
          {data.themes.map(t=>{
            const active=activeTheme===t.id;
            const c=themeColors[t.id]||"#666";
            const icon=TYPE_ICONS[themeTypes[t.id]]||"◆";
            return (
              <button key={t.id} onClick={()=>setActiveTheme(active?null:t.id)}
                style={{background:active?c+"22":"#0a0a0f88",backdropFilter:"blur(6px)",border:`1px solid ${active?c:"#333"}`,color:active?c:"#666",borderRadius:20,padding:isMobile?"5px 14px":"3px 11px",fontSize:isMobile?11:10,minHeight:isMobile?28:"auto",cursor:"pointer",transition:"all 0.3s",letterSpacing:0.3,fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <span style={{opacity:active?1:0.5}}>{icon}</span>
                {t.name}
              </button>
            );
          })}
        </div>
      </div>
      {activeTheme && themeExpl[activeTheme] && (
        <div style={{padding:"0 20px 10px"}}>
          <div style={{background:"#0e0e1888",backdropFilter:"blur(8px)",border:`1px solid ${themeColors[activeTheme]||"#333"}33`,borderRadius:8,padding:"8px 12px",maxWidth:600}}>
            <span style={{fontSize:10,color:themeColors[activeTheme]||"#666",fontWeight:500,letterSpacing:0.5,textTransform:"uppercase"}}>{TYPE_LABELS[themeTypes[activeTheme]]||"thread"}</span>
            <p style={{fontSize:12,color:"#999",margin:"3px 0 0",lineHeight:1.5}}>{themeExpl[activeTheme]}</p>
          </div>
        </div>
      )}

      {/* Map + Detail Panel */}
      <div style={{position:"relative"}}>
        <svg id="fil-svg" width={dims.w} height={dims.h} style={{cursor:"grab",display:"block",margin:"0 auto"}} onClick={()=>setSelected(null)}>
          <defs>{data.themes.map(t=>(<radialGradient key={t.id} id={`g-${t.id}`}><stop offset="0%" stopColor={themeColors[t.id]||"#666"} stopOpacity="0.8"/><stop offset="100%" stopColor={themeColors[t.id]||"#666"} stopOpacity="0"/></radialGradient>))}</defs>
          {links.map((l,i)=>(
            <line key={i} x1={l.sx} y1={l.sy} x2={l.tx} y2={l.ty} stroke={lColor(l)} strokeWidth={l.strength*0.7} opacity={lOp(l)} style={{transition:"opacity 0.4s"}}/>
          ))}
          {nodes.map(n=>{
            const op=nOp(n),isSel=selected?.id===n.id,isH=hovered===n.id;
            const pt=activeTheme&&n.themes.includes(activeTheme)?activeTheme:n.themes[0];
            const c=themeColors[pt]||"#666";
            const isFirst=n.id===data.movies[0]?.id;
            return (
              <g key={n.id} style={{cursor:"pointer",transition:"opacity 0.4s"}} opacity={op}
                onPointerDown={e=>onPD(e,n)} onClick={e=>onNodeClick(e,n)} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)}
                onTouchStart={e => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                onTouchEnd={e => {
                  if (!touchStartRef.current) return;
                  const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
                  const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
                  if (dx < 8 && dy < 8) { e.preventDefault(); onNodeClick(e, n); }
                  touchStartRef.current = null;
                }}>
                {isMobile && <circle cx={n.x} cy={n.y} r={Math.max(22, n.radius + 10)} fill="transparent" />}
                <circle cx={n.x} cy={n.y} r={n.radius*2.2} fill={`url(#g-${pt})`} opacity={isSel?0.45:isH?0.3:isFirst?0.25:0.07}/>
                <circle cx={n.x} cy={n.y} r={n.radius} fill={isSel?c+"33":"#0e0e18"} stroke={c} strokeWidth={isSel||isFirst?2:1}/>
                <circle cx={n.x} cy={n.y} r={3} fill={c} opacity={0.9}/>
                <text x={n.x} y={n.y+n.radius+(isMobile?15:14)} textAnchor="middle" fill={isSel||isH?"#fff":"#888"} fontSize={isMobile?11:9.5} fontWeight={isSel?500:300} letterSpacing={0.4} style={{pointerEvents:"none"}}>{n.title}</text>
                {!isMobile && <text x={n.x} y={n.y+n.radius+25} textAnchor="middle" fill="#444" fontSize={8.5} style={{pointerEvents:"none"}}>{n.year}</text>}
              </g>
            );
          })}
        </svg>
        {hint && !selected && (
          <p style={{textAlign:"center",fontSize:11,color:"#333",margin:"6px 0 0",letterSpacing:0.5,pointerEvents:"none"}}>{isMobile ? "tap a movie to explore" : "click a movie or TV show to explore · drag to rearrange"}</p>
        )}
        {selected && (isMobile ? (
          <div style={{position:"fixed",bottom:0,left:0,right:0,maxHeight:"80vh",background:"#0c0c14f5",backdropFilter:"blur(24px)",borderTop:"1px solid #1a1a2e",borderRadius:"16px 16px 0 0",overflowY:"auto",zIndex:100,animation:"fdUp 0.35s cubic-bezier(0.4,0,0.2,1)",paddingBottom:"env(safe-area-inset-bottom)"}}>
            <div style={{display:"flex",justifyContent:"center",padding:"12px 0 8px"}}>
              <div style={{width:32,height:4,borderRadius:2,background:"#333"}} />
            </div>
            <div style={{padding:"0 20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
                <div><h2 style={{fontSize:19,fontWeight:400,margin:0,color:"#fff",lineHeight:1.3}}>{selected.title}</h2><p style={{fontSize:13,color:"#555",margin:"3px 0 0"}}>{selected.year} · {selected.type}</p></div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:22,padding:8,lineHeight:1}}>×</button>
              </div>
              <div style={{background:"#151520",borderRadius:8,padding:12,margin:"0 0 8px"}}>
                <p style={{fontSize:10,color:"#555",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>The Vibe</p>
                <p style={{fontSize:14,color:"#bbb",margin:0,lineHeight:1.7,fontStyle:"italic"}}>{selected.vibe}</p>
              </div>
              {selected.why_this_exists && (
                <div style={{background:"#151520",borderRadius:8,padding:12,marginBottom:8}}>
                  <p style={{fontSize:10,color:"#555",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>Why This Exists</p>
                  <p style={{fontSize:14,color:"#bbb",margin:0,lineHeight:1.7,fontStyle:"italic"}}>{selected.why_this_exists}</p>
                </div>
              )}
              <p style={{fontSize:14,color:"#999",lineHeight:1.7,margin:"0 0 12px"}}>{selected.desc}</p>
              <div style={{marginBottom:12}}>
                <p style={{fontSize:10,color:"#555",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Connected through</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {selected.themes.map(t=>{
                    const c=themeColors[t]||"#666";
                    const icon=TYPE_ICONS[themeTypes[t]]||"◆";
                    return (<span key={t} onClick={e=>{e.stopPropagation();setActiveTheme(activeTheme===t?null:t);}} style={{fontSize:13,color:c,border:`1px solid ${c}44`,borderRadius:12,padding:"4px 10px",cursor:"pointer",background:activeTheme===t?c+"22":"transparent",display:"inline-flex",alignItems:"center",gap:3,transition:"all 0.2s"}}>{icon} {themeMap[t]||t}</span>);
                  })}
                </div>
              </div>
              <div>
                <p style={{fontSize:10,color:"#555",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Also connected to</p>
                {links.filter(l=>(l.sourceId===selected.id||l.targetId===selected.id)).map((l,i)=>{
                  const oid=l.sourceId===selected.id?l.targetId:l.sourceId;
                  const o=data.movies.find(m=>m.id===oid);
                  if(!o) return null;
                  return (<div key={i} onClick={e=>{e.stopPropagation();setSelected(o);}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 0",cursor:"pointer",borderBottom:"1px solid #151525"}}>
                    <span style={{fontSize:13,color:"#ccc"}}>{o.title}</span>
                    <span style={{fontSize:11,color:"#444",marginLeft:"auto"}}>{l.strength} thread{l.strength>1?"s":""}</span>
                  </div>);
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{position:"absolute",right:12,top:0,width:280,background:"#0e0e18dd",backdropFilter:"blur(20px)",border:"1px solid #222",borderRadius:12,padding:20,animation:"fdIn 0.3s ease",maxHeight:dims.h,overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <div><h2 style={{fontSize:16,fontWeight:400,margin:0,color:"#fff",lineHeight:1.3}}>{selected.title}</h2><p style={{fontSize:11,color:"#555",margin:"3px 0 0"}}>{selected.year} · {selected.type}</p></div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18,padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{background:"#151520",borderRadius:8,padding:12,margin:"12px 0 8px"}}>
              <p style={{fontSize:10,color:"#555",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>The Vibe</p>
              <p style={{fontSize:12,color:"#bbb",margin:0,lineHeight:1.5,fontStyle:"italic"}}>{selected.vibe}</p>
            </div>
            {selected.why_this_exists && (
              <div style={{background:"#151520",borderRadius:8,padding:12,marginBottom:8}}>
                <p style={{fontSize:10,color:"#555",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>Why This Exists</p>
                <p style={{fontSize:12,color:"#bbb",margin:0,lineHeight:1.5,fontStyle:"italic"}}>{selected.why_this_exists}</p>
              </div>
            )}
            <p style={{fontSize:12,color:"#999",lineHeight:1.6,margin:"0 0 12px"}}>{selected.desc}</p>
            <div style={{marginBottom:12}}>
              <p style={{fontSize:10,color:"#555",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Connected through</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {selected.themes.map(t=>{
                  const c=themeColors[t]||"#666";
                  const icon=TYPE_ICONS[themeTypes[t]]||"◆";
                  return (<span key={t} onClick={e=>{e.stopPropagation();setActiveTheme(activeTheme===t?null:t);}} style={{fontSize:10,color:c,border:`1px solid ${c}44`,borderRadius:12,padding:"2px 8px",cursor:"pointer",background:activeTheme===t?c+"22":"transparent",display:"inline-flex",alignItems:"center",gap:3,transition:"all 0.2s"}}>{icon} {themeMap[t]||t}</span>);
                })}
              </div>
            </div>
            <div>
              <p style={{fontSize:10,color:"#555",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Also connected to</p>
              {links.filter(l=>(l.sourceId===selected.id||l.targetId===selected.id)).map((l,i)=>{
                const oid=l.sourceId===selected.id?l.targetId:l.sourceId;
                const o=data.movies.find(m=>m.id===oid);
                if(!o) return null;
                return (<div key={i} onClick={e=>{e.stopPropagation();setSelected(o);}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",cursor:"pointer",borderBottom:"1px solid #151525"}}>
                  <span style={{fontSize:11,color:"#ccc"}}>{o.title}</span>
                  <span style={{fontSize:9,color:"#444",marginLeft:"auto"}}>{l.strength} thread{l.strength>1?"s":""}</span>
                </div>);
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile share bottom sheet */}
      {showShareSheet && isMobile && (
        <>
          <div onClick={()=>setShowShareSheet(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300}}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:301,background:"rgba(10,10,15,0.97)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px 16px 0 0",paddingBottom:"env(safe-area-inset-bottom)",animation:"shareSheetMobIn 220ms cubic-bezier(0.32,0.72,0,1)"}}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.18)",margin:"12px auto 4px"}}/>
            <p style={{fontSize:11,fontWeight:500,color:"#555555",letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center",padding:"6px 20px 14px",margin:0}}>Share Constellation</p>
            <div style={{padding:"0 6px 16px"}}>
              <div
                onClick={()=>{ if(tweetUrl){ setShowShareSheet(false); window.open(tweetUrl,'_blank'); } }}
                style={{height:58,display:"flex",alignItems:"center",gap:14,padding:"0 24px",cursor:"pointer",borderRadius:6}}
                onTouchStart={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                onTouchEnd={e=>e.currentTarget.style.background="transparent"}
              >
                <IconTwitter color={tweetUrl?"#888":"#555"}/>
                <span style={{fontSize:14,color:"#fff"}}>Tweet This</span>
              </div>
              <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"0 6px"}}/>
              <div
                onClick={handleCopyLink}
                style={{height:58,display:"flex",alignItems:"center",gap:14,padding:"0 24px",cursor:"pointer",borderRadius:6}}
                onTouchStart={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                onTouchEnd={e=>e.currentTarget.style.background="transparent"}
              >
                {copyState==='copied' ? <IconCheck/> : <IconLink color={copyState==='copied'?"#C77DFF":"#888"}/>}
                <span style={{fontSize:14,color:copyState==='copied'?"#C77DFF":copyState==='failed'?"#ff6b6b":"#fff"}}>
                  {copyState==='copied' ? "✓ Copied!" : copyState==='failed' ? "Failed — try again" : "Copy Link"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Warning toast */}
      {toastMounted && (
        <div style={{
          position:"fixed",
          bottom:isMobile?"env(safe-area-inset-bottom, 16px)":24,
          left:isMobile?16:"50%",
          right:isMobile?16:undefined,
          transform:isMobile?undefined:"translateX(-50%)",
          zIndex:150,
          maxWidth:isMobile?undefined:460,
          minWidth:isMobile?undefined:320,
          background:"rgba(10,10,15,0.94)",
          backdropFilter:"blur(20px)",
          border:"1px solid rgba(199,125,255,0.22)",
          borderRadius:10,
          padding:"12px 16px",
          boxShadow:"0 8px 32px rgba(0,0,0,0.45)",
          display:"flex",
          flexDirection:isMobile?"column":"row",
          alignItems:isMobile?undefined:"center",
          gap:isMobile?8:12,
          opacity:toastFading?0:1,
          transition:"opacity 300ms ease",
          animation:isMobile?"toastMobIn 300ms ease-out":"toastDeskIn 300ms ease-out",
        }}>
          {!isMobile && <div style={{width:8,height:8,borderRadius:"50%",background:"#C77DFF",flexShrink:0}}/>}
          <p style={{margin:0,fontSize:13,flex:isMobile?undefined:1}}>
            <span style={{fontWeight:500,color:"#fff"}}>1 free search remaining.</span>
            <span style={{fontWeight:400,color:"#999"}}> Pro unlocks unlimited.</span>
          </p>
          <div style={{display:"flex",alignItems:"center",justifyContent:isMobile?"space-between":undefined,gap:isMobile?0:12}}>
            <button
              onClick={()=>dismissToast(()=>onOpenPaywall('preview'))}
              style={{fontSize:13,color:"#C77DFF",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,textDecoration:"none"}}
              onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
              onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}
            >See what's included →</button>
            <button
              onClick={()=>{ dismissToast(); onDismissWarningToast(); }}
              style={{fontSize:16,color:"#555",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:isMobile?0:"0 0 0 4px",lineHeight:1}}
              onMouseEnter={e=>e.currentTarget.style.color="#999"}
              onMouseLeave={e=>e.currentTarget.style.color="#555"}
            >×</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fdIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fdUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes shareSheetIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shareSheetMobIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes bannerIn{from{opacity:0;transform:translateY(-4px);max-height:0}to{opacity:1;transform:translateY(0);max-height:80px}}
        @keyframes bannerOut{from{opacity:1;max-height:80px;padding-top:13px;padding-bottom:13px}to{opacity:0;max-height:0;padding-top:0;padding-bottom:0}}
        @keyframes toastDeskIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes toastMobIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

// === LANDING ===
function Landing({ onExplore, onGuide }) {
  const [query, setQuery] = useState("");
  const [guideStep, setGuideStep] = useState(-1);
  const [guideSel, setGuideSel] = useState([]);
  const [fadeIn, setFadeIn] = useState(true);
  const inputRef = useRef(null);

  useEffect(()=>{setFadeIn(true);},[guideStep]);

  // Focus search input when arriving from a shared constellation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref') === 'shared') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const handleGuideSelect = (optIdx) => {
    const newSel = [...guideSel, optIdx];
    setGuideSel(newSel);
    if (guideStep < GUIDE.length - 1) {
      setFadeIn(false);
      setTimeout(() => setGuideStep(guideStep + 1), 300);
    } else {
      onGuide(newSel);
    }
  };

  if (guideStep >= 0) {
    const step = GUIDE[guideStep];
    return (
      <div style={{minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
        <div style={{position:"absolute",top:20,left:20}}>
          <button onClick={()=>{setGuideStep(guideStep===0?-1:guideStep-1);setGuideSel(guideSel.slice(0,-1));}} style={{background:"#0a0a0f99",backdropFilter:"blur(8px)",border:"1px solid #333",color:"#666",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>← Back</button>
        </div>
        <div style={{position:"absolute",top:24,right:24,display:"flex",gap:6}}>
          {GUIDE.map((_,i)=>(<div key={i} style={{width:28,height:3,borderRadius:2,background:i<=guideStep?"#C77DFF":"#222",transition:"background 0.4s"}}/>))}
        </div>
        <div style={{opacity:fadeIn?1:0,transform:fadeIn?"translateY(0)":"translateY(12px)",transition:"all 0.3s ease",textAlign:"center",maxWidth:520}}>
          <p style={{fontSize:14,color:"#555",margin:"0 0 8px",letterSpacing:1,textTransform:"uppercase"}}>Step {guideStep+1} of {GUIDE.length}</p>
          <h2 style={{fontSize:26,fontWeight:300,color:"#fff",margin:"0 0 36px",lineHeight:1.4}}>{step.q}</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {step.opts.map((opt,i)=>(
              <button key={i} onClick={()=>handleGuideSelect(i)}
                style={{background:"#0e0e18cc",backdropFilter:"blur(12px)",border:"1px solid #222",borderRadius:14,padding:"20px 18px",cursor:"pointer",textAlign:"left",transition:"all 0.25s",display:"flex",flexDirection:"column",gap:8,fontFamily:"inherit"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#C77DFF55";e.currentTarget.style.background="#15151fdd";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#222";e.currentTarget.style.background="#0e0e18cc";}}>
                <span style={{fontSize:22}}>{opt.icon}</span>
                <span style={{fontSize:14,color:"#ccc",lineHeight:1.4,fontWeight:300}}>{opt.label}</span>
              </button>
            ))}
          </div>
          {guideStep === 0 && <p style={{fontSize:12,color:"#444",margin:"24px 0 0",letterSpacing:0.5}}>3 questions. No genres. Just vibes.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",maxWidth:560,position:"relative"}}>
        <h1 style={{fontSize:46,fontWeight:200,letterSpacing:12,margin:0,color:"#fff",textTransform:"uppercase"}}>Filament</h1>
        <p style={{fontSize:14,color:"#555",margin:"8px 0 0",letterSpacing:3}}>thematic discovery map</p>
        <p style={{fontSize:15,color:"#666",margin:"36px 0 44px",lineHeight:1.8,fontWeight:300}}>
          Find films you didn't know you were looking for.
        </p>
        <div style={{marginBottom:44}}>
          <p style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:2,margin:"0 0 10px"}}>Start with a movie or show you love</p>
          <div style={{display:"flex",gap:0,maxWidth:440,margin:"0 auto"}}>
            <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&query.trim()&&onExplore(query.trim())}
              placeholder="e.g. The Terror, Alien, Arrival..."
              style={{flex:1,background:"#0e0e18cc",backdropFilter:"blur(12px)",border:"1px solid #222",borderRight:"none",borderRadius:"10px 0 0 10px",padding:"14px 18px",color:"#ddd",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>query.trim()&&onExplore(query.trim())}
              style={{background:"#C77DFF14",backdropFilter:"blur(12px)",border:"1px solid #C77DFF44",borderRadius:"0 10px 10px 0",padding:"14px 24px",color:"#C77DFF",fontSize:13,cursor:"pointer",letterSpacing:0.5,fontFamily:"inherit",whiteSpace:"nowrap"}}>
              Explore →
            </button>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,margin:"0 auto",maxWidth:300,marginBottom:44}}>
          <div style={{flex:1,height:1,background:"#222"}}/><span style={{fontSize:11,color:"#444",letterSpacing:2}}>OR</span><div style={{flex:1,height:1,background:"#222"}}/>
        </div>
        <div>
          <p style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:2,margin:"0 0 12px"}}>Not sure what you're looking for?</p>
          <button onClick={()=>setGuideStep(0)}
            style={{background:"#0e0e18cc",backdropFilter:"blur(12px)",border:"1px solid #222",borderRadius:14,padding:"18px 36px",cursor:"pointer",transition:"all 0.3s",fontFamily:"inherit"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#4ECDC455";e.currentTarget.style.background="#12121fdd";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#222";e.currentTarget.style.background="#0e0e18cc";}}>
            <span style={{fontSize:15,color:"#ccc",fontWeight:300}}>Guide me to something I'll love</span>
            <p style={{fontSize:12,color:"#555",margin:"6px 0 0",fontWeight:300}}>3 questions. No genres. Just vibes.</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// === APP ===
export default function App() {
  const [view, setView] = useState("landing");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState(null);
  const [searchesRemaining, setSearchesRemaining] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuided, setIsGuided] = useState(false);
  const [teasers, setTeasers] = useState(null);

  // Session-persistent state (resets on page refresh, not on navigation)
  const [coldVisitorBannerDismissed, setColdVisitorBannerDismissed] = useState(false);
  const [searchWarningToastDismissed, setSearchWarningToastDismissed] = useState(false);
  const [paywallContext, setPaywallContext] = useState(null); // null | 'blocked' | 'preview'

  // Check URL for shared constellation on mount
  useEffect(() => {
    const path = window.location.pathname;
    const shareMatch = path.match(/^\/c\/([a-z0-9]+)$/i);

    if (shareMatch) {
      const shareId = shareMatch[1];
      loadSharedConstellation(shareId);
    }
  }, []);

  // Load shared constellation from database
  const loadSharedConstellation = async (shareId) => {
    setLoading(true);
    setError(null);
    setView("loading");

    try {
      const result = await fetchSharedConstellation(shareId);
      setData(result);
      setView("constellation");
      window.history.replaceState({}, '', `/c/${shareId}`);
    } catch (err) {
      console.error('Failed to load shared constellation:', err);
      setError(err.message || 'Failed to load constellation. The link may be invalid.');
      setView("landing");
      window.history.replaceState({}, '', '/');
    }

    setLoading(false);
  };

  // Perform new search (title or guided)
  const doSearch = async (prompt, searchType = 'title') => {
    // Block search if rate limit reached
    if (searchesRemaining === 0) {
      setPaywallContext('blocked');
      return;
    }

    setLoading(true);
    setError(null);
    setTeasers(null);
    setLoadMsg("Mapping thematic connections");
    setView("loading");

    fetchTeasers(prompt).then(t => { if (t) setTeasers(t); }).catch(() => {});

    try {
      const result = await fetchConstellation(prompt, searchType);
      setData(result);
      setSearchesRemaining(result.searchesRemaining);
      setView("constellation");

      if (result.shareId) {
        window.history.pushState({}, '', `/c/${result.shareId}`);
      }
    } catch (err) {
      console.error(err);

      if (err.status === 429) {
        setPaywallContext('blocked');
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }

      setView("landing");
    }

    setLoading(false);
  };

  const handleExplore = (query) => {
    setSearchQuery(query);
    setIsGuided(false);
    doSearch(
      `Analyze the movie/show "${query}" and find 8-12 thematically connected films and TV shows. Focus on deep thematic, craft, philosophical, and lineage threads — not surface genre. Include a mix of well-known films and hidden gems. The searched title should be the first entry.`,
      'title'
    );
  };

  const handleGuide = (selIndices) => {
    setSearchQuery('');
    setIsGuided(true);
    doSearch(buildGuidePrompt(selIndices), 'guided');
  };

  const handleBack = () => {
    setView("landing");
    setData(null);
    setTeasers(null);
    // Intentionally keep searchesRemaining so the paywall check still works
    window.history.pushState({}, '', '/');
  };

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh"}}>
      <FilamentBG intensity={view==="constellation"?0.3:0.7} />
      {view==="loading" && <LoadingView searchQuery={searchQuery} isGuided={isGuided} teasers={teasers} />}
      {view==="constellation" && data && (
        <ConstellationView
          data={data}
          onBack={handleBack}
          searchesRemaining={searchesRemaining}
          searchQuery={searchQuery}
          coldVisitorBannerDismissed={coldVisitorBannerDismissed}
          onDismissColdBanner={() => setColdVisitorBannerDismissed(true)}
          searchWarningToastDismissed={searchWarningToastDismissed}
          onDismissWarningToast={() => setSearchWarningToastDismissed(true)}
          onOpenPaywall={(ctx) => setPaywallContext(ctx)}
        />
      )}
      {view==="landing" && <Landing onExplore={handleExplore} onGuide={handleGuide} />}
      {error && view==="landing" && (
        <div style={{
          position:"fixed",
          bottom:24,
          left:"50%",
          transform:"translateX(-50%)",
          background:"#FF6B6B22",
          border:"1px solid #FF6B6B44",
          borderRadius:10,
          padding:"12px 24px",
          color:"#FF6B6B",
          fontSize:13,
          zIndex:10,
          maxWidth:"90%",
          textAlign:"center",
          lineHeight:1.5
        }}>
          {error}
        </div>
      )}
      {paywallContext && (
        <PaywallModal context={paywallContext} onClose={() => setPaywallContext(null)} />
      )}
    </div>
  );
}
