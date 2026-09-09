// ── Translations ──────────────────────────────────────────────────
const T = {
  es: {
    // nav
    nav_grover:"GROVER", nav_grover_lab:"🔬 Laboratorio", nav_grover_exp:"📖 Explicación",
    nav_teleport:"TELEPORTACIÓN", nav_teleport_lab:"🔬 Laboratorio", nav_teleport_exp:"📖 Explicación",
    nav_steane:"CORRECCIÓN DE ERROR", nav_steane_lab:"🔬 Laboratorio", nav_steane_exp:"📖 Explicación",
    nav_extras:"EXTRAS", nav_speedup:"📊 Cuántico vs Clásico", nav_3d:"🌐 Visualización 3D",
    // splash
    start_label:"Iniciar",
    // fields
    lbl_qubits:"Número de qubits", lbl_target:"Objetivo (binario)", lbl_shots:"Shots",
    lbl_state:"Estado inicial del mensaje (q₀)", lbl_errq:"Qubit con error (−1 = sin error)",
    opt_custom:"Personalizado (θ, φ)",
    // buttons
    btn_run:"Ejecutar simulación",
    // grover
    grover_lab_title:"⚛ Grover Lab — Búsqueda Cuántica",
    grover_lab_sub:"Encuentra 1 elemento entre N estados en √N pasos",
    meta_states:"estados", meta_iters:"iteraciones", meta_classic:"peor caso clásico", meta_speedup:"aceleración",
    results_title:"Resultados",
    circuit_title:"Circuito cuántico",
    // teleport
    teleport_lab_title:"🔗 Teleportación Cuántica — Laboratorio",
    teleport_lab_sub:"3 qubits · canal entrelazado · 2 bits clásicos",
    raw_title:"Mediciones brutas (q₂ q₁ q₀)", bob_title:"Bob después de corrección X+Z",
    // steane
    steane_lab_title:"🛡 Código Steane [7,1,3] — Laboratorio",
    steane_lab_sub:"1 qubit lógico codificado en 7 físicos · 6 ancillas de síndrome",
    syndrome_title:"Síndrome medido (6 ancillas)", logical_title:"Qubit lógico tras corrección",
    syndrome_map:"Mapa de síndromes [7,1,3]",
    // speedup
    speedup_title:"📊 Cuántico vs Clásico", speedup_sub:"Tabla de aceleración del Algoritmo de Grover",
    formula_lbl:"Fórmula:", th_algo:"Algoritmo", th_states2:"Estados N",
    th_classic2:"Clásico", th_quantum:"Cuántico", th_speedup2:"Aceleración",
    speedup_note:"Cada qubit añadido duplica el espacio de búsqueda, pero el algoritmo cuántico solo crece √2 en iteraciones.",
    // 3d
    viz3d_title:"🌐 Visualización 3D Interactiva",
    viz3d_sub:"Esferas de Bloch, entrelazamiento y amplitudes animadas en Three.js",
    // explain grover
    grover_exp_title:"📖 ¿Qué es el Algoritmo de Grover?",
    exp_what:"¿Qué es?", exp_analogy:"Analogía", exp_how:"¿Cómo funciona?",
    exp_math:"Las matemáticas", exp_results:"Resultados reales del proyecto", exp_key:"Concepto clave",
    grover_what_p:"Un algoritmo cuántico que encuentra un elemento marcado en una lista desordenada de N elementos usando solo √N pasos — contra los N pasos que necesitaría cualquier algoritmo clásico.",
    grover_analogy_p:"Imagina que escondes una carta en uno de 1,000,000 sobres. Un humano necesitaría abrir sobre por sobre. Grover ilumina todos los sobres a la vez y en 1,000 pasos (√1,000,000) sabe cuál contiene la carta.",
    step_h:"Superposición", step_h_desc:"puertas H ponen todos los N estados en paralelo simultáneamente.",
    step_oracle:"Oráculo", step_oracle_desc:"invierte la fase del estado objetivo (lo marca sin revelar cuál es).",
    step_diffuse:"Difusión", step_diffuse_desc:"amplifica la amplitud del estado marcado y suprime los demás.",
    step_measure:"Medición", step_measure_desc:"el estado objetivo aparece con probabilidad cercana al 100%.",
    th_config:"Configuración", th_target:"Objetivo", th_shots:"Shots", th_found:"Encontrado",
    // explain teleport
    teleport_exp_title:"📖 ¿Qué es la Teleportación Cuántica?",
    teleport_what_p:"Transferir el estado exacto de un qubit de un lugar a otro sin moverlo físicamente. El qubit original es DESTRUIDO en el proceso. Solo la información viaja.",
    teleport_analogy_p:"Imagina que quieres enviar una escultura LEGO a un amigo. En vez de enviarla: (1) la desarmas, (2) anotas cómo era cada pieza, (3) envías esas instrucciones (2 bits clásicos), (4) tu amigo la reconstruye perfectamente. El original desaparece — pero el resultado es idéntico.",
    q0_lbl:"Mensaje", q0_desc:"el estado a teleportar. Después de la medición es destruido.",
    q1_lbl:"Alice", q1_desc:"su mitad del par entrelazado. Mide y envía 2 bits clásicos a Bob.",
    q2_lbl:"Bob", q2_desc:"recibe los 2 bits, aplica correcciones y obtiene el estado original.",
    tele_result_1:"Mensaje preparado en |+⟩ → α = β = 1/√2 → 50% cada uno",
    tele_result_2:"Bob obtuvo: 52% |0⟩ y 48% |1⟩",
    tele_result_3:"✓ Diferencia del 2% = ruido estadístico normal (1024 shots)",
    teleport_key_p:"Ningún qubit viajó físicamente. El protocolo NO viola el límite de la velocidad de la luz porque los 2 bits clásicos deben transmitirse por medios convencionales.",
    // explain steane
    steane_exp_title:"📖 Corrección de Error Steane [7,1,3]",
    steane_what_p:"Una forma de proteger 1 qubit lógico usando 7 qubits físicos. Si CUALQUIER qubit se corrompe por ruido de hardware, el código detecta exactamente cuál es y lo corrige — sin mirar directamente el valor del qubit.",
    steane_why_p:"Los qubits reales son frágiles: la radiación de fondo, las vibraciones térmicas y la decoherencia los corrompen constantemente. No puedes simplemente copiar un qubit (teorema de no-clonación), así que hay que protegerlo distribuyendo su información.",
    param_7:"qubits físicos usados", param_1:"qubit lógico codificado", param_3:"distancia mínima → corrige ⌊(3−1)/2⌋ = 1 error",
    step_encode:"Codificación", step_encode_desc:"H en d[0..2] + cadena CNOT distribuye |0_L⟩ en 7 qubits.",
    step_error:"Error", step_error_desc:"puerta X en d[i] simula ruido de hardware (bit-flip).",
    step_syndrome:"Síndrome", step_syndrome_desc:"6 ancillas miden paridad de grupos sin leer los datos.",
    step_correct:"Corrección", step_correct_desc:"el patrón de síndrome señala el qubit culpable → X lo restaura.",
    steane_result_1:"13 qubits en total (7 datos + 6 ancillas) · 1024 shots",
    steane_result_2:"Síndrome 001110 → identifica exactamente d[3]",
    steane_result_3:"✓ Mismo principio en hardware cuántico real de IBM",
  },
  en: {
    nav_grover:"GROVER", nav_grover_lab:"🔬 Lab", nav_grover_exp:"📖 Explanation",
    nav_teleport:"TELEPORTATION", nav_teleport_lab:"🔬 Lab", nav_teleport_exp:"📖 Explanation",
    nav_steane:"ERROR CORRECTION", nav_steane_lab:"🔬 Lab", nav_steane_exp:"📖 Explanation",
    nav_extras:"EXTRAS", nav_speedup:"📊 Quantum vs Classical", nav_3d:"🌐 3D Visualization",
    start_label:"Start",
    lbl_qubits:"Number of qubits", lbl_target:"Target (binary)", lbl_shots:"Shots",
    lbl_state:"Initial message state (q₀)", lbl_errq:"Error qubit (−1 = no error)",
    opt_custom:"Custom (θ, φ)",
    btn_run:"Run simulation",
    grover_lab_title:"⚛ Grover Lab — Quantum Search",
    grover_lab_sub:"Find 1 item among N states in √N steps",
    meta_states:"states", meta_iters:"iterations", meta_classic:"classical worst case", meta_speedup:"speedup",
    results_title:"Results",
    circuit_title:"Quantum circuit",
    teleport_lab_title:"🔗 Quantum Teleportation — Lab",
    teleport_lab_sub:"3 qubits · entangled channel · 2 classical bits",
    raw_title:"Raw measurements (q₂ q₁ q₀)", bob_title:"Bob after X+Z correction",
    steane_lab_title:"🛡 Steane [7,1,3] Code — Lab",
    steane_lab_sub:"1 logical qubit encoded in 7 physical · 6 syndrome ancillas",
    syndrome_title:"Syndrome (6 ancillas)", logical_title:"Logical qubit after correction",
    syndrome_map:"Syndrome map [7,1,3]",
    speedup_title:"📊 Quantum vs Classical", speedup_sub:"Grover algorithm speedup table",
    formula_lbl:"Formula:", th_algo:"Algorithm", th_states2:"States N",
    th_classic2:"Classical", th_quantum:"Quantum", th_speedup2:"Speedup",
    speedup_note:"Every qubit added doubles the search space, but the quantum algorithm only grows by √2 in iterations.",
    viz3d_title:"🌐 Interactive 3D Visualization",
    viz3d_sub:"Bloch spheres, entanglement, and animated amplitudes in Three.js",
    grover_exp_title:"📖 What is Grover's Algorithm?",
    exp_what:"What is it?", exp_analogy:"Analogy", exp_how:"How does it work?",
    exp_math:"The math", exp_results:"Real project results", exp_key:"Key insight",
    grover_what_p:"A quantum algorithm that finds a marked item in an unsorted list of N items using only √N steps — vs the N steps any classical algorithm would need.",
    grover_analogy_p:"Imagine hiding a card in one of 1,000,000 envelopes. A human would have to open them one by one. Grover illuminates all envelopes at once and in 1,000 steps (√1,000,000) knows which one holds the card.",
    step_h:"Superposition", step_h_desc:"H gates put all N states in parallel simultaneously.",
    step_oracle:"Oracle", step_oracle_desc:"flips the phase of the target state (marks it without revealing which one).",
    step_diffuse:"Diffusion", step_diffuse_desc:"amplifies the marked state's amplitude and suppresses the others.",
    step_measure:"Measurement", step_measure_desc:"the target state appears with near 100% probability.",
    th_config:"Configuration", th_target:"Target", th_shots:"Shots", th_found:"Found",
    teleport_exp_title:"📖 What is Quantum Teleportation?",
    teleport_what_p:"Transfer the exact state of a qubit from one place to another without physically moving it. The original qubit is DESTROYED in the process. Only the information travels.",
    teleport_analogy_p:"Imagine sending a LEGO sculpture to a friend. Instead of shipping it: (1) disassemble it, (2) note exactly how each piece was placed, (3) send those instructions (2 classical bits), (4) your friend rebuilds it perfectly. The original is gone — but the result is identical.",
    q0_lbl:"Message", q0_desc:"the state to teleport. It is destroyed after measurement.",
    q1_lbl:"Alice", q1_desc:"her half of the entangled pair. Measures and sends 2 classical bits to Bob.",
    q2_lbl:"Bob", q2_desc:"receives the 2 bits, applies corrections, and gets the original state.",
    tele_result_1:"Message prepared in |+⟩ → α = β = 1/√2 → 50% each",
    tele_result_2:"Bob got: 52% |0⟩ and 48% |1⟩",
    tele_result_3:"✓ 2% difference = normal statistical noise (1024 shots)",
    teleport_key_p:"No qubit physically traveled. The protocol does NOT violate the speed of light because the 2 classical bits must be transmitted through conventional means.",
    steane_exp_title:"📖 Steane [7,1,3] Error Correction",
    steane_what_p:"A way to protect 1 logical qubit using 7 physical qubits. If ANY single qubit gets corrupted by hardware noise, the code detects exactly which one and fixes it — without ever directly reading the qubit data.",
    steane_why_p:"Real qubits are fragile: background radiation, thermal vibrations and decoherence corrupt them constantly. You can't simply copy a qubit (no-cloning theorem), so you protect it by distributing its information.",
    param_7:"physical qubits used", param_1:"logical qubit encoded", param_3:"minimum distance → fixes ⌊(3−1)/2⌋ = 1 error",
    step_encode:"Encoding", step_encode_desc:"H on d[0..2] + CNOT chain distributes |0_L⟩ across 7 qubits.",
    step_error:"Error", step_error_desc:"X gate on d[i] simulates hardware noise (bit-flip).",
    step_syndrome:"Syndrome", step_syndrome_desc:"6 ancillas measure parity groups without reading the data.",
    step_correct:"Correction", step_correct_desc:"syndrome pattern points to the faulty qubit → X restores it.",
    steane_result_1:"13 qubits total (7 data + 6 ancillas) · 1024 shots",
    steane_result_2:"Syndrome 001110 → identifies exactly d[3]",
    steane_result_3:"✓ Same principle used in IBM's real quantum hardware",
  }
};

let lang = 'es';

function setLang(l) {
  lang = l;
  document.querySelectorAll('[data-i]').forEach(el => {
    const key = el.getAttribute('data-i');
    if (T[l][key] !== undefined) el.textContent = T[l][key];
  });
  document.getElementById('lang-toggle-btn').textContent = l === 'es' ? '🇺🇸 English' : '🇲🇽 Español';
  document.getElementById('btn-es').classList.toggle('active', l === 'es');
  document.getElementById('btn-en').classList.toggle('active', l === 'en');
  if (document.getElementById('start-label'))
    document.getElementById('start-label').textContent = T[l]['start_label'];
}

function toggleLang() { setLang(lang === 'es' ? 'en' : 'es'); }
function t(key) { return T[lang][key] || key; }
