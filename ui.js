// ── UI Controller ─────────────────────────────────────────────────

// ── App init ──────────────────────────────────────────────────────
function startApp() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  updateGroverMeta();
  updateSteaneLabel();
  buildSpeedupTable();
  drawSpeedupChart();
}

// ── Navigation ────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ── Bar chart renderer ────────────────────────────────────────────
function renderBars(containerId, counts, targetState, barColor, altColor) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  el.innerHTML = sorted.map(([state, count]) => {
    const pct = (count/total*100).toFixed(1);
    const isTarget = state === targetState;
    const fill = isTarget ? barColor : (altColor||'#2a3566');
    return `
      <div class="bar-row">
        <span class="bar-state${isTarget?' target':''}" title="${state}">|${state}⟩${isTarget?' ★':''}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${fill}"></div>
        </div>
        <span class="bar-pct${isTarget?' target':''}">${pct}%</span>
      </div>`;
  }).join('');
}

// ── GROVER ────────────────────────────────────────────────────────
function updateGroverMeta() {
  const n = parseInt(document.getElementById('g-qubits').value);
  document.getElementById('g-qubits-val').textContent = n;
  const N = Math.pow(2, n);
  const iters = groverIters(n);
  const speedup = Math.round(N / iters);
  document.getElementById('g-N').textContent = N.toLocaleString();
  document.getElementById('g-iters').textContent = iters.toLocaleString();
  document.getElementById('g-classic').textContent = N.toLocaleString();
  document.getElementById('g-speedup').textContent = speedup >= 1000 ? (speedup/1000).toFixed(1)+'k×' : speedup+'×';
  document.getElementById('g-space-hint').textContent =
    lang==='es' ? `Espacio: ${N.toLocaleString()} estados` : `Space: ${N.toLocaleString()} states`;
  // Auto-fill target
  const tgt = document.getElementById('g-target');
  if (tgt.value.length !== n) tgt.value = '1'.repeat(n);
  validateTarget();
}

function validateTarget() {
  const n = parseInt(document.getElementById('g-qubits').value);
  const tgt = document.getElementById('g-target').value;
  const hint = document.getElementById('g-target-hint');
  const btn = document.getElementById('g-run-btn');
  const valid = tgt.length === n && /^[01]+$/.test(tgt);
  hint.textContent = valid
    ? (lang==='es'?'✓ válido':'✓ valid')
    : (lang==='es'?`✗ debe tener exactamente ${n} bits (0s y 1s)`:`✗ must be exactly ${n} bits (0s and 1s)`);
  hint.style.color = valid ? 'var(--green)' : 'var(--red)';
  btn.disabled = !valid;
}

