// ── Comparator modal ───────────────────────────────────────────────
const _compareData = [];

function addToCompare(label, counts, target, shots, speedup, iters) {
  _compareData.push({ label, counts, target, shots, speedup, iters, ts: Date.now() });
  showToast?.(`"${label}" añadido al comparador`);
}

function openComparator() {
  let modal = document.getElementById('_comparator');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = '_comparator';
    modal.style.cssText =
      'position:fixed;inset:0;background:rgba(4,6,15,.92);z-index:8000;display:flex;' +
      'align-items:center;justify-content:center;backdrop-filter:blur(8px)';
    modal.innerHTML = `
      <div style="background:#0d1020;border:1px solid rgba(80,120,255,.25);border-radius:16px;
        padding:28px 32px;max-width:700px;width:90%;max-height:80vh;overflow-y:auto;position:relative">
        <button onclick="document.getElementById('_comparator').remove()"
          style="position:absolute;top:14px;right:18px;background:none;border:none;
          color:#8090c0;font-size:20px;cursor:pointer">✕</button>
        <h3 style="color:#d0d8ff;margin:0 0 18px;font-size:16px">⚖ Comparador de experimentos</h3>
        <div id="_compare-body"></div>
      </div>`;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }

  const body = document.getElementById('_compare-body');
  if (_compareData.length === 0) {
    body.innerHTML = '<p style="color:#5a6490;font-size:13px">Ejecuta simulaciones y usa "⚖ Comparar" para agregar resultados aquí.</p>';
    return;
  }

  body.innerHTML = _compareData.map((d, i) => `
    <div style="background:#141830;border:1px solid rgba(80,120,255,.15);border-radius:10px;
      padding:14px 18px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:#d0d8ff;font-size:13px;font-weight:600">${d.label}</span>
        <button onclick="_compareData.splice(${i},1);openComparator()"
          style="background:none;border:none;color:#5a6490;cursor:pointer;font-size:12px">✕ quitar</button>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#8090c0">
        <span>🎯 Objetivo: <strong style="color:#f5c542">|${d.target}⟩</strong></span>
        <span>🔁 Iteraciones: <strong style="color:#36e8a0">${d.iters}</strong></span>
        <span>⚡ Speedup: <strong style="color:#4d7fff">${d.speedup}×</strong></span>
        <span>📊 Shots: <strong style="color:#a56bff">${d.shots.toLocaleString()}</strong></span>
        <span>✓ Prob: <strong style="color:#36e8a0">${d.counts[d.target]?((d.counts[d.target]/d.shots*100).toFixed(1))+'%':'—'}</strong></span>
      </div>
    </div>`).join('');
}
