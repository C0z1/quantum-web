// ── Quantum Simulator ─────────────────────────────────────────────
// Pure JS simulation of the three Qiskit experiments.

const SYNDROME_MAP = {
  '-1': '000000',
   '0': '001001', '1': '010010', '2': '011011',
   '3': '001110', '4': '010101', '5': '011110', '6': '001111',
};
const SYNDROME_DESC_ES = {
  '000000':'Sin error detectado',
  '001001':'Error en d[0]','010010':'Error en d[1]','011011':'Error en d[2]',
  '001110':'Error en d[3]','010101':'Error en d[4]','011110':'Error en d[5]',
  '001111':'Error en d[6]',
};
const SYNDROME_DESC_EN = {
  '000000':'No error detected',
  '001001':'Error on d[0]','010010':'Error on d[1]','011011':'Error on d[2]',
  '001110':'Error on d[3]','010101':'Error on d[4]','011110':'Error on d[5]',
  '001111':'Error on d[6]',
};

function syndromeDesc(syn) {
  return (lang === 'es' ? SYNDROME_DESC_ES : SYNDROME_DESC_EN)[syn] || syn;
}

function rng(min, max) { return min + Math.random() * (max - min); }
function noise(v, max=30) { return Math.max(0, Math.min(1024, v + (Math.random()-.5)*max)); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function groverIters(n) { return Math.max(1, Math.floor(Math.PI/4 * Math.sqrt(Math.pow(2,n)))); }

// ── GROVER SIM ─────────────────────────────────────────────────────
function simGrover(n, target, shots) {
  const N = Math.pow(2, n);
  const iters = groverIters(n);
  const theta = Math.asin(1/Math.sqrt(N));
  const angle = (2*iters+1)*theta;
  const targetProb = Math.pow(Math.sin(angle), 2);
  const otherProb = (1 - targetProb) / (N - 1);

  const targetCount = Math.round(noise(targetProb * shots, shots * .03));
  const remaining = shots - targetCount;

  const counts = {};
  const allStates = Array.from({length: Math.min(N, 32)}, (_, i) =>
    i.toString(2).padStart(n, '0')
  );

  // Only show top states when N is large
  const displayStates = N <= 32 ? allStates : allStates.slice(0, 8);

  // Distribute remaining shots
  let rem = remaining;
  displayStates.forEach((s, i) => {
    if (s === target) { counts[s] = targetCount; return; }
    if (i === displayStates.length - 1 && s !== target) {
      counts[s] = Math.max(0, rem);
    } else {
      const c = Math.round(noise(otherProb * shots, shots * .01));
      counts[s] = c;
      rem -= c;
    }
  });
  if (!counts[target]) counts[target] = targetCount;

  return {
    counts,
    targetCount,
    targetProb: (targetCount / shots * 100).toFixed(1),
    iters,
    N,
    speedup: Math.round(N / iters),
    shots,
  };
}

// ── TELEPORT SIM ───────────────────────────────────────────────────
function simTeleport(state, theta_deg, phi_deg, shots) {
  let p0, p1;
  if      (state === '0')    { p0 = 1;   p1 = 0; }
  else if (state === '1')    { p0 = 0;   p1 = 1; }
  else if (state === 'plus' || state === 'minus') { p0 = .5; p1 = .5; }
  else { // custom
    const t = theta_deg * Math.PI / 180;
    p0 = Math.pow(Math.cos(t/2), 2);
    p1 = 1 - p0;
  }

  // Bob's corrected result (with shot noise)
  const bobExpected0 = Math.round(p0 * shots);
  const bob0 = Math.round(noise(bobExpected0, shots * .025));
  const bob1 = shots - bob0;

  // Raw counts distributed across 8 outcomes (q2 q1 q0)
  const rawCounts = {};
  const pairs = ['000','001','010','011','100','101','110','111'];
  // For each alice outcome (q1 q0), bob gets corrected result
  // q2 = bob_bit, q1 = alice_bit1, q0 = alice_bit0
  let totalRaw = 0;
  pairs.forEach(s => {
    const bobRaw  = parseInt(s[0]);
    const a1 = parseInt(s[1]);
    const a0 = parseInt(s[2]);
    // After X correction: if a1=1 flip bob
    const bobCorrected = a1 ? 1-bobRaw : bobRaw;
    // Expected probability: alice bits are uniform (25% each pair), bob follows p
    const expectedBob = bobCorrected === 0 ? p0 : p1;
    const c = Math.max(0, Math.round(noise(expectedBob * shots * .25, shots*.02)));
    rawCounts[s] = c;
    totalRaw += c;
  });
  // Normalize to shots
  const scale = shots / totalRaw;
  Object.keys(rawCounts).forEach(k => rawCounts[k] = Math.round(rawCounts[k]*scale));

  const stateLabel = {
    '0':'|0⟩','1':'|1⟩','plus':'|+⟩','minus':'|−⟩',
    'custom':`custom (θ=${theta_deg}°, φ=${phi_deg}°)`
  }[state];

  return { rawCounts, bobCorrected: { '0': bob0, '1': bob1 }, p0, p1, stateLabel, shots };
}

// ── STEANE SIM ─────────────────────────────────────────────────────
function simSteane(errorQubit, shots) {
  const synKey = String(errorQubit);
  const syndrome = SYNDROME_MAP[synKey] || '000000';

  // Syndrome counts — mostly one syndrome, small noise shots
  const mainCount = Math.round(noise(shots, shots*.02));
  const syndromeCounts = { [syndrome]: mainCount };
  if (mainCount < shots) {
    const diff = shots - mainCount;
    const noiseSyn = '000000';
    if (noiseSyn !== syndrome) syndromeCounts[noiseSyn] = (syndromeCounts[noiseSyn]||0) + diff;
  }

  // Logical result after correction
  const logCorrect = Math.round(noise(shots * .988, shots*.01));
  const logicalResult = { '0': logCorrect, '1': shots - logCorrect };

  return { syndromeCounts, logicalResult, syndrome, errorQubit, shots };
}

// ── CIRCUIT SVG GENERATORS ─────────────────────────────────────────

function groverCircuitSVG(n, target) {
  // Show simplified circuit for n <= 6 otherwise schematic
  const W = Math.min(n, 4);
  const height = W * 40 + 60;
  const gateW = 26, gateH = 22;

  let svg = `<svg viewBox="0 0 560 ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;background:#0b0e1a;border-radius:8px;padding:10px;">`;

  // Wires
  for (let i = 0; i < W; i++) {
    const y = 30 + i * 40;
    svg += `<line x1="40" y1="${y}" x2="540" y2="${y}" stroke="#2a3060" stroke-width="1"/>`;
    svg += `<text x="30" y="${y+4}" text-anchor="end" font-size="11" fill="#6875a8" font-family="monospace">q${i}</text>`;
  }

  const gates = [];
  // H gates initial
  for (let i=0;i<W;i++) gates.push({wire:i,x:70,type:'H',col:'#1a2a5e',stroke:'#4d80ff'});
  // Oracle box
  svg += `<rect x="115" y="10" width="90" height="${W*40}" rx="6" fill="rgba(245,197,66,.07)" stroke="#f5c542" stroke-width=".8" stroke-dasharray="4,2"/>`;
  svg += `<text x="160" y="${W*20+8}" text-anchor="middle" font-size="10" fill="#f5c542" font-family="sans-serif">Oráculo</text>`;
  // Diffusion box
  svg += `<rect x="225" y="10" width="200" height="${W*40}" rx="6" fill="rgba(54,232,160,.05)" stroke="#36e8a0" stroke-width=".8" stroke-dasharray="4,2"/>`;
  svg += `<text x="325" y="${W*20+8}" text-anchor="middle" font-size="10" fill="#36e8a0" font-family="sans-serif">Difusión</text>`;
  // Measure
  for (let i=0;i<W;i++) gates.push({wire:i,x:460,type:'M',col:'#1e1430',stroke:'#a56bff'});

  // Render gates
  gates.forEach(g => {
    const y = 30 + g.wire*40 - gateH/2;
    svg += `<rect x="${g.x-gateW/2}" y="${y}" width="${gateW}" height="${gateH}" rx="4" fill="${g.col}" stroke="${g.stroke}" stroke-width=".8"/>`;
    const label = g.type === 'M' ? '📊' : g.type;
    svg += `<text x="${g.x}" y="${y+gateH/2+4}" text-anchor="middle" font-size="11" fill="${g.stroke}" font-family="monospace">${label}</text>`;
  });

  // Target label
  svg += `<text x="160" y="${height-8}" text-anchor="middle" font-size="10" fill="#6875a8" font-family="monospace">objetivo: |${target}⟩</text>`;
  if (n > 4) svg += `<text x="350" y="${height-8}" text-anchor="middle" font-size="10" fill="#6875a8" font-family="sans-serif">(mostrando ${W} de ${n} qubits)</text>`;

  svg += '</svg>';
  return svg;
}

function teleportCircuitSVG() {
  const W = 3, rowH = 50, y = [40, 90, 140];
  const height = W * rowH + 40;
  let svg = `<svg viewBox="0 0 600 ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;background:#0b0e1a;border-radius:8px;padding:10px;">`;

  const labels = ['q₀ msg','q₁ Alice','q₂ Bob'];
  const cols = ['#44cc88','#4488ff','#ff8844'];

  y.forEach((yi, i) => {
    svg += `<line x1="50" y1="${yi}" x2="570" y2="${yi}" stroke="#2a3060" stroke-width="1"/>`;
    svg += `<text x="44" y="${yi+4}" text-anchor="end" font-size="10" fill="${cols[i]}" font-family="monospace">${labels[i]}</text>`;
  });

  const gate = (x,wi,type,col,stroke) => {
    const gw=24,gh=20,gy=y[wi]-gh/2;
    svg+=`<rect x="${x-gw/2}" y="${gy}" width="${gw}" height="${gh}" rx="3" fill="${col}" stroke="${stroke}" stroke-width=".8"/>`;
    svg+=`<text x="${x}" y="${gy+gh/2+4}" text-anchor="middle" font-size="10" fill="${stroke}" font-family="monospace">${type}</text>`;
  };
  const ctrl = (x,w1,w2,col) => {
    svg+=`<line x1="${x}" y1="${y[w1]}" x2="${x}" y2="${y[w2]}" stroke="${col}" stroke-width="1.2"/>`;
    svg+=`<circle cx="${x}" cy="${y[w1]}" r="4" fill="${col}"/>`;
    svg+=`<circle cx="${x}" cy="${y[w2]}" r="8" fill="none" stroke="${col}" stroke-width="1.5"/>`;
    svg+=`<line x1="${x}" y1="${y[w2]-8}" x2="${x}" y2="${y[w2]+8}" stroke="${col}" stroke-width="1"/>`;
    svg+=`<line x1="${x-8}" y1="${y[w2]}" x2="${x+8}" y2="${y[w2]}" stroke="${col}" stroke-width="1"/>`;
  };
  const meas = (x,wi,col) => {
    const gw=24,gh=20,gy=y[wi]-gh/2;
    svg+=`<rect x="${x-gw/2}" y="${gy}" width="${gw}" height="${gh}" rx="3" fill="#1e1430" stroke="${col}" stroke-width=".8"/>`;
    svg+=`<text x="${x}" y="${gy+gh/2+4}" text-anchor="middle" font-size="12" fill="${col}">📊</text>`;
  };

  gate(80, 0,'H','#1a4030','#44cc88');     // msg H
  gate(140,1,'H','#1a2a5e','#4488ff');     // alice H
  ctrl(200,1,2,'#4488ff');                  // CNOT q1→q2
  ctrl(270,0,1,'#cc8800');                  // CNOT q0→q1
  gate(330,0,'H','#1a2a5e','#4488ff');     // alice H
  meas(390,0,'#f05454');
  meas(440,1,'#f05454');
  gate(500,2,'X?','#2a1a1a','#ff8844');
  gate(545,2,'Z?','#2a1430','#a56bff');

  const sections = [
    {x:65,w:45,label:'Prep',col:'#44cc88'},
    {x:125,w:90,label:'Par Bell',col:'#4488ff'},
    {x:255,w:90,label:'Alice ops',col:'#cc8800'},
    {x:375,w:90,label:'Medir',col:'#f05454'},
    {x:485,w:75,label:'Bob corrige',col:'#ff8844'},
  ];
  sections.forEach(s => {
    svg+=`<rect x="${s.x}" y="${height-22}" width="${s.w}" height="14" rx="3" fill="transparent"/>`;
    svg+=`<text x="${s.x+s.w/2}" y="${height-10}" text-anchor="middle" font-size="9" fill="${s.col}" font-family="sans-serif">${s.label}</text>`;
  });

  svg += '</svg>';
  return svg;
}

function steaneCircuitSVG(errorQubit) {
  const height = 120;
  let svg = `<svg viewBox="0 0 620 ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;background:#0b0e1a;border-radius:8px;padding:10px;">`;

  // Data qubits row
  svg += `<line x1="10" y1="35" x2="610" y2="35" stroke="#2a3060" stroke-width="1"/>`;
  svg += `<text x="6" y="39" text-anchor="end" font-size="9" fill="#6875a8" font-family="monospace">d[0..6]</text>`;
  // Ancilla row
  svg += `<line x1="10" y1="75" x2="610" y2="75" stroke="#1a3020" stroke-width="1"/>`;
  svg += `<text x="6" y="79" text-anchor="end" font-size="9" fill="#36a87a" font-family="monospace">a[0..5]</text>`;

  const box = (x,y,w,h,label,fill,stroke) => {
    svg+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width=".8"/>`;
    svg+=`<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="10" fill="${stroke}" font-family="monospace">${label}</text>`;
  };

  box(20, 22, 60, 26, 'Encode', '#0d1e30','#4d80ff');
  const errCol = errorQubit >= 0 ? '#f05454' : '#36e8a0';
  const errLabel = errorQubit >= 0 ? `X d[${errorQubit}]` : 'no err';
  box(100, 22, 70, 26, errLabel, errorQubit>=0?'#2a0a0a':'#0a2a1a', errCol);
  box(190, 22, 80, 60, 'Síndrome', '#1a1a2a','#a56bff');
  box(290, 22, 60, 26, 'Medir', '#1e1430','#a56bff');
  box(290, 62, 60, 26, 'Medir', '#0d2010','#36e8a0');
  box(370, 22, 80, 26, 'Corregir', '#0a2a0a','#36e8a0');
  box(470, 22, 60, 26, 'Medir q_L', '#1e1430','#f5c542');

  // Connect lines
  svg+=`<line x1="270" y1="35" x2="290" y2="35" stroke="#a56bff" stroke-width=".8"/>`;
  svg+=`<line x1="270" y1="75" x2="290" y2="75" stroke="#a56bff" stroke-width=".8"/>`;
  svg+=`<line x1="350" y1="35" x2="370" y2="35" stroke="#36e8a0" stroke-width=".8" stroke-dasharray="3,2"/>`;
  svg+=`<line x1="450" y1="35" x2="470" y2="35" stroke="#f5c542" stroke-width=".8"/>`;

  // Labels at bottom
  svg+=`<text x="310" y="${height-5}" text-anchor="middle" font-size="9" fill="#6875a8" font-family="sans-serif">13 qubits total (7 datos + 6 ancillas)</text>`;

  svg += '</svg>';
  return svg;
}