async function runGrover() {
  const n = parseInt(document.getElementById('g-qubits').value);
  const target = document.getElementById('g-target').value;
  const shots = parseInt(document.getElementById('g-shots').value);
  const btn = document.getElementById('g-run-btn');

  btn.disabled = true; btn.classList.add('loading');
  btn.querySelector('.run-icon').textContent = '⚛';

  await sleep(600 + n * 40);

  const r = simGrover(n, target, shots);
  document.getElementById('g-results').style.display = 'block';

  renderBars('g-bars', r.counts, target, '#f5c542', '#2a3566');
  document.getElementById('g-badge').textContent =
    `${target} — ${r.targetProb}%`;

  const s = r;
  document.getElementById('g-summary').innerHTML = lang === 'es'
    ? `<strong>|${target}⟩</strong> encontrado en <strong>${s.targetCount}/${s.shots}</strong> shots (${s.targetProb}%).
       Espacio de búsqueda: <strong>${s.N.toLocaleString()}</strong> estados.
       Grover necesitó <strong>${s.iters}</strong> iteración${s.iters>1?'es':''} vs
       hasta <strong>${s.N.toLocaleString()}</strong> intentos clásicos → aceleración <strong>${s.speedup}×</strong>.`
    : `<strong>|${target}⟩</strong> found in <strong>${s.targetCount}/${s.shots}</strong> shots (${s.targetProb}%).
       Search space: <strong>${s.N.toLocaleString()}</strong> states.
       Grover needed <strong>${s.iters}</strong> iteration${s.iters>1?'s':''} vs
       up to <strong>${s.N.toLocaleString()}</strong> classical guesses → speedup <strong>${s.speedup}×</strong>.`;

  document.getElementById('g-circuit-svg').innerHTML = groverCircuitSVG(n, target);

  btn.disabled = false; btn.classList.remove('loading');
  btn.querySelector('.run-icon').textContent = '▶';
  document.getElementById('g-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── TELEPORT ──────────────────────────────────────────────────────
function onTStateChange() {
  const state = document.getElementById('t-state').value;
  document.getElementById('t-custom-card').style.display =
    state === 'custom' ? 'block' : 'none';
}

async function runTeleport() {
  const state = document.getElementById('t-state').value;
  const theta = parseFloat(document.getElementById('t-theta')?.value||90);
  const phi   = parseFloat(document.getElementById('t-phi')?.value||0);
  const shots = parseInt(document.getElementById('t-shots').value);
  const btn = document.getElementById('t-run-btn');

  btn.disabled = true; btn.classList.add('loading');
  btn.querySelector('.run-icon').textContent = '⚛';
  await sleep(750);

  const r = simTeleport(state, theta, phi, shots);
  document.getElementById('t-results').style.display = 'block';

  renderBars('t-raw-bars', r.rawCounts, null, '#6875c8', '#1e2550');

  const bobTarget = r.p0 >= r.p1 ? '0' : '1';
  renderBars('t-bob-bars', r.bobCorrected, bobTarget, '#36e8a0', '#1a3028');

  const exp0 = (r.p0*100).toFixed(0), exp1 = (r.p1*100).toFixed(0);
  const got0 = (r.bobCorrected['0']/shots*100).toFixed(1);
  const got1 = (r.bobCorrected['1']/shots*100).toFixed(1);

  document.getElementById('t-summary').innerHTML = lang === 'es'
    ? `Mensaje: <strong>${r.stateLabel}</strong> — esperado: ~${exp0}% |0⟩, ~${exp1}% |1⟩.
       Bob obtuvo: <strong>${got0}% |0⟩, ${got1}% |1⟩</strong> (${shots} shots).
       ✓ La diferencia es ruido estadístico normal. El qubit original fue <strong>destruido</strong>; solo viajaron 2 bits clásicos.`
    : `Message: <strong>${r.stateLabel}</strong> — expected: ~${exp0}% |0⟩, ~${exp1}% |1⟩.
       Bob got: <strong>${got0}% |0⟩, ${got1}% |1⟩</strong> (${shots} shots).
       ✓ The difference is normal statistical noise. The original qubit was <strong>destroyed</strong>; only 2 classical bits traveled.`;

  document.getElementById('t-circuit-svg').innerHTML = teleportCircuitSVG();

  btn.disabled = false; btn.classList.remove('loading');
  btn.querySelector('.run-icon').textContent = '▶';
  document.getElementById('t-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── STEANE ────────────────────────────────────────────────────────
function updateSteaneLabel() {
  const eq = parseInt(document.getElementById('s-errq').value);
  const val = document.getElementById('s-errq-val');
  const hint = document.getElementById('s-errq-hint');
  val.textContent = eq === -1 ? '−1' : `d[${eq}]`;
  if (eq === -1) {
    hint.textContent = lang==='es' ? '✓ Ejecución limpia — sin error' : '✓ Clean run — no error';
    hint.style.color = 'var(--green)';
  } else {
    hint.textContent = lang==='es' ? `⚡ Error X inyectado en d[${eq}]` : `⚡ X error injected on d[${eq}]`;
    hint.style.color = 'var(--red)';
  }
}

async function runSteane() {
  const eq = parseInt(document.getElementById('s-errq').value);
  const shots = parseInt(document.getElementById('s-shots').value);
  const btn = document.getElementById('s-run-btn');

  btn.disabled = true; btn.classList.add('loading');
  btn.querySelector('.run-icon').textContent = '⚛';
  await sleep(800);

  const r = simSteane(eq, shots);
  document.getElementById('s-results').style.display = 'block';

  // Syndrome display
  const synEl = document.getElementById('s-syndrome-display');
  const topSyn = Object.entries(r.syndromeCounts).sort((a,b)=>b[1]-a[1])[0];
  const synBits = topSyn[0].split('');
  synEl.innerHTML = `
    <div class="syndrome-display">
      <div class="syndrome-bits">
        ${synBits.map((b,i)=>`<div class="sbit ${b==='1'?'on':'off'}">${b}</div>`).join('')}
      </div>
      <div class="syndrome-label">
        <strong style="color:${topSyn[0]==='000000'?'var(--green)':'var(--amber)'}">${topSyn[0]}</strong>
        — ${syndromeDesc(topSyn[0])}
        &nbsp;·&nbsp; ${topSyn[1]} shots
      </div>
    </div>`;

  // Logical result
  renderBars('s-logical-bars', r.logicalResult, '0', '#36e8a0', '#1a3028');

  // Summary
  document.getElementById('s-summary').innerHTML = eq === -1
    ? (lang==='es'
        ? '✓ Sin error inyectado. Síndrome <code>000000</code>. Qubit lógico |0⟩ intacto.'
        : '✓ No error injected. Syndrome <code>000000</code>. Logical qubit |0⟩ intact.')
    : (lang==='es'
        ? `Error X en <strong>d[${eq}]</strong> detectado por síndrome <code>${r.syndrome}</code> →
           corrección X aplicada → qubit lógico |0⟩ <strong>sobrevivió</strong>.
           Este es el mismo principio usado en hardware cuántico real de IBM.`
        : `X error on <strong>d[${eq}]</strong> detected by syndrome <code>${r.syndrome}</code> →
           X correction applied → logical qubit |0⟩ <strong>survived</strong>.
           This is the same principle used in IBM's real quantum hardware.`);

  // Syndrome map
  const mapEl = document.getElementById('s-syndrome-map');
  const synMap = {
    '-1':'000000','0':'001001','1':'010010','2':'011011',
    '3':'001110','4':'010101','5':'011110','6':'001111'
  };
  mapEl.innerHTML = `<div class="syndrome-map-grid">` +
    Object.entries(synMap).filter(([k])=>k!=='-1').map(([q,syn]) => {
      const isActive = parseInt(q) === eq;
      const isCorrected = isActive && eq >= 0;
      return `<div class="smap-cell ${isActive?'active':''} ${isCorrected?'corrected':''}">
        <span class="smap-q">d[${q}]</span>
        <code>${syn}</code>
      </div>`;
    }).join('') + `</div>`;

  // Circuit
  document.getElementById('s-circuit-svg')?.remove();
  const circWrap = document.createElement('div');
  circWrap.innerHTML = steaneCircuitSVG(eq);
  const logicalBarsEl = document.getElementById('s-logical-bars');
  logicalBarsEl.parentNode.after(circWrap);

  btn.disabled = false; btn.classList.remove('loading');
  btn.querySelector('.run-icon').textContent = '▶';
  document.getElementById('s-results').scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── SPEEDUP TABLE & CHART ─────────────────────────────────────────
const SPEEDUP_DATA = [
  {label:'Grover 2q', n:2, N:4, iters:1, classic:4},
  {label:'Grover 4q', n:4, N:16, iters:3, classic:16},
  {label:'Grover 8q', n:8, N:256, iters:12, classic:256},
  {label:'Grover 16q', n:16, N:65536, iters:201, classic:65536},
  {label:'Grover 20q', n:20, N:1048576, iters:804, classic:1048576},
  {label:'Grover 30q', n:30, N:1073741824, iters:25736, classic:1073741824},
];

function buildSpeedupTable() {
  const tb = document.getElementById('speedup-tbody');
  tb.innerHTML = SPEEDUP_DATA.map(d => {
    const speedup = Math.round(d.N / d.iters);
    const Nfmt = d.N >= 1e9 ? '~1B' : d.N >= 1e6 ? (d.N/1e6).toFixed(1)+'M' : d.N.toLocaleString();
    const cfmt = d.classic >= 1e9 ? '~1,000,000,000' : d.classic.toLocaleString();
    const sfmt = speedup >= 1000 ? speedup.toLocaleString() : speedup+'';
    return `<tr>
      <td>${d.label}</td>
      <td>${Nfmt}</td>
      <td>${cfmt}</td>
      <td>${d.iters.toLocaleString()} iters</td>
      <td class="accent">${sfmt}×</td>
    </tr>`;
  }).join('') + `
    <tr><td colspan="5" style="padding:4px 14px;color:var(--text-dim);font-size:11px">— — —</td></tr>
    <tr><td>Teleportación</td><td>—</td><td style="color:var(--red)">imposible</td><td>3 qubits</td><td class="inf">∞</td></tr>
    <tr><td>Steane [7,1,3]</td><td>—</td><td style="color:var(--text-dim)">sin equiv.</td><td>13 qubits</td><td class="inf">∞</td></tr>`;
}

function drawSpeedupChart() {
  const canvas = document.getElementById('speedup-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = {top:20, right:20, bottom:50, left:70};

  const labels = SPEEDUP_DATA.map(d => d.n+'q');
  const quantum = SPEEDUP_DATA.map(d => d.iters);
  const classical = SPEEDUP_DATA.map(d => d.N);

  const maxVal = Math.max(...classical);
  const logMax = Math.log10(maxVal) + .5;
  const logMin = 0;

  function xPos(i) { return pad.left + (i/(labels.length-1))*(W-pad.left-pad.right); }
  function yPos(v)  { const l=Math.log10(Math.max(1,v)); return H-pad.bottom-(l-logMin)/(logMax-logMin)*(H-pad.top-pad.bottom); }

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0,0,W,H);

  // Grid lines
  for (let exp=0; exp<=9; exp++) {
    const y = yPos(Math.pow(10,exp));
    if (y < pad.top || y > H-pad.bottom) continue;
    ctx.strokeStyle = '#1a2050';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(W-pad.right,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6875a8';
    ctx.font = '10px monospace';
    const label = exp >= 9 ? '1B' : exp >= 6 ? '1M' : exp >= 3 ? '1K' : '1e'+exp;
    ctx.fillText(exp===0?'1':label, 4, y+4);
  }

  // X axis labels
  labels.forEach((l,i) => {
    const x = xPos(i);
    ctx.fillStyle = '#6875a8';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(l, x, H-pad.bottom+16);
  });

  // Lines
  const drawLine = (data, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v,i) => {
      const x=xPos(i), y=yPos(v);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();
    data.forEach((v,i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(xPos(i), yPos(v), 4, 0, Math.PI*2);
      ctx.fill();
    });
  };

  drawLine(classical, '#f05454');
  drawLine(quantum,   '#36e8a0');

  // Legend
  const legendY = H - 12;
  [[`Clásico (N)`, '#f05454', 140], [`Cuántico (√N iters)`, '#36e8a0', 310]].forEach(([lbl,col,lx]) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx, legendY, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#a8b0d8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(lbl, lx+10, legendY+4);
  });

  // Axis title
  ctx.fillStyle = '#6875a8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Escala logarítmica — Qubits →', W/2, H-2);
}

// ── Util ──────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
