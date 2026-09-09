# ⚛ Quantum Computing Lab — Web App

Visual interactive web app for the Quantum Computing Project built with Qiskit 2.5.2 + AerSimulator.

## Live experiments

| Experiment | Controls | Output |
|---|---|---|
| **Grover's Algorithm** | qubits (2–16), binary target, shots | Probability bars, circuit SVG, speedup |
| **Quantum Teleportation** | initial state (0/1/+/−/custom θφ), shots | Raw + corrected Bob bars, circuit |
| **Steane [7,1,3] Error Correction** | error qubit (−1..6), shots | Syndrome bits, logical qubit, syndrome map |
| **Speedup table** | — | Comparison table + log chart |
| **3D Visualization** | per-experiment step controls | Three.js Bloch spheres, entanglement beams |

## Structure

```
quantum-web/
├── index.html          ← shell + all pages
├── style.css           ← dark theme design system
├── i18n.js             ← ES/EN translations
├── sim.js              ← pure-JS quantum simulators
├── ui.js               ← rendering + interactions
└── visual3d.html       ← Three.js 3D immersive view
```

## Features

- **Bilingual** — full Spanish / English toggle
- **Faithful simulation** — same math as the Qiskit scripts (Grover probability formula, Steane syndrome map, teleportation Bell protocol)
- **No backend needed** — runs entirely in the browser
- **Responsive** — works on mobile

## Running locally

```bash
# Any static server works
python -m http.server 8080
# then open http://localhost:8080
```

## Original Python project

Built to visualize the experiments from `menu.sh` / scripts 01–08:
- `06_grover_interactive.py` → Grover Lab
- `07_teleportation_interactive.py` → Teleportation Lab  
- `08_steane_interactive.py` → Steane Lab

## Tech stack

- **Three.js r128** — 3D visualization
- **Vanilla JS** — simulation + UI
- **CSS custom properties** — dark theme
- No build step, no dependencies to install
