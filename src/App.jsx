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

    // Parse error response for better error handling
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { error: text };
    }

    // Create error object with status and data
    const error = new Error(errorData.error || 'API request failed');
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  return res.json();
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
        if (Math.random()<0.4) continue;
        nodes.push({ bx, by, x:bx, y:by, ox:(Math.random()-.5)*12, oy:(Math.random()-.5)*12, r:1+Math.random()*1.2, color:TCOLORS[Math.floor(Math.random()*TCOLORS.length)], phase:Math.random()*Math.PI*2, breathSpeed:0.008+Math.random()*0.012, baseAlpha:0.12+Math.random()*0.18 });
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
      for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy); if(d>maxLD)continue; const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2,mdx=mx-midX,mdy=my-midY,md=Math.sqrt(mdx*mdx+mdy*mdy),prox=Math.max(0,1-md/200),fade=1-d/maxLD,alpha=(0.03+fade*0.04+prox*0.12)*intensity; ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=a.color;ctx.globalAlpha=alpha;ctx.lineWidth=0.5+prox*0.5;ctx.stroke();}
      for(let n of nodes){const dx=mx-n.x,dy=mx>-500?my-n.y:1000,d=Math.sqrt(dx*dx+dy*dy),prox=Math.max(0,1-d/180),breath=Math.sin(t*n.breathSpeed+n.phase)*0.5+0.5,alpha=(n.baseAlpha*0.4+breath*0.15+prox*0.5)*intensity,radius=n.r+prox*2; if(prox>0.1){ctx.beginPath();ctx.arc(n.x,n.y,radius+6*prox,0,Math.PI*2);const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,radius+6*prox);g.addColorStop(0,n.color);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.globalAlpha=prox*0.25*intensity;ctx.fill();} ctx.beginPath();ctx.arc(n.x,n.y,radius,0,Math.PI*2);ctx.fillStyle=n.color;ctx.globalAlpha=alpha;ctx.fill();}
      ctx.globalAlpha=1; animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onMove);window.removeEventListener("touchmove",onTouch);};
  }, [intensity]);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// === LOADING ANIMATION ===
const LOADING_PHRASES = [
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
  "Almost there — assembling your constellation",
];

