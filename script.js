/* =====================================================
   RALLY DE MATEMÁTICAS — TEC DE MONTERREY
   JavaScript: Audio Futurista + Partículas Interactivas
   ===================================================== */

/* 1) SINTETIZADOR DE AUDIO FUTURISTA (Web Audio API) */
const AudioFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  // Sonido futurista de inicio cuando entra "Matemáticas"
  playFuturisticStart() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Oscilador 1: Barrido de frecuencia ascendente estilo láser / energía
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 1.2);
    
    gain1.gain.setValueAtTime(0.01, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = "lowpass";
    filter1.frequency.setValueAtTime(300, now);
    filter1.frequency.exponentialRampToValueAtTime(3500, now + 1.0);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 1.8);

    // Oscilador 2: Sub-bajo futurista impactante
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(55, now);
    sub.frequency.exponentialRampToValueAtTime(120, now + 0.4);
    sub.frequency.exponentialRampToValueAtTime(30, now + 1.5);

    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    sub.start(now);
    sub.stop(now + 1.5);
  },

  // Sonido futurista al sumar / restar puntos (arpegio digital)
  playPointChime(isPositive = true) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Notas futuristas ascendentes para positivo, descendentes para negativo
    const freqs = isPositive
      ? [523.25, 659.25, 783.99, 1046.50] // Do, Mi, Sol, Do (C5-E5-G5-C6)
      : [440.00, 370.00, 311.13, 220.00]; // La, Fa#, Mib, La

    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.05);

      gain.gain.setValueAtTime(0.12, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.3);
    });
  }
};

/* Activar AudioContext con cualquier interacción del usuario */
window.addEventListener("pointerdown", () => AudioFX.init(), { once: true });

/* 2) CONFIGURACIÓN DE FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyBgVBaF5tdGRRSFkvIddbLHmwOXgi8gqTk",
  authDomain: "rallymatematicas-b1aa0.firebaseapp.com",
  databaseURL: "https://rallymatematicas-b1aa0-default-rtdb.firebaseio.com",
  projectId: "rallymatematicas-b1aa0",
  storageBucket: "rallymatematicas-b1aa0.firebasestorage.app",
  messagingSenderId: "953995472570",
  appId: "1:953995472570:web:1007d09f1ff49ce21e1c83"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const teamsRef = db.ref("teams");

/* 3) ESTADO GLOBAL */
const MAX_TEAMS = 20;
let teamsData = {};
let sortedTeams = [];
let editingTeamId = null;
let topChart = null;
let isCanvasRunning = false;

const COLOR_PRESETS = [
  "#00f5ff", "#8b5cf6", "#0057ff", "#ec4899",
  "#10b981", "#f59e0b", "#f43f5e", "#ffffff"
];

/* 4) ELEMENTOS DEL DOM */
const splashScreen   = document.getElementById("splashScreen");
const appEl          = document.getElementById("app");
const btnAddTeam     = document.getElementById("btnAddTeam");
const teamsCounterEl = document.getElementById("teamsCounter");
const rankingListEl  = document.getElementById("rankingList");
const emptyStateEl   = document.getElementById("emptyState");
const chartEmptyEl   = document.getElementById("chartEmptyState");

const teamModal      = document.getElementById("teamModal");
const modalTitle     = document.getElementById("modalTitle");
const teamForm       = document.getElementById("teamForm");
const teamIdInput    = document.getElementById("teamId");
const teamNameInput  = document.getElementById("teamName");
const teamColorInput = document.getElementById("teamColor");
const colorPresetsEl = document.getElementById("colorPresets");
const btnCloseModal  = document.getElementById("btnCloseModal");
const btnDeleteTeam  = document.getElementById("btnDeleteTeam");

const toastEl        = document.getElementById("toast");
const statusDot      = document.getElementById("statusDot");
const statusText     = document.getElementById("statusText");
const chartCanvas    = document.getElementById("topChart");
const cursorGlow     = document.getElementById("cursorGlow");

/* 5) CANVAS E INTERACTIVIDAD DE MOUSE CON RASTRO DE COLOR Y PARTÍCULAS */
let mouseX = -500;
let mouseY = -500;
const mouseParticles = [];

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (cursorGlow) {
    cursorGlow.style.left = `${mouseX}px`;
    cursorGlow.style.top = `${mouseY}px`;
  }

  // Generar estela/rastro de color al mover el cursor
  if (isCanvasRunning && Math.random() < 0.6) {
    mouseParticles.push({
      x: mouseX,
      y: mouseY,
      size: 3 + Math.random() * 8,
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      alpha: 1,
      decay: 0.02 + Math.random() * 0.03
    });
  }
});

