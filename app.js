const express = require('express');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises; // File System pour lire les fichiers JSON
const { constants } = require('fs'); // Pour les vérifications de fichiers

const app = express();
const PORT = process.env.PORT || 3000;
const EMAILS_FILE = path.join(__dirname, 'emails.json');

// --- 1. Configuration d'Express ---

// NOUVEAU : Middleware pour parser le JSON des requêtes (essentiel !)
app.use(express.json()); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir les fichiers statiques (CSS, JS client, images)
// Tout ce qui est dans le dossier /public sera accessible depuis la racine /
// ex: /public/css/style.css devient http://localhost:3000/css/style.css
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. Chargement des Traductions ---
// Charge les fichiers JSON de traduction au démarrage
let translations = {};
(async () => {
    try {
        translations = {
            fr: JSON.parse(await fs.readFile(path.join(__dirname, 'locales/fr.json'), 'utf-8')),
            en: JSON.parse(await fs.readFile(path.join(__dirname, 'locales/en.json'), 'utf-8'))
        };
    } catch (error) {
        console.error("Erreur lors du chargement des fichiers de traduction.", error);
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



// --- 3. Route Principale ---
app.get('/', (req, res) => {
    // Détecte la langue depuis le query param (ex: /?lang=en)
    const lang = req.query.lang || 'fr'; // 'fr' par défaut
    const t = getTranslations(lang);

    // Prépare les données pour le template EJS
    const data = {
        t, // L'objet de traduction pour la langue actuelle (pour le rendu côté serveur)
        currentLang: lang, // Pour savoir quel bouton 'activer'
        translations: JSON.stringify(translations) // L'objet complet pour l'injection côté client
    };

    // Rend la vue /views/index.ejs avec les données
    res.render('index', data);
});



// --- 4. NOUVELLE Route (POST) pour l'inscription ---
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    const lang = req.query.lang || 'fr';
    const t = getTranslations(lang);

    // Validation simple côté serveur
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        // Renvoie la clé de traduction pour que le client l'affiche
        return res.status(400).json({ messageKey: 'emailInvalid' });
    }

    try {
        let emails = await getEmailList();

        // Vérifie si l'email existe déjà
        if (emails.includes(email)) {
            return res.status(409).json({ messageKey: 'emailExists' });
        }

        // Ajoute le nouvel email
        emails.push(email);

        // Réécrit le fichier JSON
        await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2), 'utf-8');
        
        // Envoie une réponse de succès
        return res.status(201).json({ messageKey: 'emailSuccess' });

    } catch (error) {
        console.error("Erreur serveur lors de l'inscription:", error);
        return res.status(500).json({ messageKey: 'emailError' });
    }
});



// --- 4. Démarrage du Serveur ---
app.listen(PORT, () => {
    console.log(`Serveur GouvGPT "Coming Soon" démarré sur http://localhost:${PORT}`);
    console.log("Testez les langues : http://localhost:3000/?lang=fr et http://localhost:3000/?lang=en");
});

