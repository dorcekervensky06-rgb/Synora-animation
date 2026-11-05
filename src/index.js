
require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

// --------------------------------------------------
// CONFIGURATION ET SÉCURITÉ
// --------------------------------------------------

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const SESSION_DURATION = 12 * 60 * 60 * 1000;
const COOKIE_NAME = "synora_admin";

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("ERREUR : ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  process.exit(1);
}

if (!SESSION_SECRET || Buffer.byteLength(SESSION_SECRET) < 32) {
  console.error("ERREUR : SESSION_SECRET doit contenir au moins 32 octets.");
  process.exit(1);
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  next();
});

// --------------------------------------------------
// AUTHENTIFICATION PRIVÉE
// --------------------------------------------------

function createSignature(value) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("base64url");
}

function createSession() {
  const payload = {
    role: "admin",
    expires: Date.now() + SESSION_DURATION,
    nonce: crypto.randomBytes(16).toString("hex")
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createSignature(encoded)}`;
}

function verifySession(token) {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encoded, signature] = parts;
  const expected = createSignature(encoded);

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );

    return (
      payload.role === "admin" &&
      Number.isFinite(payload.expires) &&
      payload.expires > Date.now()
    );
  } catch {
    return false;
  }
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";

  for (const item of cookies.split(";")) {
    const [key, ...value] = item.trim().split("=");

    if (key === name) {
      return value.join("=");
    }
  }

  return null;
}

function isSecureRequest(req) {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

function setSessionCookie(req, res, token) {
  const secure = isSecureRequest(req) ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}${secure}`
  );
}

function clearSessionCookie(req, res) {
  const secure = isSecureRequest(req) ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
  );
}

function requireAdmin(req, res, next) {
  const token = getCookie(req, COOKIE_NAME);

  if (!verifySession(token)) {
    return res.status(401).json({
      success: false,
      error: "Session expirée. Veuillez vous reconnecter."
    });
  }

  next();
}

// --------------------------------------------------
// LIMITATION DES TENTATIVES DE CONNEXION
// --------------------------------------------------

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000;

function checkLoginLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) return true;

  if (record.blockedUntil && record.blockedUntil > now) {
    return false;
  }

  if (record.blockedUntil && record.blockedUntil <= now) {
    loginAttempts.delete(ip);
  }

  return true;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || {
    count: 0,
    blockedUntil: 0
  };

  record.count++;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION;
    record.count = 0;
  }

  loginAttempts.set(ip, record);
}

function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

// --------------------------------------------------
// VÉRIFICATION DE L'ORIGINE DES REQUÊTES
// --------------------------------------------------

function checkSameOrigin(req, res, next) {
  const origin = req.headers.origin;

  if (origin) {
    try {
      if (new URL(origin).host !== req.get("host")) {
        return res.status(403).json({
          success: false,
          error: "Origine non autorisée."
        });
      }
    } catch {
      return res.status(403).json({
        success: false,
        error: "Origine invalide."
      });
    }
  }

  next();
}

// --------------------------------------------------
// PAGE DE CONNEXION ET ATELIER
// --------------------------------------------------

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#10131c">
<title>SYNORA Animation — Atelier privé</title>

<style>
:root {
  --bg: #10131c;
  --panel: #191e2b;
  --panel2: #202738;
  --gold: #e5bd65;
  --text: #f4f2ed;
  --muted: #a5adbd;
  --border: #30394b;
  --danger: #ff7777;
  --success: #79d9a4;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
}

button, input, textarea, select {
  font: inherit;
}

button {
  cursor: pointer;
}

.container {
  width: min(1100px, 94%);
  margin: auto;
  padding: 24px 0 60px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid var(--border);
  padding: 12px 0 22px;
  margin-bottom: 25px;
}

.logo {
  color: var(--gold);
  font-size: 25px;
  font-weight: bold;
  letter-spacing: 2px;
}

.subtitle {
  color: var(--muted);
  font-size: 13px;
  margin-top: 5px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 20px;
}

h1, h2, h3 { margin-top: 0; }

h2 {
  font-size: 19px;
  color: var(--gold);
}

label {
  display: block;
  margin: 15px 0 8px;
  font-size: 14px;
  color: var(--muted);
}

input, textarea, select {
  width: 100%;
  color: var(--text);
  background: #101521;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  outline: none;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--gold);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.btn {
  border: 0;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: bold;
  background: var(--gold);
  color: #151515;
  margin-top: 15px;
}

