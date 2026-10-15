
(function () {
    const URL_LOGIN = '../html/login.html';

    async function verificarSessao() {
        try {
            const resposta = await fetch('/api/auth/sessao', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store'
            });

            if (!resposta.ok) {
                window.location.replace(URL_LOGIN);
                return;
            }

            const dados = await resposta.json();

            if (!dados.autenticado) {
                window.location.replace(URL_LOGIN);
                return;
            }

            // Sessão válida no servidor
            console.log('Usuário autenticado:', dados.usuario.login);
            console.log('Perfil:', dados.usuario.perfil);

        } catch (erro) {
            console.error('Erro ao verificar sessão:', erro);
            window.location.replace(URL_LOGIN);
        }
    }

    // Verifica a sessão ao abrir a página
    verificarSessao();

    // Verifica novamente ao retornar pelo botão "Voltar"
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            verificarSessao();
        }
    });
})();
