// ── UI v3 ─────────────────────────────────────────────────────────
let lang='es';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// ── i18n ──────────────────────────────────────────────────────────
function setLang(l){
  lang=l;
  document.querySelectorAll('[data-i]').forEach(el=>{
    const k=el.getAttribute('data-i');
    if(T[l]&&T[l][k]) el.textContent=T[l][k];
  });
  document.getElementById('nav-lang').textContent=l==='es'?'🇺🇸 EN':'🇲🇽 ES';
  document.getElementById('btn-es')?.classList.toggle('active',l==='es');
  document.getElementById('btn-en')?.classList.toggle('active',l==='en');
}
function toggleLang(){setLang(lang==='es'?'en':'es');}

// ── Bloch Sphere Canvas ───────────────────────────────────────────
function drawBloch(id,theta,phi,col='#4d7fff',label=''){
  const c=document.getElementById(id);if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,R=Math.min(W,H)/2-8;
  ctx.clearRect(0,0,W,H);
  // Sphere bg
  const g=ctx.createRadialGradient(cx-R*.3,cy-R*.25,R*.05,cx,cy,R);
  g.addColorStop(0,col+'22');g.addColorStop(1,'rgba(4,6,15,.7)');
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle=col+'33';ctx.lineWidth=1;ctx.stroke();
  // Equator
  ctx.beginPath();ctx.ellipse(cx,cy,R,R*.28,0,0,Math.PI*2);
  ctx.strokeStyle='rgba(80,120,255,.2)';ctx.lineWidth=.8;ctx.stroke();
  // Meridian
  ctx.beginPath();ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);
  ctx.strokeStyle='rgba(80,120,255,.15)';ctx.lineWidth=.8;ctx.stroke();
  // Vector
  const x=Math.sin(theta)*Math.cos(phi);
  const y=Math.cos(theta);
  const z=Math.sin(theta)*Math.sin(phi);
  const tx=cx+R*(x*.8-z*.12);
  const ty=cy-R*(y*.88);
  // shadow
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*x*.7,cy+R*.22);
  ctx.strokeStyle=col+'18';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);
  // shaft
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(tx,ty);
  ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();
  // head
  const ang=Math.atan2(ty-cy,tx-cx);
  ctx.beginPath();
  ctx.moveTo(tx,ty);
  ctx.lineTo(tx-11*Math.cos(ang-.42),ty-11*Math.sin(ang-.42));
  ctx.lineTo(tx-11*Math.cos(ang+.42),ty-11*Math.sin(ang+.42));
  ctx.closePath();ctx.fillStyle=col;ctx.fill();
  // poles
  ctx.fillStyle='rgba(200,215,255,.55)';ctx.font=`10px monospace`;ctx.textAlign='center';
  ctx.fillText('|0⟩',cx,cy-R-4);ctx.fillText('|1⟩',cx,cy+R+13);
  // label
  if(label){ctx.fillStyle=col;ctx.font='bold 11px monospace';ctx.fillText(label,tx+(tx>cx?9:-9),ty-8);}
}
function animBloch(id,t0,p0,t1,p1,col,lbl,dur=550){
  const s=performance.now();
  const tick=n=>{
    const pr=clamp((n-s)/dur,0,1),e=pr<.5?2*pr*pr:1-(2-2*pr)*(2-2*pr)/2;
    drawBloch(id,t0+(t1-t0)*e,p0+(p1-p0)*e,col,pr>.92?lbl:'');
    if(pr<1)requestAnimationFrame(tick);else drawBloch(id,t1,p1,col,lbl);
  };requestAnimationFrame(tick);
}

