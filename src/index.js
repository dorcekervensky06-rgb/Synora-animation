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
header{padding:22px 6%;border-bottom:1px solid #39313e}
.logo{color:#d8b46a;font-size:24px;font-weight:bold}
main{max-width:850px;margin:45px auto;padding:20px}
h1{color:#d8b46a;font-size:36px}
p{line-height:1.6;color:#d1ced8}
.card{background:#1c1c29;border:1px solid #494052;border-radius:16px;padding:24px;margin:24px 0}
label{display:block;margin:18px 0 8px}
input,textarea,select{width:100%;padding:13px;border-radius:8px;border:1px solid #62556d;background:#12121c;color:white;font-size:16px}
textarea{min-height:110px;resize:vertical}
button{padding:13px 18px;border:0;border-radius:8px;background:#d8b46a;color:#16121b;font-weight:bold;cursor:pointer}
.result{white-space:pre-wrap;color:#fff;line-height:1.7;margin-top:20px}
.small{font-size:13px;color:#aaa}
</style>
</head>
<body>
<header><div class="logo">SYNORA ANIMATION</div></header>
<main>
<h1>Donnez vie à vos histoires.</h1>
<p>Votre studio de préparation de contenus animés par l'intelligence artificielle.</p>
<div class="card">
<h2>Studio Mike &amp; Zoe</h2>
<p>Préparez votre prochain épisode en quelques étapes.</p>
<label for="idea">Idée de l'histoire</label>
<textarea id="idea" placeholder="Exemple : Mike et Zoe découvrent un mystérieux robot..."></textarea>
<label for="format">Format du projet</label>
<select id="format">
<option>YouTube Shorts</option>
<option>Épisode animé long</option>
<option>Mini-série</option>
</select>
<label for="tone">Style de l'histoire</label>
<select id="tone">
<option>Aventure et humour</option>
<option>Éducatif</option>
<option>Fantastique</option>
<option>Drame</option>
</select>
<button onclick="prepareStory()">Préparer mon épisode</button>
<div id="result" class="result" aria-live="polite"></div>
</div>
<p class="small">Prototype SYNORA Animation — Phase 1.</p>
</main>
<script>
function prepareStory(){
 const idea=document.getElementById('idea').value.trim();
 const format=document.getElementById('format').value;
 const tone=document.getElementById('tone').value;
 const result=document.getElementById('result');
 if(!idea){
   result.textContent="Veuillez d'abord décrire votre idée d'histoire.";
   document.getElementById('idea').focus();
   return;
 }
 result.textContent=
 "FICHE DE PRÉPARATION\\n\\n"+
 "Série : Mike & Zoe\\n"+
 "Format : "+format+"\\n"+
 "Style : "+tone+"\\n"+
 "Idée : "+idea+"\\n\\n"+
 "Prochaine étape : développer cette idée en scénario, scènes et dialogues.\\n\\n"+
 "Remarque : cette version organise votre idée, mais ne génère pas encore de scénario par IA ni de vidéo.";
}
</script>
</body>
</html>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SYNORA Animation fonctionne sur le port " + PORT);
});
