

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

/* ============================================================
   SESIÓN Y ROLES (locales, credenciales dentro del JS)
   ============================================================ */
const TOP_N = 5;
const SESSION_KEY = "rallyMatematicasSession";

const CREDENTIALS = {
  CarlosReyna: { password: "9!nH2*MiDwms%X&5", role: "admin" },
  equipo1: { password: "gato3044", role: "team" },
  equipo2: { password: "lima5349", role: "team" },
  equipo3: { password: "vela7454", role: "team" },
  equipo4: { password: "oso9231", role: "team" },
  equipo5: { password: "miel3485", role: "team" },
  equipo6: { password: "mar8476", role: "team" },
  equipo7: { password: "rio8387", role: "team" },
  equipo8: { password: "lobo1702", role: "team" },
  equipo9: { password: "trigo4495", role: "team" },
  equipo10: { password: "nube4916", role: "team" },
  equipo11: { password: "roca7133", role: "team" },
  equipo12: { password: "luna7389", role: "team" },
  equipo13: { password: "sol8009", role: "team" },
  equipo14: { password: "pino3651", role: "team" },
  equipo15: { password: "pez3559", role: "team" },
  equipo16: { password: "coco4975", role: "team" },
  equipo17: { password: "rayo1214", role: "team" },
  equipo18: { password: "arco2772", role: "team" },
  equipo19: { password: "pato5612", role: "team" },
  equipo20: { password: "faro5873", role: "team" }
};

const TEAM_SLOTS = Object.keys(CREDENTIALS)
  .filter(user => CREDENTIALS[user].role === "team")
  .sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10));

let session = null;
let teamsLoaded = false;
let promptTeamSetup = false;
let setupFromButton = false;
let loginIntent = null;
let focusMode = false;
let focusHoverTimer = null;
let hoverArmed = true;
let lastAutoFocusAt = 0;
let titleSwapTimer = null;
let chartResizeTimer = null;
let winnerOpen = false;
let winnerTimers = [];
let winnerCountRaf = null;
let winnerCloseTimer = null;

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

const dashboardEl         = document.getElementById("dashboard");
const rankingHeaderEl     = document.getElementById("rankingHeader");
const rankingTitleEl      = document.getElementById("rankingTitle");
const btnFocusToggle      = document.getElementById("btnFocusToggle");
const focusEmptyEl        = document.getElementById("focusEmptyState");

const btnLogin            = document.getElementById("btnLogin");
const btnLogout           = document.getElementById("btnLogout");
const sessionInfoEl       = document.getElementById("sessionInfo");
const sessionChipEl       = document.getElementById("sessionChip");
const sessionUserEl       = document.getElementById("sessionUser");
const sessionRoleEl       = document.getElementById("sessionRole");
const btnAddTeamLabel     = document.getElementById("btnAddTeamLabel");
const btnAddTeamIcon      = document.getElementById("btnAddTeamIcon");
const teamSlotSelect      = document.getElementById("teamSlot");

const loginModal          = document.getElementById("loginModal");
const loginForm           = document.getElementById("loginForm");
const loginUserInput      = document.getElementById("loginUser");
const loginPassInput      = document.getElementById("loginPass");
const loginErrorEl        = document.getElementById("loginError");
const loginHintEl         = document.getElementById("loginHint");
const btnCloseLogin       = document.getElementById("btnCloseLogin");

const btnAssignWinner     = document.getElementById("btnAssignWinner");
const winnerBackdrop      = document.getElementById("winnerBackdrop");
const winnerOverlay       = document.getElementById("winnerOverlay");
const winnerTitleEl       = document.getElementById("winnerTitle");
const winnerTeamEl        = document.getElementById("winnerTeamName");
const winnerScoreEl       = document.getElementById("winnerScore");
const winnerConfettiEl    = document.getElementById("winnerConfetti");
const btnCloseWinner      = document.getElementById("btnCloseWinner");

const canHover = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function safeColor(color) {
  return HEX_RE.test(String(color || "")) ? color : "#00f5ff";
}

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

