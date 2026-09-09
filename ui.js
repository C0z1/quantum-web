// ── UI Controller v2 ─────────────────────────────────────────────
let history = [];   // experiment run history

// ── App boot ─────────────────────────────────────────────────────
function startApp(){
  document.getElementById('splash').style.display='none';
  document.getElementById('app').style.display='flex';
  updateGroverMeta();
  updateSteaneLabel();
  buildSpeedupTable();
  drawSpeedupChart();
  loadHistory();
  // Hamburger for mobile
  document.getElementById('hamburger').addEventListener('click',()=>{
    document.getElementById('sidebar').classList.toggle('open');
  });
}

// ── Navigation ────────────────────────────────────────────────────
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(event?.currentTarget) event.currentTarget.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  // Lazy-draw chart
  if(id==='speedup') setTimeout(drawSpeedupChart,50);
}

// ── Animated bar renderer ─────────────────────────────────────────
function renderBars(cid, counts, targetState, barCol, altCol, animate=true){
  const el=document.getElementById(cid); if(!el) return;
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12);
  el.innerHTML=sorted.map(([st,cnt])=>{
    const pct=(cnt/total*100).toFixed(1);
    const isT=st===targetState;
    return `<div class="bar-row">
      <span class="bar-state${isT?' target':''}">${st==='0'||st==='1'?'|'+st+'⟩':'|'+st+'⟩'}${isT?' ★':''}</span>
      <div class="bar-track"><div class="bar-fill" data-w="${pct}" style="width:${animate?0:pct}%;background:${isT?barCol:(altCol||'#2a3566')}"></div></div>
      <span class="bar-pct${isT?' target':''}">${pct}%</span>
    </div>`;
  }).join('');
  if(animate) requestAnimationFrame(()=>{
    el.querySelectorAll('.bar-fill').forEach(b=>{
      b.style.transition='width .7s cubic-bezier(.4,0,.2,1)';
      b.style.width=b.dataset.w+'%';
    });
  });
}

// ── Bloch Sphere Canvas ───────────────────────────────────────────
function drawBloch(canvasId, theta, phi, col='#4d80ff', label=''){
  const c=document.getElementById(canvasId); if(!c) return;
  const ctx=c.getContext('2d'), W=c.width, H=c.height, cx=W/2, cy=H/2, R=Math.min(W,H)/2-10;
  ctx.clearRect(0,0,W,H);
  // Sphere
  const grad=ctx.createRadialGradient(cx-R*.3,cy-R*.3,R*.05,cx,cy,R);
  grad.addColorStop(0,'rgba(80,110,200,.18)'); grad.addColorStop(1,'rgba(10,15,40,.6)');
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();
  ctx.strokeStyle='rgba(80,110,200,.25)'; ctx.lineWidth=1; ctx.stroke();
  // Equator ellipse
  ctx.beginPath(); ctx.ellipse(cx,cy,R,.3*R,0,0,Math.PI*2);
  ctx.strokeStyle='rgba(80,110,200,.2)'; ctx.lineWidth=.8; ctx.stroke();
  // Vertical line
  ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R);
  ctx.strokeStyle='rgba(80,110,200,.2)'; ctx.lineWidth=.8; ctx.stroke();
  // State vector projection
  const x=Math.sin(theta)*Math.cos(phi);
  const y=Math.cos(theta);
  const z=Math.sin(theta)*Math.sin(phi);
  const px=cx+R*(x*.85-z*.15);
  const py=cy-R*(y*.9);
  // Shadow on equator
  const sx=cx+R*(x*.85-z*.15)*.8;
  const sy=cy+R*.28;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(sx,sy);
  ctx.strokeStyle='rgba(100,130,200,.2)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
  // Arrow shaft
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py);
  ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.stroke();
  // Arrowhead
  const angle=Math.atan2(py-cy,px-cx);
  ctx.beginPath();
  ctx.moveTo(px,py);
  ctx.lineTo(px-12*Math.cos(angle-0.4),py-12*Math.sin(angle-0.4));
  ctx.lineTo(px-12*Math.cos(angle+0.4),py-12*Math.sin(angle+0.4));
  ctx.closePath(); ctx.fillStyle=col; ctx.fill();
  // Poles
  ctx.fillStyle='rgba(200,210,255,.7)'; ctx.font='11px monospace';
  ctx.textAlign='center'; ctx.fillText('|0⟩',cx,cy-R-5);
  ctx.fillText('|1⟩',cx,cy+R+14);
  // Label on vector
  if(label){
    ctx.fillStyle=col; ctx.font='bold 12px monospace';
    ctx.fillText(label,px+(px>cx?10:-10),py-8);
  }
}

