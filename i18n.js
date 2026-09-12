// Translations object — setLang/toggleLang live in ui.js
const T = {
  es:{
    // Hero
    hero_badge:'⚛ Qiskit 2.5.2 · AerSimulator · Visualización Interactiva',
    hero_sub:'Explora Grover, Teleportación y Steane con simulación en tiempo real, esferas de Bloch animadas y circuitos interactivos.',
    hero_enter:'Comenzar experiencia →',
    // Grover
    grover_title:'Grover — Búsqueda Cuántica',
    grover_sub:'Encuentra 1 elemento entre N en solo √N pasos',
    g_controls:'Configuración',g_walk_title:'Paso a paso — Esferas de Bloch',
    lbl_qubits:'Número de qubits',lbl_target:'Estado objetivo (binario)',lbl_shots:'Shots',
    btn_run:'Ejecutar simulación',
    // Teleport
    teleport_title:'Teleportación Cuántica',
    teleport_sub:'3 qubits · par Bell entrelazado · 2 bits clásicos · original destruido',
    t_controls:'Configuración',t_walk_title:'Protocolo — 3 Esferas de Bloch',lbl_state:'Estado inicial del mensaje (q₀)',
    raw_title:'Mediciones brutas (q₂ q₁ q₀)',bob_title:'Bob tras corrección X+Z',
    // Steane
    steane_title:'Steane [7,1,3] — Corrección de Error',
    steane_sub:'1 qubit lógico · 7 físicos · 6 ancillas · corrige 1 error unitario',
    s_controls:'Configuración',lbl_errq:'Qubit con error (−1 = sin error)',
    s_grid_title:'7 qubits físicos',s_ancilla_title:'6 ancillas de síndrome',
    syndrome_title:'Síndrome medido',logical_title:'Qubit lógico tras corrección',
    syndrome_map:'Mapa de síndromes [7,1,3]',
  },
  en:{
    // Hero
    hero_badge:'⚛ Qiskit 2.5.2 · AerSimulator · Interactive Visualization',
    hero_sub:'Explore Grover, Teleportation and Steane with real-time simulation, animated Bloch spheres, and interactive circuits.',
    hero_enter:'Start experience →',
    // Grover
    grover_title:"Grover's Algorithm — Quantum Search",
    grover_sub:'Find 1 item among N in only √N steps',
    g_controls:'Configuration',g_walk_title:'Step by step — Bloch Spheres',
    lbl_qubits:'Number of qubits',lbl_target:'Target state (binary)',lbl_shots:'Shots',
    btn_run:'Run simulation',
    // Teleport
    teleport_title:'Quantum Teleportation',
    teleport_sub:'3 qubits · Bell pair · 2 classical bits · state destroyed',
    t_controls:'Configuration',t_walk_title:'Protocol — 3 Bloch Spheres',lbl_state:'Initial message state (q₀)',
    raw_title:'Raw measurements (q₂ q₁ q₀)',bob_title:'Bob after X+Z correction',
    // Steane
    steane_title:'Steane [7,1,3] — Error Correction',
    steane_sub:'1 logical qubit · 7 physical · 6 ancillas · corrects 1 single-qubit error',
    s_controls:'Configuration',lbl_errq:'Error qubit (−1 = no error)',
    s_grid_title:'7 physical qubits',s_ancilla_title:'6 syndrome ancillas',
    syndrome_title:'Measured syndrome',logical_title:'Logical qubit after correction',
    syndrome_map:'Syndrome map [7,1,3]',
  }
};