/* ============================================================
   SESIÓN LOCAL: inicio / cierre de sesión y permisos
   ============================================================ */
function findCredentialKey(input) {
  const wanted = String(input || "").trim().toLowerCase();
  return Object.keys(CREDENTIALS).find(user => user.toLowerCase() === wanted) || null;
}

function isAdmin() {
  return !!session && session.role === "admin";
}

function isTeamUser() {
  return !!session && session.role === "team";
}

function canControl(teamId) {
  return isAdmin() || (isTeamUser() && session.username === teamId);
}

function freeSlots() {
  return TEAM_SLOTS.filter(id => !teamsData[id]);
}

function loadStoredSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(CREDENTIALS, stored)) {
      return { username: stored, role: CREDENTIALS[stored].role };
    }
  } catch (_) {}
  return null;
}

function storeSession() {
  try {
    if (session) localStorage.setItem(SESSION_KEY, session.username);
    else localStorage.removeItem(SESSION_KEY);
  } catch (_) {}
}

function updateAddButton() {
  const hasOwnTeam = isTeamUser() && !!teamsData[session.username];
  btnAddTeamLabel.textContent = hasOwnTeam ? "Editar Mi Equipo" : "Agregar Equipo";
  btnAddTeamIcon.textContent = hasOwnTeam ? "✎" : "+";
}

function applySessionUI() {
  const logged = !!session;
  btnLogin.classList.toggle("hidden", logged);
  sessionInfoEl.classList.toggle("hidden", !logged);

  if (logged) {
    sessionUserEl.textContent = session.username;
    sessionRoleEl.textContent = isAdmin() ? "ADMIN" : "EQUIPO";
    sessionChipEl.classList.toggle("is-admin", isAdmin());
  }

  document.body.classList.toggle("role-admin", isAdmin());
  document.body.classList.toggle("role-team", isTeamUser());
  dashboardEl.classList.toggle("is-admin", isAdmin());
  btnAssignWinner.classList.toggle("hidden", !isAdmin());
  updateAddButton();
}

function openLoginModal(intent = null, hint = "") {
  loginIntent = intent;
  loginForm.reset();
  loginErrorEl.classList.add("hidden");
  loginHintEl.textContent = hint || "Ingresa con el usuario y la contraseña que te asignaron.";
  loginModal.classList.remove("hidden");

  AudioFX.playPop();
  triggerHaptic();

  setTimeout(() => loginUserInput.focus(), 50);
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
  loginForm.reset();
  loginErrorEl.classList.add("hidden");
  loginIntent = null;
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = findCredentialKey(loginUserInput.value);
  const valid = key && CREDENTIALS[key].password === loginPassInput.value;

  if (!valid) {
    loginErrorEl.classList.remove("hidden");
    const box = loginModal.querySelector(".modal");
    box.classList.remove("shake");
    void box.offsetWidth;
    box.classList.add("shake");
    AudioFX.playPointChime(false);
    triggerHaptic();
    loginPassInput.select();
    return;
  }

  const intent = loginIntent;
  session = { username: key, role: CREDENTIALS[key].role };
  storeSession();
  closeLoginModal();
  applySessionUI();
  renderApp();

  AudioFX.playPointChime(true);
  triggerHaptic();
  showToast(isAdmin() ? "Sesión de administrador iniciada ✅" : `Sesión iniciada: ${key} ✅`, "success");

  if (isAdmin()) {
    if (intent === "addTeam") handleAddTeamClick();
  } else {
    promptTeamSetup = true;
    setupFromButton = intent === "addTeam";
    maybePromptTeamSetup();
  }
});

btnCloseLogin.addEventListener("click", closeLoginModal);
loginModal.addEventListener("click", (e) => { if (e.target === loginModal) closeLoginModal(); });
btnLogin.addEventListener("click", () => openLoginModal());

