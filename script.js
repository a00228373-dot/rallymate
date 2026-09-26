/* =====================================================
   RALLY DE MATEMÁTICAS — TEC DE MONTERREY
   Lógica: Firebase + Chart.js + Animación SVG Splash
   ===================================================== */

/* -----------------------------------------------------
   1) CONFIGURACIÓN DE FIREBASE
------------------------------------------------------ */
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

/* -----------------------------------------------------
   2) ESTADO GLOBAL
------------------------------------------------------ */
const MAX_TEAMS = 20;
let teamsData = {};
let sortedTeams = [];
let previousScores = {};
let editingTeamId = null;
let topChart = null;

const COLOR_PRESETS = [
  "#00f5ff", "#8b5cf6", "#0057ff", "#ec4899",
  "#10b981", "#f59e0b", "#f43f5e", "#ffffff"
];

/* -----------------------------------------------------
   3) REFERENCIAS DOM
------------------------------------------------------ */
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

/* =====================================================
   4) FONDO DE SÍMBOLOS MATEMÁTICOS (CANVAS)
   ===================================================== */
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

  const mathItems = [
    "π", "∑", "∫", "√x", "e^{iπ}+1=0", "f(x)", "Δ", "∞",
    "d/dx", "lim", "x² + y² = r²", "sin(x)", "cos(θ)", "∇",
    "α", "β", "λ", "3.14159", "E = mc²", "∫ x dx", "±"
  ];

  const particles = Array.from({ length: 32 }, () => ({
    text: mathItems[Math.floor(Math.random() * mathItems.length)],
    x: Math.random() * width,
    y: Math.random() * height,
    size: 14 + Math.random() * 22,
    speedY: -0.3 - Math.random() * 0.5,
    speedX: (Math.random() - 0.5) * 0.3,
    opacity: 0.15 + Math.random() * 0.35,
    color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < -40) {
        p.y = height + 40;
        p.x = Math.random() * width;
      }
      if (p.x < -40) p.x = width + 40;
      if (p.x > width + 40) p.x = -40;

      ctx.save();
      ctx.font = `600 ${p.size}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* =====================================================
   5) CONTROL DEL SPLASH Y REVELADO DE LA APP
   ===================================================== */
function initSplashScreen() {
  // Permite que la animación de giro de los anillos luzca antes de cargar la app
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    appEl.classList.remove("hidden");
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        appEl.classList.add("visible");
      });
    });

    setTimeout(() => splashScreen.remove(), 800);
  }, 2800);
}

/* =====================================================
   6) UTILIDADES DE UI Y COLORES
   ===================================================== */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showToast(message, type = "") {
  toastEl.textContent = message;
  toastEl.className = "toast show " + type;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
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

/* =====================================================
   7) LÓGICA MODAL
   ===================================================== */
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
  const count = Object.keys(teamsData).length;
  if (count >= MAX_TEAMS) {
    showToast(`Límite alcanzado: máximo ${MAX_TEAMS} equipos`, "error");
    return;
  }
  openAddModal();
});

btnCloseModal.addEventListener("click", closeModal);
teamModal.addEventListener("click", (e) => {
  if (e.target === teamModal) closeModal();
});

teamColorInput.addEventListener("input", highlightActiveSwatch);

/* =====================================================
   8) GUARDAR Y ELIMINAR EQUIPOS
   ===================================================== */
teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = teamNameInput.value.trim();
  const color = teamColorInput.value;

  if (!name) {
    showToast("Escribe un nombre o número de equipo", "error");
    return;
  }

  if (editingTeamId) {
    teamsRef.child(editingTeamId).update({ name, color })
      .then(() => {
        showToast("Equipo actualizado ✅", "success");
        closeModal();
      })
      .catch(err => showToast("Error al guardar: " + err.message, "error"));
  } else {
    const count = Object.keys(teamsData).length;
    if (count >= MAX_TEAMS) {
      showToast(`Límite alcanzado: máximo ${MAX_TEAMS} equipos`, "error");
      return;
    }
    teamsRef.push({
      name,
      color,
      score: 0,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    })
      .then(() => {
        showToast("Equipo agregado 🎉", "success");
        closeModal();
      })
      .catch(err => showToast("Error al agregar: " + err.message, "error"));
  }
});

btnDeleteTeam.addEventListener("click", () => {
  if (!editingTeamId) return;
  const team = teamsData[editingTeamId];
  const ok = confirm(`¿Eliminar al equipo "${team ? team.name : ""}"?`);
  if (!ok) return;

  teamsRef.child(editingTeamId).remove()
    .then(() => {
      showToast("Equipo eliminado", "success");
      closeModal();
    })
    .catch(err => showToast("Error al eliminar: " + err.message, "error"));
});

function adjustScore(id, delta) {
  if (!delta || isNaN(delta)) return;
  teamsRef.child(id).child("score").transaction(current => {
    return (current || 0) + Number(delta);
  }).catch(err => showToast("Error al actualizar puntaje: " + err.message, "error"));
}

/* =====================================================
   9) RENDERIZADO TABLA Y GRÁFICO
   ===================================================== */
function recomputeSortedTeams() {
  sortedTeams = Object.entries(teamsData)
    .map(([id, data]) => ({ id, ...data, score: Number(data.score) || 0 }))
    .sort((a, b) => b.score - a.score);
}

function renderCounter() {
  const count = Object.keys(teamsData).length;
  teamsCounterEl.textContent = `${count} / ${MAX_TEAMS} equipos`;
}

function renderRanking() {
  rankingListEl.innerHTML = "";

  if (sortedTeams.length === 0) {
    emptyStateEl.classList.remove("hidden");
    previousScores = {};
    return;
  }
  emptyStateEl.classList.add("hidden");

  sortedTeams.forEach((team, index) => {
    const rank = index + 1;
    const prevScore = previousScores[team.id];
    let pulseClass = "";
    if (prevScore !== undefined && prevScore !== team.score) {
      pulseClass = team.score > prevScore ? " score-pulse-up" : " score-pulse-down";
    }

    const row = document.createElement("div");
    row.className = "team-row" + pulseClass;
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
        <button class="icon-btn icon-edit" title="Editar" data-action="edit">✎</button>
        <button class="icon-btn icon-delete" title="Eliminar" data-action="delete">🗑</button>
      </div>
      <div class="team-controls">
        <button class="score-btn plus" data-action="delta" data-delta="1">+1</button>
        <button class="score-btn plus" data-action="delta" data-delta="5">+5</button>
        <button class="score-btn plus" data-action="delta" data-delta="10">+10</button>
        <button class="score-btn minus" data-action="delta" data-delta="-5">-5</button>
        <div class="custom-score">
          <input type="number" placeholder="±#" data-role="custom-input" aria-label="Puntos personalizados">
          <button class="btn-apply" data-action="apply-custom">Aplicar</button>
        </div>
      </div>
    `;

    rankingListEl.appendChild(row);
  });

  previousScores = Object.fromEntries(sortedTeams.map(t => [t.id, t.score]));
}

