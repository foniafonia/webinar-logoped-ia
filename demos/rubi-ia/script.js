/* ═══════════════════════════════════════════════════
   CUADERNO RUB-IA · Lógica principal v2.0
   ═══════════════════════════════════════════════════ */

/* ─── Referencias DOM ───────────────────────────── */
const bookEl        = document.getElementById("book");
const prevBtn       = document.getElementById("prevBtn");
const nextBtn       = document.getElementById("nextBtn");
const printBtn      = document.getElementById("printBtn");
const addPageBtn    = document.getElementById("addPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const totalIndicator= document.getElementById("totalIndicator");
const editorError   = document.getElementById("editorError");
const coverTemplate = document.getElementById("coverTemplate");

const customTitleEl  = document.getElementById("customTitle");
const customPromptEl = document.getElementById("customPrompt");
const repetitionsEl  = document.getElementById("repetitions");
const lineStyleEl    = document.getElementById("lineStyle");
const letterCaseEl   = document.getElementById("letterCase");
const contentLevelEl = document.getElementById("contentLevel");
const ruleSizeEl     = document.getElementById("ruleSize");
const rulingTypeEl   = document.getElementById("rulingType");
const stagePresetEl  = document.getElementById("stagePreset");
const xHeightMmEl    = document.getElementById("xHeightMm");
const ascRatioEl     = document.getElementById("ascRatio");
const descRatioEl    = document.getElementById("descRatio");
const objectiveEl    = document.getElementById("objective");
const applyPresetBtn = document.getElementById("applyPresetBtn");
const studentNameEl  = document.getElementById("studentName");
const therapistNameEl= document.getElementById("therapistName");
const sessionDateEl  = document.getElementById("sessionDate");
const sessionNumEl   = document.getElementById("sessionNum");

/* ─── Estado global ─────────────────────────────── */
let currentPage = 0;
const pages = [];

const STAGE_PRESETS = {
  "3-4": { ruleMm: 8, xHeightMm: 8, ascRatio: 0.8, descRatio: 0.7, rulingType: "montessori", letterCase: "upper", contentLevel: "tracing", lineStyle: "trace", objective: "Pretrazo, direccionalidad y control de presión" },
  "4-5": { ruleMm: 8, xHeightMm: 7, ascRatio: 1.0, descRatio: 0.8, rulingType: "montessori", letterCase: "upper", contentLevel: "syllables", lineStyle: "trace", objective: "Consolidar grafemas iniciales y sílabas directas" },
  "5-6": { ruleMm: 5, xHeightMm: 5, ascRatio: 1.0, descRatio: 1.0, rulingType: "montessori", letterCase: "both", contentLevel: "words", lineStyle: "mixed", objective: "Automatizar sílabas y palabras funcionales" },
  "6-7": { ruleMm: 3.5, xHeightMm: 3.5, ascRatio: 1.2, descRatio: 1.0, rulingType: "simple", letterCase: "cursive", contentLevel: "sentences", lineStyle: "copy", objective: "Transferir a frase funcional y ritmo de escritura" },
  intervencion: { ruleMm: 5, xHeightMm: 5, ascRatio: 1.1, descRatio: 1.1, rulingType: "grid", letterCase: "lower", contentLevel: "pseudo", lineStyle: "trace", objective: "Intervención en disgrafía con control espacial y visomotor" }
};

/* ═══════════════════════════════════════════════════
   PÁGINAS PREDEFINIDAS
   Progresión clínica real:
   Nivel I (8mm):  pretrazo, vocales, consonantes
   Nivel II (5mm): sílabas directas, inversas, trabadas, palabras
   Nivel III (3.5mm): pseudopalabras, frases, registro
   ═══════════════════════════════════════════════════ */
const predefinedPages = [

  /* ─── NIVEL I · Pretrazo ─────────────────────── */
  {
    type: "section",
    level: "I",
    title: "Pretrazo y Grafomotricidad Básica",
    desc: "Pauta 8 mm · Consolida control postural, dirección y presión antes de introducir letras."
  },
  {
    type: "exercise",
    title: "Trazos rectos: vertical, horizontal y diagonal",
    instructions: "Repasa el modelo azul y continúa la serie en las líneas en blanco. Mantén ritmo constante.",
    ruleMm: 8,
    lines: [
      trace("| | | | | | | | | |"),
      ghost("| | | | | | | | | |"),
      blank(),
      trace("— — — — — — — — — —"),
      ghost("— — — — — — — — — —"),
      blank(),
      trace("/ / / / / / / / / /"),
      ghost("/ / / / / / / / / /"),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Los trazos rectos consolidan estabilidad de muñeca, orientación espacial y control proximal-distal antes de cualquier grafema.",
      expected: "Reducción de temblor, mejor continuidad y base para trazados más complejos."
    }
  },
  {
    type: "exercise",
    title: "Curvas y bucles preparatorios",
    instructions: "Sigue el punto de inicio marcado. Repasa el azul, copia en gris y completa las líneas libres.",
    ruleMm: 8,
    lines: [
      trace("o o o o o o o o o o"),
      ghost("o o o o o o o o o o"),
      blank(),
      trace("c c c c c c c c c c"),
      ghost("e e e e e e e e e e"),
      blank(),
      trace("l l l l l l l l l l"),
      ghost("b b b b b b b b b b"),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Las curvas y bucles automatizan los patrones motores de letras redondeadas (a, d, e, g, o, p, q) que forman el 40% del alfabeto.",
      expected: "Mayor fluidez en transiciones redondeadas y mejor cierre de grafemas circulares."
    }
  },
  {
    type: "exercise",
    title: "Zigzags y ángulos: cambio de dirección",
    instructions: "Alterna zigzags ascendentes y descendentes sin levantar el lápiz. Mantén tamaño regular.",
    ruleMm: 8,
    lines: [
      trace("∧ ∧ ∧ ∧ ∧ ∧ ∧ ∧ ∧ ∧"),
      ghost("∧ ∧ ∧ ∧ ∧ ∧ ∧ ∧ ∧ ∧"),
      blank(),
      trace("∨ ∨ ∨ ∨ ∨ ∨ ∨ ∨ ∨ ∨"),
      ghost("∨ ∨ ∨ ∨ ∨ ∨ ∨ ∨ ∨ ∨"),
      blank(),
      trace("M M M M M M M M M M"),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Los cambios de ángulo exigen ajuste fino de presión y coordinación visomotora en tiempo real, necesarios para letras como N, M, V, W.",
      expected: "Mayor precisión en ángulos y reducción de quiebres abruptos en enlaces entre letras."
    }
  },

  /* ─── NIVEL I · Letras aisladas ─────────────── */
  {
    type: "exercise",
    title: "Vocales mayúsculas en pauta amplia",
    instructions: "Repasa cada vocal y copia tres veces. Ocupa toda la altura de la pauta sin salirte.",
    ruleMm: 8,
    lines: [
      trace("A   A   A   A   A   A   A   A"),
      ghost("A   A   A   A   A   A   A   A"),
      blank(),
      trace("E   E   E   E   E   E   E   E"),
      ghost("E   I   I   I   O   O   O   U"),
      blank(),
      blank(),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Las vocales en mayúscula ofrecen trazos claros y segmentados ideales para iniciarse en precisión gráfica. Son la base de cualquier sílaba posterior.",
      expected: "Direccionalidad correcta, altura regular y conciencia de la línea base."
    }
  },
  {
    type: "exercise",
    title: "Consonantes frecuentes en mayúscula: M P L S T",
    instructions: "Practica cada grupo. Recuerda: la M tiene dos montañas, la P baja sólo hasta la mediana.",
    ruleMm: 8,
    lines: [
      trace("M   M   M   M   M   M   M   M"),
      ghost("M   M   M   M   M   M   M   M"),
      blank(),
      trace("P   P   P   P   P   P   P   P"),
      ghost("L   L   L   L   S   S   S   T"),
      blank(),
      blank(),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "M, P, L, S y T son las consonantes más frecuentes en español y las primeras en combinarse con vocales para formar sílabas directas.",
      expected: "Trazado limpio de rasgos diferenciadores y altura consistente entre letras del mismo grupo."
    }
  },

  /* ─── NIVEL II · Sílabas directas ───────────── */
  {
    type: "section",
    level: "II",
    title: "Sílabas, Palabras y Consolidación",
    desc: "Pauta 5 mm · Automatización de secuencias grafomotoras, palabras funcionales y pseudopalabras."
  },
  {
    type: "exercise",
    title: "Sílabas directas MA·ME·MI·MO·MU — BLOC",
    instructions: "Repasa el modelo azul línea a línea. Mantén ritmo y separación entre sílabas.",
    ruleMm: 5,
    lines: [
      trace("MA   ME   MI   MO   MU", "print"),
      ghost("MA   ME   MI   MO   MU", "print"),
      blank(),
      trace("PA   PE   PI   PO   PU", "print"),
      ghost("PA   PE   PI   PO   PU", "print"),
      blank(),
      trace("LA   LE   LI   LO   LU", "print"),
      ghost("LA   LE   LI   LO   LU", "print"),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "La repetición de sílabas CV en mayúscula acelera la conversión fonema-grafema y consolida secuencias motoras automatizadas con trazos claramente diferenciados.",
      expected: "Aumento de velocidad de transcripción con menor tasa de omisiones o inversiones silábicas."
    }
  },
  {
    type: "exercise",
    title: "Sílabas directas ma·me·mi — minúscula bloque",
    instructions: "Trabaja la zona de escritura media y los ascendentes de 'l', 'b'. No invadas las franjas vecinas.",
    ruleMm: 5,
    lines: [
      trace("ma   me   mi   mo   mu", "print"),
      ghost("ma   me   mi   mo   mu", "print"),
      blank(),
      trace("pa   pe   pi   po   pu", "print"),
      ghost("pa   pe   pi   po   pu", "print"),
      blank(),
      trace("sa   se   si   so   su", "print"),
      ghost("sa   se   si   so   su", "print"),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "La minúscula exige control preciso de las tres zonas de escritura (ascendentes, cuerpo, descendentes) y mejora la legibilidad cotidiana.",
      expected: "Reducción de deformaciones y mejor encaje de las letras en el renglón escolar."
    }
  },
  {
    type: "exercise",
    title: "Sílabas directas en cursiva enlazada",
    instructions: "Practica sin levantar el lápiz entre letras de la misma sílaba. El enlace es clave.",
    ruleMm: 5,
    lines: [
      trace("ma  me  mi  mo  mu", "cursive"),
      ghost("ma  me  mi  mo  mu", "cursive"),
      blank(),
      trace("la  le  li  lo  lu", "cursive"),
      ghost("la  le  li  lo  lu", "cursive"),
      blank(),
      trace("sa  se  si  so  su", "cursive"),
      ghost("sa  se  si  so  su", "cursive"),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "La cursiva mejora la continuidad cinética del trazo y economiza los movimientos en escritura prolongada, reduciendo la fragmentación grafomotora.",
      expected: "Mayor fluidez con menor número de interrupciones y mejor velocidad de escritura a largo plazo."
    }
  },
  {
    type: "exercise",
    title: "Sílabas inversas: AM EM AN EN AR",
    instructions: "La estructura VC invierte el orden habitual. Practica la vocal completa antes de la consonante.",
    ruleMm: 5,
    lines: [
      trace("AM   EM   AN   EN   AR", "print"),
      ghost("AM   EM   AN   EN   AR", "print"),
      blank(),
      trace("al   el   il   ol   ul", "print"),
      ghost("al   el   il   ol   ul", "print"),
      blank(),
      trace("as   es   is   os   us", "print"),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Las sílabas inversas incrementan la demanda secuencial y entrenan la flexibilidad del sistema fonema-grafema al invertir el orden habitual CV.",
      expected: "Reducción de errores de inversión silábica y mejora en palabras con coda consonántica (campo, bolsa, arco)."
    }
  },
  {
    type: "exercise",
    title: "Sílabas trabadas: PRA·PRE · BRA·BRE · TRA·TRE",
    instructions: "Mantén forma clara en los grupos consonánticos CCV. No omitas la primera consonante.",
    ruleMm: 5,
    lines: [
      trace("pra  pre  pri  pro  pru", "print"),
      ghost("pra  pre  pri  pro  pru", "print"),
      blank(),
      trace("bra  bre  bri  bro  bru", "print"),
      ghost("bra  bre  bri  bro  bru", "print"),
      blank(),
      trace("tra  tre  tri  cla  glo", "print"),
      ghost("tra  tre  tri  cla  glo", "print"),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Las sílabas trabadas incrementan la demanda secuencial grafomotora y entrenan el control de grupos consonánticos presentes en el 35% del vocabulario escolar.",
      expected: "Mejor rendimiento en palabras escolares complejas y reducción de omisiones de la primera consonante."
    }
  },
  {
    type: "exercise",
    title: "Palabras frecuentes del español",
    instructions: "Copia primero el modelo gris, luego escribe de memoria en las líneas libres.",
    ruleMm: 5,
    lines: [
      ghost("mesa  sopa  nube  pato  mano", "print"),
      blank(),
      ghost("luna  tela  leche  pala  boca", "print"),
      blank(),
      ghost("libro  campo  perro  flor  casa", "print"),
      blank(),
      blank(),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Las palabras de alta frecuencia consolidan la ortografía implícita y automatizan la secuencia motora de los vocablos más usados en la comunicación escrita.",
      expected: "Mayor automatización de palabras del vocabulario básico y reducción de errores ortográficos frecuentes."
    }
  },

  /* ─── NIVEL III · Generalización ────────────── */
  {
    type: "section",
    level: "III",
    title: "Generalización y Registro Clínico",
    desc: "Pauta 3.5 mm · Pseudopalabras, frases funcionales y hoja de registro para el terapeuta."
  },
  {
    type: "exercise",
    title: "Pseudopalabras — sin corrección léxica",
    instructions: "Copia exactamente lo que ves. No corrijas ni cambies nada. La ortografía no importa aquí.",
    ruleMm: 3.5,
    lines: [
      ghost("puaso   quesa   tirlo   malpo", "print"),
      blank(),
      ghost("punea   costi   larpo   befrim", "print"),
      blank(),
      ghost("MUTRA   SOLPE   BRINCA   CALPOE", "print"),
      blank(),
      blank(),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "Las pseudopalabras eliminan el apoyo de la memoria léxica y fuerzan la decodificación fonema-grafema pura, revelan el nivel real de automatización grafomotora.",
      expected: "Mayor generalización del patrón motor a secuencias nuevas y desconocidas. Indicador de transferencia real del aprendizaje."
    }
  },
  {
    type: "exercise",
    title: "Frases funcionales breves",
    instructions: "Repasa y copia respetando espaciado entre palabras y signos de puntuación.",
    ruleMm: 3.5,
    lines: [
      trace("Mi mano escribe suave y clara.", "print"),
      ghost("Mi mano escribe suave y clara.", "print"),
      blank(),
      trace("Hoy mantengo ritmo y buen espacio.", "print"),
      ghost("Hoy mantengo ritmo y buen espacio.", "print"),
      blank(),
      trace("La frase es larga pero yo puedo.", "print"),
      blank(),
      blank(),
      blank(), blank(), blank()
    ],
    theory: {
      why: "La frase integra control motor, atención sostenida, planificación espacial y segmentación léxica en una tarea funcional análoga a la escritura de aula.",
      expected: "Transferencia de los patrones entrenados a las tareas de copia y dictado escolar con mejor legibilidad global."
    }
  },
  {
    type: "exercise",
    title: "Registro clínico del terapeuta",
    instructions: "Anota indicadores de esta sesión. Compara con sesiones anteriores para ajustar el nivel de pauta.",
    ruleMm: 5,
    lines: [
      blankLabel("Alumno/a:"),
      blankLabel("Sesión nº:                    Fecha:"),
      blankLabel("Pauta usada: □ 8mm  □ 5mm  □ 3.5mm"),
      blankLabel("Presión del lápiz: □ baja  □ adecuada  □ excesiva"),
      blankLabel("Velocidad:  □ lenta  □ adecuada  □ rápida"),
      blankLabel("Legibilidad global (1-5):"),
      blankLabel("Respeto de márgenes:"),
      blankLabel("Errores más frecuentes:"),
      blankLabel("Apoyos y adaptaciones usadas:"),
      blankLabel("Objetivo próxima sesión:"),
      blank(), blank()
    ],
    theory: {
      why: "Registrar indicadores concretos permite ajustar la dificultad con criterio terapéutico objetivo y documentar la evolución funcional del alumno.",
      expected: "Intervención más individualizada, medible y justificable ante familia y equipo educativo."
    }
  }
];

/* ═══════════════════════════════════════════════════
   INICIALIZACIÓN
   ═══════════════════════════════════════════════════ */
function initialize() {
  pages.push({ type: "cover" });
  pages.push(...predefinedPages);
  currentPage = getInitialPageFromUrl();
  renderBook();
  bindEvents();
  applyStagePreset();
}

function bindEvents() {
  prevBtn.addEventListener("click", () => navigate(-1));
  nextBtn.addEventListener("click", () => navigate(+1));
  printBtn.addEventListener("click", () => {
    injectSessionDataIntoCover();
    window.print();
  });
  addPageBtn.addEventListener("click", createCustomPageFromInput);
  applyPresetBtn?.addEventListener("click", applyStagePreset);
  stagePresetEl?.addEventListener("change", applyStagePreset);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowRight") navigate(+1);
    if (e.key === "ArrowLeft")  navigate(-1);
  });
}

