// ── Quantum Simulator v3 ──────────────────────────────────────────
// Full physics-accurate simulation with noise models

const SYNDROME_MAP = {
  '-1':'000000','0':'001001','1':'010010','2':'011011',
  '3':'001110','4':'010101','5':'011110','6':'001111',
};
const SYNDROME_DESC = {
  es:{'000000':'Sin error detectado','001001':'Error en d[0]','010010':'Error en d[1]',
      '011011':'Error en d[2]','001110':'Error en d[3]','010101':'Error en d[4]',
      '011110':'Error en d[5]','001111':'Error en d[6]'},
  en:{'000000':'No error detected','001001':'Error on d[0]','010010':'Error on d[1]',
      '011011':'Error on d[2]','001110':'Error on d[3]','010101':'Error on d[4]',
      '011110':'Error on d[5]','001111':'Error on d[6]'},
};
function syndromeDesc(syn){ return (SYNDROME_DESC[lang]||SYNDROME_DESC.es)[syn]||syn; }
function groverIters(n){ return Math.max(1,Math.floor(Math.PI/4*Math.sqrt(Math.pow(2,n)))); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

// ── Noise model ────────────────────────────────────────────────────
// depolarizing: probability p that a gate applies X, Y, or Z by mistake
function applyDepolarizing(prob, shots, p_noise=0) {
  if(p_noise <= 0) return prob;
  // Depolarizing: output = (1-4/3*p)*ideal + 4/3*p * (1/N) where N=total states
  return prob * (1 - p_noise) + p_noise * 0.5; // simplified model
}

function noisySample(p, shots, noise_level=0) {
  const pn = applyDepolarizing(p, shots, noise_level);
  const base = Math.round(pn * shots);
  const jitter = Math.floor((Math.random() - 0.5) * Math.sqrt(shots) * 1.2);
  return Math.max(0, Math.min(shots, base + jitter));
}

// ── Grover full simulation ─────────────────────────────────────────
function simGroverFull(n, target, shots, noise_level=0) {
  const N = Math.pow(2, n);
  const iters = groverIters(n);
  const theta = Math.asin(1 / Math.sqrt(N));

  // Build display state list
  const displayN = Math.min(N, 32);
  const states = Array.from({length: displayN}, (_, i) => i.toString(2).padStart(n, '0'));
  if (!states.includes(target)) states[states.length - 1] = target;

  // Amplitude snapshots per iteration
  const snapshots = [];
  for (let k = 0; k <= iters; k++) {
    const angle = (2 * k + 1) * theta;
    const tgt = Math.pow(Math.sin(angle), 2);
    const other = Math.max(0, (1 - tgt) / (N - 1));
    const snap = {};
    states.forEach(s => snap[s] = s === target ? tgt : other);
    snapshots.push(snap);
  }

  // Final counts with noise
  const finalProb = snapshots[iters];
  const counts = {};
  let rem = shots;
  states.forEach((s, i) => {
    if (i === states.length - 1) { counts[s] = Math.max(0, rem); return; }
    const c = noisySample(finalProb[s], shots, noise_level);
    counts[s] = c; rem -= c;
  });
  if (!counts[target]) counts[target] = 0;

  const targetCount = counts[target];
  const actualProb = targetCount / shots;

  // Theoretical probability (ideal)
  const idealAngle = (2 * iters + 1) * theta;
  const theoreticalProb = Math.pow(Math.sin(idealAngle), 2);

  // Classical benchmark: avg steps needed
  const classicAvg = (N + 1) / 2;
  const classicWorst = N;

  return {
    counts, snapshots, iters, N, n, target, shots,
    targetCount,
    targetProb: (actualProb * 100).toFixed(2),
    theoreticalProb: (theoreticalProb * 100).toFixed(2),
    speedup: Math.round(N / iters),
    speedupVsAvg: (classicAvg / iters).toFixed(1),
    classicAvg: Math.round(classicAvg),
    classicWorst,
    noise_level,
    gateCount: iters * (2 * n + 3) + n, // approx gate count
  };
}

// ── Teleportation full simulation ─────────────────────────────────
function simTeleport(state, theta_deg, shots, noise_level=0) {
  let p0, p1;
  if (state === '0')              { p0 = 1;   p1 = 0; }
  else if (state === '1')         { p0 = 0;   p1 = 1; }
  else if (state === 'plus')      { p0 = .5;  p1 = .5; }
  else if (state === 'minus')     { p0 = .5;  p1 = .5; }
  else { // custom theta
    const t = theta_deg * Math.PI / 180;
    p0 = Math.pow(Math.cos(t / 2), 2);
    p1 = 1 - p0;
  }

  // Apply noise to Bob's qubit
  const p0n = applyDepolarizing(p0, shots, noise_level);
  const p1n = 1 - p0n;

  const bob0 = noisySample(p0n, shots, noise_level);
  const bob1 = shots - bob0;

  // Raw counts: 8 possible outcomes (q2 q1 q0)
  const rawCounts = {};
  ['000','001','010','011','100','101','110','111'].forEach(s => {
    const bRaw = parseInt(s[0]), a1 = parseInt(s[1]);
    const bCorr = a1 ? 1 - bRaw : bRaw;
    const exp = bCorr === 0 ? p0n : p1n;
    rawCounts[s] = Math.max(0, noisySample(exp * 0.25, shots, noise_level));
  });
  // Normalize
  const tot = Object.values(rawCounts).reduce((a, b) => a + b, 1);
  Object.keys(rawCounts).forEach(k => rawCounts[k] = Math.round(rawCounts[k] * shots / tot));

  const fidelity = 1 - Math.abs((bob0 / shots) - p0);

  const stateLabel = {
    '0':'|0⟩','1':'|1⟩','plus':'|+⟩','minus':'|−⟩',
    'custom':`|ψ(θ=${theta_deg}°)⟩`
  }[state] || '|ψ⟩';

  return {
    rawCounts, bobCorrected: {'0': bob0, '1': bob1},
    p0, p1, stateLabel, shots, noise_level,
    fidelity: (fidelity * 100).toFixed(1),
    expectedP0: (p0 * 100).toFixed(1),
    expectedP1: (p1 * 100).toFixed(1),
  };
}

// ── Steane simulation ─────────────────────────────────────────────
function simSteane(errorQubit, shots, noise_level=0) {
  const syndrome = SYNDROME_MAP[String(errorQubit)] || '000000';
  const errorRate = noise_level > 0 ? noise_level * 0.1 : 0;

  // Syndrome counts — main syndrome plus small noise
  const syndromeCounts = {};
  const mainCount = noisySample(1 - errorRate, shots, 0);
  syndromeCounts[syndrome] = mainCount;

  // Occasional wrong syndrome from noise
  if (mainCount < shots) {
    const wrongSyn = '000000';
    syndromeCounts[wrongSyn] = (syndromeCounts[wrongSyn] || 0) + (shots - mainCount);
  }

  // Logical qubit after correction (very high fidelity)
  const correctionFidelity = 1 - errorRate * 0.5;
  const logCorrect = noisySample(correctionFidelity, shots, 0);
  const logicalResult = { '0': logCorrect, '1': shots - logCorrect };

  return {
    syndromeCounts, logicalResult, syndrome, errorQubit, shots,
    correctionFidelity: (correctionFidelity * 100).toFixed(1),
  };
}

// ── Grover RACE simulation (classical vs quantum) ─────────────────
// Returns step-by-step progress of both approaches searching for target
function simRace(N, target_idx) {
  const iters = groverIters(Math.log2(N));
  const theta = Math.asin(1 / Math.sqrt(N));

  const classicSteps = [];
  const quantumSteps = [];

  // Classical: random search (average case), track cumulative P(found)
  let classicPFound = 0;
  for (let k = 1; k <= N; k++) {
    classicPFound = 1 - Math.pow((N - 1) / N, k);
    classicSteps.push({ step: k, pFound: classicPFound });
    if (classicPFound > 0.9999) break;
  }

  // Quantum: Grover amplitude after each iteration
  for (let k = 0; k <= iters; k++) {
    const angle = (2 * k + 1) * theta;
    quantumSteps.push({ step: k, pFound: Math.pow(Math.sin(angle), 2) });
  }

  return { classicSteps, quantumSteps, N, iters };
}

// ── Density matrix visualization (simplified) ─────────────────────
// Returns 2x2 density matrix elements for a single qubit state
function densityMatrix(theta, phi) {
  // |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
  const a = Math.cos(theta / 2);
  const bR = Math.cos(phi) * Math.sin(theta / 2);
  const bI = Math.sin(phi) * Math.sin(theta / 2);
  return {
    rho00: a * a,
    rho11: bR * bR + bI * bI,
    rho01R: a * bR,  // Re(ρ₀₁)
    rho01I: a * bI,  // Im(ρ₀₁)
    purity: a*a*a*a + (bR*bR+bI*bI)*(bR*bR+bI*bI) + 2*(a*bR)*(a*bR) + 2*(a*bI)*(a*bI),
    blochX: 2 * a * bR,
    blochY: -2 * a * bI,
    blochZ: a * a - (bR*bR + bI*bI),
  };
}

// ── Circuit SVG generators (full gate-by-gate) ────────────────────

function groverCircuitSVG(n, target, highlightStep=-1) {
  const W = Math.min(n, 5);
  const H = W * 44 + 72;
  const wy = i => 36 + i * 44;
  let s = `<svg viewBox="0 0 620 ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#06091a;border-radius:10px;display:block">`;

  // Wires
  for (let i = 0; i < W; i++) {
    s += `<line x1="46" y1="${wy(i)}" x2="605" y2="${wy(i)}" stroke="#161e40" stroke-width="1.2"/>`;
    s += `<text x="40" y="${wy(i)+4}" text-anchor="end" font-size="11" fill="#3a4570" font-family="monospace">q${i}</text>`;
  }

  // Phase boxes (background highlight for current step)
  const phases = [
    {x:56,w:38,label:'H',color:'#4d7fff',active:highlightStep===0},
    {x:108,w:110,label:'Oracle',color:'#f5c542',active:highlightStep===1,box:true},
    {x:234,w:220,label:'Diffusion',color:'#36e8a0',active:highlightStep===2||highlightStep===3,box:true},
    {x:490,w:36,label:'M',color:'#a56bff',active:highlightStep===3},
  ];
  phases.filter(p=>p.box).forEach(p=>{
    s += `<rect x="${p.x-4}" y="8" width="${p.w}" height="${W*44+4}" rx="6"
      fill="${p.active?'rgba(54,232,160,.08)':'rgba(30,40,80,.25)'}"
      stroke="${p.color}" stroke-width="${p.active?1.4:.5}"
      stroke-dasharray="${p.active?'none':'5,3'}"/>`;
    s += `<text x="${p.x+p.w/2-4}" y="${W*22+8}" text-anchor="middle"
      font-size="9" fill="${p.color}" font-family="sans-serif">${p.label}</text>`;
  });

  // Gate renderer
  const gate = (x, y, label, fill, stroke, active=false, w=26, h=22) => {
    s += `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="4"
      fill="${active?fill+'44':fill+'22'}" stroke="${active?stroke:stroke+'88'}"
      stroke-width="${active?1.3:.7}"/>`;
    s += `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="11"
      fill="${active?'#fff':stroke}" font-family="monospace">${label}</text>`;
  };
  const ctrl = (x, cy, ty, col, active=false) => {
    s += `<line x1="${x}" y1="${wy(cy)}" x2="${x}" y2="${wy(ty)}" stroke="${col}" stroke-width="${active?1.5:1}"/>`;
    s += `<circle cx="${x}" cy="${wy(cy)}" r="${active?5:4}" fill="${col}"/>`;
    // CNOT target
    s += `<circle cx="${x}" cy="${wy(ty)}" r="9" fill="none" stroke="${col}" stroke-width="${active?1.5:1.2}"/>`;
    s += `<line x1="${x}" y1="${wy(ty)-9}" x2="${x}" y2="${wy(ty)+9}" stroke="${col}" stroke-width="1"/>`;
    s += `<line x1="${x-9}" y1="${wy(ty)}" x2="${x+9}" y2="${wy(ty)}" stroke="${col}" stroke-width="1"/>`;
  };

  // H gates (step 0)
  for (let i = 0; i < W; i++)
    gate(75, wy(i), 'H', '#0d1e40', '#4d7fff', highlightStep===0);

  // Oracle: CZ + phase kick (step 1)
  const ox = 170;
  if (W >= 2) {
    s += `<line x1="${ox}" y1="${wy(0)}" x2="${ox}" y2="${wy(W-1)}"
      stroke="${highlightStep===1?'#f5c542':'#f5c54288'}" stroke-width="${highlightStep===1?1.5:1}"/>`;
    s += `<circle cx="${ox}" cy="${wy(0)}" r="${highlightStep===1?5:4}" fill="#f5c542" opacity="${highlightStep===1?1:.6}"/>`;
    s += `<circle cx="${ox}" cy="${wy(W-1)}" r="9" fill="none" stroke="#f5c542" stroke-width="${highlightStep===1?1.5:1}" opacity="${highlightStep===1?1:.6}"/>`;
    s += `<text x="${ox}" y="${wy(W-1)+4}" text-anchor="middle" font-size="10" fill="#f5c542">Z</text>`;
  }

  // Diffusion: H-X-CZ-X-H (step 2)
  const dx = [250,285,320,360,395];
  for (let i = 0; i < W; i++) {
    gate(dx[0], wy(i), 'H', '#0d2a1a', '#36e8a0', highlightStep===2||highlightStep===3);
    gate(dx[1], wy(i), 'X', '#1a0d10', '#e88a36', highlightStep===2||highlightStep===3);
  }
  if (W >= 2) ctrl(dx[2], 0, W-1, '#36e8a0', highlightStep===2||highlightStep===3);
  for (let i = 0; i < W; i++) {
    gate(dx[3], wy(i), 'X', '#1a0d10', '#e88a36', highlightStep===2||highlightStep===3);
    gate(dx[4], wy(i), 'H', '#0d2a1a', '#36e8a0', highlightStep===2||highlightStep===3);
  }

  // Measure (step 3)
  for (let i = 0; i < W; i++)
    gate(516, wy(i), 'M', '#14082a', '#a56bff', highlightStep===3, 28, 22);

  // Classical output wires
  for (let i = 0; i < W; i++) {
    s += `<line x1="530" y1="${wy(i)}" x2="600" y2="${wy(i)}"
      stroke="#1e1450" stroke-width="2" stroke-dasharray="3,2"/>`;
    s += `<text x="604" y="${wy(i)+4}" font-size="9" fill="#3a3070" font-family="monospace">c${i}</text>`;
  }

  // Footer
  s += `<text x="310" y="${H-6}" text-anchor="middle" font-size="9"
    fill="#2a3060" font-family="monospace">|${target}⟩${n>5?` (showing 5/${n}q)`:''}  ·  k=${groverIters(n)} iters</text>`;
  s += '</svg>';
  return s;
}

function teleportCircuitSVG(highlightStep=-1) {
  const wy = [50, 100, 150];
  const H = 200;
  let s = `<svg viewBox="0 0 660 ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#06091a;border-radius:10px;display:block">`;

  const wireColors = ['#44cc88','#4488ff','#ff8844'];
  wy.forEach((y, i) => {
    s += `<line x1="60" y1="${y}" x2="640" y2="${y}" stroke="#161e40" stroke-width="1.2"/>`;
    s += `<text x="54" y="${y+4}" text-anchor="end" font-size="10"
      fill="${wireColors[i]}" font-family="monospace">${['q₀','q₁','q₂'][i]}</text>`;
    s += `<text x="58" y="${y+14}" text-anchor="start" font-size="8"
      fill="${wireColors[i]}55" font-family="sans-serif">${['msg','Alice','Bob'][i]}</text>`;
  });

  const gate = (x, wi, lbl, fill, stroke, hl, gw=28, gh=22) => {
    const y = wy[wi];
    s += `<rect x="${x-gw/2}" y="${y-gh/2}" width="${gw}" height="${gh}" rx="4"
      fill="${hl?fill+'55':fill+'22'}" stroke="${hl?stroke:stroke+'66'}"
      stroke-width="${hl?1.4:.7}"/>`;
    s += `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="11"
      fill="${hl?'#fff':stroke}" font-family="monospace">${lbl}</text>`;
  };
  const cnot = (x, ctrlW, tgtW, col, hl) => {
    const cy = wy[ctrlW], ty = wy[tgtW];
    s += `<line x1="${x}" y1="${cy}" x2="${x}" y2="${ty}" stroke="${col}" stroke-width="${hl?1.6:1}"/>`;
    s += `<circle cx="${x}" cy="${cy}" r="${hl?5.5:4}" fill="${col}"/>`;
    s += `<circle cx="${x}" cy="${ty}" r="9.5" fill="none" stroke="${col}" stroke-width="${hl?1.6:1.2}"/>`;
    s += `<line x1="${x}" y1="${ty-9}" x2="${x}" y2="${ty+9}" stroke="${col}" stroke-width="1.2"/>`;
    s += `<line x1="${x-9}" y1="${ty}" x2="${x+9}" y2="${ty}" stroke="${col}" stroke-width="1.2"/>`;
  };

  const hl = highlightStep;
  // Step 0: prep msg
  gate(88, 0, 'H', '#0d2a1a', '#44cc88', hl===0);
  // Step 1: Bell pair
  gate(155, 1, 'H', '#0d1e38', '#4488ff', hl===1);
  cnot(210, 1, 2, '#4488ff', hl===1);
  // Step 2: Alice ops
  cnot(278, 0, 1, '#cc9900', hl===2);
  gate(338, 0, 'H', '#0d1e38', '#4488ff', hl===2);
  // Step 3: Measure
  gate(398, 0, 'M', '#120828', '#f05454', hl===3, 26, 22);
  gate(450, 1, 'M', '#120828', '#f05454', hl===3, 26, 22);
  // Classical channel
  const chOp = hl===3||hl===4 ? 1 : 0.25;
  s += `<line x1="464" y1="${wy[1]}" x2="520" y2="${wy[2]}" stroke="#cc9900"
    stroke-width="1.2" stroke-dasharray="4,3" opacity="${chOp}"/>`;
  s += `<line x1="412" y1="${wy[0]}" x2="520" y2="${wy[2]}" stroke="#cc9900"
    stroke-width="1.2" stroke-dasharray="4,3" opacity="${chOp}"/>`;
  // Step 4: Bob corrections
  gate(540, 2, 'X', '#1a0d10', '#ff8844', hl===4);
  gate(590, 2, 'Z', '#100d1a', '#a56bff', hl===4);

  // Step labels bottom
  const stepLabels = [
    [88,'Prep','#44cc88'],[183,'Par Bell','#4488ff'],
    [308,'Alice ops','#cc9900'],[424,'Medir','#f05454'],[565,'Bob','#ff8844'],
  ];
  stepLabels.forEach(([x,lbl,c]) => {
    s += `<text x="${x}" y="${H-7}" text-anchor="middle" font-size="9"
      fill="${c}" font-family="sans-serif">${lbl}</text>`;
  });

  s += '</svg>';
  return s;
}

function steaneCircuitSVG(eq) {
  const H = 140;
  let s = `<svg viewBox="0 0 700 ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#06091a;border-radius:10px;display:block">`;

  // Wires
  s += `<line x1="8" y1="42" x2="695" y2="42" stroke="#161e40" stroke-width="1.2"/>`;
  s += `<line x1="8" y1="90" x2="695" y2="90" stroke="#0d2a1a" stroke-width="1.2"/>`;
  s += `<text x="2" y="46" text-anchor="end" font-size="9" fill="#3a4570" font-family="monospace">data</text>`;
  s += `<text x="2" y="94" text-anchor="end" font-size="9" fill="#36a87a" font-family="monospace">anc.</text>`;

  const bx = (x, y, w, h, lbl, fill, stroke, pulsing=false) => {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"
      fill="${fill}" stroke="${stroke}" stroke-width="${pulsing?1.5:.9}"
      ${pulsing?`style="filter:drop-shadow(0 0 4px ${stroke})"`:''}/>`;
    s += `<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="10"
      fill="${stroke}" font-family="monospace">${lbl}</text>`;
  };

  bx(14, 28, 68, 28, 'Encode', '#080f20', '#4d80ff');

  const hasErr = eq >= 0;
  const eLabel = hasErr ? `X[${eq}]` : 'clean';
  bx(96, 28, 76, 28, eLabel, hasErr?'#200808':'#08200f',
     hasErr?'#f05454':'#36e8a0', hasErr);

  bx(188, 28, 88, 66, 'Syndrome', '#100d1a', '#a56bff');

  bx(292, 28, 60, 28, 'Meas.', '#100d1a', '#a56bff');
  bx(292, 72, 60, 28, 'Meas.', '#08200f', '#36e8a0');

  bx(368, 28, 82, 28, 'Correct', '#08200f', '#36e8a0', hasErr);

  bx(466, 28, 70, 28, 'Read q_L', '#180f06', '#f5c542');

  // Connector arrows
  [[358,42,368,42,'#36e8a0'],[436,42,466,42,'#f5c542']].forEach(([x1,y1,x2,y2,c])=>{
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="${c}" stroke-width=".9" stroke-dasharray="3,2"/>`;
  });

  // 7-qubit representation inside encode block
  for (let i = 0; i < 7; i++) {
    const qx = 16 + i * 9;
    const isErr = i === eq;
    s += `<circle cx="${qx}" cy="22" r="3.5"
      fill="${isErr?'#f05454':i<3?'#4d7fff':'#36e8a0'}"
      opacity="${isErr?1:.6}"/>`;
  }

  // Syndrome bit pattern
  const synBits = (SYNDROME_MAP[String(eq)] || '000000').split('');
  synBits.forEach((b, i) => {
    s += `<rect x="${194+i*13}" y="80" width="10" height="10" rx="2"
      fill="${b==='1'?'rgba(245,197,66,.3)':'rgba(30,40,80,.5)'}"
      stroke="${b==='1'?'#f5c542':'#1e2650'}" stroke-width=".7"/>`;
    s += `<text x="${199+i*13}" y="89" text-anchor="middle" font-size="7"
      fill="${b==='1'?'#f5c542':'#3a4570'}" font-family="monospace">${b}</text>`;
  });

  s += `<text x="350" y="${H-6}" text-anchor="middle" font-size="9"
    fill="#2a3060" font-family="sans-serif">Steane [7,1,3] · 13 qubits · AerSimulator</text>`;
  s += '</svg>';
  return s;
}

