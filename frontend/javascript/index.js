document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.module-card');

    // Escuta qualquer evento de digitação na página (Delegação de Eventos)
    document.addEventListener('input', (event) => {
        
        // Verifica se a digitação aconteceu especificamente no campo de busca da navbar
        if (event.target && event.target.id === 'search-input') {
            const searchTerm = event.target.value.toLowerCase().trim();

            cards.forEach(card => {
                const tittle = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();

                // Verifica se o título ou a descrição contêm o texto digitado
                const atendeFiltro = tittle.includes(searchTerm) || description.includes(searchTerm);

                // Exibe ou oculta o card com base no resultado
                card.style.display = atendeFiltro ? 'flex' : 'none';
            });
        }
    });
});