function navigate(delta) {
  currentPage = Math.max(0, Math.min(pages.length - 1, currentPage + delta));
  updateFlipState();
}

/* ═══════════════════════════════════════════════════
   RENDERIZADO DEL LIBRO
   ═══════════════════════════════════════════════════ */
function renderBook() {
  bookEl.innerHTML = "";

  pages.forEach((pageData, index) => {
    let pageEl;
    if (pageData.type === "cover") {
      pageEl = createCoverPage();
    } else if (pageData.type === "section") {
      pageEl = createSectionPage(pageData);
    } else {
      pageEl = createExercisePage(pageData, index);
    }
    pageEl.classList.add("page");
    pageEl.dataset.index = String(index);
    bookEl.appendChild(pageEl);
  });

  updateFlipState();
}

function createCoverPage() {
  const cloned = coverTemplate.content.firstElementChild.cloneNode(true);
  injectSessionDataIntoCover(cloned);
  return cloned;
}

function injectSessionDataIntoCover(coverEl) {
  const el = coverEl || bookEl.querySelector(".cover-page");
  if (!el) return;

  const meta = el.querySelector("#coverMeta") || el.querySelector(".cover-meta");
  if (!meta) return;

  const student   = studentNameEl?.value.trim();
  const therapist = therapistNameEl?.value.trim();
  const date      = sessionDateEl?.value;
  const session   = sessionNumEl?.value;

  const parts = [];
  if (student)   parts.push(`<span><strong>Alumno/a:</strong> ${escapeHtml(student)}</span>`);
  if (therapist) parts.push(`<span><strong>Terapeuta:</strong> ${escapeHtml(therapist)}</span>`);
  if (date)      parts.push(`<span><strong>Fecha:</strong> ${escapeHtml(date)}</span>`);
  if (session)   parts.push(`<span><strong>Sesión:</strong> nº ${escapeHtml(session)}</span>`);

  meta.innerHTML = parts.join("");
}