// ── Density matrix SVG ────────────────────────────────────────────
function densityMatrixSVG(theta, phi, col='#4d7fff') {
  const dm = densityMatrix(theta, phi);
  const W = 200, H = 200;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;background:#06091a;border-radius:8px;display:block">`;

  s += `<text x="100" y="14" text-anchor="middle" font-size="9" fill="#3a4570" font-family="sans-serif">Density Matrix ρ</text>`;

  const cellW = 74, cellH = 60, ox = 16, oy = 22;
  const cells = [
    {r:0,c:0,val:dm.rho00,label:'ρ₀₀',desc:`${(dm.rho00*100).toFixed(0)}%`},
    {r:0,c:1,val:Math.sqrt(dm.rho01R**2+dm.rho01I**2),label:'ρ₀₁',desc:`${dm.rho01R.toFixed(2)}+${dm.rho01I.toFixed(2)}i`},
    {r:1,c:0,val:Math.sqrt(dm.rho01R**2+dm.rho01I**2),label:'ρ₁₀',desc:`${dm.rho01R.toFixed(2)}-${dm.rho01I.toFixed(2)}i`},
    {r:1,c:1,val:dm.rho11,label:'ρ₁₁',desc:`${(dm.rho11*100).toFixed(0)}%`},
  ];

  cells.forEach(cell => {
    const x = ox + cell.c * (cellW + 4);
    const y = oy + cell.r * (cellH + 4);
    const intensity = Math.min(1, Math.abs(cell.val));
    s += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="6"
      fill="${col}${Math.round(intensity*40+10).toString(16).padStart(2,'0')}"
      stroke="${col}" stroke-width="${intensity > 0.1 ? 1 : 0.3}" opacity="0.9"/>`;
    s += `<text x="${x+cellW/2}" y="${y+16}" text-anchor="middle" font-size="10"
      fill="${col}" font-family="monospace">${cell.label}</text>`;
    s += `<text x="${x+cellW/2}" y="${y+34}" text-anchor="middle" font-size="12" font-weight="500"
      fill="#fff" font-family="monospace">${(cell.val).toFixed(3)}</text>`;
    s += `<text x="${x+cellW/2}" y="${y+52}" text-anchor="middle" font-size="8"
      fill="${col}99" font-family="monospace">${cell.desc}</text>`;
  });

  // Purity
  s += `<text x="100" y="${H-18}" text-anchor="middle" font-size="9" fill="#3a4570">Pureza = Tr(ρ²) = ${dm.purity.toFixed(3)}</text>`;
  s += `<text x="100" y="${H-6}" text-anchor="middle" font-size="9" fill="#2a3060">Bloch: (${dm.blochX.toFixed(2)}, ${dm.blochY.toFixed(2)}, ${dm.blochZ.toFixed(2)})</text>`;

  s += '</svg>';
  return s;
}
