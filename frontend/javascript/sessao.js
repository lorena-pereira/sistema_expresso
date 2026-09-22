document.addEventListener('DOMContentLoaded', () => {
    // Recupera o objeto armazenado
    const sessaoString = localStorage.getItem('usuarioLogado');

    if (sessaoString) {
        try {
            // Converte o texto de volta para objeto
            const utilizador = JSON.parse(sessaoString);

            const usuario = utilizador.nome;
            const perfil = utilizador.perfil;

            const nomeFormatado = usuario.charAt(0).toUpperCase() + usuario.slice(1).toLowerCase();
            const perfilFormatado = perfil.charAt(0).toUpperCase() + perfil.slice(1).toLowerCase();
            
            const elNome = document.querySelector('.user-name');
            const elPerfil = document.querySelector('.user-role');
        
            
            // Atualiza a navbar com as propriedades do objeto
            if (elNome) elNome.textContent = nomeFormatado;
            if (elPerfil) elPerfil.textContent = perfilFormatado;
        } catch (e) {
            console.error("Erro ao ler dados da sessão", e);
        }
    }
});