function buildPrintMetaText(data) {
  const student = studentNameEl?.value.trim() || "____________";
  const therapist = therapistNameEl?.value.trim() || "____________";
  const date = sessionDateEl?.value || "____-__-__";
  const session = sessionNumEl?.value || "__";
  const rule = `${data.ruleMm || 5}mm`;
  const ruling = data.rulingType || "montessori";
  return `Alumno: ${student} | Terapeuta: ${therapist} | Fecha: ${date} | Sesion: ${session} | Pauta: ${rule} ${ruling}`;
}

function createSectionPage(data) {
  const page = document.createElement("article");
  const inner = document.createElement("div");
  inner.className = "section-header";
  inner.innerHTML = `
    <div class="section-num">NIVEL ${escapeHtml(data.level)}</div>
    <h2>${escapeHtml(data.title)}</h2>
    <p>${escapeHtml(data.desc)}</p>
  `;
  page.appendChild(inner);
  return page;
}

function createExercisePage(data, index) {
  const page  = document.createElement("article");
  const inner = document.createElement("div");
  inner.className = "page-inner";

  /* Cabecera */
  const header = document.createElement("div");
  header.className = "page-header";

  const title = document.createElement("h3");
  title.className = "page-title";
  title.textContent = data.title;

  const number = document.createElement("span");
  number.className = "page-number";
  number.textContent = `P${index}`;

  header.append(title, number);

  /* Instrucciones */
  const instr = document.createElement("p");
  instr.className = "instructions";
  instr.textContent = data.instructions || "";

  const printMeta = document.createElement("div");
  printMeta.className = "print-meta";
  printMeta.textContent = buildPrintMetaText(data);

  /* Área de práctica */
  const practiceArea = document.createElement("div");
  practiceArea.className = "practice-area";

  const guide = getGuidelineConfig(data);
  const rhMm = ruleBandHeightMm(data.ruleMm, guide.xHeightMm, guide.ascRatio, guide.descRatio);
  practiceArea.style.setProperty("--rh", `${rhMm}mm`);
  practiceArea.style.setProperty("--xline", `${guide.xLinePct}%`);
  practiceArea.dataset.ruling = guide.rulingType;

  data.lines.forEach((entry) => {
    const line = document.createElement("div");
    line.className = "line";

    const contentEl = buildLineContent(entry);
    if (contentEl) line.appendChild(contentEl);
    practiceArea.appendChild(line);
  });

  /* Teoría clínica */
  const theory = document.createElement("div");
  theory.className = "theory-box";
  theory.innerHTML = `
    <div>
      <strong>Por qué se trabaja</strong>
      <span>${escapeHtml(data.theory.why)}</span>
    </div>
    <div>
      <strong>Resultado esperado</strong>
      <span>${escapeHtml(data.theory.expected)}</span>
    </div>
  `;

  inner.append(header, printMeta, instr, practiceArea, theory);
  page.appendChild(inner);
  return page;
}

