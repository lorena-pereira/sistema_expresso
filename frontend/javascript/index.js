document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const cards = document.querySelectorAll('.module-card');

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase().trim();

            cards.forEach(card => {
                const tittle = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();

                // Verifica se o título ou a descrição contêm o texto digitado
                const atendeFiltro = tittle.includes(searchTerm) || description.includes(searchTerm);

                // Exibe ou oculta o card com base no resultado
                card.style.display = atendeFiltro ? 'flex' : 'none';
            });
        });
    }
});