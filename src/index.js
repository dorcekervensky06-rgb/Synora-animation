const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

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
.secondary{background:#383343;color:white}
.result{white-space:pre-wrap;line-height:1.7;margin-top:20px;overflow-wrap:anywhere}
.small{font-size:13px;color:#aaa}
</style>
</head>
<body>
<header><div class="logo">SYNORA ANIMATION</div></header>
<main>
<h1>Studio de création d'histoires</h1>
<p>Transformez une idée en scénario organisé pour Mike &amp; Zoe.</p>
<div class="card">
<h2>Préparer un épisode</h2>
<label for="title">Titre de l'épisode</label>
<input id="title" placeholder="Ex. Le robot sans mémoire">
<label for="idea">Votre idée</label>
<textarea id="idea" placeholder="Décrivez l'histoire, les personnages et le problème..."></textarea>
<label for="duration">Durée souhaitée</label>
<select id="duration">
<option value="60">Short — 1 minute</option>
<option value="180">Épisode — 3 minutes</option>
<option value="300">Épisode — 5 minutes</option>
</select>
<label for="style">Style</label>
<select id="style">
<option>Aventure et humour</option>
<option>Éducatif</option>
<option>Fantastique</option>
<option>Drame</option>
</select>
<button onclick="generate()">Créer le scénario</button>
<button class="secondary" onclick="downloadScript()">Télécharger en TXT</button>
<div id="result" class="result" aria-live="polite"></div>
</div>
<p class="small">Prototype SYNORA Animation. Génération par modèles programmés, sans IA externe.</p>
</main>
<script>
let currentScript = "";

function generate(){
const title = document.getElementById("title").value.trim() || "Nouvelle aventure";
const idea = document.getElementById("idea").value.trim();
const duration = Number(document.getElementById("duration").value);
const style = document.getElementById("style").value;
const result = document.getElementById("result");

if(!idea){
result.textContent="Veuillez écrire votre idée avant de créer le scénario.";
return;
}

const sceneCount = 5;
const sceneSeconds = Math.floor(duration / sceneCount);
const scenes = [
{
name:"SCÈNE 1 — INTRODUCTION",
visual:"PLAN LARGE : montrer le quartier, les maisons et la rue. Mike et Zoe se promènent lorsqu'ils remarquent un événement inhabituel.",
action:"Mike s'arrête brusquement. Zoe regarde dans la même direction. Ils s'approchent avec prudence.",
mike:"Zoe, regarde ça ! Je n'ai jamais rien vu de pareil.",
zoe:"Approchons-nous doucement. Il faut d'abord comprendre ce qui se passe.",
sound:"Ambiance de quartier, pas, musique de curiosité."
},
{
name:"SCÈNE 2 — LE PROBLÈME",
visual:"PLAN RAPPROCHÉ : mettre en évidence l'objet ou le personnage au centre de l'histoire.",
action:"Les deux amis examinent la situation. Un nouvel événement complique leur recherche.",
mike:"Bon, notre découverte semble avoir un problème.",
zoe:"Au lieu de deviner, cherchons des indices. Chaque détail peut compter.",
sound:"Petit bruit mystérieux, musique de suspense légère."
},
{
name:"SCÈNE 3 — L'INDICE",
visual:"GROS PLAN : montrer un détail qui pourrait expliquer le mystère.",
action:"Zoe remarque un indice. Mike essaie de comprendre son importance et propose une hypothèse.",
mike:"Attends, ce détail pourrait nous donner la réponse !",
zoe:"C'est possible. Mais vérifions avant de tirer une conclusion.",
sound:"Bip ou son de découverte, musique qui devient plus vive."
},
{
name:"SCÈNE 4 — L'ACTION",
visual:"PLAN D'ENSEMBLE : montrer Mike et Zoe en train de tester leur solution.",
action:"Les amis unissent leurs compétences. Leur première tentative ne fonctionne pas complètement, mais ils adaptent leur plan.",
mike:"Ça n'a pas marché comme prévu ! On réessaie autrement ?",
zoe:"Oui. Si nous coopérons et réfléchissons, nous pouvons trouver une solution.",
sound:"Bruits d'action, musique rythmée, effet sonore au moment décisif."
},
{
name:"SCÈNE 5 — LA CONCLUSION",
visual:"PLAN LARGE puis PLAN RAPPROCHÉ : montrer le résultat de l'aventure et les réactions des personnages.",
action:"Le problème est résolu, ou un dernier indice annonce une prochaine aventure. Mike et Zoe partagent ce qu'ils ont appris.",
mike:"Quelle aventure ! Je crois que nous venons de découvrir quelque chose d'important.",
zoe:"Et ce n'est que le début. La prochaine fois, nous serons encore mieux préparés !",
sound:"Musique de conclusion, ambiance qui s'apaise, petit son final mystérieux."
}
];

let script = "SYNORA ANIMATION — SCÉNARIO\\n";
script += "SÉRIE : MIKE & ZOE\\n";
script += "TITRE : " + title + "\\n";
script += "STYLE : " + style + "\\n";
script += "DURÉE CIBLE : " + duration + " secondes\\n";
script += "IDÉE ORIGINALE : " + idea + "\\n";
script += "\\n========================================\\n";

scenes.forEach(function(scene,index){
script += "\\n" + scene.name + "\\n";
script += "DURÉE ESTIMÉE : " + sceneSeconds + " secondes\\n";
script += "VISUEL / CADRAGE : " + scene.visual + "\\n";
script += "ACTION : " + scene.action + "\\n";
script += "MIKE : " + scene.mike + "\\n";
script += "ZOE : " + scene.zoe + "\\n";
script += "SON : " + scene.sound + "\\n";
script += "----------------------------------------\\n";
});

script += "\\nFIN DU SCÉNARIO\\n";
script += "NOTE DE PRODUCTION : ce document est une base à adapter à l'idée originale. Les scènes et dialogues utilisent des modèles programmés. Ce n'est pas encore une génération par intelligence artificielle.";

currentScript = script;
result.textContent = script;
}

function downloadScript(){
if(!currentScript){
document.getElementById("result").textContent="Créez d'abord un scénario.";
return;
}
const blob = new Blob([currentScript],{type:"text/plain;charset=utf-8"});
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "SYNORA-Mike-Zoe-scenario.txt";
link.click();
setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
</script>
</body>
</html>`);
});

app.listen(PORT,"0.0.0.0",()=>{
console.log("SYNORA Animation fonctionne sur le port "+PORT);
});