function logout() {
  session = null;
  promptTeamSetup = false;
  storeSession();
  closeModal();
  closeWinnerOverlay(true);
  applySessionUI();
  renderApp();
  showToast("Sesión cerrada", "success");
}

btnLogout.addEventListener("click", logout);

function maybePromptTeamSetup() {
  if (!promptTeamSetup || !teamsLoaded || !isTeamUser()) return;
  promptTeamSetup = false;

  if (teamsData[session.username]) {
    if (setupFromButton) openEditModal(session.username);
  } else {
    openAddModal();
  }
  setupFromButton = false;
}

/* ============================================================
   MODAL DE EQUIPO
   ============================================================ */
function populateSlotSelect(mode, currentId) {
  let ids;
  let locked;

  if (mode === "edit") {
    ids = [currentId];
    locked = true;
  } else if (isAdmin()) {
    ids = freeSlots();
    locked = false;
  } else {
    ids = [session.username];
    locked = true;
  }

  teamSlotSelect.innerHTML = "";
  ids.forEach(id => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = TEAM_SLOTS.includes(id) ? id : "Registro anterior (sin usuario)";
    teamSlotSelect.appendChild(opt);
  });
  if (ids.length) teamSlotSelect.value = ids[0];
  teamSlotSelect.disabled = locked;
}

function openAddModal() {
  editingTeamId = null;
  modalTitle.textContent = "Agregar Equipo";
  teamIdInput.value = "";
  teamNameInput.value = "";
  teamColorInput.value = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
  btnDeleteTeam.classList.add("hidden");
  populateSlotSelect("new");
  highlightActiveSwatch();
  teamModal.classList.remove("hidden");

  AudioFX.playPop();
  triggerHaptic();

  setTimeout(() => teamNameInput.focus(), 50);
}

