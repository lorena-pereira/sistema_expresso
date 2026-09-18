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

    /* alterar o nome do perfil conforme o login */
    const usuario = localStorage.getItem('usuarioLogado');
    const perfil = localStorage.getItem('perfilUsuario');

    // se não existir usuário logado, expulsa de volta para o login
    if (!usuario) {
        window.location.href = './login.html';
        return;
    }

    // formata a primeira letra para maiúscula
    const nomeFormatado = usuario.charAt(0).toUpperCase() + usuario.slice(1).toLowerCase();
    const perfilFormatado = perfil.charAt(0).toUpperCase() + perfil.slice(1).toLowerCase();

    // busca os elementos no HTML para atualizar os textos
    const spanNome = document.querySelector('.user-name');
    const spanPerfil = document.querySelector('.user-role');

    if (spanNome) spanNome.textContent = nomeFormatado;
    if (spanPerfil) spanPerfil.textContent = perfilFormatado;
});