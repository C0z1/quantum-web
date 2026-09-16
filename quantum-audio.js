// ── Quantum Audio ──────────────────────────────────────────────────
const QAudio = (() => {
  let ctx = null;

  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }

  function tone(freq, type, vol, attack, decay, delay = 0) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
    osc.start(t); osc.stop(t + attack + decay + 0.05);
  }

  function chord(freqs, type = 'sine', vol = 0.08, decay = 0.5) {
    freqs.forEach((f, i) => tone(f, type, vol, 0.02, decay, i * 0.04));
  }

  return {
    init,
    superposition() { chord([261, 329, 392, 523], 'sine', 0.07, 0.6); },
    oracle()        { chord([220, 277, 370], 'triangle', 0.08, 0.4); },
    diffuse()       { chord([349, 440, 523, 698], 'sine', 0.06, 0.7); },
    teleport()      { [0,1,2,3].forEach(i => tone(440 * Math.pow(2, i/12), 'sine', 0.07, 0.03, 0.3, i*0.12)); },
    error()         { tone(180, 'sawtooth', 0.06, 0.01, 0.3); tone(160, 'sawtooth', 0.05, 0.01, 0.3, 0.15); },
    syndrome(bits)  { if (!Array.isArray(bits)) return; bits.forEach((b, i) => { if (b === '1') tone(300 + i * 80, 'square', 0.04, 0.01, 0.15, i * 0.07); }); },
    success()       { [0,4,7,12].forEach((s,i) => tone(440 * Math.pow(2, s/12), 'sine', 0.07, 0.02, 0.4, i * 0.1)); },
  };
})();