.btn.secondary {
  color: var(--text);
  background: var(--panel2);
  border: 1px solid var(--border);
}

.btn.danger {
  background: #612d35;
  color: white;
}

.btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.full { width: 100%; }

.status {
  color: var(--muted);
  font-size: 13px;
  margin-top: 12px;
  min-height: 18px;
}

.error { color: var(--danger); }
.success { color: var(--success); }

.hidden { display: none !important; }

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.actions .btn { margin-top: 8px; }

.result {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #101521;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px;
  line-height: 1.7;
  min-height: 120px;
  max-height: 600px;
  overflow: auto;
}

.episode {
  border: 1px solid var(--border);
  background: #101521;
  border-radius: 8px;
  padding: 13px;
  margin: 10px 0;
}

.small {
  color: var(--muted);
  font-size: 12px;
}

.login {
  width: min(430px, 94%);
  margin: 10vh auto;
}

footer {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  margin-top: 30px;
}

@media(max-width: 650px) {
  .grid { grid-template-columns: 1fr; }
  header { align-items: flex-start; }
  .logo { font-size: 21px; }
  .panel { padding: 16px; }
}
</style>
</head>

<body>

<section id="loginScreen" class="login hidden">
  <div class="panel">
    <div class="logo">SYNORA</div>
    <p class="subtitle">ANIMATION — ESPACE ADMINISTRATEUR PRIVÉ</p>

    <h2 style="margin-top:30px">Connexion sécurisée</h2>

    <form id="loginForm">
      <label for="password">Mot de passe administrateur</label>
      <input id="password" type="password"
        autocomplete="current-password" required>

      <button class="btn full" id="loginButton" type="submit">
        Se connecter
      </button>
    </form>

    <div id="loginStatus" class="status"></div>
    <p class="small">Accès réservé à l'administrateur de SYNORA Animation.</p>
  </div>
</section>

<main id="appScreen" class="container hidden">

<header>
  <div>
    <div class="logo">SYNORA ANIMATION</div>
    <div class="subtitle">Atelier privé de création audiovisuelle</div>
  </div>

  <button class="btn danger" id="logoutButton">Déconnexion</button>
</header>

<section class="panel">
  <h2>01 — Générateur de scénarios</h2>
  <p class="small">
    Crée des scénarios structurés pour les épisodes de tes séries.
  </p>

  <label for="title">Titre de l'épisode</label>
  <input id="title" placeholder="Ex. Mike et Zoé : Le secret de la ville">

  <label for="idea">Idée principale de l'histoire</label>
  <textarea id="idea" placeholder="Décris l'histoire, le problème, le message éducatif et les événements souhaités..."></textarea>

  <div class="grid">
    <div>
      <label for="duration">Durée</label>
      <select id="duration">
        <option value="60">60 secondes</option>
        <option value="180" selected>180 secondes</option>
        <option value="300">300 secondes</option>
      </select>
    </div>

    <div>
      <label for="style">Style</label>
      <select id="style">
        <option>Aventure éducative</option>
        <option>Humour et aventure</option>
        <option>Mystère</option>
        <option>Science et découverte</option>
        <option>Éducation citoyenne</option>
        <option>Conte fantastique</option>
      </select>
    </div>
  </div>

  <button class="btn full" id="generateButton">
    Générer le scénario
  </button>

  <div id="generateStatus" class="status"></div>
</section>

<section class="panel">
  <h2>02 — Scénario produit</h2>

  <div id="scenario" class="result">Ton scénario apparaîtra ici après la génération.</div>

  <div class="actions">
    <button class="btn" id="downloadTxt">Télécharger TXT</button>
    <button class="btn secondary" id="saveEpisode">Enregistrer l'épisode</button>
    <button class="btn secondary" id="copyScenario">Copier</button>
  </div>
</section>

<section class="panel">
  <h2>03 — Atelier des dialogues</h2>
  <p class="small">
    Extraction des répliques et lecture vocale par le navigateur.
    La lecture ne produit pas de fichier audio MP3.
  </p>

  <div class="actions">
    <button class="btn secondary" id="extractDialogues">Extraire les dialogues</button>
    <button class="btn secondary" id="readDialogues">Lire les dialogues</button>
    <button class="btn danger" id="stopVoice">Arrêter la lecture</button>
  </div>

  <div id="dialogues" class="result">Les dialogues extraits apparaîtront ici.</div>
