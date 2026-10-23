const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SYNORA Animation Studio</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#101018;color:#fff;font-family:Arial,sans-serif}
header{padding:20px 6%;border-bottom:1px solid #39313e}
.logo{color:#d8b46a;font-size:23px;font-weight:bold}
main{max-width:900px;margin:30px auto;padding:20px}
h1,h2{color:#d8b46a}
p{line-height:1.6;color:#d1ced8}
.card{background:#1c1c29;border:1px solid #494052;border-radius:16px;padding:22px;margin:20px 0}
label{display:block;margin:17px 0 8px}
input,textarea,select{width:100%;padding:13px;border-radius:8px;border:1px solid #62556d;background:#12121c;color:white;font-size:16px}
textarea{min-height:120px}
button{padding:13px 17px;border:0;border-radius:8px;background:#d8b46a;color:#16121b;font-weight:bold;cursor:pointer;margin:8px 5px 8px 0}
button:disabled{opacity:.6;cursor:wait}
.secondary{background:#383343;color:white}
.result{white-space:pre-wrap;line-height:1.7;margin-top:20px;overflow-wrap:anywhere}
.small{font-size:13px;color:#aaa}
</style>
</head>
<body>
<header><div class="logo">SYNORA ANIMATION</div></header>
<main>
<h1>Studio de création d'histoires</h1>
<p>Transformez votre idée en scénario original avec l'intelligence artificielle.</p>
<div class="card">
<h2>Préparer un épisode</h2>
<label for="title">Titre de l'épisode</label>
<input id="title" placeholder="Ex. Le robot sans mémoire">
<label for="idea">Votre idée</label>
<textarea id="idea" placeholder="Décrivez l'histoire, les personnages et le problème..."></textarea>
<label for="duration">Durée souhaitée</label>
<select id="duration">
<option value="60">Short — 1 minute</option>
<option value="180" selected>Épisode — 3 minutes</option>
<option value="300">Épisode — 5 minutes</option>
</select>
<label for="style">Style</label>
<select id="style">
<option>Aventure et humour</option>
<option>Éducatif</option>
<option>Fantastique</option>
<option>Drame</option>
</select>
<button id="generateBtn" onclick="generate()">Créer le scénario avec l'IA</button>
<button class="secondary" onclick="downloadScript()">Télécharger en TXT</button>
<div id="result" class="result" aria-live="polite"></div>
</div>
<p class="small">SYNORA ANIMATION — Série Mike &amp; Zoe. La génération IA nécessite une connexion API active.</p>
</main>
<script>
let currentScript = "";

async function generate() {
  const title = document.getElementById("title").value.trim() || "Nouvelle aventure";
  const idea = document.getElementById("idea").value.trim();
  const duration = Number(document.getElementById("duration").value);
  const style = document.getElementById("style").value;
  const result = document.getElementById("result");
  const button = document.getElementById("generateBtn");

  if (!idea) {
    result.textContent = "Veuillez écrire votre idée avant de créer le scénario.";
    return;
  }

  button.disabled = true;
  result.textContent = "L'IA écrit votre scénario. Veuillez patienter...";
  currentScript = "";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, idea, duration, style })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "La génération a échoué.");
    }

    currentScript = data.script;
    result.textContent = currentScript;
  } catch (error) {
    result.textContent = "Impossible de générer le scénario : " + error.message +
      "\\n\\nVérifiez la configuration API et réessayez.";
  } finally {
    button.disabled = false;
  }
}

function downloadScript() {
  if (!currentScript) {
    document.getElementById("result").textContent =
      "Générez d'abord un scénario.";
    return;
  }

  const blob = new Blob([currentScript], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "SYNORA-Mike-Zoe-scenario.txt";
  link.click();
  URL.revokeObjectURL(url);
}
</script>
</body>
</html>`);
});

app.post("/api/generate", async (req, res) => {
  try {
    const { title, idea, duration, style } = req.body || {};

    if (typeof idea !== "string" || !idea.trim()) {
      return res.status(400).json({ error: "Veuillez fournir une idée d'histoire." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "La clé API OpenRouter n'est pas configurée sur le serveur."
      });
    }

    const seconds = [60, 180, 300].includes(Number(duration))
      ? Number(duration)
      : 180;

    const prompt = [
  "Tu es le scénariste principal de SYNORA ANIMATION, une série professionnelle centrée sur Mike et Zoé.",
  "Écris un scénario COMPLET, cohérent, original et prêt pour la production.",
  "Respecte le titre, l'idée, le style et la durée demandée.",
  "IMPORTANT : le scénario doit avoir un début, un problème, une enquête, des obstacles, un suspense, une résolution expliquée et une vraie conclusion. Ne termine jamais au milieu d'une scène ou d'une phrase.",
  "Adapte la longueur à la durée. Pour 60 secondes : 3 à 4 scènes courtes. Pour 180 secondes : 5 à 6 scènes. Pour 300 secondes : 8 à 10 scènes.",
  "Pour chaque scène, indique : numéro, durée, décor, cadrages caméra, actions visibles, dialogues naturels avec le nom du personnage, effets sonores et musique.",
  "Présente les personnages importants et explique les événements. Garde une continuité logique entre toutes les scènes.",
  "Pour un contenu éducatif destiné aux enfants, favorise la curiosité, la coopération, la réflexion et la résolution pacifique des conflits.",
  "Termine par une conclusion complète et, si approprié, une leçon naturelle.",
  "FORMAT OBLIGATOIRE : titre, série, style, durée totale, personnages principaux, scènes numérotées détaillées, conclusion finale.",
  "Sois détaillé mais concis pour pouvoir terminer le scénario dans une seule réponse. Ne répète pas les mêmes informations. N'ajoute aucun commentaire hors scénario.",
  "Titre : " + String(title || "Nouvelle aventure").slice(0, 200),
  "Style : " + String(style || "Aventure et humour").slice(0, 100),
  "Durée cible : " + seconds + " secondes.",
  "Idée originale : " + idea.trim().slice(0, 8000)
].join("\n\n");
    
    const apiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "SYNORA Animation"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: "Tu écris des scénarios d'animation originaux, détaillés et professionnels en français."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 5000
        })
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("OpenRouter error:", apiResponse.status, data);
      return res.status(502).json({
        error: apiResponse.status === 401
          ? "Clé API invalide ou non autorisée."
          : apiResponse.status === 429
          ? "Limite de requêtes atteinte. Réessayez plus tard."
          : "OpenRouter n'a pas pu répondre. Vérifiez le modèle et votre compte."
      });
    }

    const script = data.choices?.[0]?.message?.content;

    if (!script) {
      console.error("OpenRouter returned no text:", data);
      return res.status(502).json({
        error: "L'IA n'a pas renvoyé de texte. Réessayez."
      });
    }

    res.json({
      script: "SYNORA ANIMATION — SCÉNARIO GÉNÉRÉ PAR IA\\n\\n" + script
    });
  } catch (error) {
    console.error("Generation error:", error.message);
    res.status(500).json({
      error: "Erreur du serveur pendant la génération. Réessayez."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SYNORA Animation fonctionne sur le port " + PORT);
});
