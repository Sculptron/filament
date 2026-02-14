import { useState, useEffect, useRef, useCallback } from "react";

const TCOLORS = ["#4ECDC4","#C77DFF","#FF6B6B","#4D96FF","#6BCB77","#FFD93D","#FF8C42","#E0AAFF","#00B4D8","#FF477E"];

const GUIDE_STEPS = [
  { q:"What are you drawn to tonight?", opts:[
    { label:"Ancient things stirring beneath the surface", icon:"🌊", tags:"folklore, mythology, ancient evil, deep history" },
    { label:"The vast and unknowable", icon:"✦", tags:"cosmic, existential, alien, transcendent, incomprehensible" },
    { label:"Human endurance against impossible odds", icon:"🔥", tags:"survival, resilience, grit, endurance, against all odds" },
    { label:"Creeping dread that never lets go", icon:"🌑", tags:"slow-burn horror, psychological tension, atmospheric dread, unease" },
  ]},
  { q:"How do you want to feel when the credits roll?", opts:[
    { label:"Haunted — still thinking about it at 3 AM", icon:"👁", tags:"lingering unease, thought-provoking, disturbing, unforgettable" },
    { label:"Exhilarated — like I survived something", icon:"⚡", tags:"adrenaline, thrilling, intense, heart-pounding, cathartic" },
    { label:"Awed — small in the best possible way", icon:"∞", tags:"wonder, sublime, vast, meditative, beautiful" },
    { label:"Unsettled — the world feels different now", icon:"◐", tags:"perspective-shifting, eerie, reality-bending, uncanny" },
  ]},
  { q:"Pick a setting that calls to you.", opts:[
    { label:"Frozen seas and wooden ships", icon:"⛵", tags:"maritime, arctic, age of sail, naval, ocean expedition" },
    { label:"Dense forest where the map stops", icon:"🌲", tags:"wilderness, forest, remote, primal nature, uncharted" },
    { label:"Deep space or deep ocean", icon:"🪐", tags:"space, underwater, deep sea, isolation, void, abyss" },
    { label:"Somewhere that shouldn't exist", icon:"◇", tags:"surreal, liminal, otherworldly, dream-like, impossible architecture" },
  ]}
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

function LoadingView() {
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
      <div style={{ textAlign:"center", maxWidth: 360 }}>
        <div style={{ width:48, height:48, border:"2px solid #222", borderTopColor:"#C77DFF", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 28px" }} />
        <p style={{
          color:"#999", fontSize:14, fontWeight:300, letterSpacing:0.5, minHeight:24,
          opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.3s ease",
        }}>
          {LOADING_PHRASES[idx]}{dots}
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
  const [selected, setSelected] = useState(null);
  const [activeTheme, setActiveTheme] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [links, setLinks] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const nodesRef = useRef([]);
  const animRef = useRef(null);
  const dragRef = useRef(null);
  const dragStartRef = useRef(null);
  const offRef = useRef({x:0,y:0});
  const [dims, setDims] = useState({w:800,h:520});

  const themeMap = {};
  const themeColors = {};
  data.themes.forEach((t,i) => { themeMap[t.id]=t.name; themeColors[t.id]=TCOLORS[i%TCOLORS.length]; });

  useEffect(() => {
    const w=Math.min(window.innerWidth-32,900), h=520;
    setDims({w,h});
    const cx=w/2, cy=h/2;
    const init = data.movies.map((m,i) => {
      const a=(i/data.movies.length)*Math.PI*2+(Math.random()-.5)*.3;
      const r = i===0 ? 0 : 90+Math.random()*140;
      return {...m, x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r, vx:0, vy:0, radius:16+m.themes.length*3};
    });

    const lnks=[];
    for(let i=0;i<data.movies.length;i++) for(let j=i+1;j<data.movies.length;j++){
      const shared=data.movies[i].themes.filter(t=>data.movies[j].themes.includes(t));
      if(shared.length>=1) lnks.push({source:data.movies[i].id,target:data.movies[j].id,themes:shared,strength:shared.length});
    }
    setLinks(lnks);
    nodesRef.current=init;
    setNodes([...init]);
  },[data]);

  useEffect(()=>{
    const tick=()=>{
      const ns=nodesRef.current,cx=dims.w/2,cy=dims.h/2;
      for(let n of ns){n.vx*=0.85;n.vy*=0.85;const dx=cx-n.x,dy=cy-n.y,d=Math.sqrt(dx*dx+dy*dy)||1;n.vx+=dx/d*0.12;n.vy+=dy/d*0.12;}
      for(let i=0;i<ns.length;i++) for(let j=i+1;j<ns.length;j++){const dx=ns[j].x-ns[i].x,dy=ns[j].y-ns[i].y,d=Math.sqrt(dx*dx+dy*dy)||1,mn=ns[i].radius+ns[j].radius+55;if(d<mn){const f=(mn-d)/d*0.3;ns[i].vx-=dx*f;ns[i].vy-=dy*f;ns[j].vx+=dx*f;ns[j].vy+=dy*f;}}
      for(let l of links){const a=ns.find(n=>n.id===l.source),b=ns.find(n=>n.id===l.target);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1,t=110+(4-l.strength)*25,f=(d-t)/d*0.008;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;}
      for(let n of ns){if(dragRef.current?.id===n.id)continue;n.x+=n.vx;n.y+=n.vy;n.x=Math.max(n.radius,Math.min(dims.w-n.radius,n.x));n.y=Math.max(n.radius,Math.min(dims.h-n.radius,n.y));}
      setNodes([...ns]);animRef.current=requestAnimationFrame(tick);
    };
    if(links.length>0){animRef.current=requestAnimationFrame(tick);}
    return()=>cancelAnimationFrame(animRef.current);
  },[dims,links]);

  const gp=useCallback(id=>{const n=nodesRef.current.find(n=>n.id===id);return n?{x:n.x,y:n.y}:{x:0,y:0};},[]);
  const isLinked=nid=>selected&&links.some(l=>(l.source===selected.id&&l.target===nid)||(l.target===selected.id&&l.source===nid));
  const inTheme=n=>!activeTheme||n.themes.includes(activeTheme);
  const nOp=n=>{if(activeTheme&&!inTheme(n))return 0.08;if(selected&&n.id!==selected.id&&!isLinked(n.id))return 0.2;return 1;};
  const lOp=l=>{if(activeTheme&&!l.themes.includes(activeTheme))return 0.02;if(selected&&l.source!==selected.id&&l.target!==selected.id)return 0.04;return 0.45;};
  const lColor=l=>{const t=activeTheme&&l.themes.includes(activeTheme)?activeTheme:l.themes[0];return themeColors[t]||"#666";};

  const didDragRef = useRef(false);

  const onPD=(e,n)=>{e.stopPropagation();e.preventDefault();dragRef.current={id:n.id};dragStartRef.current={x:e.clientX,y:e.clientY};didDragRef.current=false;const r=e.currentTarget.closest('svg').getBoundingClientRect();offRef.current={x:e.clientX-r.left-n.x,y:e.clientY-r.top-n.y};
    const moveFn=ev=>{if(!dragRef.current)return;const dx=ev.clientX-dragStartRef.current.x,dy=ev.clientY-dragStartRef.current.y;if(Math.abs(dx)+Math.abs(dy)>5)didDragRef.current=true;const svg=document.querySelector('#fil-svg');if(!svg)return;const r=svg.getBoundingClientRect(),nd=nodesRef.current.find(x=>x.id===dragRef.current.id);if(nd){nd.x=ev.clientX-r.left-offRef.current.x;nd.y=ev.clientY-r.top-offRef.current.y;nd.vx=0;nd.vy=0;}};
    const upFn=()=>{dragRef.current=null;dragStartRef.current=null;window.removeEventListener('pointermove',moveFn);window.removeEventListener('pointerup',upFn);};
    window.addEventListener('pointermove',moveFn);window.addEventListener('pointerup',upFn);
  };

  const onNodeClick=(e,movie)=>{e.stopPropagation();if(didDragRef.current)return;setSelected(prev=>prev?.id===movie.id?null:movie);};

  const handleShare = async () => {
    if (!data.shareId) return;

    const shareUrl = `${window.location.origin}/c/${data.shareId}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      } else {
        // Fallback for older browsers
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

  return (
    <div style={{background:"transparent",minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e0e0e0",position:"relative",zIndex:1}}>
      <div style={{padding:"16px 20px 6px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"#0a0a0f99",backdropFilter:"blur(8px)",border:"1px solid #333",color:"#888",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",letterSpacing:0.5}}>← Back</button>
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
        </div>
      </div>
      <div style={{padding:"6px 20px 10px",display:"flex",flexWrap:"wrap",gap:6}}>
        {data.themes.map(t=>(
          <button key={t.id} onClick={()=>setActiveTheme(activeTheme===t.id?null:t.id)}
            style={{background:activeTheme===t.id?(themeColors[t.id]||"#666")+"22":"#0a0a0f88",backdropFilter:"blur(6px)",border:`1px solid ${activeTheme===t.id?themeColors[t.id]||"#666":"#333"}`,color:activeTheme===t.id?themeColors[t.id]||"#666":"#666",borderRadius:20,padding:"3px 12px",fontSize:10,cursor:"pointer",transition:"all 0.3s",letterSpacing:0.5}}>
            <span style={{display:"inline-block",width:5,height:5,borderRadius:3,background:themeColors[t.id]||"#666",marginRight:5,opacity:activeTheme===t.id?1:0.4}}/>
            {t.name}
          </button>
        ))}
      </div>
      <div style={{position:"relative"}}>
        <svg id="fil-svg" width={dims.w} height={dims.h} style={{cursor:"grab",display:"block",margin:"0 auto"}} onClick={()=>setSelected(null)}>
          <defs>{data.themes.map(t=>(<radialGradient key={t.id} id={`g-${t.id}`}><stop offset="0%" stopColor={themeColors[t.id]||"#666"} stopOpacity="0.8"/><stop offset="100%" stopColor={themeColors[t.id]||"#666"} stopOpacity="0"/></radialGradient>))}</defs>
          {links.map((l,i)=>{const a=gp(l.source),b=gp(l.target);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lColor(l)} strokeWidth={l.strength*0.7} opacity={lOp(l)} style={{transition:"opacity 0.4s"}}/>;
          })}
          {nodes.map(n=>{
            const op=nOp(n),isSel=selected?.id===n.id,isH=hovered===n.id;
            const pt=activeTheme&&n.themes.includes(activeTheme)?activeTheme:n.themes[0];
            const c=themeColors[pt]||"#666";
            const isFirst=n.id===data.movies[0]?.id;
            return (
              <g key={n.id} style={{cursor:"pointer",transition:"opacity 0.4s"}} opacity={op}
                onPointerDown={e=>onPD(e,n)} onClick={e=>onNodeClick(e,n)} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)}>
                <circle cx={n.x} cy={n.y} r={n.radius*2.2} fill={`url(#g-${pt})`} opacity={isSel?0.45:isH?0.3:isFirst?0.25:0.07}/>
                <circle cx={n.x} cy={n.y} r={n.radius} fill={isSel?c+"33":"#0e0e18"} stroke={c} strokeWidth={isSel||isFirst?2:1}/>
                <circle cx={n.x} cy={n.y} r={3} fill={c} opacity={0.9}/>
                <text x={n.x} y={n.y+n.radius+14} textAnchor="middle" fill={isSel||isH?"#fff":"#888"} fontSize={9.5} fontWeight={isSel?500:300} letterSpacing={0.4} style={{pointerEvents:"none"}}>{n.title}</text>
              </g>
            );
          })}
        </svg>
        {selected && (
          <div style={{position:"absolute",right:12,top:0,width:280,background:"#0e0e18dd",backdropFilter:"blur(20px)",border:"1px solid #222",borderRadius:12,padding:20,animation:"fdIn 0.3s ease",maxHeight:dims.h,overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <div><h2 style={{fontSize:16,fontWeight:400,margin:0,color:"#fff",lineHeight:1.3}}>{selected.title}</h2><p style={{fontSize:11,color:"#555",margin:"3px 0 0"}}>{selected.year} · {selected.type}</p></div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16,padding:4}}>×</button>
            </div>
            <p style={{fontSize:12,color:"#999",lineHeight:1.6,margin:"12px 0"}}>{selected.desc}</p>
            <div style={{background:"#151520",borderRadius:8,padding:12,marginBottom:14}}>
              <p style={{fontSize:10,color:"#555",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:1}}>The Vibe</p>
              <p style={{fontSize:12,color:"#bbb",margin:0,lineHeight:1.5,fontStyle:"italic"}}>{selected.vibe}</p>
            </div>
            <div><p style={{fontSize:10,color:"#555",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Threads</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {selected.themes.map(t=>(<span key={t} onClick={e=>{e.stopPropagation();setActiveTheme(activeTheme===t?null:t);}} style={{fontSize:10,color:themeColors[t]||"#666",border:`1px solid ${(themeColors[t]||"#666")}44`,borderRadius:12,padding:"2px 9px",cursor:"pointer",background:activeTheme===t?(themeColors[t]||"#666")+"22":"transparent"}}>{themeMap[t]||t}</span>))}
              </div>
            </div>
            <div style={{marginTop:12}}>
              <p style={{fontSize:10,color:"#555",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>Connected To</p>
              {links.filter(l=>(l.source===selected.id||l.target===selected.id)).map((l,i)=>{
                const oid=l.source===selected.id?l.target:l.source,o=data.movies.find(m=>m.id===oid);
                if(!o) return null;
                return (<div key={i} onClick={e=>{e.stopPropagation();setSelected(o);}} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",cursor:"pointer",borderBottom:"1px solid #1a1a2e"}}>
                  <span style={{fontSize:11,color:"#ccc"}}>{o.title}</span>
                  <span style={{fontSize:9,color:"#444",marginLeft:"auto"}}>{l.strength} thread{l.strength>1?"s":""}</span>
                </div>);
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fdIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}`}</style>
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

  const handleGuideSelect = (opt) => {
    const newSel = [...guideSel, opt.tags];
    setGuideSel(newSel);
    if (guideStep < GUIDE_STEPS.length-1) {
      setFadeIn(false);
      setTimeout(() => setGuideStep(guideStep+1), 300);
    } else {
      onGuide(newSel.join(". "));
    }
  };

  if (guideStep >= 0) {
    const step = GUIDE_STEPS[guideStep];
    return (
      <div style={{minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
        <div style={{position:"absolute",top:20,left:20}}>
          <button onClick={()=>{setGuideStep(-1);setGuideSel([]);}} style={{background:"#0a0a0f99",backdropFilter:"blur(8px)",border:"1px solid #333",color:"#666",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>← Back</button>
        </div>
        <div style={{position:"absolute",top:24,right:24,display:"flex",gap:6}}>
          {GUIDE_STEPS.map((_,i)=>(<div key={i} style={{width:28,height:3,borderRadius:2,background:i<=guideStep?"#C77DFF":"#222",transition:"background 0.4s"}}/>))}
        </div>
        <div style={{opacity:fadeIn?1:0,transform:fadeIn?"translateY(0)":"translateY(12px)",transition:"all 0.3s ease",textAlign:"center",maxWidth:520}}>
          <p style={{fontSize:14,color:"#555",margin:"0 0 8px",letterSpacing:1,textTransform:"uppercase"}}>Step {guideStep+1} of {GUIDE_STEPS.length}</p>
          <h2 style={{fontSize:26,fontWeight:300,color:"#fff",margin:"0 0 36px",lineHeight:1.4}}>{step.q}</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {step.opts.map((opt,i)=>(
              <button key={i} onClick={()=>handleGuideSelect(opt)}
                style={{background:"#0e0e18cc",backdropFilter:"blur(12px)",border:"1px solid #222",borderRadius:14,padding:"20px 18px",cursor:"pointer",textAlign:"left",transition:"all 0.25s",display:"flex",flexDirection:"column",gap:8}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#C77DFF55";e.currentTarget.style.background="#15151fdd";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#222";e.currentTarget.style.background="#0e0e18cc";}}>
                <span style={{fontSize:22}}>{opt.icon}</span>
                <span style={{fontSize:14,color:"#ccc",lineHeight:1.4,fontWeight:300}}>{opt.label}</span>
              </button>
            ))}
          </div>
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
    doSearch(
      `Analyze the movie/show "${query}" and find 8-12 thematically connected films and TV shows. Focus on deep thematic threads, not surface genre. Include a mix of well-known and hidden gems.`,
      'title'
    );
  };

  const handleGuide = (vibeDesc) => {
    doSearch(
      `A user described what they want to watch tonight through these preferences: ${vibeDesc}. Based on these moods and feelings, recommend 8-12 movies and TV shows that match, connected by thematic threads. Focus on hidden gems and immersive experiences.`,
      'guided'
    );
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
      {view==="loading" && <LoadingView />}
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