</section>

<section class="panel">
  <h2>04 — Sous-titres SRT</h2>
  <p class="small">
    Création d'une première base de sous-titres avec timing estimatif.
    Les temps doivent être vérifiés et corrigés avant utilisation.
  </p>

  <button class="btn secondary" id="makeSrt">Créer les sous-titres</button>
  <button class="btn secondary" id="downloadSrt">Télécharger SRT</button>
  <div id="srtStatus" class="status"></div>
</section>

<section class="panel">
  <h2>05 — Bibliothèque locale</h2>
  <p class="small">
    Les épisodes enregistrés ici restent dans le navigateur de cet appareil.
  </p>
  <div id="library"></div>
</section>

<footer>
  SYNORA TECH — SYNORA ANIMATION · Espace privé de production
</footer>

</main>

<script>
const $ = (id) => document.getElementById(id);

let currentScenario = "";
let currentSrt = "";
let currentDialogues = "";

function showLogin() {
  $("loginScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
}

function showApp() {
  $("loginScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");
  renderLibrary();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 401 && path !== "/api/login") {
    showLogin();
    throw new Error("Session expirée. Reconnecte-toi.");
  }

  return response;
}

async function checkSession() {
  try {
    const response = await api("/api/me");
    const data = await response.json();

    if (data.authenticated) showApp();
    else showLogin();
  } catch {
    showLogin();
  }
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("loginButton");
  const status = $("loginStatus");

  button.disabled = true;
  status.textContent = "Vérification...";
  status.className = "status";

  try {
    const response = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        password: $("password").value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Connexion impossible.");
    }

    $("password").value = "";
    status.textContent = "";
    showApp();
  } catch (error) {
    status.textContent = error.message;
    status.className = "status error";
  } finally {
    button.disabled = false;
  }
});

$("logoutButton").addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
  } finally {
    speechSynthesis.cancel();
    currentScenario = "";
    currentSrt = "";
    currentDialogues = "";
    showLogin();
  }
});

$("generateButton").addEventListener("click", async () => {
  const title = $("title").value.trim();
  const idea = $("idea").value.trim();

  if (!title || !idea) {
    $("generateStatus").textContent =
      "Ajoute un titre et une idée avant de générer.";
    $("generateStatus").className = "status error";
    return;
  }

  const button = $("generateButton");
  button.disabled = true;

  $("generateStatus").textContent =
    "Génération en cours... Cela peut prendre un moment.";
  $("generateStatus").className = "status";

  try {
    const response = await api("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        title,
        idea,
        duration: $("duration").value,
        style: $("style").value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur de génération.");
    }

    currentScenario = data.scenario;
    $("scenario").textContent = currentScenario;

    $("generateStatus").textContent = "Scénario généré.";
    $("generateStatus").className = "status success";
  } catch (error) {
    $("generateStatus").textContent = error.message;
    $("generateStatus").className = "status error";
  } finally {
    button.disabled = false;
  }
});

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function safeFilename(value) {
  return (value || "synora-episode")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
}

$("downloadTxt").addEventListener("click", () => {
  if (!currentScenario) return alert("Aucun scénario à télécharger.");

  const filename = safeFilename($("title").value);
  downloadFile(filename + ".txt", currentScenario, "text/plain;charset=utf-8");
});

$("copyScenario").addEventListener("click", async () => {
  if (!currentScenario) return alert("Aucun scénario à copier.");

  try {
    await navigator.clipboard.writeText(currentScenario);
    alert("Scénario copié.");
  } catch {
    alert("Copie impossible sur ce navigateur.");
  }
});

// --------------------------------------------------
// BIBLIOTHÈQUE LOCALE
// --------------------------------------------------

function getEpisodes() {
  try {
    return JSON.parse(localStorage.getItem("synora_episodes") || "[]");
  } catch {
    return [];
  }
}

