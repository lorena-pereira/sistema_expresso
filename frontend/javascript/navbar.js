document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('navbar-container');
    if (!container) return; // Se não houver container nesta página, não faz nada

    try {
        // 1. Busca o código HTML da navbar e injeta na página
        const response = await fetch('navbar.html');
        const html = await response.text();
        container.innerHTML = html;

        // 2. Renderiza os ícones do Lucide dentro da nova navbar
        if (window.lucide) lucide.createIcons();

        // 3. Esconder a barra de pesquisa da navbar se não estiver na página inicial
        const urlAtual = window.location.pathname.split('/').pop();
        const navbarSearch = document.querySelector('.navbar-search');

        if (urlAtual !== 'index.html' && urlAtual !== '') {
            if (navbarSearch) {
                navbarSearch.style.display = 'none';
            }
        }

        // 4. Lógica para destacar a página atual no menu
        const links = document.querySelectorAll('.navbar-center a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            // Se o link for igual à URL atual, adiciona a classe active
            if (href === urlAtual || (href === 'clientes.html' && urlAtual.includes('cadastro-cliente'))) {
                link.classList.add('active');
            }
        });

        // 5. Lógica do Dropdown e Logout (Antigo index.js)
        const userToggle = document.getElementById('user-dropdown-toggle');
        const userDropdown = document.getElementById('user-dropdown');
        const btnLogout = document.getElementById('btn-logout');

        if (userToggle && userDropdown) {
            userToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                userDropdown.classList.toggle('active');
            });
            document.addEventListener('click', (event) => {
                if (!userToggle.contains(event.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                localStorage.removeItem('usuarioLogado');
                window.location.href = '../html/login.html';
            });
        }

        // 6. Preenche os dados da Sessão (Antigo sessao.js)
        const sessaoString = localStorage.getItem('usuarioLogado');
        if (sessaoString) {
            const utilizador = JSON.parse(sessaoString);
            const nomeFormatado = utilizador.nome.charAt(0).toUpperCase() + utilizador.nome.slice(1).toLowerCase();
            const perfilFormatado = utilizador.perfil.charAt(0).toUpperCase() + utilizador.perfil.slice(1).toLowerCase();
            
            document.querySelector('.user-name').textContent = nomeFormatado;
            document.querySelector('.user-role').textContent = perfilFormatado;
        }

    } catch (erro) {
        console.error('Erro ao carregar a navbar:', erro);
    }
});