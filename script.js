

const AudioFX = {
  ctx: null,

createContextInsideGesture() {
    if (this.ctx) return; 
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    
    try {
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch (_) {}
  },

  init() {
    
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  playMathExpansion() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 1.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(120, now);
    filter.frequency.exponentialRampToValueAtTime(5000, now + 1.0);
    filter.Q.setValueAtTime(8, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.5);

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(65, now);
    sub.frequency.exponentialRampToValueAtTime(220, now + 0.2);
    sub.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    sub.start(now);
    sub.stop(now + 1.2);
  },

  playPop() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  },

  playPointChime(isPositive = true) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = isPositive ? [523.25, 659.25, 783.99, 1046.50] : [440.00, 370.00, 311.13, 220.00];

    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.05);

      gain.gain.setValueAtTime(0.1, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.3);
    });
  }
};

window.addEventListener("keydown", () => { if (AudioFX.ctx && AudioFX.ctx.state === "suspended") AudioFX.ctx.resume(); }, { once: true });

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

const splashScreen        = document.getElementById("splashScreen");
const tapToStart          = document.getElementById("tapToStart");
const splashDeerContainer = document.getElementById("splashDeerContainer");
const splashTextGroup     = document.getElementById("splashTextGroup");
const cameraBlindFlash    = document.getElementById("cameraBlindFlash");

const appEl               = document.getElementById("app");
const btnAddTeam          = document.getElementById("btnAddTeam");
const teamsCounterEl      = document.getElementById("teamsCounter");
const rankingListEl       = document.getElementById("rankingList");
const emptyStateEl        = document.getElementById("emptyState");
const chartEmptyEl        = document.getElementById("chartEmptyState");

const teamModal           = document.getElementById("teamModal");
const modalTitle          = document.getElementById("modalTitle");
const teamForm            = document.getElementById("teamForm");
const teamIdInput         = document.getElementById("teamId");
const teamNameInput       = document.getElementById("teamName");
const teamColorInput      = document.getElementById("teamColor");
const colorPresetsEl      = document.getElementById("colorPresets");
const btnCloseModal       = document.getElementById("btnCloseModal");
const btnDeleteTeam       = document.getElementById("btnDeleteTeam");

const toastEl             = document.getElementById("toast");
const statusDot           = document.getElementById("statusDot");
const statusText          = document.getElementById("statusText");
const chartCanvas         = document.getElementById("topChart");
const cursorGlow          = document.getElementById("cursorGlow");

let mouseX = -500;
let mouseY = -500;
const mouseParticles = [];

function spawnParticles(x, y, amount = 6) {
  for (let i = 0; i < amount; i++) {
    mouseParticles.push({
      x, y,
      size: 4 + Math.random() * 8,
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1,
      decay: 0.02 + Math.random() * 0.03
    });
  }
}

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorGlow) {
    cursorGlow.style.left = `${mouseX}px`;
    cursorGlow.style.top = `${mouseY}px`;
  }
  if (isCanvasRunning && Math.random() < 0.5) spawnParticles(mouseX, mouseY, 1);
});

function triggerHaptic() {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(12); } catch (_) {}
  }
}

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
    "π", "∑", "∫", "√x", "f(x)", "Δ", "∞", "d/dx", "lim", "sin(x)",
    "e^iπ", "λ", "θ", "∇×F", "x²", "α", "β", "Ω", "E=mc²", "ϕ"
  ];

  const vibrantColors = [
    "#00f5ff", "#00ff88", "#ff007f", "#8b5cf6",
    "#ffe600", "#ff6600", "#3b82f6", "#ff3399"
  ];

  const bgParticles = Array.from({ length: 32 }, () => {
    const baseSize = 16 + Math.random() * 22;
    return {
      text: mathItems[Math.floor(Math.random() * mathItems.length)],
      x: Math.random() * width,
      y: Math.random() * height,
      baseSize: baseSize,
      size: baseSize,
      speedY: -0.25 - Math.random() * 0.35,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: 0.35 + Math.random() * 0.35,
      baseOpacity: 0.35 + Math.random() * 0.35,
      color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
      rotation: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      hoverProgress: 0
    };
  });

  function animate() {
    if (!isCanvasRunning) return;
    ctx.clearRect(0, 0, width, height);

    bgParticles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed * (1 + p.hoverProgress * 3);

      if (p.y < -40) {
        p.y = height + 40;
        p.x = Math.random() * width;
      }

      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.hypot(dx, dy);
      const hoverRadius = 130;

      if (dist < hoverRadius) {
        p.hoverProgress = Math.min(1, p.hoverProgress + 0.12);
        const angle = Math.atan2(dy, dx);
        const pushForce = (hoverRadius - dist) / hoverRadius;
        p.x += Math.cos(angle) * pushForce * 2.2;
        p.y += Math.sin(angle) * pushForce * 2.2;
      } else {
        p.hoverProgress = Math.max(0, p.hoverProgress - 0.05);
      }

      const currentSize = p.baseSize * (1 + p.hoverProgress * 0.9);
      const currentOpacity = p.baseOpacity + (1 - p.baseOpacity) * p.hoverProgress;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `700 ${currentSize}px 'SchneidlerLatein', serif`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = currentOpacity;

      if (p.hoverProgress > 0) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20 * p.hoverProgress;
      }

      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });

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
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }
  
  isCanvasRunning = true;
  animate();
}

