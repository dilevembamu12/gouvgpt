// public/js/country-detail.js

document.addEventListener('DOMContentLoaded', () => {
    alert(111111111);
    // --- Logique de la Modale de Sélection de Canal ---

    const modal = document.getElementById('channel-modal');
    
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalChatbotName = document.getElementById('modal-chatbot-name');
    const openModalBtns = document.querySelectorAll('.open-channel-modal');

    // Vérification simple pour s'assurer que tous les éléments sont présents
    if (!modal || !modalOverlay || !closeModalBtn || !modalChatbotName) {
        console.error("Éléments de la modale non trouvés. Vérifiez les IDs dans views/country-detail.ejs.");
        return;
    }

    // Fonction pour ouvrir la modale
    const openModal = (chatbotName) => {
        // Met à jour le nom du chatbot dans le titre de la modale
        if (modalChatbotName) {
            modalChatbotName.innerText = chatbotName || 'ce service'; // Un nom par défaut
        }
        // Affiche la modale en retirant la classe qui la cache
        if (modal) {
            modal.classList.remove('modal-hidden');
        }
    };

    // Fonction pour fermer la modale
    const closeModal = () => {
        if (modal) {
            modal.classList.add('modal-hidden');
        }
    };

    // Ajoute un écouteur d'événement à *chaque* bouton "Lancer le Chatbot"
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Récupère le nom du chatbot depuis l'attribut 'data-chatbot-name'
            const chatbotName = btn.getAttribute('data-chatbot-name');
            openModal(chatbotName);
        });
    });

    // Ajoute les écouteurs pour fermer la modale
    // Si on clique sur le bouton X ou en dehors de la modale (sur l'overlay)
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

});