function openEditModal(id) {
  const team = teamsData[id];
  if (!team) return;
  if (!canControl(id)) {
    showToast("No tienes permiso para editar este equipo", "error");
    return;
  }
  editingTeamId = id;
  modalTitle.textContent = "Editar Equipo";
  teamIdInput.value = id;
  teamNameInput.value = team.name;
  teamColorInput.value = safeColor(team.color);
  btnDeleteTeam.classList.toggle("hidden", !isAdmin());
  populateSlotSelect("edit", id);
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

function handleAddTeamClick() {
  if (!session) {
    openLoginModal("addTeam", "Inicia sesión con tu usuario de equipo para registrar tu equipo.");
    return;
  }

  if (isAdmin()) {
    if (freeSlots().length === 0) {
      showToast(`Máximo ${MAX_TEAMS} equipos alcanzado`, "error");
      return;
    }
    openAddModal();
    return;
  }

  if (teamsData[session.username]) openEditModal(session.username);
  else openAddModal();
}

btnAddTeam.addEventListener("click", handleAddTeamClick);

btnCloseModal.addEventListener("click", closeModal);
teamModal.addEventListener("click", (e) => { if (e.target === teamModal) closeModal(); });
teamColorInput.addEventListener("input", highlightActiveSwatch);

teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = teamNameInput.value.trim();
  const color = teamColorInput.value;

  if (!session) {
    closeModal();
    openLoginModal();
    return;
  }

  if (!name) { showToast("Ingresa un nombre de equipo", "error"); return; }

  if (editingTeamId) {
    if (!canControl(editingTeamId)) {
      showToast("No tienes permiso para editar este equipo", "error");
      return;
    }
    teamsRef.child(editingTeamId).update({ name, color })
      .then(() => { AudioFX.playPop(); showToast("Equipo actualizado ✅", "success"); closeModal(); })
      .catch(err => showToast("Error: " + err.message, "error"));
  } else {
    const id = teamSlotSelect.value;
    if (!id || !TEAM_SLOTS.includes(id)) {
      showToast("Selecciona un usuario de equipo disponible", "error");
      return;
    }
    if (!canControl(id)) {
      showToast("No tienes permiso para registrar este equipo", "error");
      return;
    }
    if (teamsData[id]) {
      showToast("Ese equipo ya está registrado", "error");
      return;
    }
    teamsRef.child(id).set({
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
  if (!isAdmin()) {
    showToast("Solo el administrador puede eliminar equipos", "error");
    return;
  }
  const team = teamsData[editingTeamId];
  if (confirm(`¿Eliminar al equipo "${team ? team.name : ""}"?`)) {
    teamsRef.child(editingTeamId).remove()
      .then(() => { showToast("Equipo eliminado", "success"); closeModal(); })
      .catch(err => showToast("Error: " + err.message, "error"));
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (winnerOpen) closeWinnerOverlay();
  else if (!loginModal.classList.contains("hidden")) closeLoginModal();
  else if (!teamModal.classList.contains("hidden")) closeModal();
  else if (focusMode) setFocusMode(false);
});

function adjustScore(id, delta) {
  if (!delta || isNaN(delta)) return;
  if (!canControl(id)) {
    showToast("No tienes permiso para modificar este equipo", "error");
    return;
  }
  const numDelta = Number(delta);
  AudioFX.playPointChime(numDelta >= 0);
  triggerHaptic();

  teamsRef.child(id).child("score").transaction(current => (current || 0) + numDelta);
}

function recomputeSortedTeams() {
  sortedTeams = Object.entries(teamsData)
    .map(([id, data]) => ({
      id,
      ...data,
      name: String(data.name || ""),
      color: safeColor(data.color),
      score: Number(data.score) || 0
    }))
    .sort((a, b) => b.score - a.score);
}

function renderCounter() {
  teamsCounterEl.textContent = `${Object.keys(teamsData).length} / ${MAX_TEAMS} equipos`;
}

function createRowEl(team, animate) {
  const row = document.createElement("div");
  row.className = "team-row" + (animate ? " row-enter" : "");
  row.dataset.id = team.id;
  row.innerHTML = `
    <span class="team-position"></span>
    <span class="team-color-dot"></span>
    <div class="team-info">
      <div class="team-name"></div>
      <div class="team-score"></div>
    </div>
  `;
  return row;
}

function buildActionsHtml(perm) {
  const deleteBtn = perm === "admin"
    ? `<button type="button" class="icon-btn" title="Eliminar" data-action="delete">🗑</button>`
    : "";

  return `
    <div class="row-icons">
      <button type="button" class="icon-btn" title="Editar" data-action="edit">✎</button>
      ${deleteBtn}
    </div>
    <div class="team-controls">
      <button type="button" class="score-btn plus" data-action="delta" data-delta="1">+1</button>
      <button type="button" class="score-btn plus" data-action="delta" data-delta="5">+5</button>
      <button type="button" class="score-btn plus" data-action="delta" data-delta="10">+10</button>
      <button type="button" class="score-btn minus" data-action="delta" data-delta="-1">-1</button>
      <button type="button" class="score-btn minus" data-action="delta" data-delta="-5">-5</button>
      <div class="custom-score">
        <input type="number" placeholder="±#" data-role="custom-input">
        <button type="button" class="btn-apply" data-action="apply-custom">Ok</button>
      </div>
    </div>
  `;
}

function syncRowActions(row, perm) {
  if (row.dataset.perm === perm) return;
  row.dataset.perm = perm;
  row.querySelectorAll(".row-icons, .team-controls").forEach(el => el.remove());
  row.classList.remove("is-open");
  if (perm !== "none") row.insertAdjacentHTML("beforeend", buildActionsHtml(perm));
}

function updateRowEl(row, team, rank) {
  const color = team.color;
  [1, 2, 3].forEach(n => row.classList.toggle(`rank-${n}`, rank === n));
  row.classList.toggle("is-own", isTeamUser() && session.username === team.id);
  row.style.setProperty("--team-hover-color", hexToRgba(color, 0.6));

  row.querySelector(".team-position").textContent = `${rank}°`;

  const dot = row.querySelector(".team-color-dot");
  dot.style.background = color;
  dot.style.color = color;

  row.querySelector(".team-name").textContent = team.name;

  const scoreEl = row.querySelector(".team-score");
  scoreEl.style.color = color;
  scoreEl.textContent = `${team.score} pts`;

  if (row.dataset.score !== undefined && Number(row.dataset.score) !== team.score) {
    scoreEl.classList.remove("score-bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("score-bump");
    scoreEl.onanimationend = () => scoreEl.classList.remove("score-bump");
  }
  row.dataset.score = String(team.score);

  const perm = !canControl(team.id) ? "none" : (isAdmin() ? "admin" : "own");
  syncRowActions(row, perm);
}

function retireRow(row, animate) {
  if (!animate) {
    row.remove();
    return;
  }
  const top = row.offsetTop;
  row.style.top = `${top}px`;
  row.style.left = "0";
  row.style.right = "0";
  row.classList.remove("row-enter", "row-enter-active", "rank-move", "is-open");
  row.classList.add("row-leaving");
  setTimeout(() => { if (row.parentNode) row.remove(); }, 520);
}

/* Reconciliación por id + FLIP: las filas existentes se mueven con
   transform/transition, las nuevas entran y las que salen se desvanecen. */
function syncRankList(container, entries) {
  const animate = container.dataset.ready === "1";
  const active = document.activeElement;

  const existing = new Map();
  Array.from(container.children).forEach(el => {
    if (el.dataset.id && !el.classList.contains("row-leaving")) existing.set(el.dataset.id, el);
  });

  const before = new Map();
  existing.forEach((el, id) => before.set(id, el.offsetTop));

  const wanted = new Set(entries.map(entry => entry.team.id));
  Array.from(existing.entries()).forEach(([id, el]) => {
    if (!wanted.has(id)) {
      existing.delete(id);
      retireRow(el, animate);
    }
  });

  const created = [];
  let cursor = container.firstElementChild;
  entries.forEach(({ team, rank }) => {
    let row = existing.get(team.id);
    if (!row) {
      row = createRowEl(team, animate);
      created.push(row);
    }
    updateRowEl(row, team, rank);

    while (cursor && cursor.classList.contains("row-leaving")) cursor = cursor.nextElementSibling;
    if (row === cursor) cursor = cursor.nextElementSibling;
    else container.insertBefore(row, cursor);
  });

  if (active && active !== document.activeElement && container.contains(active)) {
    try { active.focus({ preventScroll: true }); } catch (_) {}
  }

  if (animate) {
    const moved = [];
    existing.forEach((row, id) => {
      const delta = before.get(id) - row.offsetTop;
      if (delta) moved.push([row, delta]);
    });

    moved.forEach(([row, delta]) => {
      row.style.transition = "none";
      row.style.transform = `translateY(${delta}px)`;
    });
    void container.offsetHeight;
    moved.forEach(([row]) => {
      row.style.transition = "";
      row.classList.add("rank-move");
      row.style.transform = "";
    });
    setTimeout(() => moved.forEach(([row]) => row.classList.remove("rank-move")), 700);

    if (created.length) {
      void container.offsetHeight;
      created.forEach(row => {
        row.classList.add("row-enter-active");
        row.classList.remove("row-enter");
      });
      setTimeout(() => created.forEach(row => row.classList.remove("row-enter-active")), 700);
    }
  } else {
    created.forEach(row => row.classList.remove("row-enter"));
  }

  if (entries.length > 0 && teamsLoaded) container.dataset.ready = "1";
}

function renderRanking() {
  const hasTeams = sortedTeams.length > 0;
  const entries = sortedTeams.map((team, index) => ({ team, rank: index + 1 }));
  const visible = focusMode ? entries.filter(entry => entry.rank > TOP_N) : entries;

  syncRankList(rankingListEl, visible);

  emptyStateEl.classList.toggle("hidden", hasTeams);
  focusEmptyEl.classList.toggle("hidden", !(focusMode && hasTeams && visible.length === 0));
}

rankingListEl.addEventListener("click", (e) => {
  const row = e.target.closest(".team-row");
  if (!row || row.classList.contains("row-leaving")) return;
  const id = row.dataset.id;
  const actionEl = e.target.closest("[data-action]");

  if (!actionEl) {
    if (focusMode && !e.target.closest("input")) row.classList.toggle("is-open");
    return;
  }

  const action = actionEl.dataset.action;
  if (action === "edit") openEditModal(id);
  else if (action === "delete") {
    if (!isAdmin()) {
      showToast("Solo el administrador puede eliminar equipos", "error");
      return;
    }
    if (confirm("¿Eliminar este equipo?")) {
      teamsRef.child(id).remove()
        .then(() => showToast("Equipo eliminado", "success"))
        .catch(err => showToast("Error: " + err.message, "error"));
    }
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

/* ============================================================
   VISTA TOP 5 (PÚBLICA): gráfica = Top 5, lista lateral = 6° en adelante
   ============================================================ */
function swapRankingTitle(text) {
  clearTimeout(titleSwapTimer);
  rankingTitleEl.classList.add("is-swapping");
  titleSwapTimer = setTimeout(() => {
    rankingTitleEl.textContent = text;
    rankingTitleEl.classList.remove("is-swapping");
  }, 200);
}

function setFocusMode(on, silent = false) {
  on = !!on;
  if (on === focusMode) return;
  focusMode = on;
  if (!on) hoverArmed = false;

  dashboardEl.classList.toggle("focus-mode", on);
  btnFocusToggle.setAttribute("aria-pressed", on ? "true" : "false");
  btnFocusToggle.textContent = on ? "Salir ✕" : "Vista Top 5";
  swapRankingTitle(on ? "Posiciones 6° en adelante" : "Tabla General de Posiciones");
  renderRanking();

  if (!silent) {
    AudioFX.playPop();
    triggerHaptic();
  }

  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => { if (topChart) topChart.resize(); }, 800);
}

// Tras salir de la vista, el hover no la reactiva hasta que el cursor salga del encabezado
rankingHeaderEl.addEventListener("mouseenter", () => {
  if (focusMode || !canHover || !hoverArmed) return;
  clearTimeout(focusHoverTimer);
  focusHoverTimer = setTimeout(() => {
    lastAutoFocusAt = Date.now();
    setFocusMode(true);
  }, 450);
});

rankingHeaderEl.addEventListener("mouseleave", () => {
  clearTimeout(focusHoverTimer);
  hoverArmed = true;
});

document.addEventListener("mousemove", (e) => {
  if (!hoverArmed && !rankingHeaderEl.contains(e.target)) hoverArmed = true;
});

rankingHeaderEl.addEventListener("click", () => {
  clearTimeout(focusHoverTimer);
  if (focusMode && Date.now() - lastAutoFocusAt < 1200) return;
  setFocusMode(!focusMode);
});

/* ============================================================
   ANUNCIO DE GANADOR (SOLO ADMIN LO ACTIVA)
   ============================================================ */
const WINNER_TITLE_TEXT = "¡GANADORES!";

function getCurrentWinners() {
  if (!sortedTeams.length) return [];
  const best = sortedTeams[0].score;
  if (best <= 0) return [];
  return sortedTeams.filter(team => team.score === best);
}

function buildWinnerTitle() {
  winnerTitleEl.innerHTML = "";
  Array.from(WINNER_TITLE_TEXT).forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "winner-letter";
    span.style.setProperty("--i", index);
    span.textContent = char;
    winnerTitleEl.appendChild(span);
  });
}

function buildWinnerConfetti() {
  winnerConfettiEl.innerHTML = "";
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty("--rot", `${360 + Math.random() * 720}deg`);
    piece.style.setProperty("--dur", `${4 + Math.random() * 4}s`);
    piece.style.setProperty("--delay", `${1.6 + Math.random() * 4}s`);
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${10 + Math.random() * 10}px`;
    winnerConfettiEl.appendChild(piece);
  }
}

function animateWinnerScore(target) {
  cancelAnimationFrame(winnerCountRaf);
  winnerScoreEl.textContent = "0";
  const duration = 1800;
  let startTime = null;

  function step(now) {
    if (startTime === null) startTime = now;
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    winnerScoreEl.textContent = String(Math.round(target * eased));
    if (progress < 1) winnerCountRaf = requestAnimationFrame(step);
  }

  winnerTimers.push(setTimeout(() => { winnerCountRaf = requestAnimationFrame(step); }, 3100));
}

function openWinnerOverlay(winners) {
  clearTimeout(winnerCloseTimer);
  winnerTimers.forEach(clearTimeout);
  winnerTimers = [];

  const single = winners.length === 1;
  const names = single
    ? winners[0].name
    : (winners.length <= 3 ? winners.map(team => team.name).join(" · ") : `${winners.length} equipos empatados`);

  winnerTeamEl.textContent = names;
  winnerScoreEl.textContent = "0";
  winnerOverlay.style.setProperty("--winner-color", single ? winners[0].color : "#00f5ff");
  buildWinnerTitle();
  buildWinnerConfetti();

  winnerOpen = true;
  winnerBackdrop.classList.remove("hidden");
  winnerOverlay.classList.remove("hidden", "show", "playing");
  document.body.classList.add("winner-open");
  void winnerOverlay.offsetWidth;
  winnerOverlay.classList.add("playing");
  requestAnimationFrame(() => {
    winnerBackdrop.classList.add("show");
    winnerOverlay.classList.add("show");
  });

  AudioFX.playMathExpansion();
  triggerHaptic();
  winnerTimers.push(setTimeout(() => AudioFX.playPointChime(true), 1500));
  winnerTimers.push(setTimeout(() => AudioFX.playPointChime(true), 2600));
  winnerTimers.push(setTimeout(() => AudioFX.playPointChime(true), 3400));
  animateWinnerScore(winners[0].score);

  setTimeout(() => { if (winnerOpen) btnCloseWinner.focus({ preventScroll: true }); }, 150);
}

function closeWinnerOverlay(immediate = false) {
  if (!winnerOpen) return;
  winnerOpen = false;
  winnerTimers.forEach(clearTimeout);
  winnerTimers = [];
  cancelAnimationFrame(winnerCountRaf);

  winnerBackdrop.classList.remove("show");
  winnerOverlay.classList.remove("show");

  const finish = () => {
    winnerBackdrop.classList.add("hidden");
    winnerOverlay.classList.add("hidden");
    winnerOverlay.classList.remove("playing");
    winnerConfettiEl.innerHTML = "";
    document.body.classList.remove("winner-open");
  };

  clearTimeout(winnerCloseTimer);
  if (immediate) finish();
  else winnerCloseTimer = setTimeout(finish, 750);
}

function handleAssignWinner() {
  if (!isAdmin()) {
    showToast("Solo el administrador puede asignar ganador", "error");
    return;
  }
  if (winnerOpen) return;

  const winners = getCurrentWinners();
  if (!winners.length) {
    showToast("Aún no hay puntajes para declarar un ganador", "error");
    return;
  }
  openWinnerOverlay(winners);
}

btnAssignWinner.addEventListener("click", handleAssignWinner);
btnCloseWinner.addEventListener("click", () => closeWinnerOverlay());

function renderApp() {
  recomputeSortedTeams();
  renderCounter();
  renderRanking();
  renderChart();
  updateAddButton();
}

session = loadStoredSession();
applySessionUI();

teamsRef.on("value", (snapshot) => {
  teamsData = snapshot.val() || {};
  teamsLoaded = true;
  renderApp();
  maybePromptTeamSetup();
});

db.ref(".info/connected").on("value", (snap) => {
  const connected = snap.val() === true;
  statusDot.classList.toggle("online", connected);
  statusText.textContent = connected ? "Conectado en tiempo real" : "Sin conexión";
});
