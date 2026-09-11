// ── Quantum Audio Engine ──────────────────────────────────────────
// Generates ambient tones and feedback sounds using Web Audio API

class QuantumAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.masterGain = null;
    this.ambient = null;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.18;
      this.masterGain.connect(this.ctx.destination);
      this.enabled = true;
    } catch(e) { this.enabled = false; }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  // Tone: freq, type, duration, volume
  tone(freq, type = 'sine', dur = 0.18, vol = 0.4, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Quantum "superposition" sweep
  superposition() {
    if (!this.enabled) return;
    [261, 329, 392, 523].forEach((f, i) => this.tone(f, 'sine', 0.4, 0.25, i * 0.06));
  }

  // Oracle mark — dissonant sting
  oracle() {
    if (!this.enabled) return;
    this.tone(440, 'sawtooth', 0.12, 0.18);
    this.tone(554, 'sine', 0.2, 0.12, 0.05);
  }

  // Diffusion — rising arpeggio
  diffuse() {
    if (!this.enabled) return;
    [330, 415, 523, 659].forEach((f, i) => this.tone(f, 'triangle', 0.25, 0.2, i * 0.07));
  }

  // Success chime
  success() {
    if (!this.enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 'sine', 0.3, 0.25, i * 0.08));
  }

  // Error buzz
  error() {
    if (!this.enabled) return;
    this.tone(180, 'sawtooth', 0.15, 0.3);
    this.tone(120, 'square', 0.1, 0.2, 0.05);
  }

  // Teleport beam — gliding tone
  teleport() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.6);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.75);
  }

  // Syndrome detection — clicking pattern
  syndrome(bits) {
    if (!this.enabled) return;
    bits.forEach((b, i) => {
      if (b === '1') this.tone(800 + i * 60, 'square', 0.06, 0.15, i * 0.1);
    });
  }

  // Ambient quantum hum (looping)
  startAmbient() {
    if (!this.enabled || !this.ctx) return;
    if (this.ambient) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = 55;
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    g.gain.value = 0.04;
    osc.connect(filter); filter.connect(g); g.connect(this.masterGain);
    osc.start();
    this.ambient = { osc, g };
  }

  stopAmbient() {
    if (this.ambient) {
      this.ambient.g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      setTimeout(() => { this.ambient?.osc.stop(); this.ambient = null; }, 600);
    }
  }

  setVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }
}

const QAudio = new QuantumAudio();