rankingListEl.addEventListener("click", (e) => {
  const row = e.target.closest(".team-row");
  if (!row) return;
  const id = row.dataset.id;
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  if (action === "edit") {
    openEditModal(id);
  } else if (action === "delete") {
    const team = teamsData[id];
    if (confirm(`¿Eliminar al equipo "${team ? team.name : ""}"?`)) {
      teamsRef.child(id).remove()
        .then(() => showToast("Equipo eliminado", "success"))
        .catch(err => showToast("Error: " + err.message, "error"));
    }
  } else if (action === "delta") {
    adjustScore(id, actionEl.dataset.delta);
  } else if (action === "apply-custom") {
    const input = row.querySelector('[data-role="custom-input"]');
    const value = parseInt(input.value, 10);
    if (isNaN(value) || value === 0) {
      showToast("Ingresa una cantidad válida", "error");
      return;
    }
    adjustScore(id, value);
    input.value = "";
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
    const gradient = ctx.createLinearGradient(0, 0, chartCanvas.width || 300, 0);
    gradient.addColorStop(0, hexToRgba(t.color, 0.4));
    gradient.addColorStop(1, hexToRgba(t.color, 0.95));
    return gradient;
  });
  const borders = top5.map(t => hexToRgba(t.color, 1));

  if (topChart) {
    topChart.data.labels = labels;
    topChart.data.datasets[0].data = data;
    topChart.data.datasets[0].backgroundColor = backgrounds;
    topChart.data.datasets[0].borderColor = borders;
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
        borderColor: borders,
        borderWidth: 1.5,
        borderRadius: 12,
        maxBarThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0d1021",
          borderColor: "#00f5ff",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#00f5ff",
          padding: 12,
          cornerRadius: 12
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: "#94a3b8", precision: 0 },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          ticks: { color: "#ffffff", font: { weight: "600" } },
          grid: { display: false }
        }
      },
      animation: { duration: 500, easing: "easeOutQuint" }
    }
  });
}

function renderApp() {
  recomputeSortedTeams();
  renderCounter();
  renderRanking();
  renderChart();
}

/* =====================================================
   10) LISTENERS TIEMPO REAL
   ===================================================== */
teamsRef.on("value", (snapshot) => {
  teamsData = snapshot.val() || {};
  renderApp();
});

db.ref(".info/connected").on("value", (snap) => {
  const connected = snap.val() === true;
  statusDot.classList.toggle("online", connected);
  statusDot.classList.toggle("offline", !connected);
  statusText.textContent = connected ? "Conectado en tiempo real" : "Sin conexión — reintentando...";
});

/* INICIALIZACIÓN */
document.addEventListener("DOMContentLoaded", () => {
  buildColorPresets();
  initMathBackgroundCanvas();
  initSplashScreen();
});
