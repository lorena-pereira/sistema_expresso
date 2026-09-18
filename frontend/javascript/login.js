// garante que o script rode após o HTML carregar
document.addEventListener('DOMContentLoaded', () => {

    // buscando os elementos HTML
    const loginForm = document.getElementById('login-form');
    const userInput = document.getElementById('user');
    const passwordInput = document.getElementById('password');
    const togglePasswordIcon = document.querySelector('.icon-right');

    // lógica do ocultamento de senha
    if (togglePasswordIcon && passwordInput) {
        togglePasswordIcon.addEventListener('click', () => {
            const currentType = passwordInput.getAttribute('type');

            if (currentType === 'password') {
                passwordInput.setAttribute('type', 'text');
            } else {
                passwordInput.setAttribute('type', 'password');
                togglePasswordIcon.style.opacity = '0.5';
            }
        });
    }

    // envio do formulário e integração com o API
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = userInput.value.trim();
        const senha = passwordInput.value;

        if (!usuario || !senha) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        try {
            // envia a requisição para a API Node.js na porta 3000
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usuario, senha })
            });

            // converte os dados recebidos 
            const data = await response.json();

            // verifica se a resposta teve sucesso
            if (response.ok && data.success) {
                localStorage.setItem('usuarioLogado', usuario);
                localStorage.setItem('perfilUsuario', data.profile);

                // redireciona para a página inicial
                window.location.href = './index.html';
            } else {
                alert(data.message || 'Erro ao realizar login.');

                passwordInput.value = '';
                passwordInput.focus();
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Não foi possível conectar ao servidor. Verifique se o Back-end está rodando.');
        }
    });
});