/* ─── Render de contenido de línea ─────────────── */
function buildLineContent(entry) {
  if (!entry || entry.kind === "blank") return null;

  const span = document.createElement("span");

  if (entry.kind === "trace") {
    return buildTraceSvg(entry.text || "", entry.script || "print");
  }

  if (entry.kind === "ghost") {
    span.className = `ghost-text${entry.script === "cursive" ? " cursive" : ""}`;
    span.textContent = entry.text || "";
    return span;
  }

  if (entry.kind === "label") {
    span.className = "label-text";
    span.textContent = entry.text || "";
    return span;
  }

  return null;
}

function buildTraceSvg(text, script) {
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.classList.add("trace-svg");
  svg.setAttribute("viewBox", "0 0 1200 100");
  svg.setAttribute("preserveAspectRatio", "none");

  const defs = document.createElementNS(svgNs, "defs");
  const symbol = document.createElementNS(svgNs, "symbol");
  symbol.setAttribute("id", "startDot");
  symbol.setAttribute("viewBox", "0 0 6 6");
  const dot = document.createElementNS(svgNs, "circle");
  dot.setAttribute("cx", "3");
  dot.setAttribute("cy", "3");
  dot.setAttribute("r", "2.3");
  symbol.appendChild(dot);
  defs.appendChild(symbol);

  const useDot = document.createElementNS(svgNs, "use");
  useDot.setAttribute("href", "#startDot");
  useDot.setAttribute("x", "2");
  useDot.setAttribute("y", "10");
  useDot.setAttribute("width", "6");
  useDot.setAttribute("height", "6");

  const textEl = document.createElementNS(svgNs, "text");
  textEl.textContent = text;
  textEl.setAttribute("x", "12");
  textEl.setAttribute("y", "68");
  if (script === "cursive") {
    textEl.classList.add("cursive");
  }

  svg.append(defs, useDot, textEl);
  return svg;
}

