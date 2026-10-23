const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SYNORA Animation</title>
      <style>
        body {
          margin: 0;
          padding: 40px 20px;
          background: #101018;
          color: white;
          font-family: Arial, sans-serif;
          text-align: center;
        }

        h1 {
          color: #d8b46a;
          font-size: 36px;
        }

        .card {
          max-width: 600px;
          margin: 30px auto;
          padding: 25px;
          border: 1px solid #d8b46a;
          border-radius: 16px;
          background: #1c1c29;
        }

        button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: #d8b46a;
          color: #101018;
          font-weight: bold;
          cursor: pointer;
        }
      </style>
    </head>

    <body>
      <h1>SYNORA Animation</h1>

      <div class="card">
        <h2>Bienvenue dans notre studio IA</h2>
        <p>
          Nous préparons un système intelligent de création
          d'histoires et de vidéos animées.
        </p>

        <h3>Notre première série : Mike & Zoe</h3>

        <p id="status">Statut : prototype en développement</p>

        <button onclick="document.getElementById('status').textContent =
          'Mike & Zoe : projet en préparation !'">
          Découvrir le projet
        </button>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SYNORA Animation fonctionne sur le port ${PORT}`);
});
