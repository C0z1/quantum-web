// ── Carrera Cuántico vs Clásico ────────────────────────────────────
let _raceModal = null;
let _raceRunning = false;

function openRace(action) {
  if (action === 'close') { _raceModal?.remove(); _raceModal = null; return; }

  if (_raceModal) { _raceModal.remove(); _raceModal = null; return; }

  _raceModal = document.createElement('div');
  _raceModal.id = '_race';
  _raceModal.style.cssText =
    'position:fixed;inset:0;background:rgba(4,6,15,.93);z-index:8000;display:flex;' +
    'align-items:center;justify-content:center;backdrop-filter:blur(10px)';
  _raceModal.innerHTML = `
    <div style="background:#0d1020;border:1px solid rgba(80,120,255,.25);border-radius:16px;
      padding:28px 32px;max-width:560px;width:92%;position:relative">
      <button onclick="openRace('close')"
        style="position:absolute;top:14px;right:18px;background:none;border:none;
        color:#8090c0;font-size:20px;cursor:pointer">✕</button>
      <h3 style="color:#d0d8ff;margin:0 0 6px;font-size:16px">🏁 Carrera — Cuántico vs Clásico</h3>
      <p style="color:#5a6490;font-size:12px;margin:0 0 20px">¿Cuántos pasos necesita cada uno para encontrar el objetivo?</p>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
        <label style="color:#8090c0;font-size:12px">Qubits (n):
          <input type="range" id="_race-n" min="2" max="20" value="8"
            style="margin-left:8px;vertical-align:middle" oninput="document.getElementById('_race-nv').textContent=this.value">
          <span id="_race-nv" style="color:#d0d8ff;margin-left:6px">8</span>
        </label>
        <button onclick="_startRace()"
          style="background:linear-gradient(135deg,#1a2870,#0d1840);border:1px solid #4d7fff;
          border-radius:8px;color:#d0d8ff;padding:7px 18px;cursor:pointer;font-size:13px">▶ Iniciar</button>
      </div>
      <div id="_race-track" style="background:#080b16;border-radius:10px;padding:18px 20px;min-height:100px">
        <p style="color:#3a4580;font-size:12px;text-align:center;margin:20px 0">Presiona Iniciar para comenzar la carrera</p>
      </div>
    </div>`;
  document.body.appendChild(_raceModal);
}

async function _startRace() {
  if (_raceRunning) return;
  _raceRunning = true;
  const n = parseInt(document.getElementById('_race-n').value);
  const N = Math.pow(2, n);
  const qSteps = typeof groverIters === 'function' ? groverIters(n) : Math.floor(Math.PI / 4 * Math.sqrt(N));
  const cSteps = Math.floor(N / 2) || 1;
  const track = document.getElementById('_race-track');
  track.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;color:#8090c0;font-size:11px;margin-bottom:6px">
        <span>⚛ Cuántico (Grover)</span><span id="_rq-steps" style="color:#36e8a0">0 / ${qSteps} pasos</span>
      </div>
      <div style="background:#0d1020;border-radius:6px;height:22px;overflow:hidden">
        <div id="_rq-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#1a4030,#36e8a0);transition:width .12s"></div>
      </div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;color:#8090c0;font-size:11px;margin-bottom:6px">
        <span>💻 Clásico</span><span id="_rc-steps" style="color:#f05454">0 / ${cSteps} pasos</span>
      </div>
      <div style="background:#0d1020;border-radius:6px;height:22px;overflow:hidden">
        <div id="_rc-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#301a1a,#f05454);transition:width .12s"></div>
      </div>
    </div>
    <div id="_race-verdict" style="margin-top:18px;text-align:center;font-size:13px;color:#5a6490"></div>`;

  const totalDuration = 2800;
  const startTime = performance.now();
  let qDone = false, cDone = false;

  const update = (now) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / totalDuration, 1);
    const ease = t < 0.5 ? 2*t*t : 1-(2-2*t)*(2-2*t)/2;

    const qPct = Math.min(ease * 100, 100);
    const cPct = Math.min((elapsed / (totalDuration * (cSteps / qSteps))) * 100, 100);
    const qCurrent = Math.floor(ease * qSteps);
    const cCurrent = Math.min(Math.floor(elapsed / totalDuration * cSteps * (totalDuration / (totalDuration * (cSteps/qSteps)))), cSteps);

    const qEl = document.getElementById('_rq-bar');
    const cEl = document.getElementById('_rc-bar');
    const qS  = document.getElementById('_rq-steps');
    const cS  = document.getElementById('_rc-steps');
    if (!qEl) { _raceRunning = false; return; }

    if (!qDone) { qEl.style.width = qPct + '%'; qS.textContent = `${qCurrent} / ${qSteps} pasos`; }
    if (!cDone) { cEl.style.width = Math.min(cPct, 100) + '%'; cS.textContent = `${Math.min(cCurrent, cSteps)} / ${cSteps} pasos`; }

    if (!qDone && t >= 1) {
      qDone = true;
      qEl.style.width = '100%'; qS.textContent = `${qSteps} / ${qSteps} pasos ✓`;
      const v = document.getElementById('_race-verdict');
      v.innerHTML = `<span style="color:#36e8a0;font-weight:600">⚛ Cuántico gana en ${qSteps.toLocaleString()} pasos</span> vs ${cSteps.toLocaleString()} clásico → <strong style="color:#f5c542">${Math.round(cSteps/qSteps)}× speedup</strong>`;
    }
    if (!cDone && cPct >= 100) { cDone = true; cEl.style.width = '100%'; cS.textContent = `${cSteps} / ${cSteps} pasos ✓`; }

    if (elapsed < totalDuration * 3) requestAnimationFrame(update);
    else _raceRunning = false;
  };
  requestAnimationFrame(update);
}
