// public/js/home.js
// Script pour les interactions de la page d'accueil (Mode DEV)

document.addEventListener('DOMContentLoaded', () => {

    console.log("home.js chargé.");

    // --- 1. NOUVEAU: Interaction Parallax du Header ---
    const header = document.getElementById('main-header');
    if (header) {
        // Définit la distance sur laquelle le fade s'effectue (en pixels)
        const fadeDistance = 100; // Fade complet après 100px de scroll

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            // Calcule l'opacité. 
            // 0.0 = tout en haut. 1.0 = à 100px (ou plus).
            let opacity = scrollY / fadeDistance;
            if (opacity > 1) {
                opacity = 1;
            }
            if (opacity < 0) {
                opacity = 0;
            }

            // Applique le fond blanc "de plus en plus"
            header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            
            // Applique l'ombre ("solid bottom") "de plus en plus"
            // L'opacité de l'ombre (le '0.05') est aussi basée sur le scroll
            header.style.boxShadow = `0 2px 4px rgba(0, 0, 0, ${opacity * 0.05})`; 
        });
    }

    // --- 2. Interaction du Focus sur la barre de recherche ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('query');
    if (searchForm && searchInput) {
        searchInput.addEventListener('focus', () => {
            searchForm.classList.add('search-focused');
        });
        searchInput.addEventListener('blur', () => {
            searchForm.classList.remove('search-focused');
        });
    }

    // --- 3. Interaction des boutons de filtre ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Empêche le lien de naviguer (car ce sont des <a>)
            e.preventDefault(); 
            
            // Ajoute ou supprime la classe 'filter-active'
            btn.classList.toggle('filter-active');
            
            // Note : Pour l'instant, ils sont indépendants.
            // Plus tard, nous pourrons les lier à une vraie logique de filtrage.
        });
    });

});

