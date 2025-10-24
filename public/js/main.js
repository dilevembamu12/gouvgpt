// --- Gestion de la traduction ---

// 1. Les objets 'translations' et 'currentLang' sont maintenant injectés par /views/index.ejs
//    et sont disponibles globalement dans ce script.

// 2. Fonction pour changer la langue (recharge la page avec un query param)
function setLanguage(lang) {
    window.location.search = `?lang=${lang}`;
}

// 3. Définir le bouton actif au chargement
(function() {
    // 'currentLang' est défini dans /views/index.ejs
    const btnFr = document.getElementById('btn-fr');
    const btnEn = document.getElementById('btn-en');
    
    if (currentLang === 'fr') {
        btnFr.classList.add('active');
        btnEn.classList.remove('active');
        btnFr.classList.remove('border-gray-600', 'text-gray-400', 'hover:bg-gray-600');
        btnFr.classList.add('border-blue-600', 'text-blue-300', 'hover:bg-blue-600');
        btnEn.classList.add('border-gray-600', 'text-gray-400', 'hover:bg-gray-600');
        btnEn.classList.remove('border-blue-600', 'text-blue-300', 'hover:bg-blue-600');
    } else {
        btnEn.classList.add('active');
        btnFr.classList.remove('active');
        btnEn.classList.remove('border-gray-600', 'text-gray-400', 'hover:bg-gray-600');
        btnEn.classList.add('border-blue-600', 'text-blue-300', 'hover:bg-blue-600');
        btnFr.classList.add('border-gray-600', 'text-gray-400', 'hover:bg-gray-600');
        btnFr.classList.remove('border-blue-600', 'text-blue-300', 'hover:bg-blue-600');
    }
})();

// --- Logique du compte à rebours ---
const launchDate = new Date("2025-12-31T00:00:00").getTime();
function updateCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
    const hoursEl = document.getElementById('hours');
    if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
    const minutesEl = document.getElementById('minutes');
    if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
    const secondsEl = document.getElementById('seconds');
    if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');

    if (distance < 0) {
        clearInterval(countdownInterval);
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.innerHTML = `<span class="text-3xl md:text-4xl font-bold text-white col-span-2 md:col-span-4">Lancement !</span>`;
        }
        const headlineEl = document.getElementById('headline');
        if (headlineEl) {
            const lang = document.documentElement.lang || 'fr';
            // Utilise l'objet 'translations' chargé
            headlineEl.innerText = translations[lang].headline_launched || "Lancement !";
        }
    }
}
const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();


// --- Logique de l'API Gemini ---

// Sélection des éléments du DOM
const geminiButton = document.getElementById('gemini-button');
const geminiButtonText = document.getElementById('gemini-button-text');
const geminiSpinner = document.getElementById('gemini-spinner');
const previewButton = document.getElementById('preview-button');
const previewButtonText = document.getElementById('preview-button-text');
const previewSpinner = document.getElementById('preview-spinner');
const geminiModal = document.getElementById('gemini-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitleEl = document.getElementById('modal-title');
const geminiResponseEl = document.getElementById('gemini-response');
const geminiSourcesEl = document.getElementById('gemini-sources');
const geminiSourcesContainer = document.getElementById('gemini-sources-container');

// Fonctions pour ouvrir/fermer le modal
function openModal() {
    geminiModal.classList.remove('hidden');
}
function closeModal() {
    geminiModal.classList.add('hidden');
}

// Ajout des écouteurs d'événements
geminiButton.addEventListener('click', fetchGeminiInfo);
previewButton.addEventListener('click', fetchPreviewNotification);
modalOverlay.addEventListener('click', closeModal);
closeModalBtn.addEventListener('click', closeModal);

// Fonction 1: "Pourquoi est-ce important ?"
async function fetchGeminiInfo() {
    const lang = document.documentElement.lang || 'fr';
    const t = translations[lang].gemini;
    const langName = lang === 'fr' ? 'Français' : 'English';

    geminiButtonText.innerText = t.loadingText;
    geminiSpinner.classList.remove('hidden');
    geminiButton.disabled = true;
    modalTitleEl.innerText = t.modalTitle;
    geminiResponseEl.innerHTML = `<div class="flex justify-center items-center"><div class="spinner"></div></div>`;
    geminiSourcesEl.innerHTML = '';
    geminiSourcesContainer.classList.add('hidden');
    openModal();

    const systemPrompt = "Vous êtes un analyste expert en transformation numérique et en IA dans le secteur public. Votre rôle est de trouver et de résumer des informations pertinentes sur l'utilisation de l'IA par les gouvernements pour informer les citoyens.";
    const userQuery = `Trouvez 1 ou 2 articles de presse ou rapports récents (de l'année dernière) sur les avantages, les défis ou les cas d'utilisation de l'IA (en particulier l'IA générative) pour les services gouvernementaux et l'administration publique. Fournissez un résumé concis et neutre (en ${langName}) des points clés.`;
    const apiKey = ""; // La clé est gérée par l'environnement Canvas
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const result = await response.json();
        const candidate = result.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
            geminiResponseEl.innerText = text;
        } else {
            throw new Error("No text content returned.");
        }
        const groundingMetadata = candidate?.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingAttributions) {
            const sources = groundingMetadata.groundingAttributions
                .map(attribution => ({
                    uri: attribution.web?.uri,
                    title: attribution.web?.title,
                }))
                .filter(source => source.uri && source.title);
            if (sources.length > 0) {
                geminiSourcesEl.innerHTML = sources.map(source => 
                    `<li class="truncate"><a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="hover:underline">${source.title}</a></li>`
                ).join('');
                geminiSourcesContainer.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Gemini API call failed (Info):", error);
        geminiResponseEl.innerText = t.errorText;
    } finally {
        geminiButtonText.innerText = t.buttonText;
        geminiSpinner.classList.add('hidden');
        geminiButton.disabled = false;
    }
}