function initMathBackgroundCanvas() {
  const canvas = document.getElementById("mathBgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const mathItems = ["π", "∑", "∫", "√x", "f(x)", "Δ", "∞", "d/dx", "lim", "sin(x)", "∇", "α", "β"];

  const bgParticles = Array.from({ length: 22 }, () => ({
    text: mathItems[Math.floor(Math.random() * mathItems.length)],
    x: Math.random() * width,
    y: Math.random() * height,
    size: 14 + Math.random() * 16,
    speedY: -0.2 - Math.random() * 0.3,
    speedX: (Math.random() - 0.5) * 0.2,
    opacity: 0.12 + Math.random() * 0.25,
    color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]
  }));

  function animate() {
    if (!isCanvasRunning) return;
    ctx.clearRect(0, 0, width, height);

    // Dibuja símbolos matemáticos de fondo
    bgParticles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < -30) { p.y = height + 30; p.x = Math.random() * width; }

      // Reacción al pasar el mouse cerca
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let extraScale = 1;

      if (dist < 120) {
        extraScale = 1 + (120 - dist) / 70; // Se agrandan al acercarse
      }

      ctx.save();
      ctx.font = `600 ${p.size * extraScale}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = dist < 120 ? Math.min(1, p.opacity + 0.5) : p.opacity;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });

    // Dibuja partículas luminosas de la estela del mouse
    for (let i = mouseParticles.length - 1; i >= 0; i--) {
      const p = mouseParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        mouseParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }
  
  isCanvasRunning = true;
  animate();
}

/* 6) SECUENCIA DEL SPLASH + DISPARO DE SONIDO FUTURISTA */
function initSplashScreen() {
  // Dispara el sonido futurista a los 1200ms justo cuando la palabra "Matemáticas" inicia su expansión
  setTimeout(() => {
    AudioFX.playFuturisticStart();
  }, 1200);

  // Transición exacta sin modificar duraciones
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    appEl.classList.remove("hidden");
    
    initMathBackgroundCanvas();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        appEl.classList.add("visible");
      });
    });

    setTimeout(() => splashScreen.remove(), 500);
  }, 2700);
}

/* 7) AUXILIARES Y UTILERÍAS */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const bigint = parseInt(full, 16);
  return `rgba(${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}, ${alpha})`;
}

function showToast(message, type = "") {
  toastEl.textContent = message;
  toastEl.className = "toast show " + type;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toastEl.classList.remove("show"), 2500);
}

function buildColorPresets() {
  colorPresetsEl.innerHTML = "";
  COLOR_PRESETS.forEach(color => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.background = color;
    swatch.style.color = color;
    swatch.addEventListener("click", () => {
      teamColorInput.value = color;
      highlightActiveSwatch();
    });
    swatch.dataset.color = color;
    colorPresetsEl.appendChild(swatch);
  });
}

function highlightActiveSwatch() {
  const current = teamColorInput.value.toLowerCase();
  document.querySelectorAll(".color-swatch").forEach(sw => {
    sw.classList.toggle("active", sw.dataset.color.toLowerCase() === current);
  });
}

/* 8) CONTROL DEL MODAL */
function openAddModal() {
  editingTeamId = null;
  modalTitle.textContent = "Agregar Equipo";
  teamIdInput.value = "";
  teamNameInput.value = "";
  teamColorInput.value = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
  btnDeleteTeam.classList.add("hidden");
  highlightActiveSwatch();
  teamModal.classList.remove("hidden");
  setTimeout(() => teamNameInput.focus(), 50);
}

function openEditModal(id) {
  const team = teamsData[id];
  if (!team) return;
  editingTeamId = id;
  modalTitle.textContent = "Editar Equipo";
  teamIdInput.value = id;
  teamNameInput.value = team.name;
  teamColorInput.value = team.color;
  btnDeleteTeam.classList.remove("hidden");
  highlightActiveSwatch();
  teamModal.classList.remove("hidden");
  setTimeout(() => teamNameInput.focus(), 50);
}

function closeModal() {
  teamModal.classList.add("hidden");
  teamForm.reset();
  editingTeamId = null;
}

btnAddTeam.addEventListener("click", () => {
  if (Object.keys(teamsData).length >= MAX_TEAMS) {
    showToast(`Máximo ${MAX_TEAMS} equipos alcanzado`, "error");
    return;
  }
  openAddModal();
});

btnCloseModal.addEventListener("click", closeModal);
teamModal.addEventListener("click", (e) => { if (e.target === teamModal) closeModal(); });
teamColorInput.addEventListener("input", highlightActiveSwatch);

/* 9) MANEJO DE BASE DE DATOS Y PUNTAJE CON SONIDO FUTURISTA */
teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = teamNameInput.value.trim();
  const color = teamColorInput.value;

  if (!name) { showToast("Ingresa un nombre de equipo", "error"); return; }

  if (editingTeamId) {
    teamsRef.child(editingTeamId).update({ name, color })
      .then(() => { showToast("Equipo actualizado ✅", "success"); closeModal(); })
      .catch(err => showToast("Error: " + err.message, "error"));
  } else {
    teamsRef.push({
      name,
      color,
      score: 0,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    })
      .then(() => { 
        AudioFX.playPointChime(true);
        showToast("Equipo registrado 🎉", "success"); 
        closeModal(); 
      })
      .catch(err => showToast("Error: " + err.message, "error"));
  }
});

btnDeleteTeam.addEventListener("click", () => {
  if (!editingTeamId) return;
  const team = teamsData[editingTeamId];
  if (confirm(`¿Eliminar al equipo "${team ? team.name : ""}"?`)) {
    teamsRef.child(editingTeamId).remove()
      .then(() => { showToast("Equipo eliminado", "success"); closeModal(); })
      .catch(err => showToast("Error: " + err.message, "error"));
  }
});

// Función que suma/resta puntos e invoca el sonido futurista
function adjustScore(id, delta) {
  if (!delta || isNaN(delta)) return;
  const numDelta = Number(delta);
  
  // Reproduce sonido futurista acorde al cambio (+ o -)
  AudioFX.playPointChime(numDelta >= 0);

  teamsRef.child(id).child("score").transaction(current => (current || 0) + numDelta);
}

/* 10) RENDERIZADO GENERAL Y GRÁFICOS */
function recomputeSortedTeams() {
  sortedTeams = Object.entries(teamsData)
    .map(([id, data]) => ({ id, ...data, score: Number(data.score) || 0 }))
    .sort((a, b) => b.score - a.score);
}

function renderCounter() {
  teamsCounterEl.textContent = `${Object.keys(teamsData).length} / ${MAX_TEAMS} equipos`;
}

function renderRanking() {
  rankingListEl.innerHTML = "";
  if (sortedTeams.length === 0) {
    emptyStateEl.classList.remove("hidden");
    return;
  }
  emptyStateEl.classList.add("hidden");

  sortedTeams.forEach((team, index) => {
    const rank = index + 1;
    const row = document.createElement("div");
    row.className = "team-row";
    if (rank <= 3) row.classList.add(`rank-${rank}`);
    row.dataset.id = team.id;

    row.innerHTML = `
      <span class="team-position">${rank}°</span>
      <span class="team-color-dot" style="background:${team.color}; color:${team.color};"></span>
      <div class="team-info">
        <div class="team-name">${escapeHtml(team.name)}</div>
        <div class="team-score">${team.score} pts</div>
      </div>
      <div class="row-icons">
        <button class="icon-btn" title="Editar" data-action="edit">✎</button>
        <button class="icon-btn" title="Eliminar" data-action="delete">🗑</button>
      </div>
      <div class="team-controls">
        <button class="score-btn plus" data-action="delta" data-delta="1">+1</button>
        <button class="score-btn plus" data-action="delta" data-delta="5">+5</button>
        <button class="score-btn plus" data-action="delta" data-delta="10">+10</button>
        <button class="score-btn minus" data-action="delta" data-delta="-5">-5</button>
        <div class="custom-score">
          <input type="number" placeholder="±#" data-role="custom-input">
          <button class="btn-apply" data-action="apply-custom">Ok</button>
        </div>
      </div>
    `;

    rankingListEl.appendChild(row);
  });
}

rankingListEl.addEventListener("click", (e) => {
  const row = e.target.closest(".team-row");
  if (!row) return;
  const id = row.dataset.id;
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === "edit") openEditModal(id);
  else if (action === "delete") {
    if (confirm("¿Eliminar este equipo?")) teamsRef.child(id).remove();
  } else if (action === "delta") {
    adjustScore(id, actionEl.dataset.delta);
  } else if (action === "apply-custom") {
    const input = row.querySelector('[data-role="custom-input"]');
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val !== 0) { adjustScore(id, val); input.value = ""; }
  }
});

function renderChart() {
  const top5 = sortedTeams.slice(0, 5);
  if (top5.length === 0) {
    chartEmptyEl.classList.remove("hidden");
    chartCanvas.classList.add("hidden");
    if (topChart) { topChart.destroy(); topChart = null; }
    return;
  }
  chartEmptyEl.classList.add("hidden");
  chartCanvas.classList.remove("hidden");

  const labels = top5.map(t => t.name);
  const data = top5.map(t => t.score);
  const ctx = chartCanvas.getContext("2d");

  const backgrounds = top5.map(t => {
    const g = ctx.createLinearGradient(0, 0, chartCanvas.width || 300, 0);
    g.addColorStop(0, hexToRgba(t.color, 0.35));
    g.addColorStop(1, hexToRgba(t.color, 0.95));
    return g;
  });

  if (topChart) {
    topChart.data.labels = labels;
    topChart.data.datasets[0].data = data;
    topChart.data.datasets[0].backgroundColor = backgrounds;
    topChart.update();
    return;
  }

  topChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Puntos",
        data,
        backgroundColor: backgrounds,
        borderColor: top5.map(t => t.color),
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#ffffff", font: { weight: "600" } }, grid: { display: false } }
      }
    }
  });
}

function renderApp() {
  recomputeSortedTeams();
  renderCounter();
  renderRanking();
  renderChart();
}

/* 11) INICIALIZACIÓN */
teamsRef.on("value", (snapshot) => {
  teamsData = snapshot.val() || {};
  renderApp();
});

db.ref(".info/connected").on("value", (snap) => {
  const connected = snap.val() === true;
  statusDot.classList.toggle("online", connected);
  statusText.textContent = connected ? "Conectado en tiempo real" : "Sin conexión";
});

document.addEventListener("DOMContentLoaded", () => {
  buildColorPresets();
  initSplashScreen();
});
