document.addEventListener('DOMContentLoaded', () => {
    // lógica para alternar entre Pessoa Física e Jurídica
    const form = document.getElementById('formCadastroCliente');
    
    if(form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            // cria um objeto com todos os dados preenchidos nos inputs
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // pega o valor do input hidden (PF ou PJ) da página atual
            const tipoPessoaInput = document.querySelector('input[name="tipoPessoa"]');
            if(tipoPessoaInput) {
                data.tipo = tipoPessoaInput.value;
            }

            try {
                // envia os dados para o servidor Node.js
                const response = await fetch('http://localhost:3000/cadastrar-cliente', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                // se o servidor responder que deu tudo certo
                const result = await response.json();

                if (result.success) {
                    alert('Cliente cadastrado com sucesso!');
                    window.location.href = 'listagem-clientes.html'; 
                } else {
                    alert('Erro ao cadastrar: ' + result.message);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }
});