/* =====================================================
   RALLY DE MATEMÁTICAS — TEC DE MONTERREY
   Lógica JavaScript: Firebase + Chart.js + Splash Sync
   ===================================================== */

/* 1) FIREBASE CONFIG */
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

/* 2) ESTADO GLOBAL */
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

/* 3) REFERENCIAS DOM */
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

/* 4) CANVA DE SÍMBOLOS Y ECUACIONES EN EL FONDO */
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

  const mathItems = ["π", "∑", "∫", "√x", "e^{iπ}+1=0", "f(x)", "Δ", "∞", "d/dx", "lim", "x² + y² = r²", "sin(x)", "cos(θ)", "∇", "α", "β", "λ"];

  const particles = Array.from({ length: 30 }, () => ({
    text: mathItems[Math.floor(Math.random() * mathItems.length)],
    x: Math.random() * width,
    y: Math.random() * height,
    size: 14 + Math.random() * 20,
    speedY: -0.3 - Math.random() * 0.4,
    speedX: (Math.random() - 0.5) * 0.3,
    opacity: 0.15 + Math.random() * 0.3,
    color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < -40) { p.y = height + 40; p.x = Math.random() * width; }
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

/* 5) CONTROL Y SINCRO DE TIEMPO DEL SPLASH SCREEN */
function initSplashScreen() {
  // Sincronizado con los 3.2 segundos exactos de la animación de "Matemáticas" creciendo
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    appEl.classList.remove("hidden");
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        appEl.classList.add("visible");
      });
    });

    setTimeout(() => splashScreen.remove(), 600);
  }, 3100);
}

/* 6) AUXILIARES UI */
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
  showToast._timer = setTimeout(() => toastEl.classList.remove("show"), 2600);
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

/* 7) MODAL */
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
    showToast(`Límite alcanzado: máximo ${MAX_TEAMS} equipos`, "error");
    return;
  }
  openAddModal();
});

btnCloseModal.addEventListener("click", closeModal);
teamModal.addEventListener("click", (e) => { if (e.target === teamModal) closeModal(); });
teamColorInput.addEventListener("input", highlightActiveSwatch);

/* 8) OPERACIONES CON FIREBASE */
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
      .then(() => { showToast("Equipo creado 🎉", "success"); closeModal(); })
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

function adjustScore(id, delta) {
  if (!delta || isNaN(delta)) return;
  teamsRef.child(id).child("score").transaction(current => (current || 0) + Number(delta));
}

/* 9) RENDERIZADO */
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
    previousScores = {};
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
        borderRadius: 10
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

/* 10) INICIALIZACIÓN */
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
  initMathBackgroundCanvas();
  initSplashScreen();
});
