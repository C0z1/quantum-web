// ── Experiment Comparator ─────────────────────────────────────────
// Side-by-side comparison of multiple Grover runs

let compareData = [];

function addToCompare(label, counts, target, shots, speedup, iters) {
  compareData.push({ label, counts, target, shots, speedup, iters, ts: Date.now() });
  if (compareData.length > 4) compareData.shift();
  renderComparatorIfOpen();
  showToast(`📊 "${label}" añadido a comparador`);
}

function openComparator() {
  if (compareData.length < 1) {
    showToast('Ejecuta al menos un experimento primero', 'error');
    return;
  }
  let modal = document.getElementById('compare-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'compare-modal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:500;
      background:rgba(4,6,15,.92);backdrop-filter:blur(16px);
      display:flex;align-items:center;justify-content:center;padding:20px;
      animation:fadeModalIn .25s ease;
    `;
    modal.innerHTML = `
      <style>
        @keyframes fadeModalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
        #compare-inner{
          background:#080d1e;border:1px solid rgba(80,120,255,.2);border-radius:16px;
          padding:24px;max-width:900px;width:100%;max-height:85vh;overflow-y:auto;
        }
        .cmp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .cmp-title{font-size:18px;font-weight:300;color:#fff}
        .cmp-close{background:transparent;border:1px solid rgba(80,120,255,.2);color:#4a5480;
          border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px}
        .cmp-close:hover{border-color:#4d7fff;color:#fff}
        .cmp-grid{display:grid;gap:14px}
        .cmp-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
        .cmp-label{font-size:11px;min-width:68px;font-family:monospace;color:#4a5480}
        .cmp-track{flex:1;height:12px;background:rgba(255,255,255,.04);border-radius:99px;overflow:hidden}
        .cmp-fill{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1)}
        .cmp-pct{font-size:11px;min-width:40px;text-align:right;font-family:monospace;color:#4a5480}
        .cmp-meta{font-size:11px;color:#2a3570;margin-top:8px}
        .cmp-card{background:#0d1428;border:1px solid rgba(80,120,255,.12);border-radius:10px;padding:14px}
        .cmp-card-title{font-size:12px;font-weight:500;color:#4d7fff;margin-bottom:10px}
      </style>
      <div id="compare-inner">
        <div class="cmp-header">
          <span class="cmp-title">📊 Comparador de experimentos</span>
          <button class="cmp-close" onclick="closeComparator()">✕ Cerrar</button>
        </div>
        <div id="cmp-content"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeComparator(); });
  }
  modal.style.display = 'flex';
  renderComparatorIfOpen();
}

function closeComparator() {
  const m = document.getElementById('compare-modal');
  if (m) m.style.display = 'none';
}

function renderComparatorIfOpen() {
  const content = document.getElementById('cmp-content');
  if (!content) return;
  const cols = ['#4d7fff','#36e8a0','#f5c542','#a56bff'];
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">
      ${compareData.map((d, ci) => {
        const col = cols[ci % cols.length];
        const total = Object.values(d.counts).reduce((a,b)=>a+b,0) || 1;
        const sorted = Object.entries(d.counts).sort((a,b)=>b[1]-a[1]).slice(0, 6);
        return `<div class="cmp-card">
          <div class="cmp-card-title" style="color:${col}">${d.label}</div>
          <div style="font-size:10px;color:#2a3570;margin-bottom:10px">|${d.target}⟩ · ${d.shots} shots · ${d.iters} iters · ${d.speedup}× speedup</div>
          ${sorted.map(([st, cnt]) => {
            const pct = (cnt/total*100).toFixed(1);
            const isT = st === d.target;
            return `<div class="cmp-row">
              <span class="cmp-label">${'|'+st+'⟩'}${isT?' ★':''}</span>
              <div class="cmp-track"><div class="cmp-fill" style="width:${pct}%;background:${isT?col:'rgba(80,120,255,.2)'}"></div></div>
              <span class="cmp-pct" style="color:${isT?col:'#4a5480'}">${pct}%</span>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
    </div>
    ${compareData.length > 1 ? `
    <div style="margin-top:16px;background:#0d1428;border:1px solid rgba(80,120,255,.12);border-radius:10px;padding:14px">
      <div class="cmp-card-title">Comparativa de speedup</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${compareData.map((d,ci) => `
          <div style="display:flex;align-items:center;gap:8px;font-size:13px">
            <span style="width:10px;height:10px;border-radius:50%;background:${cols[ci%cols.length]};display:inline-block"></span>
            <span style="color:#d0d8ff">${d.label}</span>
            <span style="color:${cols[ci%cols.length]};font-weight:500;font-family:monospace">${d.speedup}×</span>
          </div>`).join('')}
      </div>
    </div>` : ''}
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
      <button onclick="compareData=[];renderComparatorIfOpen();showToast('Comparador limpiado')"
        style="padding:7px 16px;border-radius:8px;border:1px solid rgba(80,120,255,.2);background:transparent;color:#4a5480;cursor:pointer;font-size:12px">
        ↺ Limpiar
      </button>
    </div>`;
}

// ── Presentation mode ─────────────────────────────────────────────
let presentMode = false;
function togglePresentation() {
  presentMode = !presentMode;
  if (presentMode) {
    document.documentElement.requestFullscreen?.();
    document.body.style.cursor = 'none';
    document.getElementById('topnav').style.opacity = '0';
    document.getElementById('section-dots').style.opacity = '0';
    showToast('🎬 Modo presentación · ESC para salir · ← → para navegar');
  } else {
    exitPresentation();
  }
}
function exitPresentation() {
  presentMode = false;
  document.exitFullscreen?.().catch(()=>{});
  document.body.style.cursor = '';
  document.getElementById('topnav').style.opacity = '1';
  document.getElementById('section-dots').style.opacity = '1';
}
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) exitPresentation();
});

// ── Audio toggle ──────────────────────────────────────────────────
let audioOn = false;
function toggleAudio() {
  if (!audioOn) {
    QAudio.init();
    QAudio.resume();
    QAudio.startAmbient();
    QAudio.success();
    audioOn = true;
    document.getElementById('audio-btn').textContent = '🔊';
    document.getElementById('audio-btn').title = 'Apagar sonido (M)';
    showToast('🔊 Sonido activado');
  } else {
    QAudio.stopAmbient();
    audioOn = false;
    document.getElementById('audio-btn').textContent = '🔇';
    document.getElementById('audio-btn').title = 'Activar sonido (M)';
    showToast('🔇 Sonido desactivado');
  }
}