// ── Bar chart ─────────────────────────────────────────────────────
function renderBars(cid,counts,targetState,barCol,altCol){
  const el=document.getElementById(cid);if(!el)return;
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  el.innerHTML=sorted.map(([st,cnt])=>{
    const pct=(cnt/total*100).toFixed(1),isT=st===targetState;
    return`<div class="bar-row">
      <span class="bar-label${isT?' hi':''}">${'|'+st+'⟩'}${isT?' ★':''}</span>
      <div class="bar-track"><div class="bar-fill" data-w="${pct}" style="width:0%;background:${isT?barCol:(altCol||'#2a3870')}"></div></div>
      <span class="bar-pct${isT?' hi':''}">${pct}%</span>
    </div>`;
  }).join('');
  requestAnimationFrame(()=>el.querySelectorAll('.bar-fill').forEach(b=>{
    b.style.transition='width .7s cubic-bezier(.4,0,.2,1)';b.style.width=b.dataset.w+'%';
  }));
}

// ── GROVER ────────────────────────────────────────────────────────
function updateGroverMeta(){
  const n=parseInt(document.getElementById('g-qubits').value);
  document.getElementById('g-qubits-val').textContent=n;
  const N=Math.pow(2,n),iters=groverIters(n),sp=Math.round(N/iters);
  document.getElementById('g-N').textContent=N>=1e6?(N/1e6).toFixed(1)+'M':N.toLocaleString();
  document.getElementById('g-iters').textContent=iters.toLocaleString();
  document.getElementById('g-classic').textContent=N>=1e9?'~1B':N>=1e6?(N/1e6).toFixed(0)+'M':N.toLocaleString();
  document.getElementById('g-speedup').textContent=sp>=1000?(sp/1000).toFixed(1)+'k×':sp+'×';
  document.getElementById('g-space-hint').textContent=`${N.toLocaleString()} estados · 2^${n}`;
  const tgt=document.getElementById('g-target');
  if(tgt.value.length!==n) tgt.value='1'.repeat(n);
  validateTarget();
  // Refresh Bloch at step 0
  const s=GROVER_STEPS[0];
  drawBloch('g-bloch0',s.theta,s.phi,'#4d7fff',s.lbl);
  drawBloch('g-bloch1',s.theta,s.phi+.25,'#a56bff',s.lbl);
  document.getElementById('g-circuit-walk').innerHTML=groverCircuitSVG(n,document.getElementById('g-target').value,gWalkStep);
}
function validateTarget(){
  const n=parseInt(document.getElementById('g-qubits').value);
  const tgt=document.getElementById('g-target').value;
  const hint=document.getElementById('g-target-hint');
  const btn=document.getElementById('g-run-btn');
  const ok=tgt.length===n&&/^[01]+$/.test(tgt);
  hint.textContent=ok?'✓ válido':`✗ necesita ${n} bits (0 y 1)`;
  hint.style.color=ok?'var(--green)':'var(--red)';
  btn.disabled=!ok;
}