function renderLibrary() {
  const episodes = getEpisodes();
  const library = $("library");

  library.replaceChildren();

  if (!episodes.length) {
    library.textContent = "Aucun épisode enregistré pour le moment.";
    return;
  }

  episodes.forEach((episode, index) => {
    const card = document.createElement("div");
    card.className = "episode";

    const title = document.createElement("strong");
    title.textContent = episode.title;

    const date = document.createElement("p");
    date.className = "small";
    date.textContent = episode.date;

    const actions = document.createElement("div");
    actions.className = "actions";

    const open = document.createElement("button");
    open.className = "btn secondary";
    open.textContent = "Ouvrir";
    open.addEventListener("click", () => {
      currentScenario = episode.scenario;
      $("scenario").textContent = currentScenario;
      $("title").value = episode.title;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const remove = document.createElement("button");
    remove.className = "btn danger";
    remove.textContent = "Supprimer";
    remove.addEventListener("click", () => {
      const updated = getEpisodes();
      updated.splice(index, 1);
      localStorage.setItem("synora_episodes", JSON.stringify(updated));
      renderLibrary();
    });

    actions.append(open, remove);
    card.append(title, date, actions);
    library.append(card);
  });
}

$("saveEpisode").addEventListener("click", () => {
  if (!currentScenario) return alert("Aucun scénario à enregistrer.");

  const episodes = getEpisodes();

  episodes.unshift({
    title: $("title").value.trim() || "Épisode sans titre",
    scenario: currentScenario,
    date: new Date().toLocaleString("fr-FR")
  });

  try {
    localStorage.setItem("synora_episodes", JSON.stringify(episodes));
    renderLibrary();
    alert("Épisode enregistré dans ce navigateur.");
  } catch {
    alert("Espace de stockage du navigateur insuffisant.");
  }
});

// --------------------------------------------------
// EXTRACTION ET LECTURE DES DIALOGUES
// --------------------------------------------------

$("extractDialogues").addEventListener("click", () => {
  if (!currentScenario) {
    return alert("Génère ou ouvre un scénario d'abord.");
  }

  const lines = currentScenario.split(/\r?\n/);

  const dialogueLines = lines.filter(line =>
    /^\s*(MIKE|ZO[ÉE]|ZOE|LUMI|M\.?\s*L[ÉE]ON|BROOK|M\.?\s*DARK)\s*:/i.test(line)
  );

  currentDialogues = dialogueLines.join("\n");

  $("dialogues").textContent = currentDialogues ||
    "Aucune réplique reconnue. Vérifie le format des dialogues.";
});

$("readDialogues").addEventListener("click", () => {
  if (!currentDialogues) {
    return alert("Aucun dialogue à lire. Extrais les dialogues d'abord.");
  }

  if (!("speechSynthesis" in window)) {
    return alert("Lecture vocale non disponible sur ce navigateur.");
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(currentDialogues);
  utterance.lang = "fr-FR";
  utterance.rate = 0.95;
  speechSynthesis.speak(utterance);
});

  if (!("speechSynthesis" in window)) {
    return alert("Lecture vocale non disponible sur ce navigateur.");
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(currentDialogues);
  utterance.lang = "fr-FR";
  utterance.rate = 0.95;
  speechSynthesis.speak(utterance);
});

$("stopVoice").addEventListener("click", () => {
  speechSynthesis.cancel();
});

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return (
    String(hours).padStart(2, "0") + ":" +
    String(minutes).padStart(2, "0") + ":" +
    String(secs).padStart(2, "0") + ",000"
  );
}

$("makeSrt").addEventListener("click", () => {
  if (!currentScenario) {
    return alert("Génère un scénario d'abord.");
  }

  const lines = currentScenario.split(/\r?\n/).filter(line => line.trim());
  const dialogues = lines.filter(line => /^\s*[^:]{1,35}:\s*.+/.test(line));

  if (!dialogues.length) {
    $("srtStatus").textContent = "Aucun dialogue détecté.";
    return;
  }

  let time = 0;
  const duration = 4;

  currentSrt = dialogues.map((line, index) => {
    const start = formatTime(time);
    time += duration;
    const end = formatTime(time);

    return (index + 1) + "\n" + start + " --> " + end +
      "\n" + line.trim() + "\n";
  }).join("\n");

  $("srtStatus").textContent =
    "Sous-titres créés. Vérifie les timings avant utilisation.";
});

$("downloadSrt").addEventListener("click", () => {
  if (!currentSrt) {
    return alert("Crée les sous-titres d'abord.");
  }

  downloadFile(
    safeFilename($("title").value) + ".srt",
    currentSrt,
    "text/plain;charset=utf-8"
  );
});

checkSession();
</script>
</body>
</html>`;


// --------------------------------------------------
// ROUTES SERVEUR
// --------------------------------------------------

app.get("/", (req, res) => {
  res.type("html").send(HTML);
});

app.get("/api/me", (req, res) => {
  res.json({
    authenticated: verifySession(getCookie(req, COOKIE_NAME))
  });
});

app.post("/api/login", checkSameOrigin, (req, res) => {
  const ip = req.ip || "unknown";

  if (!checkLoginLimit(ip)) {
    return res.status(429).json({
      success: false,
      error: "Trop de tentatives. Réessaie dans 15 minutes."
    });
  }

  const password = req.body && req.body.password;

  if (typeof password !== "string" || password.length > 200) {
    recordFailedLogin(ip);
    return res.status(401).json({
      success: false,
      error: "Identifiants incorrects."
    });
  }

  const supplied = Buffer.from(password);
  const expected = Buffer.from(ADMIN_PASSWORD);

  const valid =
    supplied.length === expected.length &&
    crypto.timingSafeEqual(supplied, expected);

  if (!valid) {
    recordFailedLogin(ip);
    return res.status(401).json({
      success: false,
      error: "Identifiants incorrects."
    });
  }

  clearFailedLogins(ip);

  setSessionCookie(req, res, createSession());

  res.json({ success: true });
});

app.post("/api/logout", checkSameOrigin, (req, res) => {
  clearSessionCookie(req, res);
  res.json({ success: true });
});

app.post(
  "/api/generate",
  checkSameOrigin,
  requireAdmin,
  async (req, res) => {
    try {
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "Clé OpenRouter non configurée."
        });
      }

      const title = String(req.body.title || "").trim();
      const idea = String(req.body.idea || "").trim();
      const style = String(req.body.style || "Aventure éducative");
      const duration = Number(req.body.duration);

      if (!title || !idea) {
        return res.status(400).json({
          success: false,
          error: "Le titre et l'idée sont obligatoires."
        });
      }

      if (title.length > 200 || idea.length > 6000) {
        return res.status(400).json({
          success: false,
          error: "Le titre ou l'idée est trop long."
        });
      }

      if (![60, 180, 300].includes(duration)) {
        return res.status(400).json({
          success: false,
          error: "Durée non autorisée."
        });
      }

      const prompt = [
        "Tu es un scénariste professionnel spécialisé en animation.",
        "Rédige un scénario complet, original et exploitable par une équipe de production.",
        "Titre : " + title,
        "Idée : " + idea,
        "Style : " + style,
        "Durée cible : " + duration + " secondes.",
        "",
        "Structure obligatoire :",
        "1. Titre et concept de l'épisode.",
        "2. Personnages présents et leurs motivations.",
        "3. Résumé de l'histoire.",
        "4. Découpage détaillé en scènes numérotées.",
        "5. Pour chaque scène : lieu, moment, ambiance, description visuelle, actions, expressions et mouvements des personnages.",
        "6. Dialogues complets, avec le nom du personnage avant chaque réplique.",
        "7. Indications de caméra, cadrage, mouvements et transitions.",
        "8. Ambiance sonore et effets sonores.",
        "9. Dénouement et message final.",
        "",
        "Respecte la durée demandée.",
        "Évite les répétitions et les descriptions vagues.",
        "Ne résume pas les dialogues : écris les répliques réellement prononcées.",
        "Ne saute aucune scène importante.",
        "Réponds en français."
      ].join("\n");

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + OPENROUTER_API_KEY,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://synora-animation.onrender.com",
            "X-Title": "SYNORA Animation"
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Tu es un scénariste expert en animation audiovisuelle."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.8,
            max_tokens: 7000
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Erreur OpenRouter :", result);

        return res.status(502).json({
          success: false,
          error: "Le service IA n'a pas pu générer le scénario. Vérifie la clé, le modèle et les crédits OpenRouter."
        });
      }

      const scenario =
        result.choices &&
        result.choices[0] &&
        result.choices[0].message &&
        result.choices[0].message.content;

      if (!scenario || typeof scenario !== "string") {
        return res.status(502).json({
          success: false,
          error: "La réponse de l'IA est vide."
        });
      }

      res.json({
        success: true,
        scenario: scenario.trim()
      });

    } catch (error) {
      console.error("Erreur génération :", error);

      res.status(500).json({
        success: false,
        error: "Une erreur interne est survenue pendant la génération."
      });
    }
  }
);


// --------------------------------------------------
// DÉMARRAGE DU SERVEUR
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log("SYNORA Animation démarré sur le port " + PORT);
});
