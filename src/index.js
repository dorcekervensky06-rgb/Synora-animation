const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SYNORA Animation</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#101018;color:#fff;font-family:Arial,sans-serif}
header{padding:20px 6%;border-bottom:1px solid #39313e}
.logo{color:#d8b46a;font-size:23px;font-weight:bold}
main{max-width:850px;margin:30px auto;padding:20px}
h1{color:#d8b46a}
p{line-height:1.6;color:#d1ced8}
.card{background:#1c1c29;border:1px solid #494052;border-radius:16px;padding:22px;margin:20px 0}
label{display:block;margin:17px 0 8px}
input,textarea,select{width:100%;padding:13px;border-radius:8px;border:1px solid #62556d;background:#12121c;color:white;font-size:16px}
textarea{min-height:120px}
button{padding:13px 17px;border:0;border-radius:8px;background:#d8b46a;color:#16121b;font-weight:bold;cursor:pointer;margin:8px 5px 8px 0}
.secondary{background:#383343;color:#fff}
.result{white-space:pre-wrap;line-height:1.7;margin-top:20px;overflow-wrap:anywhere}
.small{font-size:13px;color:#aaa}
</style>
</head>
<body>
<header><div class="logo">SYNORA ANIMATION</div></header>
<main>
<h1>Donnez vie à vos histoires.</h1>
<p>Préparez des scénarios pour votre studio d'animation.</p>

<div class="card">
<h2>Studio Mike &amp; Zoe</h2>
<label for="title">Titre de l'épisode</label>
<input id="title" placeholder="Ex. Le robot sans mémoire">

<label for="idea">Idée de l'histoire</label>
<textarea id="idea" placeholder="Décrivez ce qui arrive à Mike et Zoe..."></textarea>

<label for="format">Format</label>
<select id="format">
<option value="Short de 1 minute">YouTube Shorts — 1 minute</option>
<option value="Épisode de 3 minutes">Épisode — 3 minutes</option>
<option value="Épisode de 5 minutes">Épisode — 5 minutes</option>
<option value="Mini-série">Mini-série</option>
</select>

<label for="style">Style</label>
<select id="style">
<option>Aventure et humour</option>
<option>Éducatif</option>
<option>Fantastique</option>
<option>Drame</option>
</select>

<button onclick="generate()">Générer le scénario</button>
<button class="secondary" onclick="downloadScript()">Télécharger le scénario</button>
<div id="result" class="result" aria-live="polite"></div>
</div>

<p class="small">SYNORA Animation — Prototype de création de scénarios. Version sans IA externe.</p>
</main>

<script>
let currentScript = "";

function generate() {
  const title = document.getElementById("title").value.trim() || "Nouvelle aventure";
  const idea = document.getElementById("idea").value.trim();
  const format = document.getElementById("format").value;
  const style = document.getElementById("style").value;
  const result = document.getElementById("result");

  if (!idea) {
    result.textContent = "Veuillez d'abord décrire votre idée d'histoire.";
    return;
  }

  const scenes = [
    {
      name: "SCÈNE 1 — LE DÉBUT",
      description: "Dans leur quartier, Mike et Zoe découvrent la situation suivante : " + idea,
      mike: "Zoe, tu as vu ça ? Je crois que notre journée vient de changer !",
      zoe: "Oui, Mike. Restons calmes et essayons de comprendre ce qui se passe."
    },
    {
      name: "SCÈNE 2 — LE PROBLÈME",
      description: "Le problème devient plus sérieux. Les deux amis doivent réfléchir avant d'agir.",
      mike: "On doit trouver une solution. Tu as une idée ?",
      zoe: "Commençons par observer les indices et travaillons ensemble."
    },
    {
      name: "SCÈNE 3 — LA DÉCOUVERTE",
      description: "En examinant la situation, Mike et Zoe découvrent un nouvel indice qui peut les aider.",
      mike: "Attends ! Je viens de remarquer quelque chose d'important !",
      zoe: "Bien vu ! Vérifions si cet indice peut nous aider."
    },
    {
      name: "SCÈNE 4 — LA SOLUTION",
      description: "Les deux amis mettent leur idée en pratique et tentent de résoudre le problème.",
      mike: "Prêt ? On essaie ensemble !",
      zoe: "Ensemble, on peut y arriver. Allons-y !"
    },
    {
      name: "SCÈNE 5 — LA FIN",
      description: "La situation se termine. Mike et Zoe tirent une leçon de cette aventure.",
      mike: "Quelle aventure ! Je ne suis pas près d'oublier ça.",
      zoe: "Et la prochaine fois, on sera encore mieux préparés !"
    }
  ];

  let script = "SYNORA ANIMATION — STUDIO MIKE & ZOE\\n";
  script += "TITRE : " + title + "\\n";
  script += "FORMAT : " + format + "\\n";
  script += "STYLE : " + style + "\\n";
  script += "IDÉE DE DÉPART : " + idea + "\\n";
  script += "\\n================================\\n";

  scenes.forEach(function(scene) {
    script += "\\n" + scene.name + "\\n";
    script += "VISUEL : " + scene.description + "\\n";
    script += "MIKE : " + scene.mike + "\\n";
    script += "ZOE : " + scene.zoe + "\\n";
  });

  script += "\\n================================\\n";
  script += "FIN DU SCÉNARIO\\n";
  script += "À améliorer : décors, mouvements, sons, musique et détails visuels.\\n";
  script += "Note : ce scénario est construit à partir de modèles programmés, pas par une IA générative.";

  currentScript = script;
  result.textContent = script;
}

function downloadScript() {
  if (!currentScript) {
    document.getElementById("result").textContent =
      "Générez d'abord un scénario avant de le télécharger.";
    return;
  }

  const blob = new Blob([currentScript], {type: "text/plain;charset=utf-8"});
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

app.listen(PORT, "0.0.0.0", () => {
  console.log("SYNORA Animation fonctionne sur le port " + PORT);
});
