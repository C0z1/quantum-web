// ── Export & Share Engine ─────────────────────────────────────────

function exportResultsJSON(type, data) {
  const payload = {
    experiment: type,
    timestamp: new Date().toISOString(),
    tool: 'Quantum Computing Lab',
    backend: 'AerSimulator (JS simulation)',
    ...data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `quantum_${type}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('📄 JSON exportado');
}

function exportChartPNG(canvasId, filename) {
  const c = document.getElementById(canvasId);
  if (!c) { showToast('❌ Canvas no encontrado', 'error'); return; }
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = filename || `quantum_chart_${Date.now()}.png`;
  a.click();
  showToast('🖼 PNG exportado');
}

// Export results as styled HTML card (screenshot-ready)
function exportResultCard(type, summaryHTML) {
  const card = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body{margin:0;background:#04060f;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',system-ui}
  .card{background:linear-gradient(135deg,#080d1e,#0d1428);border:1px solid rgba(80,120,255,.2);
    border-radius:16px;padding:32px;max-width:500px;width:90%;box-shadow:0 0 60px rgba(77,127,255,.1)}
  .badge{display:inline-block;padding:4px 12px;border-radius:99px;border:1px solid rgba(77,127,255,.4);
    font-size:11px;color:#4d7fff;letter-spacing:.08em;margin-bottom:16px}
  h2{color:#fff;font-weight:300;font-size:24px;margin:0 0 8px}
  p{color:#4a5480;font-size:13px;line-height:1.7;margin:0 0 16px}
  .result{background:rgba(54,232,160,.08);border:1px solid rgba(54,232,160,.2);
    border-radius:10px;padding:14px;font-size:13px;color:#36e8a0}
  .footer{margin-top:20px;font-size:11px;color:#2a3060;text-align:center}
</style></head><body>
<div class="card">
  <div class="badge">⚛ Quantum Computing Lab</div>
  <h2>${{grover:'Grover',teleport:'Teleportación',steane:'Steane [7,1,3]'}[type]||type}</h2>
  <p>Simulación · Qiskit 2.5.2 · AerSimulator · ${new Date().toLocaleString()}</p>
  <div class="result">${summaryHTML}</div>
  <div class="footer">github.com/C0z1/quantum-web</div>
</div></body></html>`;
  const blob = new Blob([card], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `quantum_${type}_card.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('🎴 Card exportada');
}

// ── Toast notification ─────────────────────────────────────────────
function showToast(msg, type = 'ok') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
      background:rgba(8,13,30,.95);border:1px solid rgba(80,120,255,.3);
      color:#d0d8ff;padding:10px 20px;border-radius:99px;font-size:13px;
      z-index:9999;transition:transform .3s cubic-bezier(.4,0,.2,1);
      backdrop-filter:blur(12px);white-space:nowrap;pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.borderColor = type === 'error' ? 'rgba(240,84,84,.4)' : 'rgba(80,120,255,.3)';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(80px)'; }, 2800);
}

// ── Clipboard share ────────────────────────────────────────────────
async function shareResult(text) {
  const shareText = `⚛ Quantum Computing Lab\n${text}\n\nhttps://c0z1.github.io/quantum-web`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Quantum Lab', text: shareText }); return; } catch(e) {}
  }
  try {
    await navigator.clipboard.writeText(shareText);
    showToast('📋 Copiado al portapapeles');
  } catch(e) { showToast('❌ Error al copiar', 'error'); }
}

// ── Keyboard shortcuts ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const sections = ['grover','teleport','steane','speedup','quiz'];
  if (e.key === '1') scrollToSection('grover');
  if (e.key === '2') scrollToSection('teleport');
  if (e.key === '3') scrollToSection('steane');
  if (e.key === '4') scrollToSection('speedup');
  if (e.key === '5') scrollToSection('quiz');
  if (e.key === 'ArrowRight' || e.key === 'j') {
    const cur = getCurrentSection();
    const next = sections[sections.indexOf(cur) + 1];
    if (next) scrollToSection(next);
  }
  if (e.key === 'ArrowLeft' || e.key === 'k') {
    const cur = getCurrentSection();
    const prev = sections[sections.indexOf(cur) - 1];
    if (prev) scrollToSection(prev);
  }
  if (e.key === 'g') runGrover?.();
  if (e.key === 't') runTeleport?.();
  if (e.key === 's') runSteane?.();
  if (e.key === 'm') toggleAudio?.();
  if (e.key === 'Escape') exitPresentation?.();
});

function getCurrentSection() {
  const sections = ['grover','teleport','steane','speedup','quiz'];
  let cur = 'grover';
  sections.forEach(id => {
    const el = document.getElementById('sec-' + id);
    if (el && el.getBoundingClientRect().top < window.innerHeight / 2) cur = id;
  });
  return cur;
}

function scrollToSection(id) {
  document.getElementById('sec-' + id)?.scrollIntoView({ behavior: 'smooth' });
}

// Additional keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'r') openRace?.();
  if (e.key === 'i') openStats?.();
  if (e.key === 'c') openComparator?.();
  if (e.key === 'p') togglePresentation?.();
});
