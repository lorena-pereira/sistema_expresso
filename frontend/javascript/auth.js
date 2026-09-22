(function () {
    // Verifica se existe o registro de login no localStorage
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (!usuarioLogado) {
        // Se não estiver logado, manda para a tela de login
        window.location.replace('../html/login.html');
    }

    // Impede a exibição da página via cache do botão "Voltar" do navegador
    window.addEventListener('pageshow', (event) => {
        if (event.persisted && !localStorage.getItem('usuarioLogado')) {
            window.location.replace('../html/login.html');
        }
    });
})();