let splashSequenceStarted = false;
let splashCompleted = false;

function skipSplashSequence() {
  if (splashCompleted) return;
  splashCompleted = true;

  if (splashScreen && splashScreen.parentNode) {
    splashScreen.remove();
  }
  if (cameraBlindFlash && cameraBlindFlash.parentNode) {
    cameraBlindFlash.remove();
  }

  appEl.classList.remove("hidden");
  initMathBackgroundCanvas();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      appEl.classList.add("visible");
    });
  });
}

function runSplashSequence() {
  if (splashSequenceStarted) return;
  splashSequenceStarted = true;

AudioFX.init();

requestAnimationFrame(() => {
    if (splashDeerContainer) {
      splashDeerContainer.classList.add("fade-in-luxury");
    }
    if (splashTextGroup) {
      splashTextGroup.classList.add("fade-in-text");
    }
  });

setTimeout(() => {
    if (splashCompleted) return;
    if (splashDeerContainer) {
      splashDeerContainer.classList.add("glowing");
    }
    if (splashTextGroup) {
      splashTextGroup.classList.add("fade-out-text");
    }
  }, 3800);

setTimeout(() => {
    if (splashCompleted) return;
    AudioFX.playMathExpansion();
  }, 5300);

setTimeout(() => {
    if (splashCompleted) return;
    if (cameraBlindFlash) {
      cameraBlindFlash.classList.add("blind-active");
    }
  }, 5700);

setTimeout(() => {
    if (splashCompleted) return;
    splashCompleted = true;

if (splashScreen) {
      splashScreen.classList.add("fade-out");
      setTimeout(() => {
        if (splashScreen && splashScreen.parentNode) {
          splashScreen.remove();
        }
      }, 1000);
    }

appEl.classList.remove("hidden");
    initMathBackgroundCanvas();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        
        appEl.classList.add("visible");

if (cameraBlindFlash) {
          cameraBlindFlash.classList.remove("blind-active");
          cameraBlindFlash.classList.add("clearing");
        }
      });
    });

setTimeout(() => {
      if (cameraBlindFlash && cameraBlindFlash.parentNode) {
        cameraBlindFlash.remove();
      }
    }, 1800);
  }, 6400);
}

document.addEventListener("DOMContentLoaded", () => {
  buildColorPresets();

  function handleTapToStart() {

AudioFX.createContextInsideGesture();

if (tapToStart) {
      tapToStart.classList.add("hiding");
      setTimeout(() => { if (tapToStart && tapToStart.parentNode) tapToStart.remove(); }, 500);
    }

setTimeout(runSplashSequence, 80);
  }

  if (tapToStart) {
    tapToStart.addEventListener("pointerdown", handleTapToStart, { once: true });
    tapToStart.addEventListener("click",        handleTapToStart, { once: true });
  } else {
    setTimeout(runSplashSequence, 100);
  }
});

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
      triggerHaptic();
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

function openAddModal() {
  editingTeamId = null;
  modalTitle.textContent = "Agregar Equipo";
  teamIdInput.value = "";
  teamNameInput.value = "";
  teamColorInput.value = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
  btnDeleteTeam.classList.add("hidden");
  highlightActiveSwatch();
  teamModal.classList.remove("hidden");
  
  AudioFX.playPop();
  triggerHaptic();

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

  AudioFX.playPop();
  triggerHaptic();

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

teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = teamNameInput.value.trim();
  const color = teamColorInput.value;

  if (!name) { showToast("Ingresa un nombre de equipo", "error"); return; }

  if (editingTeamId) {
    teamsRef.child(editingTeamId).update({ name, color })
      .then(() => { AudioFX.playPop(); showToast("Equipo actualizado ✅", "success"); closeModal(); })
      .catch(err => showToast("Error: " + err.message, "error"));
  } else {
    teamsRef.push({
      name,
      color,
      score: 0,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    })
      .then(() => { AudioFX.playPop(); triggerHaptic(); showToast("Equipo registrado 🎉", "success"); closeModal(); })
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
  const numDelta = Number(delta);
  AudioFX.playPointChime(numDelta >= 0);
  triggerHaptic();

  teamsRef.child(id).child("score").transaction(current => (current || 0) + numDelta);
}

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
    row.style.setProperty("--team-hover-color", hexToRgba(team.color, 0.6));

    row.innerHTML = `
      <span class="team-position">${rank}°</span>
      <span class="team-color-dot" style="background:${team.color}; color:${team.color};"></span>
      <div class="team-info">
        <div class="team-name">${escapeHtml(team.name)}</div>
        <div class="team-score" style="color:${team.color};">${team.score} pts</div>
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
        x: { beginAtZero: true, ticks: { color: "#94a3b8", font: { family: "'SchneidlerLatein', serif" } }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#ffffff", font: { family: "'SchneidlerLatein', serif", weight: "600" } }, grid: { display: false } }
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

teamsRef.on("value", (snapshot) => {
  teamsData = snapshot.val() || {};
  renderApp();
});

db.ref(".info/connected").on("value", (snap) => {
  const connected = snap.val() === true;
  statusDot.classList.toggle("online", connected);
  statusText.textContent = connected ? "Conectado en tiempo real" : "Sin conexión";
});