function LoadingView({ searchQuery, isGuided }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotIv = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(dotIv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % LOADING_PHRASES.length);
        setFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',-apple-system,sans-serif", position:"relative", zIndex:1 }}>
      <div style={{ textAlign:"center", maxWidth: 400 }}>
        <div style={{ width:48, height:48, border:"2px solid #222", borderTopColor:"#C77DFF", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 28px" }} />
        {isGuided ? (
          <p style={{ color:"#777", fontSize:14, fontWeight:300, letterSpacing:0.5, margin:"0 0 20px" }}>
            Mapping your constellation...
          </p>
        ) : searchQuery ? (
          <div style={{ margin:"0 0 20px" }}>
            <p style={{ color:"#666", fontSize:13, fontWeight:300, margin:"0 0 6px", letterSpacing:0.3 }}>
              Mapping the constellation around
            </p>
            <p style={{ color:"#ddd", fontSize:22, fontWeight:200, margin:0, letterSpacing:1 }}>
              {searchQuery}
            </p>
          </div>
        ) : null}
        <p style={{
          color:"#999", fontSize:14, fontWeight:300, letterSpacing:0.5, minHeight:24,
          opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.3s ease",
        }}>
          {LOADING_PHRASES[idx]}{dots}
        </p>
        <p style={{ color:"#555", fontSize:12, fontWeight:300, margin:"12px 0 0", letterSpacing:0.3 }}>
          This can take up to a minute, we're doing the deep work.
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:20 }}>
          {LOADING_PHRASES.slice(0, 8).map((_, i) => (
            <div key={i} style={{
              width: 16, height: 2, borderRadius: 1,
              background: i <= idx ? "#C77DFF" : "#222",
              transition: "background 0.5s ease",
            }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// === CONSTELLATION VIEW ===
function ConstellationView({ data, onBack, searchesRemaining }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTheme, setActiveTheme] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dims, setDims] = useState({w:800,h:520});
  const [showOnboard, setShowOnboard] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [hint, setHint] = useState(true);
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

  const handleShare = async () => {
    if (!data.shareId) return;
    const shareUrl = `${window.location.origin}/c/${data.shareId}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
        <h2 style={{fontSize:28,fontWeight:300,color:"#fff",margin:"0 0 16px",textAlign:"center",lineHeight:1.4,maxWidth:480}}>
          We found {mc} films connected by {tc} invisible threads
        </h2>
        <p style={{fontSize:14,color:"#555",margin:isMobile?"0":"0 0 40px",textAlign:"center",maxWidth:420,lineHeight:1.7,fontWeight:300}}>
          Shared obsessions, cinematic lineages, and feelings that echo across decades.{" "}
          {isMobile ? "Tap any film to see why it belongs here." : "Click any film to see why it belongs here."}
        </p>
        {isMobile && (
          <p style={{fontSize:13,color:"#666",margin:"8px 0 40px",textAlign:"center",fontWeight:300}}>
            Swipe the threads above to explore connections.
          </p>
        )}
        <button onClick={()=>setShowOnboard(false)}
          style={{background:"#C77DFF18",border:"1px solid #C77DFF44",borderRadius:10,padding:"12px 36px",color:"#C77DFF",fontSize:14,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",transition:"all 0.3s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#C77DFF28";e.currentTarget.style.borderColor="#C77DFF66";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#C77DFF18";e.currentTarget.style.borderColor="#C77DFF44";}}>
          Start exploring
        </button>
      </div>
    );
  }

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
            <button onClick={handleShare}
              style={{background:copySuccess?"#4ECDC422":"#0a0a0f99",backdropFilter:"blur(8px)",border:`1px solid ${copySuccess?"#4ECDC4":"#333"}`,color:copySuccess?"#4ECDC4":"#888",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",letterSpacing:0.5,transition:"all 0.3s"}}>
              {copySuccess ? "✓ Copied!" : "Share"}
            </button>
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
          <p style={{fontSize:12,color:"#666",margin:0,lineHeight:1.6}}>Click any film to see why it belongs here. Use the thread pills above the map to isolate specific connections. Drag nodes to rearrange.</p>
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
          <p style={{textAlign:"center",fontSize:11,color:"#333",margin:"6px 0 0",letterSpacing:0.5,pointerEvents:"none"}}>{isMobile ? "tap a movie to explore" : "click a movie to explore · drag to rearrange"}</p>
        )}
        {selected && (isMobile ? (
          // MOBILE: Bottom sheet
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
          // DESKTOP: Side panel — unchanged
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
      <style>{`@keyframes fdIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}@keyframes fdUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// === LANDING ===
function Landing({ onExplore, onGuide }) {
  const [query, setQuery] = useState("");
  const [guideStep, setGuideStep] = useState(-1);
  const [guideSel, setGuideSel] = useState([]);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(()=>{setFadeIn(true);},[guideStep]);

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
          Every great movie is connected to another by invisible threads — 
          a shared feeling, a kindred mythology, a familiar ache. 
          Filament maps those threads so you can find what you're really looking for.
        </p>
        <div style={{marginBottom:44}}>
          <p style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:2,margin:"0 0 10px"}}>Start with a movie you love</p>
          <div style={{display:"flex",gap:0,maxWidth:440,margin:"0 auto"}}>
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&query.trim()&&onExplore(query.trim())}
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
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuided, setIsGuided] = useState(false);

  // ============================================================
  // Check URL for shared constellation on mount
  // ============================================================
  useEffect(() => {
    const path = window.location.pathname;
    const shareMatch = path.match(/^\/c\/([a-z0-9]+)$/i);

    if (shareMatch) {
      const shareId = shareMatch[1];
      loadSharedConstellation(shareId);
    }
  }, []);

  // ============================================================
  // Load shared constellation from database
  // ============================================================
  const loadSharedConstellation = async (shareId) => {
    setLoading(true);
    setError(null);
    setView("loading");

    try {
      const result = await fetchSharedConstellation(shareId);
      setData(result);
      setView("constellation");
      // Update URL without page reload
      window.history.replaceState({}, '', `/c/${shareId}`);
    } catch (err) {
      console.error('Failed to load shared constellation:', err);
      setError(err.message || 'Failed to load constellation. The link may be invalid.');
      setView("landing");
      // Clear invalid share URL
      window.history.replaceState({}, '', '/');
    }

    setLoading(false);
  };

  // ============================================================
  // Perform new search (title or guided)
  // ============================================================
  const doSearch = async (prompt, searchType = 'title') => {
    setLoading(true);
    setError(null);
    setIsRateLimited(false);
    setLoadMsg("Mapping thematic connections");
    setView("loading");

    try {
      const result = await fetchConstellation(prompt, searchType);
      setData(result);
      setSearchesRemaining(result.searchesRemaining);
      setView("constellation");

      // Update URL to share URL if shareId is present
      if (result.shareId) {
        window.history.pushState({}, '', `/c/${result.shareId}`);
      }
    } catch (err) {
      console.error(err);

      // Handle rate limiting (429)
      if (err.status === 429) {
        setIsRateLimited(true);
        setError(
          err.data?.error ||
          "You've used all 5 free searches today. Come back tomorrow for more discoveries!"
        );
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
    setSearchesRemaining(null);
    // Clear share URL when going back
    window.history.pushState({}, '', '/');
  };

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh"}}>
      <FilamentBG intensity={view==="constellation"?0.3:0.7} />
      {view==="loading" && <LoadingView searchQuery={searchQuery} isGuided={isGuided} />}
      {view==="constellation" && data && (
        <ConstellationView
          data={data}
          onBack={handleBack}
          searchesRemaining={searchesRemaining}
        />
      )}
      {view==="landing" && <Landing onExplore={handleExplore} onGuide={handleGuide} />}
      {error && view==="landing" && (
        <div style={{
          position:"fixed",
          bottom:24,
          left:"50%",
          transform:"translateX(-50%)",
          background: isRateLimited ? "#FFD93D22" : "#FF6B6B22",
          border: `1px solid ${isRateLimited ? "#FFD93D44" : "#FF6B6B44"}`,
          borderRadius:10,
          padding:"12px 24px",
          color: isRateLimited ? "#FFD93D" : "#FF6B6B",
          fontSize:13,
          zIndex:10,
          maxWidth:"90%",
          textAlign:"center",
          lineHeight:1.5
        }}>
          {error}
        </div>
      )}
    </div>
  );
}