const GROVER_STEPS=[
  {label:'Estado inicial |0⟩',desc:'Los qubits comienzan en |0⟩. El vector apunta al polo norte de la esfera de Bloch.',theta:0,phi:0,lbl:'|0⟩',cs:0},
  {label:'Superposición — puerta H',desc:'La puerta Hadamard (H) lleva cada qubit al ecuador: |+⟩ = (|0⟩+|1⟩)/√2. Ahora todos los N estados existen simultáneamente con igual amplitud.',theta:Math.PI/2,phi:0,lbl:'|+⟩',cs:0},
  {label:'Oráculo — marca el objetivo',desc:'El oráculo invierte la fase del estado objetivo |target⟩ sin destruir la superposición. El vector gira en el espacio de fases — no perceptible visualmente, pero crucial.',theta:Math.PI/2,phi:Math.PI*.75,lbl:'⊖',cs:1},
  {label:'Difusión — amplifica amplitud',desc:'El operador de difusión (H-X-CZ-X-H) refleja el estado respecto a la media. La amplitud del objetivo crece; las demás se comprimen. Cada iteración aumenta la probabilidad.',theta:Math.PI*.18,phi:0,lbl:'↑',cs:2},
  {label:'Medición — el objetivo emerge',desc:'Al medir, el estado colapsa al objetivo con ~96-100% de probabilidad. Un ordenador clásico necesitaría hasta N intentos; Grover usa √N iteraciones.',theta:Math.PI,phi:0,lbl:'|1⟩',cs:3},
];
let gWalkStep=0;
function initGroverWalk(){
  gWalkStep=0;updateGroverWalkUI();
}
function gotoGroverStep(i){gWalkStep=i;updateGroverWalkUI();}
function groverWalkStep(d){gWalkStep=clamp(gWalkStep+d,0,GROVER_STEPS.length-1);updateGroverWalkUI();}
function updateGroverWalkUI(){
  const s=GROVER_STEPS[gWalkStep],prev=GROVER_STEPS[Math.max(0,gWalkStep-1)];
  document.getElementById('g-walk-label').textContent=s.label;
  document.getElementById('g-walk-desc').textContent=s.desc;
  animBloch('g-bloch0',prev.theta,prev.phi,s.theta,s.phi,'#4d7fff',s.lbl);
  animBloch('g-bloch1',prev.theta,prev.phi+.25,s.theta,s.phi+.25,'#a56bff',s.lbl);
  const n=parseInt(document.getElementById('g-qubits').value);
  const tgt=document.getElementById('g-target').value||'1'.repeat(n);
  document.getElementById('g-circuit-walk').innerHTML=groverCircuitSVG(n,tgt,s.cs);
  document.querySelectorAll('#g-steps-pills .wstep').forEach((b,i)=>{
    b.className='wstep'+(i===gWalkStep?' active':i<gWalkStep?' done':'');
  });
  document.getElementById('g-walk-prev').disabled=gWalkStep===0;
  document.getElementById('g-walk-next').disabled=gWalkStep===GROVER_STEPS.length-1;
}

