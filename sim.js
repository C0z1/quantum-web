// ── Quantum Simulator v2 ──────────────────────────────────────────

const SYNDROME_MAP = {
  '-1':'000000','0':'001001','1':'010010','2':'011011',
  '3':'001110','4':'010101','5':'011110','6':'001111',
};
const SYNDROME_DESC = {
  es:{'000000':'Sin error','001001':'d[0]','010010':'d[1]','011011':'d[2]',
      '001110':'d[3]','010101':'d[4]','011110':'d[5]','001111':'d[6]'},
  en:{'000000':'No error','001001':'d[0]','010010':'d[1]','011011':'d[2]',
      '001110':'d[3]','010101':'d[4]','011110':'d[5]','001111':'d[6]'},
};
function syndromeDesc(syn){ return (SYNDROME_DESC[lang]||SYNDROME_DESC.es)[syn]||syn; }

function noise(v,spread){ return Math.max(0,v+(Math.random()-.5)*2*spread); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function groverIters(n){ return Math.max(1,Math.floor(Math.PI/4*Math.sqrt(Math.pow(2,n)))); }

// Returns per-iteration amplitude snapshots for animation
function simGroverFull(n, target, shots){
  const N = Math.pow(2,n);
  const iters = groverIters(n);
  const theta = Math.asin(1/Math.sqrt(N));
  const snapshots = [];   // [{state: pct}, ...]

  // Build state list (cap at 32 for display)
  const displayN = Math.min(N, 32);
  const states = Array.from({length:displayN},(_,i)=>i.toString(2).padStart(n,'0'));
  if (!states.includes(target)) states[states.length-1] = target;

  for(let k=0; k<=iters; k++){
    const angle = (2*k+1)*theta;
    const tgt = Math.pow(Math.sin(angle),2);
    const other = (1-tgt)/(N-1);
    const snap = {};
    states.forEach(s => snap[s] = s===target ? tgt : other);
    snapshots.push(snap);
  }

  // Final counts with shot noise
  const finalProb = snapshots[iters];
  const counts = {};
  let rem = shots;
  states.forEach((s,i) => {
    if(i===states.length-1){ counts[s]=Math.max(0,rem); return; }
    const c = Math.round(noise(finalProb[s]*shots, shots*.015));
    counts[s]=c; rem-=c;
  });
  if(!counts[target]) counts[target]=0;
  counts[target] = Math.max(0, counts[target]);

  const targetCount = counts[target];
  return {
    counts, snapshots, iters, N,
    targetProb: (targetCount/shots*100).toFixed(1),
    targetCount,
    speedup: Math.round(N/iters),
    shots, target, n,
  };
}

function simTeleport(state, theta_deg, shots){
  let p0,p1;
  if(state==='0'){p0=1;p1=0;}
  else if(state==='1'){p0=0;p1=1;}
  else if(state==='plus'||state==='minus'){p0=.5;p1=.5;}
  else{ const t=theta_deg*Math.PI/180; p0=Math.pow(Math.cos(t/2),2); p1=1-p0; }

  const bob0=Math.round(noise(p0*shots,shots*.025));
  const bob1=shots-bob0;

  const rawCounts={};
  ['000','001','010','011','100','101','110','111'].forEach(s=>{
    const bRaw=parseInt(s[0]),a1=parseInt(s[1]);
    const bCorr=a1?1-bRaw:bRaw;
    const exp=bCorr===0?p0:p1;
    rawCounts[s]=Math.max(0,Math.round(noise(exp*shots*.25,shots*.02)));
  });
  const tot=Object.values(rawCounts).reduce((a,b)=>a+b,1);
  const sc=shots/tot;
  Object.keys(rawCounts).forEach(k=>rawCounts[k]=Math.round(rawCounts[k]*sc));

  const stateLabel={'0':'|0⟩','1':'|1⟩','plus':'|+⟩','minus':'|−⟩','custom':`θ=${theta_deg}°`}[state];
  return {rawCounts,bobCorrected:{'0':bob0,'1':bob1},p0,p1,stateLabel,shots};
}

function simSteane(errorQubit,shots){
  const syndrome=SYNDROME_MAP[String(errorQubit)]||'000000';
  const mainCount=Math.round(noise(shots,shots*.015));
  const syndromeCounts={[syndrome]:mainCount};
  if(mainCount<shots) syndromeCounts['000000']=(syndromeCounts['000000']||0)+(shots-mainCount);
  const logCorrect=Math.round(noise(shots*.99,shots*.008));
  return {syndromeCounts,logicalResult:{'0':logCorrect,'1':shots-logCorrect},syndrome,errorQubit,shots};
}

// ── CIRCUIT SVG (animated-ready, gate IDs) ───────────────────────

function groverCircuitSVG(n, target, highlightStep=-1){
  const W=Math.min(n,5);
  const H=W*44+70;
  const wy=i=>36+i*44;
  let s=`<svg id="gcircuit" viewBox="0 0 600 ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#080b16;border-radius:10px;display:block">`;
  // wires
  for(let i=0;i<W;i++){
    s+=`<line x1="46" y1="${wy(i)}" x2="580" y2="${wy(i)}" stroke="#1e2650" stroke-width="1.2"/>`;
    s+=`<text x="40" y="${wy(i)+4}" text-anchor="end" font-size="11" fill="#5a6490" font-family="monospace">q${i}</text>`;
  }
  // Step highlights
  const steps=[
    {x:70,w:32,label:'H',color:'#4d80ff',bg:'#0d1e40'},
    {x:160,w:90,label:'Oráculo',color:'#f5c542',bg:'rgba(245,197,66,.08)',box:true},
    {x:280,w:200,label:'Difusión',color:'#36e8a0',bg:'rgba(54,232,160,.06)',box:true},
    {x:505,w:32,label:'M',color:'#a56bff',bg:'#150d28'},
  ];
  steps.forEach((st,si)=>{
    const active=highlightStep===si;
    if(st.box){
      s+=`<rect x="${st.x-10}" y="12" width="${st.w}" height="${W*44}" rx="6"
        fill="${active?st.bg.replace('08','18').replace('06','14'):st.bg}"
        stroke="${st.color}" stroke-width="${active?1.5:.6}" stroke-dasharray="${active?'none':'4,3'}"
        style="transition:all .4s"/>`;
      s+=`<text x="${st.x+st.w/2-10}" y="${W*22+10}" text-anchor="middle" font-size="10"
        fill="${st.color}" font-family="sans-serif">${st.label}</text>`;
    }
    if(!st.box){
      for(let i=0;i<W;i++){
        const y=wy(i),gw=28,gh=22;
        s+=`<rect x="${st.x-gw/2}" y="${y-gh/2}" width="${gw}" height="${gh}" rx="4"
          fill="${active?st.bg.replace('0d','1a').replace('15','2a'):st.bg}"
          stroke="${active?st.color:st.color+'99'}" stroke-width="${active?1.2:.7}"
          style="transition:all .3s"/>`;
        s+=`<text x="${st.x}" y="${y+4}" text-anchor="middle" font-size="11"
          fill="${active?'#fff':st.color}" font-family="monospace">${st.label}</text>`;
      }
    }
  });
  // CZ in oracle (symbolic)
  if(W>=2){
    s+=`<circle cx="180" cy="${wy(0)}" r="4" fill="#f5c542"/>`;
    s+=`<line x1="180" y1="${wy(0)}" x2="180" y2="${wy(W-1)}" stroke="#f5c542" stroke-width="1.2"/>`;
    s+=`<circle cx="180" cy="${wy(W-1)}" r="8" fill="none" stroke="#f5c542" stroke-width="1.2"/>`;
  }
  // Target label
  s+=`<text x="300" y="${H-6}" text-anchor="middle" font-size="9" fill="#3a4580" font-family="monospace">objetivo |${target}⟩${n>5?' (mostrando 5/'+n+'q)':''}</text>`;
  s+='</svg>';
  return s;
}

function teleportCircuitSVG(highlightStep=-1){
  const wy=[45,95,145];
  const H=190;
  let s=`<svg viewBox="0 0 640 ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#080b16;border-radius:10px;display:block">`;
  const labels=['q₀  msg','q₁  Alice','q₂  Bob'];
  const cols=['#44cc88','#4488ff','#ff8844'];
  wy.forEach((y,i)=>{
    s+=`<line x1="58" y1="${y}" x2="620" y2="${y}" stroke="#1e2650" stroke-width="1.2"/>`;
    s+=`<text x="52" y="${y+4}" text-anchor="end" font-size="10" fill="${cols[i]}" font-family="monospace">${labels[i]}</text>`;
  });

  const gate=(x,wi,lbl,fill,stroke,hl)=>{
    const gw=lbl.length>1?32:26,gh=22,y=wy[wi]-gh/2;
    s+=`<rect x="${x-gw/2}" y="${y}" width="${gw}" height="${gh}" rx="4"
      fill="${hl?fill.replace('1a','2a').replace('0d','1a'):fill}"
      stroke="${hl?stroke:''+stroke+'99'}" stroke-width="${hl?1.3:.7}"/>`;
    s+=`<text x="${x}" y="${y+gh/2+4}" text-anchor="middle" font-size="10"
      fill="${hl?'#fff':stroke}" font-family="monospace">${lbl}</text>`;
  };
  const cnot=(x,c,t,col,hl)=>{
    s+=`<line x1="${x}" y1="${wy[c]}" x2="${x}" y2="${wy[t]}" stroke="${col}" stroke-width="${hl?1.5:1}"/>`;
    s+=`<circle cx="${x}" cy="${wy[c]}" r="${hl?5:4}" fill="${col}"/>`;
    s+=`<circle cx="${x}" cy="${wy[t]}" r="9" fill="none" stroke="${col}" stroke-width="${hl?1.5:1.2}"/>`;
    s+=`<line x1="${x}" y1="${wy[t]-9}" x2="${x}" y2="${wy[t]+9}" stroke="${col}" stroke-width="${hl?1.3:1}"/>`;
    s+=`<line x1="${x-9}" y1="${wy[t]}" x2="${x+9}" y2="${wy[t]}" stroke="${col}" stroke-width="${hl?1.3:1}"/>`;
  };

  const hl=highlightStep;
  gate(85,0,'H','#0d2a1e','#44cc88',hl===0);
  gate(155,1,'H','#0d1e38','#4488ff',hl===1);
  cnot(215,1,2,'#4488ff',hl===1);
  cnot(285,0,1,'#cc8800',hl===2);
  gate(345,0,'H','#0d1e38','#4488ff',hl===2);
  gate(405,0,'📊','#120d28','#f05454',hl===3);
  gate(460,1,'📊','#120d28','#f05454',hl===3);
  // Classical channel dashes
  s+=`<line x1="430" y1="${wy[1]}" x2="530" y2="${wy[2]}" stroke="#cc8800" stroke-width="1"
    stroke-dasharray="4,3" opacity="${hl===3?.9:.3}"/>`;
  gate(530,2,'X?','#1a0d10','#ff8844',hl===4);
  gate(580,2,'Z?','#100d1a','#a56bff',hl===4);

  // Step labels
  [['Prep msg',85,cols[0]],['Par Bell',185,cols[1]],['Alice ops',315,'#cc8800'],
   ['Medir',432,'#f05454'],['Bob',555,cols[2]]].forEach(([lbl,x,c])=>{
    s+=`<text x="${x}" y="${H-8}" text-anchor="middle" font-size="9" fill="${c}" font-family="sans-serif">${lbl}</text>`;
  });
  s+='</svg>';
  return s;
}

function steaneCircuitSVG(eq){
  const H=130;
  let s=`<svg viewBox="0 0 660 ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#080b16;border-radius:10px;display:block">`;
  s+=`<line x1="10" y1="40" x2="650" y2="40" stroke="#1e2650" stroke-width="1.2"/>`;
  s+=`<line x1="10" y1="85" x2="650" y2="85" stroke="#0d2a1e" stroke-width="1.2"/>`;
  s+=`<text x="4" y="44" text-anchor="end" font-size="9" fill="#5a6490" font-family="monospace">d[0..6]</text>`;
  s+=`<text x="4" y="89" text-anchor="end" font-size="9" fill="#36a87a" font-family="monospace">a[0..5]</text>`;
  const bx=(x,y,w,h,lbl,fill,stroke)=>{
    s+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width=".9"/>`;
    s+=`<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="10" fill="${stroke}" font-family="monospace">${lbl}</text>`;
  };
  bx(18,26,70,28,'Encode','#080f20','#4d80ff');
  const ec=eq>=0?'#f05454':'#36e8a0';
  const el=eq>=0?`X d[${eq}]`:'No err';
  bx(104,26,75,28,el,eq>=0?'#1a0808':'#081a10',ec);
  bx(196,26,85,64,'Síndrome','#100d1a','#a56bff');
  bx(298,26,62,28,'Medir','#100d1a','#a56bff');
  bx(298,70,62,28,'Medir','#081a10','#36e8a0');
  bx(378,26,80,28,'Corregir','#081a10','#36e8a0');
  bx(476,26,65,28,'Medir q_L','#120f08','#f5c542');
  s+=`<line x1="358" y1="40" x2="378" y2="40" stroke="#36e8a0" stroke-width=".9" stroke-dasharray="3,2"/>`;
  s+=`<line x1="458" y1="40" x2="476" y2="40" stroke="#f5c542" stroke-width=".9"/>`;
  s+=`<text x="330" y="${H-6}" text-anchor="middle" font-size="9" fill="#3a4580" font-family="sans-serif">13 qubits · 1024 shots · Qiskit AerSimulator</text>`;
  s+='</svg>';
  return s;
}
