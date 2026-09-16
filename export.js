// ── Export utilities ───────────────────────────────────────────────

function exportResultsJSON(type, data) {
  const payload = { type, timestamp: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `quantum-${type}-${Date.now()}.json`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast?.('JSON exportado');
}

function exportChartPNG(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) { showToast?.('Canvas no encontrado', 'error'); return; }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename || `chart-${Date.now()}.png`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  showToast?.('PNG exportado');
}