// Fonction 2: "Prévisualiser la notification"
async function fetchPreviewNotification() {
    const lang = document.documentElement.lang || 'fr';
    const t = translations[lang].gemini;
    const langName = lang === 'fr' ? 'Français' : 'English';
    const email = document.getElementById('email-placeholder').value || 'non fourni';

    previewButtonText.innerText = t.previewLoading;
    previewSpinner.classList.remove('hidden');
    previewButton.disabled = true;
    modalTitleEl.innerText = t.previewTitle;
    geminiResponseEl.innerHTML = `<div class="flex justify-center items-center"><div class="spinner"></div></div>`;
    geminiSourcesEl.innerHTML = '';
    geminiSourcesContainer.classList.add('hidden');
    openModal();

    const systemPrompt = "Vous êtes un rédacteur marketing pour GouvGPT.com. Rédigez un e-mail de notification de lancement enthousiaste, professionnel et concis. L'e-mail doit expliquer que GouvGPT.com est lancé et inviter l'utilisateur à visiter le portail. Adressez-vous à l'utilisateur de manière amicale. Le corps de l'email doit être en 'white-space: pre-wrap' (respecter les sauts de ligne).";
    const userQuery = `Rédigez l'e-mail en ${langName}. Si l'email '${email}' est fourni et n'est pas 'non fourni', utilisez-le pour personnaliser légèrement le message (par exemple, "Merci de votre intérêt, ${email}"). Sinon, utilisez un message d'accueil générique.`;
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const result = await response.json();
        const candidate = result.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
            geminiResponseEl.innerText = text;
        } else {
            throw new Error("No text content returned.");
        }
    } catch (error) {
        console.error("Gemini API call failed (Preview):", error);
        geminiResponseEl.innerText = t.errorText;
    } finally {
        previewButtonText.innerText = t.previewButton;
        previewSpinner.classList.add('hidden');
        previewButton.disabled = false;
    }
}




// --- NOUVEAU: Logique du formulaire de notification ---

// Sélection des éléments du DOM pour le formulaire
const notifyForm = document.getElementById('notify-form');
const emailInput = document.getElementById('email-placeholder');
const notifyButton = document.getElementById('notify-button');
const notifyButtonText = document.getElementById('notify-button-text');
const notifySpinner = document.getElementById('notify-spinner');
const notifyMessage = document.getElementById('notify-message');

// Regex simple pour la validation de l'email
function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

// Affiche un message de statut (succès, erreur, avertissement)
function showNotifyMessage(message, type = 'success') {
    notifyMessage.innerText = message;
    
    // Change la couleur en fonction du type
    if (type === 'success') {
        notifyMessage.classList.add('text-green-400');
        notifyMessage.classList.remove('text-red-400', 'text-yellow-400');
    } else if (type === 'error') {
        notifyMessage.classList.add('text-red-400');
        notifyMessage.classList.remove('text-green-400', 'text-yellow-400');
    } else { // 'warning' ou autre
        notifyMessage.classList.add('text-yellow-400');
        notifyMessage.classList.remove('text-green-400', 'text-red-400');
    }

    // Efface le message après 5 secondes
    setTimeout(() => {
        notifyMessage.innerText = '';
    }, 5000);
}

// Fonction principale pour soumettre l'email
async function subscribeEmail(event) {
    event.preventDefault(); // Empêche le rechargement de la page
    
    const lang = document.documentElement.lang || 'fr';
    const t = translations[lang].gemini; // Récupère les textes de traduction
    const email = emailInput.value;

    // 1. Validation côté client
    if (!validateEmail(email)) {
        showNotifyMessage(t.emailInvalid, 'error');
        return;
    }

    // 2. Définir l'état de chargement
    notifyButton.disabled = true;
    notifyButtonText.classList.add('hidden');
    notifySpinner.classList.remove('hidden');
    notifyMessage.innerText = ''; // Efface les anciens messages

    try {
        // 3. Envoyer la requête au serveur
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
        });

        const result = await response.json();

        // 4. Gérer la réponse du serveur
        if (response.status === 201) { // 201 Created
            showNotifyMessage(t.emailSuccess, 'success');
            emailInput.value = ''; // Efface le champ email
        } else if (response.status === 409) { // 409 Conflict
            showNotifyMessage(t.emailExists, 'warning');
        } else if (response.status === 400) { // 400 Bad Request
            showNotifyMessage(t.emailInvalid, 'error');
        } else { // Autre erreur
            throw new Error(result.message || 'server_error');
        }

    } catch (error) {
        console.error("Erreur d'inscription:", error);
        showNotifyMessage(t.emailError, 'error');
    } finally {
        // 5. Réinitialiser l'état du bouton
        notifyButton.disabled = false;
        notifyButtonText.classList.remove('hidden');
        notifySpinner.classList.add('hidden');
    }
}

// Ajoute l'écouteur d'événement au formulaire
notifyForm.addEventListener('submit', subscribeEmail);



