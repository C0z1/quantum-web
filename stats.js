// ── Stats modal ────────────────────────────────────────────────────
const _sessionStats = {
  groverRuns: 0, teleportRuns: 0, steaneRuns: 0,
  totalShots: 0, bestSpeedup: 0, startTime: Date.now(),
};

// Hook into run functions after page load
document.addEventListener('DOMContentLoaded', () => {
  const _origRunGrover = window.runGrover;
  if (_origRunGrover) {
    window.runGrover = async function(...args) {
      _sessionStats.groverRuns++;
      const r = await _origRunGrover.apply(this, args);
      if (window.lastGroverResult) {
        _sessionStats.totalShots += window.lastGroverResult.shots || 0;
        const sp = parseInt(window.lastGroverResult.speedup) || 0;
        if (sp > _sessionStats.bestSpeedup) _sessionStats.bestSpeedup = sp;
      }
      return r;
    };
  }
  const _origRunTele = window.runTeleport;
  if (_origRunTele) {
    window.runTeleport = async function(...args) {
      _sessionStats.teleportRuns++;
      const r = await _origRunTele.apply(this, args);
      if (window.lastTeleResult) _sessionStats.totalShots += window.lastTeleResult.shots || 0;
      return r;
    };
  }
  const _origRunSteane = window.runSteane;
  if (_origRunSteane) {
    window.runSteane = async function(...args) {
      _sessionStats.steaneRuns++;
      const r = await _origRunSteane.apply(this, args);
      if (window.lastSteaneResult) _sessionStats.totalShots += window.lastSteaneResult.shots || 0;
      return r;
    };
  }
});

function openStats() {
  let modal = document.getElementById('_stats');
  if (modal) { modal.remove(); return; }

  const elapsed = Math.floor((Date.now() - _sessionStats.startTime) / 1000);
  const mins = Math.floor(elapsed / 60), secs = elapsed % 60;
  const totalRuns = _sessionStats.groverRuns + _sessionStats.teleportRuns + _sessionStats.steaneRuns;

  modal = document.createElement('div');
  modal.id = '_stats';
  modal.style.cssText =
    'position:fixed;inset:0;background:rgba(4,6,15,.92);z-index:8000;display:flex;' +
    'align-items:center;justify-content:center;backdrop-filter:blur(10px)';
  modal.innerHTML = `
    <div style="background:#0d1020;border:1px solid rgba(80,120,255,.25);border-radius:16px;
      padding:28px 32px;max-width:480px;width:92%;position:relative">
      <button onclick="document.getElementById('_stats').remove()"
        style="position:absolute;top:14px;right:18px;background:none;border:none;
        color:#8090c0;font-size:20px;cursor:pointer">✕</button>
      <h3 style="color:#d0d8ff;margin:0 0 20px;font-size:16px">📈 Estadísticas de sesión</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${stat('⚛ Corridas Grover',  _sessionStats.groverRuns,   '#4d7fff')}
        ${stat('🔗 Corridas Teleport', _sessionStats.teleportRuns, '#44cc88')}
        ${stat('🛡 Corridas Steane',  _sessionStats.steaneRuns,   '#a56bff')}
        ${stat('📊 Total shots',      _sessionStats.totalShots.toLocaleString(), '#36e8a0')}
        ${stat('⚡ Mejor speedup',    _sessionStats.bestSpeedup > 0 ? _sessionStats.bestSpeedup.toLocaleString() + '×' : '—', '#f5c542')}
        ${stat('⏱ Tiempo en sesión', `${mins}m ${secs}s`, '#8090c0')}
      </div>
      ${totalRuns === 0 ? '<p style="color:#3a4580;font-size:12px;text-align:center;margin-top:16px">Ejecuta algunas simulaciones para ver estadísticas.</p>' : ''}
    </div>`;
  document.body.appendChild(modal);
}

function stat(label, value, color) {
  return `<div style="background:#141830;border:1px solid rgba(80,120,255,.12);border-radius:10px;padding:14px 16px">
    <div style="color:#5a6490;font-size:11px;margin-bottom:6px">${label}</div>
    <div style="color:${color};font-size:20px;font-weight:700;font-family:monospace">${value}</div>
  </div>`;
}