function applyStagePreset() {
  const presetKey = stagePresetEl?.value;
  const preset = presetKey ? STAGE_PRESETS[presetKey] : null;
  if (!preset) return;

  ruleSizeEl.value = String(preset.ruleMm);
  lineStyleEl.value = preset.lineStyle;
  letterCaseEl.value = preset.letterCase;
  rulingTypeEl.value = preset.rulingType;
  xHeightMmEl.value = String(preset.xHeightMm);
  ascRatioEl.value = String(preset.ascRatio);
  descRatioEl.value = String(preset.descRatio);
  objectiveEl.value = preset.objective;
}

/* ═══════════════════════════════════════════════════
   GENERADOR DE PÁGINAS DEL TERAPEUTA
   ═══════════════════════════════════════════════════ */
function createCustomPageFromInput() {
  const title      = customTitleEl.value.trim() || "Serie personalizada";
  const rawPrompt  = customPromptEl.value.trim();
  const repetitions= Number(repetitionsEl.value) || 3;
  const style      = lineStyleEl.value;
  const letterCase = letterCaseEl.value;
  const ruleMm     = Number(ruleSizeEl.value) || 5;
  const rulingType = rulingTypeEl.value || "montessori";
  const xHeightMm  = Number(xHeightMmEl.value) || ruleMm;
  const ascRatio   = Number(ascRatioEl.value) || 1;
  const descRatio  = Number(descRatioEl.value) || 1;
  const objective  = objectiveEl.value.trim() || "Consolidar automatización grafomotora";

  if (!rawPrompt) {
    editorError.textContent = "Escribe primero una secuencia (ej: MA ME MI MO MU).";
    return;
  }

  const tokens = rawPrompt
    .split(/[\s,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!tokens.length) {
    editorError.textContent = "No se detectaron sílabas o palabras válidas.";
    return;
  }

  editorError.textContent = "";
  const script = letterCase === "cursive" ? "cursive" : "print";

  const lines = buildCustomLines(tokens, repetitions, style, letterCase, script);
  const modelText = tokens.map((t) => applyCase(t, letterCase)).join("  ");

  const customPage = {
    type: "exercise",
    title,
    instructions: `Modelo: ${modelText}. Pauta ${ruleMm}mm · x-height ${xHeightMm}mm · ratio ${ascRatio}:${1}:${descRatio}.`,
    ruleMm,
    rulingType,
    guide: { xHeightMm, ascRatio, descRatio },
    lines,
    theory: {
      why: `${objective}. La página combina calco, modelo de referencia y práctica libre para maximizar la retención grafomotora.`,
      expected: "Mejora progresiva de legibilidad, ritmo gráfico y automatización de la secuencia entrenada."
    }
  };

  pages.push(customPage);
  renderBook();
  currentPage = pages.length - 1;
  updateFlipState();
}

function buildCustomLines(tokens, repetitions, style, letterCase, script) {
  const lines = [];
  const safeReps = Math.max(1, Math.min(6, repetitions));

  tokens.forEach((token) => {
    const word = applyCase(token, letterCase);

    /* Construir texto de repetición para línea de calco */
    const traceText = Array.from({ length: safeReps }, () => word).join("   ");
    /* Muestra simple para línea ghost */
    const ghostText = Array.from({ length: Math.max(2, Math.ceil(safeReps / 2)) }, () => word).join("   ");

    if (style === "trace") {
      lines.push(trace(traceText, script));
      lines.push(ghost(ghostText, script));
      lines.push(blank());
    } else if (style === "copy") {
      lines.push(ghost(ghostText, script));
      lines.push(blank());
      lines.push(blank());
    } else {
      /* mixed: calco + libre */
      lines.push(trace(traceText, script));
      lines.push(blank());
    }
  });

  /* Pad hasta 12 líneas */
  while (lines.length < 12) lines.push(blank());
  return lines.slice(0, 12);
}

function applyCase(token, letterCase) {
  if (letterCase === "lower")   return token.toLowerCase();
  if (letterCase === "both")    return `${token.toUpperCase()} ${token.toLowerCase()}`;
  if (letterCase === "cursive") return token.toLowerCase();
  return token.toUpperCase();
}

/* ═══════════════════════════════════════════════════
   ESTADO DEL FLIP
   ═══════════════════════════════════════════════════ */
function updateFlipState() {
  const pageEls = Array.from(bookEl.querySelectorAll(".page"));
  const total   = pageEls.length;

  pageEls.forEach((page, index) => {
    const isFlipped = index < currentPage;
    page.classList.toggle("flipped", isFlipped);
    /* Z-index: la página visible encima de todo, las anteriores debajo */
    page.style.zIndex = isFlipped
      ? String(index + 1)
      : String(total * 2 - index);
  });

  pageIndicator.textContent = `Página ${currentPage + 1}`;
  totalIndicator.textContent = `/ ${total}`;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= total - 1;
}

/* ═══════════════════════════════════════════════════
   UTILIDADES
   ═══════════════════════════════════════════════════ */

/**
 * Convierte ruleMm (pauta solicitada) en la altura real de banda en mm.
 * Incluye espacio para ascendentes/descendentes más la zona media.
 * Calibrado para impresión A4 y pantalla proporcional.
 */
function ruleBandHeightMm(ruleMm, xHeightMm, ascRatio, descRatio) {
  const safeX = Number.isFinite(xHeightMm) ? xHeightMm : ruleMm;
  const safeAsc = Number.isFinite(ascRatio) ? ascRatio : 1;
  const safeDesc = Number.isFinite(descRatio) ? descRatio : 1;
  const computed = safeX * (safeAsc + 1 + safeDesc);

  if (Number.isFinite(computed) && computed > 3) {
    return Math.min(28, Math.max(8, computed));
  }

  if (ruleMm >= 8) return 20;
  if (ruleMm >= 5) return 13;
  return 9.5;
}

function getGuidelineConfig(data) {
  const guide = data.guide || {};
  const ascRatio = Number(guide.ascRatio ?? 1);
  const descRatio = Number(guide.descRatio ?? 1);
  const xHeightMm = Number(guide.xHeightMm ?? data.ruleMm ?? 5);
  const rulingType = data.rulingType || "montessori";
  const total = Math.max(0.2, ascRatio + 1 + descRatio);
  const xLinePct = ((ascRatio / total) * 100).toFixed(2);

  return {
    ascRatio,
    descRatio,
    xHeightMm,
    rulingType,
    xLinePct
  };
}

function getInitialPageFromUrl() {
  const params    = new URLSearchParams(window.location.search);
  const requested = Number(params.get("page"));
  if (!Number.isFinite(requested)) return 0;
  const idx = Math.floor(requested) - 1;
  return Math.max(0, Math.min(idx, pages.length - 1));
}

function trace(text, script = "print") {
  return { kind: "trace", text, script };
}

function ghost(text, script = "print") {
  return { kind: "ghost", text, script };
}

function blank() {
  return { kind: "blank", text: "" };
}

function blankLabel(text) {
  return { kind: "label", text };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ─── Arranque ───────────────────────────────────── */
initialize();
