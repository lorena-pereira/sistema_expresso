document.addEventListener('DOMContentLoaded', () => {
    /* filtro de busca */
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

document.addEventListener('DOMContentLoaded', () => {
    const userToggle = document.getElementById('user-dropdown-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const btnLogout = document.getElementById('btn-logout');

    // 1. Alterna a exibição do menu ao clicar na área do usuário
    if (userToggle && userDropdown) {
        userToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que o clique feche imediatamente
            userDropdown.classList.toggle('active');
        });

        // 2. Fecha o menu ao clicar fora dele na tela
        document.addEventListener('click', (event) => {
            if (!userToggle.contains(event.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    // 3. Ação de Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Limpa o usuário armazenado na sessão
            localStorage.removeItem('usuarioLogado');

            // Redireciona de volta para a tela de login
            window.location.href = '../html/login.html';
        });
    }
});