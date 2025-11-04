require('dotenv').config(); // Charge les variables d'environnement de .env
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises; // File System (version asynchrone)
const { constants } = require('fs'); // Pour les vérifications de fichiers

const app = express();
const PORT = process.env.PORT || 3000;
const EMAILS_FILE = path.join(__dirname, 'emails.json');
const APP_DOMAIN = process.env.APP_DOMAIN || 'localhost';

// --- 1. Configuration d'Express ---

// Middleware pour parser le JSON des requêtes (essentiel !)
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir les fichiers statiques (CSS, JS client, images)
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. Chargement des Traductions ---
let translations = {};
(async () => {
    try {
        translations = {
            fr: JSON.parse(await fs.readFile(path.join(__dirname, 'locales/fr.json'), 'utf-8')),
            en: JSON.parse(await fs.readFile(path.join(__dirname, 'locales/en.json'), 'utf-8'))
        };
        console.log("Fichiers de traduction chargés avec succès.");
    } catch (error) {
        console.error("Erreur critique : Fichiers de traduction introuvables.", error);
        process.exit(1);
    }
})();

// Fonction pour obtenir la traduction, avec 'fr' par défaut
function getTranslations(lang) {
    return translations[lang] || translations['fr'];
}

// Fonction utilitaire pour lire les emails
async function getEmailList() {
    try {
        await fs.access(EMAILS_FILE, constants.R_OK | constants.W_OK);
        const data = await fs.readFile(EMAILS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(EMAILS_FILE, '[]', 'utf-8'); // Crée le fichier s'il n'existe pas
            return [];
        }
        console.error("Erreur en lisant le fichier emails.json:", error);
        return [];
    }
}

// --- 3. Route Principale (AVEC AIGUILLAGE DEV/PUBLIC) ---
app.get('/', (req, res) => {
    const lang = req.query.lang || 'fr';
    const t = getTranslations(lang);
    
    const data = {
        t,
        currentLang: lang,
        translations: JSON.stringify(translations)
    };

    // AIGUILLAGE : 'true' (chaîne)
    if (req.query.dev === 'true') {
        // Mode DEV : Affiche la nouvelle page d'accueil
        res.render('home', data);
    } else {
        // Mode DEV
        res.render('home', data);
    }
});


// --- 4. NOUVELLE Route (GET) pour la page de détail d'un pays ---
// /country/fr, /country/ca, etc.
app.get('/country/:code', (req, res) => {
    const lang = req.query.lang || 'fr';
    const t = getTranslations(lang);
    const countryCode = req.params.code; // 'fr', 'ca', etc.

    // Vérifie si on est en mode DEV
    if (req.query.dev !== 'true') {
        // Redirige vers le "Coming Soon" si on n'est pas en dev
        res.redirect('/?dev=false');
        return;
    }

    // Prépare les données pour le template EJS
    const data = {
        t,
        currentLang: lang,
        translations: JSON.stringify(translations),
        // Passe le code pays au template (pour un usage futur)
        countryCode: countryCode, 
        // TODO: Dans la phase 2, nous utiliserons ce code pour
        // récupérer dynamiquement les données du pays.
        // Pour l'instant, 'country-detail.ejs' est statique.
    };

    // Rend la vue /views/country-detail.ejs avec les données
    res.render('country-detail', data);
});


// --- 5. NOUVELLE Route (POST) pour l'inscription ---
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ messageKey: 'emailInvalid' });
    }

    try {
        let emails = await getEmailList();
        if (emails.includes(email)) {
            return res.status(409).json({ messageKey: 'emailExists' });
        }
        emails.push(email);
        await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2), 'utf-8');
        return res.status(201).json({ messageKey: 'emailSuccess' });
    } catch (error) {
        console.error("Erreur serveur lors de l'inscription:", error);
        return res.status(500).json({ messageKey: 'emailError' });
    }
});

// --- 5. Routes API (Proxy pour Gemini) ---

// Fonction générique pour appeler l'API Gemini
async function callGemini(payload) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Erreur : GEMINI_API_KEY n'est pas définie sur le serveur.");
        throw new Error("Configuration serveur manquante.");
    }
    
    // Correction de l'URL de l'API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Erreur de l'API Gemini:", response.status, errorBody);
        throw new Error(`API Error: ${response.statusText}`);
    }
    return await response.json();
}

// Route API pour "Pourquoi est-ce important ?"
app.post('/api/gemini-info', async (req, res) => {
    const { langName, systemPrompt, userQuery } = req.body;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    
    try {
        const result = await callGemini(payload);
        res.json(result);
    } catch (error) {
        console.error("Erreur du proxy /api/gemini-info:", error);
        res.status(500).json({ error: error.message });
    }
});

// Route API pour "Prévisualiser la notification"
app.post('/api/gemini-preview', async (req, res) => {
    const { langName, email, systemPrompt, userQuery } = req.body;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const result = await callGemini(payload);
        res.json(result);
    } catch (error) {
        console.error("Erreur du proxy /api/gemini-preview:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- 6. Démarrage du Serveur ---
app.listen(PORT, () => {
    console.log(`Serveur GouvGPT (PID: ${process.pid}) démarré sur http://${APP_DOMAIN}:${PORT}`);
    console.log(`Variables d'environnement chargées :`);
    console.log(`- PORT: ${PORT}`);
    console.log(`- APP_DOMAIN: ${APP_DOMAIN}`);
    console.log(`- GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Chargée (***)' : 'NON DÉFINIE'}`);
    console.log("---");
    console.log(`Mode PUBLIC (Coming Soon): http://${APP_DOMAIN}:${PORT}`);
    console.log(`Mode DÉVELOPPEMENT (App): http://${APP_DOMAIN}:${PORT}/?dev=true`);
});