// Animate Bloch sphere from angle A to B
function animateBloch(canvasId, t0, p0, t1, p1, col, label, dur=600){
  const start=performance.now();
  const tick=now=>{
    const progress=clamp((now-start)/dur,0,1);
    const ease=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2;
    drawBloch(canvasId, t0+(t1-t0)*ease, p0+(p1-p0)*ease, col, progress>.95?label:'');
    if(progress<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Circuit step-by-step animator ────────────────────────────────
let circuitAnimTimer=null;
function animateCircuit(svgFn, containerId, steps, delay=900){
  clearInterval(circuitAnimTimer);
  let step=-1;
  const next=()=>{
    step++;
    if(step>steps) { clearInterval(circuitAnimTimer); return; }
    document.getElementById(containerId).innerHTML=svgFn(step-1);
  };
  next();
  circuitAnimTimer=setInterval(next, delay);
}

// ── Run history ───────────────────────────────────────────────────
function saveRun(type, params, summary){
  history.unshift({type, params, summary, ts: Date.now()});
  if(history.length>20) history.pop();
  try{ localStorage.setItem('qlab_history', JSON.stringify(history)); }catch(e){}
  renderHistory();
}
function loadHistory(){
  try{ const h=JSON.parse(localStorage.getItem('qlab_history')||'[]'); history=h; }catch(e){}
  renderHistory();
}
function renderHistory(){
  const el=document.getElementById('history-list'); if(!el) return;
  if(!history.length){ el.innerHTML=`<div class="hist-empty">${lang==='es'?'Sin experimentos aún':'No experiments yet'}</div>`; return; }
  el.innerHTML=history.slice(0,8).map((r,i)=>`
    <div class="hist-item" onclick="replayRun(${i})">
      <div class="hist-type">${{grover:'⚛',teleport:'🔗',steane:'🛡'}[r.type]||'⚛'} ${r.type}</div>
      <div class="hist-sum">${r.summary}</div>
      <div class="hist-ts">${new Date(r.ts).toLocaleTimeString()}</div>
    </div>`).join('');
}
function replayRun(i){
  const r=history[i];
  if(!r) return;
  if(r.type==='grover'){
    document.getElementById('g-qubits').value=r.params.n;
    document.getElementById('g-target').value=r.params.target;
    document.getElementById('g-shots').value=r.params.shots;
    updateGroverMeta();
    showPage('grover-lab');
    setTimeout(runGrover,100);
  }
}

// ── GROVER ────────────────────────────────────────────────────────
function updateGroverMeta(){
  const n=parseInt(document.getElementById('g-qubits').value);
  document.getElementById('g-qubits-val').textContent=n;
  const N=Math.pow(2,n), iters=groverIters(n), sp=Math.round(N/iters);
  document.getElementById('g-N').textContent=N.toLocaleString();
  document.getElementById('g-iters').textContent=iters.toLocaleString();
  document.getElementById('g-classic').textContent=N.toLocaleString();
  document.getElementById('g-speedup').textContent=sp>=1000?(sp/1000).toFixed(1)+'k×':sp+'×';
  document.getElementById('g-space-hint').textContent=
    lang==='es'?`Espacio: ${N.toLocaleString()} estados`:`Space: ${N.toLocaleString()} states`;
  const tgt=document.getElementById('g-target');
  if(tgt.value.length!==n) tgt.value='1'.repeat(n);
  validateTarget();
  // Update Bloch preview
  drawBloch('g-bloch0',0,0,'#4d80ff','|0⟩');
  drawBloch('g-bloch1',0,0,'#a56bff','|0⟩');
}

function validateTarget(){
  const n=parseInt(document.getElementById('g-qubits').value);
  const tgt=document.getElementById('g-target').value;
  const hint=document.getElementById('g-target-hint');
  const btn=document.getElementById('g-run-btn');
  const valid=tgt.length===n&&/^[01]+$/.test(tgt);
  hint.textContent=valid?(lang==='es'?'✓ válido':'✓ valid'):(lang==='es'?`✗ necesita ${n} bits`:`✗ needs ${n} bits`);
  hint.style.color=valid?'var(--green)':'var(--red)';
  btn.disabled=!valid;
}

// Grover step-by-step walkthrough
let gWalkStep=-1;
const GROVER_WALK_ES=[
  {label:'Estado inicial',desc:'Todos los qubits en |0⟩. Vector apunta al polo norte.',theta:0,phi:0,lbl:'|0⟩',circStep:0},
  {label:'Superposición (H)',desc:'Puerta Hadamard → vector al ecuador. Todos los estados existen a la vez.',theta:Math.PI/2,phi:0,lbl:'|+⟩',circStep:0},
  {label:'Oráculo',desc:'La fase del objetivo se invierte internamente. No cambia el vector visualmente pero modifica la fase.',theta:Math.PI/2,phi:Math.PI*.7,lbl:'oracle',circStep:1},
  {label:'Difusión (amplificación)',desc:'El operador de difusión amplifica el estado objetivo y suprime los demás.',theta:Math.PI*.15,phi:0,lbl:'≈|1⟩',circStep:2},
  {label:'Medición',desc:'El estado colapsa. El objetivo aparece con ~100% de probabilidad.',theta:Math.PI,phi:0,lbl:'|1⟩',circStep:3},
];
const GROVER_WALK_EN=[
  {label:'Initial state',desc:'All qubits in |0⟩. Vector points to north pole.',theta:0,phi:0,lbl:'|0⟩',circStep:0},
  {label:'Superposition (H)',desc:'Hadamard gate → vector to equator. All states exist simultaneously.',theta:Math.PI/2,phi:0,lbl:'|+⟩',circStep:0},
  {label:'Oracle',desc:'The target phase is flipped internally. The vector shifts in phase space.',theta:Math.PI/2,phi:Math.PI*.7,lbl:'oracle',circStep:1},
  {label:'Diffusion (amplification)',desc:'The diffusion operator amplifies the target and suppresses others.',theta:Math.PI*.15,phi:0,lbl:'≈|1⟩',circStep:2},
  {label:'Measurement',desc:'State collapses. The target appears with ~100% probability.',theta:Math.PI,phi:0,lbl:'|1⟩',circStep:3},
];
function groverWalkStep(dir){
  const steps=lang==='es'?GROVER_WALK_ES:GROVER_WALK_EN;
  const prev=gWalkStep;
  gWalkStep=clamp(gWalkStep+dir,0,steps.length-1);
  const s=steps[gWalkStep];
  const prevS=steps[Math.max(0,prev)];
  document.getElementById('g-walk-label').textContent=s.label;
  document.getElementById('g-walk-desc').textContent=s.desc;
  document.getElementById('g-walk-step').textContent=`${gWalkStep+1}/${steps.length}`;
  // Animate both Bloch spheres
  animateBloch('g-bloch0',prevS.theta,prevS.phi,s.theta,s.phi,'#4d80ff',s.lbl);
  animateBloch('g-bloch1',prevS.theta,prevS.phi+.3,s.theta,s.phi+.3,'#a56bff',s.lbl);
  // Update circuit highlight
  const n=parseInt(document.getElementById('g-qubits').value);
  const tgt=document.getElementById('g-target').value||'1'.repeat(n);
  document.getElementById('g-circuit-walk').innerHTML=groverCircuitSVG(n,tgt,s.circStep);
  // Dot indicators
  document.querySelectorAll('#g-walk-dots .wdot').forEach((d,i)=>{
    d.className='wdot'+(i===gWalkStep?' active':i<gWalkStep?' done':'');
  });
  document.getElementById('g-walk-prev').disabled=gWalkStep===0;
  document.getElementById('g-walk-next').disabled=gWalkStep===steps.length-1;
}
function initGroverWalk(){
  const steps=lang==='es'?GROVER_WALK_ES:GROVER_WALK_EN;
  const dotsEl=document.getElementById('g-walk-dots');
  dotsEl.innerHTML=steps.map((_,i)=>`<div class="wdot${i===0?' active':''}"></div>`).join('');
  gWalkStep=0;
  const s=steps[0];
  document.getElementById('g-walk-label').textContent=s.label;
  document.getElementById('g-walk-desc').textContent=s.desc;
  document.getElementById('g-walk-step').textContent=`1/${steps.length}`;
  drawBloch('g-bloch0',s.theta,s.phi,'#4d80ff',s.lbl);
  drawBloch('g-bloch1',s.theta,s.phi+.3,'#a56bff',s.lbl);
  const n=parseInt(document.getElementById('g-qubits').value);
  const tgt=document.getElementById('g-target').value||'1'.repeat(n);
  document.getElementById('g-circuit-walk').innerHTML=groverCircuitSVG(n,tgt,0);
  document.getElementById('g-walk-prev').disabled=true;
}

async function runGrover(){
  const n=parseInt(document.getElementById('g-qubits').value);
  const target=document.getElementById('g-target').value;
  const shots=parseInt(document.getElementById('g-shots').value);
  const btn=document.getElementById('g-run-btn');
  btn.disabled=true; btn.classList.add('loading'); btn.querySelector('.run-icon').textContent='⚛';

  // Animate Bloch through steps while "computing"
  const walkSteps=lang==='es'?GROVER_WALK_ES:GROVER_WALK_EN;
  for(let i=0;i<walkSteps.length;i++){
    const s=walkSteps[i], prev=walkSteps[Math.max(0,i-1)];
    animateBloch('g-bloch0',prev.theta,prev.phi,s.theta,s.phi,'#4d80ff',s.lbl,400);
    animateBloch('g-bloch1',prev.theta,prev.phi+.3,s.theta,s.phi+.3,'#a56bff',s.lbl,400);
    document.getElementById('g-circuit-walk').innerHTML=groverCircuitSVG(n,target,s.circStep);
    await sleep(450);
  }

  await sleep(200);
  const r=simGroverFull(n,target,shots);

  document.getElementById('g-results').style.display='block';
  renderBars('g-bars',r.counts,target,'#f5c542','#2a3566',true);
  document.getElementById('g-badge').textContent=`|${target}⟩ — ${r.targetProb}%`;

  // Probability-over-iterations mini chart
  renderIterChart('g-iter-chart', r.snapshots, target, r.iters);

  document.getElementById('g-summary').innerHTML=lang==='es'
    ?`<strong>|${target}⟩</strong> encontrado en <strong>${r.targetCount}/${shots}</strong> shots (<strong>${r.targetProb}%</strong>).
      Espacio: <strong>${r.N.toLocaleString()}</strong> estados · <strong>${r.iters}</strong> iteración${r.iters>1?'es':''} cuánticas
      vs hasta <strong>${r.N.toLocaleString()}</strong> intentos clásicos → <strong>${r.speedup}×</strong> más rápido.`
    :`<strong>|${target}⟩</strong> found in <strong>${r.targetCount}/${shots}</strong> shots (<strong>${r.targetProb}%</strong>).
      Space: <strong>${r.N.toLocaleString()}</strong> states · <strong>${r.iters}</strong> quantum iteration${r.iters>1?'s':''} vs
      up to <strong>${r.N.toLocaleString()}</strong> classical guesses → <strong>${r.speedup}×</strong> faster.`;

  saveRun('grover',{n,target,shots},`|${target}⟩ → ${r.targetProb}% (${r.iters} iters, ${r.speedup}× speedup)`);

  btn.disabled=false; btn.classList.remove('loading'); btn.querySelector('.run-icon').textContent='▶';
  document.getElementById('g-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// Mini line chart: probability of target across Grover iterations
function renderIterChart(cid, snapshots, target, finalIter){
  const el=document.getElementById(cid); if(!el) return;
  const W=el.offsetWidth||340, H=120;
  el.innerHTML=`<canvas id="${cid}-c" width="${W}" height="${H}" style="width:100%;display:block"></canvas>`;
  const c=document.getElementById(cid+'-c'); if(!c) return;
  const ctx=c.getContext('2d');
  const probs=snapshots.map(s=>s[target]||0);
  const maxP=Math.max(...probs,1);
  const pad={l:36,r:16,t:12,b:28};
  ctx.fillStyle='#080b16'; ctx.fillRect(0,0,W,H);
  // Axes
  ctx.strokeStyle='#1e2650'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,H-pad.b); ctx.lineTo(W-pad.r,H-pad.b); ctx.stroke();
  // Y labels
  [0,.25,.5,.75,1].forEach(v=>{
    const y=H-pad.b-(v/1)*(H-pad.t-pad.b);
    ctx.fillStyle='#3a4580'; ctx.font='9px monospace'; ctx.textAlign='right';
    ctx.fillText((v*100).toFixed(0)+'%',pad.l-4,y+3);
    ctx.strokeStyle='rgba(80,100,200,.1)'; ctx.lineWidth=.5;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
  });
  // Optimal marker
  const optX=pad.l+(finalIter/(probs.length-1||1))*(W-pad.l-pad.r);
  ctx.strokeStyle='rgba(245,197,66,.4)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(optX,pad.t); ctx.lineTo(optX,H-pad.b); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='#f5c54288'; ctx.font='9px sans-serif'; ctx.textAlign='center';
  ctx.fillText('óptimo',optX,pad.t+8);
  // Line
  ctx.strokeStyle='#36e8a0'; ctx.lineWidth=2; ctx.beginPath();
  probs.forEach((p,i)=>{
    const x=pad.l+(i/(probs.length-1||1))*(W-pad.l-pad.r);
    const y=H-pad.b-(p/1)*(H-pad.t-pad.b);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
  // Dots
  probs.forEach((p,i)=>{
    const x=pad.l+(i/(probs.length-1||1))*(W-pad.l-pad.r);
    const y=H-pad.b-(p/1)*(H-pad.t-pad.b);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle=i===finalIter?'#f5c542':'#36e8a0'; ctx.fill();
  });
  // X label
  ctx.fillStyle='#3a4580'; ctx.font='9px monospace'; ctx.textAlign='center';
  ctx.fillText('Iteraciones Grover →',W/2,H-6);
  ctx.fillText('P(|'+target+'⟩)',pad.l-22,pad.t+40);
}

// ── TELEPORT ──────────────────────────────────────────────────────
let tWalkStep=0;
const TELE_WALK_ES=[
  {label:'Mensaje preparado',desc:'q₀ en estado |+⟩: 50% |0⟩ y 50% |1⟩. Ninguna copia posible (no-clonación).',theta:Math.PI/2,phi:0,lbl:'|+⟩',circStep:0},
  {label:'Par Bell compartido',desc:'Alice y Bob comparten un par entrelazado. H en q₁, CNOT q₁→q₂.',theta:Math.PI/2,phi:Math.PI/3,lbl:'Bell',circStep:1},
  {label:'Operaciones de Alice',desc:'CNOT(q₀→q₁) + H(q₀). El mensaje se entrelaza con el par.',theta:Math.PI/3,phi:Math.PI*.6,lbl:'ent.',circStep:2},
  {label:'Medición de Alice',desc:'Alice mide q₀ y q₁ → 2 bits clásicos. El mensaje queda destruido.',theta:Math.PI,phi:0,lbl:'💥',circStep:3},
  {label:'Bob reconstruye',desc:'Bob aplica X y/o Z según los 2 bits. Su q₂ = estado original.',theta:Math.PI/2,phi:0,lbl:'|+⟩ ✓',circStep:4},
];
const TELE_WALK_EN=[
  {label:'Message prepared',desc:'q₀ in |+⟩: 50% |0⟩ and 50% |1⟩. No copying possible (no-cloning).',theta:Math.PI/2,phi:0,lbl:'|+⟩',circStep:0},
  {label:'Bell pair shared',desc:'Alice and Bob share an entangled pair. H on q₁, CNOT q₁→q₂.',theta:Math.PI/2,phi:Math.PI/3,lbl:'Bell',circStep:1},
  {label:"Alice's operations",desc:'CNOT(q₀→q₁) + H(q₀). The message entangles with the pair.',theta:Math.PI/3,phi:Math.PI*.6,lbl:'ent.',circStep:2},
  {label:"Alice's measurement",desc:'Alice measures q₀ and q₁ → 2 classical bits. Message is destroyed.',theta:Math.PI,phi:0,lbl:'💥',circStep:3},
  {label:'Bob reconstructs',desc:'Bob applies X and/or Z from the 2 bits. His q₂ = original state.',theta:Math.PI/2,phi:0,lbl:'|+⟩ ✓',circStep:4},
];
function teleWalkStep(dir){
  const steps=lang==='es'?TELE_WALK_ES:TELE_WALK_EN;
  const prev=tWalkStep;
  tWalkStep=clamp(tWalkStep+dir,0,steps.length-1);
  const s=steps[tWalkStep], ps=steps[prev];
  document.getElementById('t-walk-label').textContent=s.label;
  document.getElementById('t-walk-desc').textContent=s.desc;
  document.getElementById('t-walk-step').textContent=`${tWalkStep+1}/${steps.length}`;
  const cols=['#44cc88','#4488ff','#ff8844'];
  ['t-bloch0','t-bloch1','t-bloch2'].forEach((id,i)=>{
    const tp=i===0?s.theta:i===1?s.theta*.8:s.theta*.9;
    const pp=s.phi+i*.5;
    const tp2=i===0?ps.theta:i===1?ps.theta*.8:ps.theta*.9;
    const pp2=ps.phi+i*.5;
    animateBloch(id,tp2,pp2,tp,pp,cols[i],i===0?s.lbl:'');
  });
  document.getElementById('t-circuit-walk').innerHTML=teleportCircuitSVG(s.circStep);
  document.querySelectorAll('#t-walk-dots .wdot').forEach((d,i)=>{
    d.className='wdot'+(i===tWalkStep?' active':i<tWalkStep?' done':'');
  });
  document.getElementById('t-walk-prev').disabled=tWalkStep===0;
  document.getElementById('t-walk-next').disabled=tWalkStep===steps.length-1;
}
function initTeleWalk(){
  const steps=lang==='es'?TELE_WALK_ES:TELE_WALK_EN;
  document.getElementById('t-walk-dots').innerHTML=steps.map((_,i)=>`<div class="wdot${i===0?' active':''}"></div>`).join('');
  tWalkStep=0;
  const s=steps[0];
  document.getElementById('t-walk-label').textContent=s.label;
  document.getElementById('t-walk-desc').textContent=s.desc;
  document.getElementById('t-walk-step').textContent=`1/${steps.length}`;
  ['t-bloch0','t-bloch1','t-bloch2'].forEach((id,i)=>{
    drawBloch(id,s.theta,s.phi+i*.5,['#44cc88','#4488ff','#ff8844'][i],i===0?s.lbl:'');
  });
  document.getElementById('t-circuit-walk').innerHTML=teleportCircuitSVG(0);
  document.getElementById('t-walk-prev').disabled=true;
}

function onTStateChange(){
  document.getElementById('t-custom-card').style.display=
    document.getElementById('t-state').value==='custom'?'block':'none';
}
async function runTeleport(){
  const state=document.getElementById('t-state').value;
  const theta=parseFloat(document.getElementById('t-theta')?.value||90);
  const shots=parseInt(document.getElementById('t-shots').value);
  const btn=document.getElementById('t-run-btn');
  btn.disabled=true; btn.classList.add('loading'); btn.querySelector('.run-icon').textContent='⚛';

  // Run walk animation
  const steps=lang==='es'?TELE_WALK_ES:TELE_WALK_EN;
  for(let i=0;i<steps.length;i++){
    const s=steps[i],ps=steps[Math.max(0,i-1)];
    ['t-bloch0','t-bloch1','t-bloch2'].forEach((id,j)=>{
      animateBloch(id,ps.theta,ps.phi+j*.5,s.theta,s.phi+j*.5,['#44cc88','#4488ff','#ff8844'][j],j===0?s.lbl:'',380);
    });
    document.getElementById('t-circuit-walk').innerHTML=teleportCircuitSVG(s.circStep);
    await sleep(420);
  }

  const r=simTeleport(state,theta,shots);
  document.getElementById('t-results').style.display='block';
  renderBars('t-raw-bars',r.rawCounts,null,'#6875c8','#1e2550');
  const bobTarget=r.p0>=r.p1?'0':'1';
  renderBars('t-bob-bars',r.bobCorrected,bobTarget,'#36e8a0','#1a3028');
  const g0=(r.p0*100).toFixed(0),g1=(r.p1*100).toFixed(0);
  const b0=(r.bobCorrected['0']/shots*100).toFixed(1),b1=(r.bobCorrected['1']/shots*100).toFixed(1);
  document.getElementById('t-summary').innerHTML=lang==='es'
    ?`Mensaje <strong>${r.stateLabel}</strong> — esperado ~${g0}%|0⟩, ~${g1}%|1⟩. Bob obtuvo <strong>${b0}%|0⟩, ${b1}%|1⟩</strong>. ✓ El qubit original fue <strong>destruido</strong>.`
    :`Message <strong>${r.stateLabel}</strong> — expected ~${g0}%|0⟩, ~${g1}%|1⟩. Bob got <strong>${b0}%|0⟩, ${b1}%|1⟩</strong>. ✓ Original qubit was <strong>destroyed</strong>.`;
  document.getElementById('t-circuit-result').innerHTML=teleportCircuitSVG(-1);
  saveRun('teleport',{state,theta,shots},`${r.stateLabel} → Bob: ${b0}%|0⟩, ${b1}%|1⟩`);
  btn.disabled=false; btn.classList.remove('loading'); btn.querySelector('.run-icon').textContent='▶';
  document.getElementById('t-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── STEANE ────────────────────────────────────────────────────────
function updateSteaneLabel(){
  const eq=parseInt(document.getElementById('s-errq').value);
  document.getElementById('s-errq-val').textContent=eq===-1?'−1':`d[${eq}]`;
  const hint=document.getElementById('s-errq-hint');
  if(eq===-1){
    hint.textContent=lang==='es'?'✓ Ejecución limpia — sin error':'✓ Clean run — no error';
    hint.style.color='var(--green)';
  } else {
    hint.textContent=lang==='es'?`⚡ Error X en d[${eq}]`:`⚡ X error on d[${eq}]`;
    hint.style.color='var(--red)';
  }
  // Render qubit grid preview
  renderSteaneGrid(eq);
}
function renderSteaneGrid(eq){
  const el=document.getElementById('s-qubit-grid'); if(!el) return;
  el.innerHTML=Array.from({length:7},(_,i)=>{
    const isErr=i===eq;
    return `<div class="qgrid-cell ${isErr?'qgrid-err':''}" title="d[${i}]">
      <div class="qgrid-ball" style="background:${isErr?'var(--red)':'var(--blue)'}"></div>
      <span>d[${i}]</span>
    </div>`;
  }).join('')+`<div style="grid-column:1/-1;font-size:10px;color:var(--text-dim);margin-top:4px">
    ${eq>=0?(lang==='es'?`⚡ d[${eq}] tiene error X inyectado`:`⚡ d[${eq}] has injected X error`):(lang==='es'?'✓ Sin errores':'✓ No errors')}
  </div>`;
}
async function runSteane(){
  const eq=parseInt(document.getElementById('s-errq').value);
  const shots=parseInt(document.getElementById('s-shots').value);
  const btn=document.getElementById('s-run-btn');
  btn.disabled=true; btn.classList.add('loading'); btn.querySelector('.run-icon').textContent='⚛';
  await sleep(700);
  const r=simSteane(eq,shots);
  document.getElementById('s-results').style.display='block';
  // Syndrome
  const topSyn=Object.entries(r.syndromeCounts).sort((a,b)=>b[1]-a[1])[0];
  const bits=topSyn[0].split('');
  document.getElementById('s-syndrome-display').innerHTML=`
    <div class="syndrome-display">
      <div class="syndrome-bits">${bits.map((b,i)=>`<div class="sbit ${b==='1'?'on':'off'}" title="ancilla ${i}">${b}</div>`).join('')}</div>
      <div class="syndrome-label">
        <strong style="color:${topSyn[0]==='000000'?'var(--green)':'var(--amber)'}">${topSyn[0]}</strong>
        — ${syndromeDesc(topSyn[0])} &nbsp;·&nbsp; ${topSyn[1].toLocaleString()} shots
      </div>
    </div>`;
  renderBars('s-logical-bars',r.logicalResult,'0','#36e8a0','#1a3028');
  document.getElementById('s-summary').innerHTML=eq===-1
    ?(lang==='es'?'✓ Sin error. Síndrome <code>000000</code>. Qubit lógico |0_L⟩ intacto.':'✓ No error. Syndrome <code>000000</code>. Logical qubit |0_L⟩ intact.')
    :(lang==='es'
      ?`Error en <strong>d[${eq}]</strong> → síndrome <code>${r.syndrome}</code> → corrección X → qubit lógico <strong>sobrevivió</strong>. Mismo principio en IBM Quantum.`
      :`Error on <strong>d[${eq}]</strong> → syndrome <code>${r.syndrome}</code> → X correction → logical qubit <strong>survived</strong>. Same principle on IBM Quantum.`);
  // Map
  const mapEl=document.getElementById('s-syndrome-map');
  const sm={'-1':'000000','0':'001001','1':'010010','2':'011011','3':'001110','4':'010101','5':'011110','6':'001111'};
  mapEl.innerHTML=`<div class="syndrome-map-grid">`+
    Object.entries(sm).filter(([k])=>k!=='-1').map(([q,syn])=>`
      <div class="smap-cell ${parseInt(q)===eq?'active':''}">
        <span class="smap-q">d[${q}]</span><code>${syn}</code>
      </div>`).join('')+`</div>`;
  document.getElementById('s-circuit-display').innerHTML=steaneCircuitSVG(eq);
  saveRun('steane',{eq,shots},`d[${eq}] → synd ${r.syndrome} → corrected`);
  btn.disabled=false; btn.classList.remove('loading'); btn.querySelector('.run-icon').textContent='▶';
  document.getElementById('s-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── QUIZ ──────────────────────────────────────────────────────────
const QUIZ_ES=[
  {q:'¿Cuántas iteraciones necesita Grover para buscar en 16 estados?',opts:['16','3','4','8'],ans:1,exp:'k = ⌊π/4·√16⌋ = ⌊π/4·4⌋ = ⌊3.14⌋ = 3 iteraciones.'},
  {q:'¿Cuántos bits clásicos envía Alice a Bob en la teleportación cuántica?',opts:['0','1','2','3'],ans:2,exp:'Alice mide q₀ y q₁ → 2 bits clásicos que se envían por canal convencional.'},
  {q:'¿Qué ocurre con el qubit original después de la teleportación?',opts:['Se copia','Se destruye','Se guarda','Se comprime'],ans:1,exp:'El teorema de no-clonación impide copiar qubits. El original queda destruido al medirlo.'},
  {q:'¿Cuántos qubits físicos usa el código Steane [7,1,3] para 1 qubit lógico?',opts:['3','5','7','13'],ans:2,exp:'El código [7,1,3] usa 7 qubits de datos + 6 ancillas = 13 total para el circuito completo.'},
  {q:'La aceleración de Grover sobre búsqueda clásica es proporcional a...',opts:['N','log N','√N','N²'],ans:2,exp:'Grover usa O(√N) evaluaciones vs O(N) clásico → aceleración cuadrática.'},
  {q:'¿Cuál de estas puertas pone un qubit en superposición?',opts:['X','CNOT','H','Z'],ans:2,exp:'La puerta Hadamard (H) lleva |0⟩ → (|0⟩+|1⟩)/√2, creando superposición perfecta 50/50.'},
  {q:'El síndrome "001110" en el código Steane corresponde a un error en...',opts:['d[0]','d[2]','d[3]','d[5]'],ans:2,exp:'El mapa de síndromes asigna 001110 exactamente al qubit d[3].'},
];
const QUIZ_EN=[
  {q:'How many iterations does Grover need to search 16 states?',opts:['16','3','4','8'],ans:1,exp:'k = ⌊π/4·√16⌋ = ⌊π/4·4⌋ = ⌊3.14⌋ = 3 iterations.'},
  {q:'How many classical bits does Alice send Bob in quantum teleportation?',opts:['0','1','2','3'],ans:2,exp:'Alice measures q₀ and q₁ → 2 classical bits sent via conventional channel.'},
  {q:'What happens to the original qubit after teleportation?',opts:['It is copied','It is destroyed','It is saved','It is compressed'],ans:1,exp:'The no-cloning theorem prevents copying qubits. The original is destroyed upon measurement.'},
  {q:'How many physical qubits does the Steane [7,1,3] code use for 1 logical qubit?',opts:['3','5','7','13'],ans:2,exp:'The [7,1,3] code uses 7 data qubits + 6 ancillas = 13 total for the full circuit.'},
  {q:"Grover's speedup over classical search is proportional to...",opts:['N','log N','√N','N²'],ans:2,exp:'Grover uses O(√N) evaluations vs O(N) classical → quadratic speedup.'},
  {q:'Which gate puts a qubit into superposition?',opts:['X','CNOT','H','Z'],ans:2,exp:'The Hadamard (H) gate maps |0⟩ → (|0⟩+|1⟩)/√2, creating perfect 50/50 superposition.'},
  {q:'Syndrome "001110" in the Steane code corresponds to an error on...',opts:['d[0]','d[2]','d[3]','d[5]'],ans:2,exp:'The syndrome map assigns 001110 exactly to qubit d[3].'},
];
let quizIdx=0, quizScore=0, quizAnswered=false;
function startQuiz(){
  quizIdx=0; quizScore=0;
  document.getElementById('quiz-score-wrap').style.display='none';
  renderQuizQ();
}
function renderQuizQ(){
  const pool=lang==='es'?QUIZ_ES:QUIZ_EN;
  if(quizIdx>=pool.length){ showQuizScore(); return; }
  const q=pool[quizIdx];
  quizAnswered=false;
  document.getElementById('quiz-q-num').textContent=`${quizIdx+1}/${pool.length}`;
  document.getElementById('quiz-q-text').textContent=q.q;
  document.getElementById('quiz-opts').innerHTML=q.opts.map((o,i)=>
    `<button class="quiz-opt" onclick="answerQuiz(${i})">${o}</button>`).join('');
  document.getElementById('quiz-explanation').style.display='none';
  document.getElementById('quiz-next-btn').style.display='none';
  // Progress dots
  document.getElementById('quiz-progress').innerHTML=pool.map((_,i)=>
    `<div class="quiz-dot ${i<quizIdx?'done':i===quizIdx?'active':''}"></div>`).join('');
}
function answerQuiz(choice){
  if(quizAnswered) return;
  quizAnswered=true;
  const pool=lang==='es'?QUIZ_ES:QUIZ_EN;
  const q=pool[quizIdx];
  const correct=choice===q.ans;
  if(correct) quizScore++;
  document.querySelectorAll('.quiz-opt').forEach((btn,i)=>{
    btn.disabled=true;
    if(i===q.ans) btn.classList.add('quiz-correct');
    else if(i===choice&&!correct) btn.classList.add('quiz-wrong');
  });
  document.getElementById('quiz-explanation').style.display='block';
  document.getElementById('quiz-explanation').innerHTML=
    `<span style="color:${correct?'var(--green)':'var(--red)'}">${correct?(lang==='es'?'✓ Correcto!':'✓ Correct!'):(lang==='es'?'✗ Incorrecto':'✗ Incorrect')}</span>
     — ${q.exp}`;
  document.getElementById('quiz-next-btn').style.display='block';
}
function quizNext(){ quizIdx++; renderQuizQ(); }
function showQuizScore(){
  const pool=lang==='es'?QUIZ_ES:QUIZ_EN;
  document.getElementById('quiz-q-text').textContent='';
  document.getElementById('quiz-opts').innerHTML='';
  document.getElementById('quiz-explanation').style.display='none';
  document.getElementById('quiz-next-btn').style.display='none';
  const sc=document.getElementById('quiz-score-wrap');
  sc.style.display='block';
  sc.innerHTML=`<div class="quiz-final">
    <div class="quiz-score-num" style="color:${quizScore>=5?'var(--green)':'var(--amber)'}">${quizScore}/${pool.length}</div>
    <div class="quiz-score-lbl">${lang==='es'?'respuestas correctas':'correct answers'}</div>
    <div class="quiz-score-msg">${quizScore===pool.length?(lang==='es'?'🏆 ¡Perfecto! Eres un experto cuántico.':'🏆 Perfect! You are a quantum expert.')
      :quizScore>=5?(lang==='es'?'🎉 Excelente trabajo!':'🎉 Excellent work!')
      :(lang==='es'?'📚 Revisa las explicaciones y vuelve a intentarlo.':'📚 Review the explanations and try again.')}</div>
    <button class="run-btn" onclick="startQuiz()" style="margin-top:12px">
      <span class="run-icon">↺</span> ${lang==='es'?'Repetir quiz':'Retry quiz'}
    </button>
  </div>`;
}

// ── SPEEDUP TABLE & CHART ─────────────────────────────────────────
const SPEEDUP_DATA=[
  {label:'Grover 2q',N:4,iters:1},{label:'Grover 4q',N:16,iters:3},
  {label:'Grover 8q',N:256,iters:12},{label:'Grover 12q',N:4096,iters:50},
  {label:'Grover 16q',N:65536,iters:201},{label:'Grover 20q',N:1048576,iters:804},
  {label:'Grover 30q',N:1073741824,iters:25736},
];
function buildSpeedupTable(){
  const tb=document.getElementById('speedup-tbody'); if(!tb) return;
  tb.innerHTML=SPEEDUP_DATA.map(d=>{
    const sp=Math.round(d.N/d.iters);
    const Nf=d.N>=1e9?'~1B':d.N>=1e6?(d.N/1e6).toFixed(1)+'M':d.N.toLocaleString();
    const spf=sp>=1e6?(sp/1e6).toFixed(1)+'M×':sp>=1000?(sp/1000).toFixed(1)+'k×':sp+'×';
    return `<tr><td>${d.label}</td><td>${Nf}</td><td>${d.N.toLocaleString()}</td>
      <td>${d.iters.toLocaleString()}</td><td class="accent">${spf}</td></tr>`;
  }).join('')+`<tr><td colspan="5" style="padding:3px 14px;color:var(--text-dim);font-size:11px;border:none">——</td></tr>
    <tr><td>Teleportación</td><td>—</td><td style="color:var(--red)">imposible</td><td>3 qubits</td><td class="inf">∞</td></tr>
    <tr><td>Steane [7,1,3]</td><td>—</td><td style="color:var(--text-dim)">sin equiv.</td><td>13 qubits</td><td class="inf">∞</td></tr>`;
}
function drawSpeedupChart(){
  const canvas=document.getElementById('speedup-canvas'); if(!canvas) return;
  const W=canvas.width=canvas.parentElement.offsetWidth-40||660, H=300;
  canvas.height=H;
  const ctx=canvas.getContext('2d');
  const pad={t:20,r:20,b:50,l:72};
  const labels=SPEEDUP_DATA.map(d=>d.label.replace('Grover ',''));
  const quantum=SPEEDUP_DATA.map(d=>d.iters);
  const classical=SPEEDUP_DATA.map(d=>d.N);
  const logMax=Math.log10(Math.max(...classical))+.5;
  const xPos=i=>pad.l+(i/(labels.length-1))*(W-pad.l-pad.r);
  const yPos=v=>H-pad.b-(Math.log10(Math.max(1,v))/logMax)*(H-pad.t-pad.b);
  ctx.fillStyle='#080b16'; ctx.fillRect(0,0,W,H);
  // Grid
  for(let e=0;e<=9;e++){
    const y=yPos(Math.pow(10,e));
    if(y<pad.t||y>H-pad.b) continue;
    ctx.strokeStyle='#131830'; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#3a4580'; ctx.font='9px monospace'; ctx.textAlign='right';
    const lbl=e>=9?'1B':e>=6?'1M':e>=3?'1k':'10^'+e;
    ctx.fillText(e===0?'1':lbl,pad.l-4,y+3);
  }
  // X labels
  labels.forEach((l,i)=>{
    ctx.fillStyle='#3a4580'; ctx.font='10px monospace'; ctx.textAlign='center';
    ctx.fillText(l,xPos(i),H-pad.b+15);
  });
  // Fill area
  const drawArea=(data,col)=>{
    ctx.beginPath(); ctx.moveTo(xPos(0),H-pad.b);
    data.forEach((v,i)=>ctx.lineTo(xPos(i),yPos(v)));
    ctx.lineTo(xPos(data.length-1),H-pad.b); ctx.closePath();
    ctx.fillStyle=col.replace(')',',0.08)').replace('rgb','rgba');
    try{ ctx.fill(); }catch(e){}
  };
  // Lines
  const drawLine=(data,col)=>{
    ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.lineJoin='round';
    ctx.beginPath(); data.forEach((v,i)=>i===0?ctx.moveTo(xPos(i),yPos(v)):ctx.lineTo(xPos(i),yPos(v))); ctx.stroke();
    data.forEach((v,i)=>{ ctx.beginPath(); ctx.arc(xPos(i),yPos(v),4.5,0,Math.PI*2); ctx.fillStyle=col; ctx.fill(); });
  };
  drawLine(classical,'#f05454');
  drawLine(quantum,'#36e8a0');
  // Legend
  [[' Clásico O(N)','#f05454',pad.l+40],[' Cuántico O(√N)','#36e8a0',pad.l+180]].forEach(([lbl,col,lx])=>{
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(lx-12,H-10,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#8090c0'; ctx.font='11px sans-serif'; ctx.textAlign='left'; ctx.fillText(lbl,lx-5,H-7);
  });
}

// ── Utils ─────────────────────────────────────────────────────────
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
