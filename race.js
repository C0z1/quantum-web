// ── Grover vs Classical Race ──────────────────────────────────────

let raceAnimFrame = null;
let raceRunning = false;

function openRace() {
  let modal = document.getElementById('race-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'race-modal';
    modal.style.cssText = `position:fixed;inset:0;z-index:500;background:rgba(4,6,15,.94);
      backdrop-filter:blur(18px);display:flex;align-items:center;justify-content:center;
      padding:20px;animation:fadeModalIn .25s ease`;
    modal.innerHTML = `
    <style>
      @keyframes fadeModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
      #race-inner{background:#080d1e;border:1px solid rgba(80,120,255,.2);border-radius:16px;
        padding:24px;max-width:820px;width:100%;max-height:88vh;overflow-y:auto}
      .race-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
      .race-title{font-size:18px;font-weight:300;color:#fff}
      .race-close{background:transparent;border:1px solid rgba(80,120,255,.2);color:#4a5480;
        border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px}
      .race-close:hover{border-color:#4d7fff;color:#fff}
      .race-controls{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;align-items:center}
      .race-select{background:rgba(4,6,15,.8);border:1px solid rgba(80,120,255,.26);
        border-radius:8px;padding:7px 11px;color:#d0d8ff;font-size:13px;outline:none}
      .race-run{padding:9px 24px;border-radius:9px;background:rgba(77,127,255,.2);
        border:1px solid rgba(77,127,255,.4);color:#fff;font-size:13px;cursor:pointer;transition:.15s}
      .race-run:hover{background:rgba(77,127,255,.35)}
      .race-canvas{width:100%;border-radius:10px;background:#06091a;display:block}
      .race-legend{display:flex;gap:20px;margin-top:10px;font-size:12px;color:#4a5480}
      .race-leg{display:flex;align-items:center;gap:6px}
      .race-dot{width:10px;height:10px;border-radius:50%}
      .race-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
      .rstat{background:#0d1428;border:1px solid rgba(80,120,255,.15);border-radius:9px;
        padding:10px 14px;text-align:center}
      .rstat-v{font-size:18px;font-weight:500;font-family:monospace;color:#fff;line-height:1}
      .rstat-l{font-size:10px;color:#4a5480;margin-top:3px}
    </style>
    <div id="race-inner">
      <div class="race-header">
        <span class="race-title">🏁 Grover vs Clásico — Race</span>
        <button class="race-close" onclick="closeRace()">✕</button>
      </div>
      <div class="race-controls">
        <label style="font-size:12px;color:#4a5480">Qubits:</label>
        <select class="race-select" id="race-n">
          <option value="2">2q (N=4)</option>
          <option value="4">4q (N=16)</option>
          <option value="6">6q (N=64)</option>
          <option value="8" selected>8q (N=256)</option>
          <option value="10">10q (N=1024)</option>
          <option value="12">12q (N=4096)</option>
        </select>
        <label style="font-size:12px;color:#4a5480">Velocidad:</label>
        <select class="race-select" id="race-speed">
          <option value="30">Lenta</option>
          <option value="16" selected>Normal</option>
          <option value="8">Rápida</option>
          <option value="2">Turbo</option>
        </select>
        <button class="race-run" onclick="startRace()">▶ Iniciar carrera</button>
        <button class="race-run" onclick="resetRace()" style="background:transparent;border-color:rgba(80,120,255,.2)">↺ Reset</button>
      </div>
      <canvas id="race-canvas" class="race-canvas" height="280"></canvas>
      <div class="race-legend">
        <div class="race-leg"><div class="race-dot" style="background:#f05454"></div>Búsqueda clásica (aleatorio)</div>
        <div class="race-leg"><div class="race-dot" style="background:#36e8a0"></div>Grover cuántico</div>
        <div class="race-leg"><div class="race-dot" style="background:#f5c54266;border:1px solid #f5c542"></div>Umbral 95% encontrado</div>
      </div>
      <div class="race-stats">
        <div class="rstat"><div class="rstat-v" id="rs-classic">—</div><div class="rstat-l">Pasos clásicos</div></div>
        <div class="rstat"><div class="rstat-v" id="rs-quantum">—</div><div class="rstat-l">Iteraciones Grover</div></div>
        <div class="rstat"><div class="rstat-v" id="rs-speedup" style="color:#36e8a0">—</div><div class="rstat-l">Speedup</div></div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeRace(); });
  }
  modal.style.display = 'flex';
  resetRace();
}

function closeRace() {
  cancelAnimationFrame(raceAnimFrame);
  raceRunning = false;
  const m = document.getElementById('race-modal');
  if (m) m.style.display = 'none';
}

let raceState = null;

function resetRace() {
  cancelAnimationFrame(raceAnimFrame);
  raceRunning = false;
  raceState = null;
  const canvas = document.getElementById('race-canvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth - 48 || 740;
  drawRaceEmpty(canvas);
  document.getElementById('rs-classic').textContent = '—';
  document.getElementById('rs-quantum').textContent = '—';
  document.getElementById('rs-speedup').textContent = '—';
}

function drawRaceEmpty(canvas) {
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#06091a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1e2650'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Presiona ▶ para iniciar la carrera', W/2, H/2);
}

function startRace() {
  const n = parseInt(document.getElementById('race-n').value);
  const speed = parseInt(document.getElementById('race-speed').value);
  const N = Math.pow(2, n);
  const iters = groverIters(n);
  const data = simRace(N, N - 1);

  raceState = {
    n, N, iters, speed,
    classicSteps: data.classicSteps,
    quantumSteps: data.quantumSteps,
    classicIdx: 0,
    quantumIdx: 0,
    frame: 0,
    classicDone: false,
    quantumDone: false,
    classicFoundAt: null,
    quantumFoundAt: null,
    history: { classic: [], quantum: [] },
  };
  raceRunning = true;
  raceAnimFrame = requestAnimationFrame(raceLoop);
}

function raceLoop() {
  if (!raceRunning || !raceState) return;
  const rs = raceState;
  const canvas = document.getElementById('race-canvas');
  if (!canvas) return;

  canvas.width = canvas.parentElement?.clientWidth - 48 || 740;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;

  // Advance state
  if (rs.frame % rs.speed === 0) {
    if (!rs.classicDone && rs.classicIdx < rs.classicSteps.length) {
      const step = rs.classicSteps[rs.classicIdx];
      rs.history.classic.push({ x: rs.classicIdx, y: step.pFound });
      if (step.pFound >= 0.95 && !rs.classicFoundAt) {
        rs.classicFoundAt = rs.classicIdx + 1;
      }
      if (step.pFound >= 0.9999) rs.classicDone = true;
      rs.classicIdx++;
    }
    if (!rs.quantumDone && rs.quantumIdx < rs.quantumSteps.length) {
      const step = rs.quantumSteps[rs.quantumIdx];
      rs.history.quantum.push({ x: rs.quantumIdx, y: step.pFound });
      if (step.pFound >= 0.95 && !rs.quantumFoundAt) {
        rs.quantumFoundAt = rs.quantumIdx;
      }
      if (rs.quantumIdx >= rs.iters) rs.quantumDone = true;
      rs.quantumIdx++;
    }
  }
  rs.frame++;

  // Draw
  drawRaceFrame(ctx, W, H, rs);

  if (rs.classicDone && rs.quantumDone) {
    raceRunning = false;
    document.getElementById('rs-classic').textContent = rs.classicFoundAt?.toLocaleString() || rs.N.toLocaleString();
    document.getElementById('rs-quantum').textContent = rs.iters;
    const sp = rs.classicFoundAt ? Math.round(rs.classicFoundAt / rs.iters) : Math.round(rs.N / rs.iters);
    document.getElementById('rs-speedup').textContent = sp.toLocaleString() + '×';
    showToast(`🏁 Grover ganó! ${sp.toLocaleString()}× más rápido`);
    if (audioOn) QAudio.success();
    return;
  }
  raceAnimFrame = requestAnimationFrame(raceLoop);
}

function drawRaceFrame(ctx, W, H, rs) {
  const pad = { l: 56, r: 20, t: 20, b: 36 };
  ctx.fillStyle = '#06091a'; ctx.fillRect(0, 0, W, H);

  const maxX = Math.max(rs.classicSteps.length, rs.quantumSteps.length, 1);

  // Grid
  [0, 0.25, 0.5, 0.75, 0.95, 1].forEach(v => {
    const y = H - pad.b - v * (H - pad.t - pad.b);
    ctx.strokeStyle = v === 0.95 ? 'rgba(245,197,66,.2)' : 'rgba(80,120,255,.07)';
    ctx.lineWidth = v === 0.95 ? 1 : 0.5;
    ctx.setLineDash(v === 0.95 ? [4, 4] : []);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = v === 0.95 ? '#f5c542' : '#2a3060';
    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText((v * 100).toFixed(0) + '%', pad.l - 3, y + 3);
  });

  const xPos = idx => pad.l + (idx / maxX) * (W - pad.l - pad.r);
  const yPos = p => H - pad.b - p * (H - pad.t - pad.b);

  // Draw lines
  [
    { history: rs.history.classic, col: '#f05454' },
    { history: rs.history.quantum, col: '#36e8a0' },
  ].forEach(({ history, col }) => {
    if (history.length < 2) return;
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = xPos(pt.x), y = yPos(pt.y);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Current head
    const last = history[history.length - 1];
    ctx.beginPath(); ctx.arc(xPos(last.x), yPos(last.y), 5, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
  });

  // Axis label
  ctx.fillStyle = '#2a3060'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Pasos / Iteraciones →', W / 2, H - 4);
  ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('P(encontrado)', 0, 0); ctx.restore();

  // Live labels
  const lastC = rs.history.classic[rs.history.classic.length - 1];
  const lastQ = rs.history.quantum[rs.history.quantum.length - 1];
  if (lastC) {
    ctx.fillStyle = '#f05454'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`Clásico: ${(lastC.y * 100).toFixed(0)}%`, pad.l + 5, yPos(lastC.y) - 8);
  }
  if (lastQ) {
    ctx.fillStyle = '#36e8a0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`Grover: ${(lastQ.y * 100).toFixed(0)}%`, pad.l + 5, yPos(lastQ.y) - 8);
  }
}
