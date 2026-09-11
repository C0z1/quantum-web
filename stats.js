// ── Advanced Stats Panel ──────────────────────────────────────────

function openStats() {
  let modal = document.getElementById('stats-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stats-modal';
    modal.style.cssText = `position:fixed;inset:0;z-index:500;background:rgba(4,6,15,.93);
      backdrop-filter:blur(18px);display:flex;align-items:center;justify-content:center;
      padding:20px;animation:fadeModalIn .25s ease`;
    modal.innerHTML = `
    <style>
      #stats-inner{background:#080d1e;border:1px solid rgba(80,120,255,.2);border-radius:16px;
        padding:24px;max-width:900px;width:100%;max-height:88vh;overflow-y:auto}
      .stats-close{float:right;background:transparent;border:1px solid rgba(80,120,255,.2);
        color:#4a5480;border-radius:8px;padding:5px 13px;cursor:pointer;font-size:13px;margin-left:12px}
      .stats-close:hover{border-color:#4d7fff;color:#fff}
      .stats-tabs{display:flex;gap:4px;margin:16px 0}
      .stab{padding:6px 16px;border-radius:8px;border:none;background:transparent;
        color:#4a5480;font-size:12px;cursor:pointer;transition:.15s}
      .stab.active{background:rgba(77,127,255,.15);color:#d0d8ff}
      .stat-panel{display:none}.stat-panel.active{display:block}
      .sm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:18px}
      .sm-card{background:#0d1428;border:1px solid rgba(80,120,255,.15);border-radius:9px;
        padding:12px 14px;text-align:center}
      .sm-v{font-size:22px;font-weight:300;font-family:monospace;color:#fff;line-height:1}
      .sm-l{font-size:10px;color:#4a5480;margin-top:4px}
      .sm-sub{font-size:11px;color:#2a5040;margin-top:3px}
      .noise-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
      .noise-label{font-size:12px;color:#4a5480;min-width:120px}
    </style>
    <div id="stats-inner">
      <button class="stats-close" onclick="closeStats()">✕</button>
      <div style="font-size:17px;font-weight:300;color:#fff">📈 Estadísticas Avanzadas</div>
      <div class="stats-tabs">
        <button class="stab active" onclick="showStatTab('grover')">Grover</button>
        <button class="stab" onclick="showStatTab('teleport')">Teleportación</button>
        <button class="stab" onclick="showStatTab('steane')">Steane</button>
        <button class="stab" onclick="showStatTab('noise')">Modelo de ruido</button>
      </div>
      <div id="stat-grover" class="stat-panel active"></div>
      <div id="stat-teleport" class="stat-panel"></div>
      <div id="stat-steane" class="stat-panel"></div>
      <div id="stat-noise" class="stat-panel"></div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeStats(); });
  }
  modal.style.display = 'flex';
  renderStatPanels();
}
function closeStats() {
  const m = document.getElementById('stats-modal');
  if (m) m.style.display = 'none';
}
function showStatTab(name) {
  document.querySelectorAll('.stat-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  document.getElementById('stat-' + name).classList.add('active');
  event.target.classList.add('active');
}

function renderStatPanels() {
  // Grover stats
  const gr = lastGroverResult;
  document.getElementById('stat-grover').innerHTML = gr ? `
    <div class="sm-grid">
      <div class="sm-card"><div class="sm-v">${gr.n}</div><div class="sm-l">Qubits</div></div>
      <div class="sm-card"><div class="sm-v">${gr.N.toLocaleString()}</div><div class="sm-l">Estados N</div></div>
      <div class="sm-card"><div class="sm-v" style="color:#36e8a0">${gr.iters}</div><div class="sm-l">Iteraciones Grover</div></div>
      <div class="sm-card"><div class="sm-v">${gr.classicWorst.toLocaleString()}</div><div class="sm-l">Peor caso clásico</div></div>
      <div class="sm-card"><div class="sm-v">${gr.classicAvg.toLocaleString()}</div><div class="sm-l">Promedio clásico</div></div>
      <div class="sm-card"><div class="sm-v" style="color:#f5c542">${gr.speedup}×</div><div class="sm-l">Speedup (vs peor)</div></div>
      <div class="sm-card"><div class="sm-v">${gr.speedupVsAvg}×</div><div class="sm-l">Speedup (vs avg)</div></div>
      <div class="sm-card"><div class="sm-v" style="color:#36e8a0">${gr.targetProb}%</div><div class="sm-l">P(objetivo) medida</div></div>
      <div class="sm-card"><div class="sm-v">${gr.theoreticalProb}%</div><div class="sm-l">P teórica (ideal)</div></div>
      <div class="sm-card"><div class="sm-v">${gr.gateCount}</div><div class="sm-l">Gates totales (~)</div></div>
      <div class="sm-card"><div class="sm-v">${gr.shots}</div><div class="sm-l">Shots</div></div>
      <div class="sm-card"><div class="sm-v">${gr.targetCount}</div><div class="sm-l">Target encontrado</div></div>
    </div>
    <div style="background:#0d1428;border:1px solid rgba(80,120,255,.15);border-radius:10px;padding:14px;font-size:12px;color:#4a5480;line-height:2">
      <strong style="color:#d0d8ff">Fórmula de iteraciones:</strong> k = ⌊π/4 · √N⌋ = ⌊π/4 · √${gr.N.toLocaleString()}⌋ = <strong style="color:#36e8a0">${gr.iters}</strong><br>
      <strong style="color:#d0d8ff">P(éxito) teórica:</strong> sin²((2k+1)·arcsin(1/√N)) = <strong style="color:#36e8a0">${gr.theoreticalProb}%</strong><br>
      <strong style="color:#d0d8ff">Complejidad:</strong> O(√N) = O(√${gr.N.toLocaleString()}) ≈ <strong style="color:#36e8a0">${Math.round(Math.sqrt(gr.N))} operaciones</strong>
    </div>` :
    `<div style="color:#4a5480;padding:20px">Ejecuta Grover primero para ver estadísticas detalladas.</div>`;

  // Teleport stats
  const te = lastTeleResult;
  document.getElementById('stat-teleport').innerHTML = te ? `
    <div class="sm-grid">
      <div class="sm-card"><div class="sm-v">3</div><div class="sm-l">Qubits totales</div></div>
      <div class="sm-card"><div class="sm-v">2</div><div class="sm-l">Bits clásicos</div></div>
      <div class="sm-card"><div class="sm-v">${te.stateLabel}</div><div class="sm-l">Estado teleportado</div></div>
      <div class="sm-card"><div class="sm-v">${te.expectedP0}%</div><div class="sm-l">P(|0⟩) esperada</div></div>
      <div class="sm-card"><div class="sm-v">${(te.bobCorrected['0']/te.shots*100).toFixed(1)}%</div><div class="sm-l">P(|0⟩) Bob medida</div></div>
      <div class="sm-card"><div class="sm-v" style="color:#36e8a0">${te.fidelity}%</div><div class="sm-l">Fidelidad estimada</div></div>
      <div class="sm-card"><div class="sm-v">${te.shots}</div><div class="sm-l">Shots</div></div>
      <div class="sm-card"><div class="sm-v">1</div><div class="sm-l">Par Bell usado</div></div>
    </div>
    <div style="background:#0d1428;border:1px solid rgba(80,120,255,.15);border-radius:10px;padding:14px;font-size:12px;color:#4a5480;line-height:2">
      <strong style="color:#d0d8ff">Protocolo:</strong> Par Bell (H⊗CNOT) + operaciones Alice + corrección Bob X/Z<br>
      <strong style="color:#d0d8ff">Fidelidad:</strong> F = 1 - |P(0)_medir - P(0)_ideal| = <strong style="color:#36e8a0">${te.fidelity}%</strong><br>
      <strong style="color:#d0d8ff">Error estadístico:</strong> σ = 1/√N = 1/√${te.shots} ≈ <strong>${(100/Math.sqrt(te.shots)).toFixed(1)}%</strong>
    </div>` :
    `<div style="color:#4a5480;padding:20px">Ejecuta Teleportación primero.</div>`;

  // Steane stats
  const st = lastSteaneResult;
  document.getElementById('stat-steane').innerHTML = st ? `
    <div class="sm-grid">
      <div class="sm-card"><div class="sm-v">7</div><div class="sm-l">Qubits datos</div></div>
      <div class="sm-card"><div class="sm-v">6</div><div class="sm-l">Qubits ancilla</div></div>
      <div class="sm-card"><div class="sm-v">13</div><div class="sm-l">Total qubits</div></div>
      <div class="sm-card"><div class="sm-v">1</div><div class="sm-l">Qubit lógico</div></div>
      <div class="sm-card"><div class="sm-v">${st.errorQubit>=0?`d[${st.errorQubit}]`:'—'}</div><div class="sm-l">Error inyectado</div></div>
      <div class="sm-card"><div class="sm-v" style="font-family:monospace;font-size:14px">${st.syndrome}</div><div class="sm-l">Síndrome</div></div>
      <div class="sm-card"><div class="sm-v">${(st.logicalResult['0']/st.shots*100).toFixed(1)}%</div><div class="sm-l">Fidelidad lógica</div></div>
      <div class="sm-card"><div class="sm-v">${st.correctionFidelity}%</div><div class="sm-l">Tasa corrección</div></div>
    </div>
    <div style="background:#0d1428;border:1px solid rgba(80,120,255,.15);border-radius:10px;padding:14px;font-size:12px;color:#4a5480;line-height:2">
      <strong style="color:#d0d8ff">Código [n,k,d]:</strong> [7,1,3] — 7 físicos, 1 lógico, distancia 3<br>
      <strong style="color:#d0d8ff">Errores corregibles:</strong> t = ⌊(d-1)/2⌋ = ⌊(3-1)/2⌋ = <strong style="color:#a56bff">1 error</strong><br>
      <strong style="color:#d0d8ff">Redundancia:</strong> 7:1 ratio — necesita 7 qubits por qubit lógico protegido
    </div>` :
    `<div style="color:#4a5480;padding:20px">Ejecuta Steane primero.</div>`;

  // Noise model
  document.getElementById('stat-noise').innerHTML = `
    <div style="margin-bottom:14px;font-size:13px;color:#4a5480;line-height:1.7">
      Ajusta el nivel de ruido para simular decoherencia e imperfecciones de hardware real.
      El modelo usa <strong style="color:#d0d8ff">canal despolarizante</strong>: con probabilidad p,
      el qubit recibe una puerta X, Y o Z aleatoria.
    </div>
    <div class="noise-row">
      <span class="noise-label">Nivel de ruido p:</span>
      <input type="range" id="noise-slider" min="0" max="0.3" step="0.01" value="0"
        style="flex:1;accent-color:#f5c542"
        oninput="document.getElementById('noise-val').textContent=(this.value*100).toFixed(0)+'%';updateNoisePreview()">
      <span style="font-family:monospace;font-size:14px;color:#f5c542;min-width:40px" id="noise-val">0%</span>
    </div>
    <div id="noise-preview" style="margin-top:14px"></div>
    <div style="margin-top:14px;background:#0d1428;border:1px solid rgba(80,120,255,.15);
      border-radius:10px;padding:14px;font-size:12px;color:#4a5480;line-height:2">
      <strong style="color:#d0d8ff">p=0%</strong> → Simulación ideal (AerSimulator sin ruido)<br>
      <strong style="color:#d0d8ff">p=1-5%</strong> → Hardware cuántico moderno (IBM Falcon ~0.3%, IBM Eagle ~0.2%)<br>
      <strong style="color:#d0d8ff">p=10-20%</strong> → Hardware ruidoso NISQ, decoherencia alta<br>
      <strong style="color:#d0d8ff">p=30%</strong> → Qubit totalmente ruidoso → resultados aleatorios
    </div>`;
}

function updateNoisePreview() {
  const p = parseFloat(document.getElementById('noise-slider').value);
  const n = lastGroverResult?.n || 4;
  const target = lastGroverResult?.target || '1111';
  const shots = lastGroverResult?.shots || 1024;
  const r = simGroverFull(n, target, shots, p);
  const el = document.getElementById('noise-preview');
  if (!el) return;
  const idealProb = parseFloat(lastGroverResult?.theoreticalProb || r.theoreticalProb);
  const noisyProb = parseFloat(r.targetProb);
  const fidelityLoss = Math.max(0, idealProb - noisyProb).toFixed(1);
  el.innerHTML = `
    <div class="sm-grid">
      <div class="sm-card"><div class="sm-v">${r.theoreticalProb}%</div><div class="sm-l">P ideal</div></div>
      <div class="sm-card"><div class="sm-v" style="color:${p>0.1?'#f05454':'#36e8a0'}">${r.targetProb}%</div><div class="sm-l">P con ruido p=${(p*100).toFixed(0)}%</div></div>
      <div class="sm-card"><div class="sm-v" style="color:${fidelityLoss>10?'#f05454':'#f5c542'}">-${fidelityLoss}%</div><div class="sm-l">Pérdida fidelidad</div></div>
    </div>`;
}