async function runGrover(){
  const n=parseInt(document.getElementById('g-qubits').value);
  const target=document.getElementById('g-target').value;
  const shots=parseInt(document.getElementById('g-shots').value);
  const btn=document.getElementById('g-run-btn');
  btn.disabled=true;btn.classList.add('loading');btn.querySelector('.run-icon').textContent='⚛';

  for(let i=0;i<GROVER_STEPS.length;i++){
    gWalkStep=i;updateGroverWalkUI();
    await sleep(500);
  }
  await sleep(200);
  const r=simGroverFull(n,target,shots);
  document.getElementById('g-results').style.display='block';
  renderBars('g-bars',r.counts,target,'#f5c542','#1e2a60');
  document.getElementById('g-badge').textContent=`|${target}⟩ — ${r.targetProb}%`;
  document.getElementById('g-summary').innerHTML=
    `<strong>|${target}⟩</strong> → <strong>${r.targetCount}/${shots}</strong> shots (${r.targetProb}%) · ${r.iters} iter${r.iters>1?'s':''} cuánticas vs ${r.N.toLocaleString()} clásico → <strong style="color:var(--green)">${r.speedup}× speedup</strong>`;

  // Iter chart
  document.getElementById('g-iter-wrap').style.display='block';
  renderIterChart('g-iter-chart',r.snapshots,target,r.iters);

  btn.disabled=false;btn.classList.remove('loading');btn.querySelector('.run-icon').textContent='▶';
  document.getElementById('g-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function renderIterChart(cid,snapshots,target,finalIter){
  const el=document.getElementById(cid);if(!el)return;
  const W=el.offsetWidth||320,H=110;
  el.innerHTML=`<canvas width="${W}" height="${H}" style="width:100%;display:block" id="${cid}-c"></canvas>`;
  const c=document.getElementById(cid+'-c');if(!c)return;
  const ctx=c.getContext('2d');
  const probs=snapshots.map(s=>s[target]||0);
  const pad={l:38,r:12,t:10,b:24};
  ctx.fillStyle='transparent';ctx.fillRect(0,0,W,H);
  // grid
  [0,.5,1].forEach(v=>{
    const y=H-pad.b-(v)*(H-pad.t-pad.b);
    ctx.strokeStyle='rgba(80,120,255,.1)';ctx.lineWidth=.5;ctx.setLineDash([3,4]);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#3a4580';ctx.font='9px monospace';ctx.textAlign='right';
    ctx.fillText((v*100).toFixed(0)+'%',pad.l-3,y+3);
  });
  // optimal line
  const ox=pad.l+(finalIter/(probs.length-1||1))*(W-pad.l-pad.r);
  ctx.strokeStyle='rgba(245,197,66,.35)';ctx.lineWidth=1;ctx.setLineDash([2,3]);
  ctx.beginPath();ctx.moveTo(ox,pad.t);ctx.lineTo(ox,H-pad.b);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(245,197,66,.6)';ctx.font='8px sans-serif';ctx.textAlign='center';
  ctx.fillText('k='+finalIter,ox,pad.t+7);
  // line
  ctx.strokeStyle='#36e8a0';ctx.lineWidth=2;ctx.beginPath();
  probs.forEach((p,i)=>{
    const x=pad.l+(i/(probs.length-1||1))*(W-pad.l-pad.r),y=H-pad.b-p*(H-pad.t-pad.b);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });ctx.stroke();
  // dots
  probs.forEach((p,i)=>{
    const x=pad.l+(i/(probs.length-1||1))*(W-pad.l-pad.r),y=H-pad.b-p*(H-pad.t-pad.b);
    ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle=i===finalIter?'#f5c542':'#36e8a0';ctx.fill();
  });
  ctx.fillStyle='#3a4580';ctx.font='9px sans-serif';ctx.textAlign='center';
  ctx.fillText('Iteraciones →',W/2,H-4);
}

// ── TELEPORT ──────────────────────────────────────────────────────
const TELE_STEPS=[
  {label:'Mensaje en |+⟩',desc:'q₀ preparado en superposición 50/50. El vector verde apunta al ecuador. No puede copiarse (no-clonación).',t0:Math.PI/2,p0:0,t1:0,p1:0,t2:0,p2:0,lbl0:'|+⟩',cs:0},
  {label:'Par Bell compartido',desc:'H en q₁ + CNOT(q₁→q₂). Alice y Bob comparten un par entrelazado. El beam de luz los une instantáneamente.',t0:Math.PI/2,p0:0,t1:Math.PI/2,p1:.5,t2:Math.PI/2,p2:.5+Math.PI,lbl0:'|+⟩',cs:1},
  {label:'Operaciones de Alice',desc:'CNOT(q₀→q₁) + H(q₀). El mensaje se entrelaza con el par. Los 3 qubits forman un estado inseparable.',t0:Math.PI/3,p0:.8,t1:Math.PI*.55,p1:.5,t2:Math.PI/2,p2:.5+Math.PI,lbl0:'ent.',cs:2},
  {label:'Alice mide — mensaje destruido',desc:'Alice mide q₀ y q₁ → 2 bits clásicos. El estado de q₀ colapsa y es destruido para siempre. Los bits viajan por canal clásico.',t0:Math.PI,p0:0,t1:Math.PI*.4,p1:.2,t2:Math.PI/2,p2:.5+Math.PI,lbl0:'💥',cs:3},
  {label:'Bob reconstruye ✓',desc:'Bob aplica X (si bit₁=1) y Z (si bit₀=1) en q₂. Su qubit toma exactamente el estado original |+⟩. Teleportación completada.',t0:Math.PI,p0:0,t1:Math.PI*.4,p1:.2,t2:Math.PI/2,p2:0,lbl0:'💥',lbl2:'|+⟩✓',cs:4},
];
let tWalkStep=0;
function initTeleWalk(){
  tWalkStep=0;updateTeleWalkUI();
}
function gotoTeleStep(i){tWalkStep=i;updateTeleWalkUI();}
function teleWalkStep(d){tWalkStep=clamp(tWalkStep+d,0,TELE_STEPS.length-1);updateTeleWalkUI();}
function updateTeleWalkUI(){
  const s=TELE_STEPS[tWalkStep],ps=TELE_STEPS[Math.max(0,tWalkStep-1)];
  document.getElementById('t-walk-label').textContent=s.label;
  document.getElementById('t-walk-desc').textContent=s.desc;
  animBloch('t-bloch0',ps.t0,ps.p0,s.t0,s.p0,'#44cc88',s.lbl0||'');
  animBloch('t-bloch1',ps.t1,ps.p1,s.t1,s.p1,'#4488ff','');
  animBloch('t-bloch2',ps.t2,ps.p2,s.t2,s.p2,'#ff8844',s.lbl2||'');
  document.getElementById('t-circuit-walk').innerHTML=teleportCircuitSVG(s.cs);
  document.querySelectorAll('#t-steps-pills .wstep').forEach((b,i)=>{
    b.className='wstep'+(i===tWalkStep?' active':i<tWalkStep?' done':'');
  });
  document.getElementById('t-walk-prev').disabled=tWalkStep===0;
  document.getElementById('t-walk-next').disabled=tWalkStep===TELE_STEPS.length-1;
}
function onTStateChange(){
  document.getElementById('t-custom-row').style.display=
    document.getElementById('t-state').value==='custom'?'block':'none';
}
async function runTeleport(){
  const state=document.getElementById('t-state').value;
  const theta=parseFloat(document.getElementById('t-theta')?.value||90);
  const shots=parseInt(document.getElementById('t-shots').value);
  const btn=document.getElementById('t-run-btn');
  btn.disabled=true;btn.classList.add('loading');btn.querySelector('.run-icon').textContent='⚛';
  for(let i=0;i<TELE_STEPS.length;i++){tWalkStep=i;updateTeleWalkUI();await sleep(480);}
  const r=simTeleport(state,theta,shots);
  document.getElementById('t-results').style.display='block';
  renderBars('t-raw-bars',r.rawCounts,null,'#6875c8','#1a2050');
  renderBars('t-bob-bars',r.bobCorrected,r.p0>=r.p1?'0':'1','#36e8a0','#0d2a1a');
  const b0=(r.bobCorrected['0']/shots*100).toFixed(1),b1=(r.bobCorrected['1']/shots*100).toFixed(1);
  document.getElementById('t-summary').innerHTML=
    `Mensaje <strong>${r.stateLabel}</strong> → Bob: <strong>${b0}%|0⟩, ${b1}%|1⟩</strong>. ✓ Original destruido, solo 2 bits clásicos viajaron.`;
  btn.disabled=false;btn.classList.remove('loading');btn.querySelector('.run-icon').textContent='▶';
  document.getElementById('t-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── STEANE ────────────────────────────────────────────────────────
function initSteaneGrid(){
  const g=document.getElementById('s-qubit-grid');
  const a=document.getElementById('s-ancilla-row');
  if(g) g.innerHTML=Array.from({length:7},(_,i)=>`<div class="sq" id="sq-${i}" title="d[${i}]">d[${i}]</div>`).join('');
  if(a) a.innerHTML=Array.from({length:6},(_,i)=>`<div class="anc" id="anc-${i}">${i}</div>`).join('');
  document.getElementById('s-circuit').innerHTML=steaneCircuitSVG(3);
}
function updateSteaneLabel(){
  const eq=parseInt(document.getElementById('s-errq').value);
  document.getElementById('s-errq-val').textContent=eq===-1?'−1':`d[${eq}]`;
  const hint=document.getElementById('s-errq-hint');
  hint.textContent=eq===-1?'✓ Ejecución limpia — sin error':`⚡ Error X inyectado en d[${eq}]`;
  hint.style.color=eq===-1?'var(--green)':'var(--red)';
  // Update visual grid
  for(let i=0;i<7;i++){
    const el=document.getElementById('sq-'+i);if(!el)return;
    el.className='sq'+(i===eq?' error':'');
  }
  document.getElementById('s-circuit').innerHTML=steaneCircuitSVG(eq);
}
async function runSteane(){
  const eq=parseInt(document.getElementById('s-errq').value);
  const shots=parseInt(document.getElementById('s-shots').value);
  const btn=document.getElementById('s-run-btn');
  btn.disabled=true;btn.classList.add('loading');btn.querySelector('.run-icon').textContent='⚛';

  // Animate ancillas lighting up
  for(let i=0;i<6;i++){
    await sleep(140);
    const a=document.getElementById('anc-'+i);
    if(a) a.classList.add('active');
  }
  await sleep(400);

  const r=simSteane(eq,shots);
  const top=Object.entries(r.syndromeCounts).sort((a,b)=>b[1]-a[1])[0];
  const bits=top[0].split('');

  // Remove ancilla highlights, replace with syndrome
  for(let i=0;i<6;i++){
    const a=document.getElementById('anc-'+i);
    if(a){a.classList.remove('active');if(bits[i]==='1')a.classList.add('active');}
  }

  // Corrected qubit flashes green
  if(eq>=0){
    await sleep(300);
    const el=document.getElementById('sq-'+eq);
    if(el){ el.className='sq corrected'; }
  }

  document.getElementById('s-results').style.display='block';

  // Syndrome bits
  document.getElementById('s-syn-bits').innerHTML=bits.map((b,i)=>
    `<div class="syn-bit ${b==='1'?'on':'off'}">${b}</div>`).join('');
  document.getElementById('s-syn-label').innerHTML=
    `<strong style="color:${top[0]==='000000'?'var(--green)':'var(--amber)'}">${top[0]}</strong>
     — ${syndromeDesc(top[0])} &nbsp;·&nbsp; ${top[1].toLocaleString()} shots`;

  renderBars('s-logical-bars',r.logicalResult,'0','#36e8a0','#0d2a1a');

  document.getElementById('s-summary').innerHTML=eq===-1
    ?'✓ Sin error. Síndrome <code>000000</code>. Qubit lógico |0_L⟩ intacto.'
    :`Error <strong>d[${eq}]</strong> detectado por síndrome <code>${r.syndrome}</code> → corrección X → qubit lógico <strong style="color:var(--green)">sobrevivió</strong>.`;

  // Map
  const sm={0:'001001',1:'010010',2:'011011',3:'001110',4:'010101',5:'011110',6:'001111'};
  document.getElementById('s-syn-map').innerHTML=Object.entries(sm).map(([q,syn])=>
    `<div style="background:var(--s2);border:1px solid ${parseInt(q)===eq?'var(--amber)':'var(--border)'};border-radius:8px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;font-size:11px">
      <span style="color:var(--dim)">d[${q}]</span>
      <code style="font-family:var(--mono);color:${parseInt(q)===eq?'var(--amber)':'var(--dim)'}">${syn}</code>
    </div>`).join('');

  btn.disabled=false;btn.classList.remove('loading');btn.querySelector('.run-icon').textContent='▶';
  document.getElementById('s-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── SPEEDUP ───────────────────────────────────────────────────────
const SP_DATA=[
  {l:'2q',N:4,it:1},{l:'4q',N:16,it:3},{l:'8q',N:256,it:12},
  {l:'12q',N:4096,it:50},{l:'16q',N:65536,it:201},{l:'20q',N:1048576,it:804},{l:'30q',N:1073741824,it:25736},
];
function buildSpeedupTable(){
  const tb=document.getElementById('speedup-tbody');if(!tb)return;
  tb.innerHTML=SP_DATA.map(d=>{
    const sp=Math.round(d.N/d.it);
    const Nf=d.N>=1e9?'~1B':d.N>=1e6?(d.N/1e6).toFixed(1)+'M':d.N.toLocaleString();
    const spf=sp>=1e6?(sp/1e6).toFixed(0)+'M×':sp>=1000?(sp/1000).toFixed(1)+'k×':sp+'×';
    return`<tr><td>Grover ${d.l}</td><td>${Nf}</td><td>${d.N.toLocaleString()}</td>
      <td>${d.it.toLocaleString()}</td><td class="ac">${spf}</td></tr>`;
  }).join('')+
  `<tr><td>Teleportación</td><td>—</td><td style="color:var(--red)">imposible</td><td>3q</td><td class="in">∞</td></tr>
   <tr><td>Steane [7,1,3]</td><td>—</td><td style="color:var(--dim)">sin equiv.</td><td>13q</td><td class="in">∞</td></tr>`;
}
function drawSpeedupChart(){
  const canvas=document.getElementById('speedup-canvas');if(!canvas)return;
  const W=canvas.width=canvas.parentElement.clientWidth-40||300,H=canvas.height=220;
  const ctx=canvas.getContext('2d');
  const pad={l:52,r:12,t:16,b:36};
  const logMax=10.1;
  const xp=i=>pad.l+(i/(SP_DATA.length-1))*(W-pad.l-pad.r);
  const yp=v=>H-pad.b-(Math.log10(Math.max(1,v))/logMax)*(H-pad.t-pad.b);
  ctx.fillStyle='transparent';ctx.fillRect(0,0,W,H);
  for(let e=0;e<=9;e++){
    const y=yp(Math.pow(10,e));if(y<pad.t||y>H-pad.b)continue;
    ctx.strokeStyle='rgba(80,120,255,.08)';ctx.lineWidth=1;ctx.setLineDash([3,5]);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#3a4580';ctx.font='8px monospace';ctx.textAlign='right';
    ctx.fillText(e===0?'1':e>=9?'1B':e>=6?'1M':e>=3?'1k':'10^'+e,pad.l-3,y+3);
  }
  SP_DATA.forEach((d,i)=>{
    ctx.fillStyle='#3a4580';ctx.font='9px monospace';ctx.textAlign='center';
    ctx.fillText(d.l,xp(i),H-pad.b+13);
  });
  const line=(data,col)=>{
    ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineJoin='round';
    ctx.beginPath();data.forEach((v,i)=>i===0?ctx.moveTo(xp(i),yp(v)):ctx.lineTo(xp(i),yp(v)));ctx.stroke();
    data.forEach((v,i)=>{ctx.beginPath();ctx.arc(xp(i),yp(v),4,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  };
  line(SP_DATA.map(d=>d.N),'#f05454');
  line(SP_DATA.map(d=>d.it),'#36e8a0');
  [[' O(N) Clásico','#f05454',pad.l+30],[' O(√N) Cuántico','#36e8a0',pad.l+160]].forEach(([lbl,col,lx])=>{
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(lx-10,H-12,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8090c0';ctx.font='10px sans-serif';ctx.textAlign='left';ctx.fillText(lbl,lx-3,H-9);
  });
}

// ── QUIZ ──────────────────────────────────────────────────────────
const QUIZ=[
  {q:'¿Cuántas iteraciones necesita Grover para buscar en 16 estados?',opts:['16','3','4','8'],ans:1,exp:'k = ⌊π/4·√16⌋ = ⌊3.14⌋ = 3 iteraciones.'},
  {q:'¿Cuántos bits clásicos envía Alice a Bob en la teleportación cuántica?',opts:['0','1','2','3'],ans:2,exp:'Alice mide q₀ y q₁ → 2 bits que viajan por canal convencional.'},
  {q:'¿Qué ocurre con el qubit original después de la teleportación?',opts:['Se copia','Se destruye','Se guarda','Se pausa'],ans:1,exp:'El teorema de no-clonación impide copiar qubits. El original queda destruido al medirlo.'},
  {q:'¿Cuántos qubits físicos usa el código Steane [7,1,3]?',opts:['3','5','7','13'],ans:2,exp:'7 qubits de datos + 6 ancillas = 13 qubits totales en el circuito completo.'},
  {q:'La aceleración de Grover sobre búsqueda clásica es proporcional a...',opts:['N','log N','√N','N²'],ans:2,exp:'Grover usa O(√N) evaluaciones vs O(N) clásico → aceleración cuadrática.'},
  {q:'¿Qué puerta cuántica crea superposición?',opts:['X','CNOT','H','Z'],ans:2,exp:'La puerta Hadamard (H) lleva |0⟩ → (|0⟩+|1⟩)/√2.'},
  {q:'El síndrome "001110" en Steane identifica error en...',opts:['d[0]','d[2]','d[3]','d[5]'],ans:2,exp:'El mapa de síndromes asigna 001110 exactamente a d[3].'},
];
let qIdx=0,qScore=0,qAnswered=false;
function startQuiz(){
  qIdx=0;qScore=0;
  document.getElementById('quiz-score-wrap').innerHTML='';
  document.getElementById('quiz-next-btn').style.display='none';
  renderQuizQ();
}
function renderQuizQ(){
  if(qIdx>=QUIZ.length){showQuizScore();return;}
  const q=QUIZ[qIdx];qAnswered=false;
  document.getElementById('quiz-q-num').textContent=`${qIdx+1}/${QUIZ.length}`;
  document.getElementById('quiz-score-live').textContent=`Score: ${qScore}`;
  document.getElementById('quiz-q-text').textContent=q.q;
  document.getElementById('quiz-opts').innerHTML=q.opts.map((o,i)=>
    `<button class="quiz-opt" onclick="answerQuiz(${i})">${o}</button>`).join('');
  document.getElementById('quiz-exp').style.display='none';
  document.getElementById('quiz-next-btn').style.display='none';
  // progress
  document.getElementById('quiz-progress').innerHTML=QUIZ.map((_,i)=>
    `<div class="qpill ${i<qIdx?'done':i===qIdx?'active':''}"></div>`).join('');
}
function answerQuiz(c){
  if(qAnswered)return;qAnswered=true;
  const q=QUIZ[qIdx];const ok=c===q.ans;if(ok)qScore++;
  document.querySelectorAll('.quiz-opt').forEach((b,i)=>{
    b.disabled=true;
    if(i===q.ans)b.classList.add('correct');
    else if(i===c&&!ok)b.classList.add('wrong');
  });
  const exp=document.getElementById('quiz-exp');
  exp.style.display='block';
  exp.innerHTML=`<span style="color:${ok?'var(--green)':'var(--red)'};font-weight:500">${ok?'✓ Correcto!':'✗ Incorrecto'}</span> — ${q.exp}`;
  document.getElementById('quiz-next-btn').style.display='flex';
  document.getElementById('quiz-score-live').textContent=`Score: ${qScore}`;
}
function quizNext(){qIdx++;renderQuizQ();}
function showQuizScore(){
  document.getElementById('quiz-q-text').textContent='';
  document.getElementById('quiz-opts').innerHTML='';
  document.getElementById('quiz-exp').style.display='none';
  document.getElementById('quiz-next-btn').style.display='none';
  const pct=Math.round(qScore/QUIZ.length*100);
  const col=pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)';
  document.getElementById('quiz-score-wrap').innerHTML=`
    <div class="quiz-score-big" style="color:${col}">${qScore}/${QUIZ.length}</div>
    <div class="quiz-score-msg">${pct>=90?'🏆 Maestro cuántico!':pct>=70?'🎉 Excelente!':pct>=50?'📚 Buen intento — revisa las explicaciones.':'🔬 Sigue explorando los laboratorios.'}</div>
    <button class="run-btn" onclick="startQuiz()" style="margin-top:16px"><span class="run-icon">↺</span> Repetir</button>`;
  document.getElementById('quiz-progress').innerHTML=QUIZ.map(()=>`<div class="qpill done"></div>`).join('');
}
