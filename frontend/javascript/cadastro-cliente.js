document.addEventListener('DOMContentLoaded', () => {
    // Função para exibir o Toast Notification
    function mostrarToast(mensagem, tipo = 'sucesso') {
        const toastAntigo = document.querySelector('.toast-notification');
        if (toastAntigo) toastAntigo.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification ${tipo}`;
        
        // Ícone e texto
        toast.innerHTML = `
            <i data-lucide="${tipo === 'sucesso' ? 'check-circle' : 'alert-circle'}" style="width: 20px; height: 20px;"></i>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        // Faz o toast aparecer deslizando
        setTimeout(() => {
            toast.style.right = '20px';
        }, 100);

        // Remove o toast após 3 segundos
        setTimeout(() => {
            toast.style.right = '-400px';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // lógica para alternar entre Pessoa Física e Jurídica
    const form = document.getElementById('formCadastroCliente');
    const clienteId = new URLSearchParams(window.location.search).get('id');
    const emEdicao = Boolean(clienteId);

    if (emEdicao) {
        const titulo = document.querySelector('.form-card h1');
        const botao = form ? form.querySelector('button[type="submit"]') : null;
        if (titulo) titulo.textContent = 'Editar Cliente';
        if (botao) botao.textContent = 'SALVAR ALTERAÇÕES';
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            // cria um objeto com todos os dados preenchidos nos inputs
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const tipoPessoaInput = document.querySelector('input[name="tipoPessoa"]');
            if (tipoPessoaInput) data.tipo = tipoPessoaInput.value;

            try {
                // envia os dados para o servidor Node.js
                const response = await fetch(emEdicao
                    ? `http://localhost:3000/clientes/${encodeURIComponent(clienteId)}`
                    : 'http://localhost:3000/cadastrar-cliente', {
                    method: emEdicao ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                // se o servidor responder que deu tudo certo
                const result = await response.json();

                if (result.success) {
                    const mensagemSucesso = emEdicao ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!';
                    mostrarToast(mensagemSucesso, 'sucesso');
                    
                    // Aguarda 1.5 segundos para o utilizador ver o toast antes de redirecionar
                    setTimeout(() => {
                        window.location.assign('./clientes.html');
                    }, 1500);
                } else {
                    const mensagemErro = (emEdicao ? 'Erro ao atualizar: ' : 'Erro ao cadastrar: ') + result.message;
                    mostrarToast(mensagemErro, 'erro');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                mostrarToast('Erro de conexão com o servidor.', 'erro');
            }
        });
    }

    async function carregarClienteParaEdicao() {
        if (!emEdicao || !form) return;

        try {
            const response = await fetch('../../backend/data/clientes.json');
            if (!response.ok) throw new Error('Erro ao buscar cliente');

            const clientes = await response.json();
            const cliente = clientes.find(item => String(item.id) === clienteId);

            if (!cliente) {
                mostrarToast('Cliente não encontrado.', 'erro');
                setTimeout(() => {
                    window.location.href = './clientes.html';
                }, 1500);
                return;
            }

            Object.entries(cliente).forEach(([campo, valor]) => {
                const input = form.elements.namedItem(campo);
                if (input && typeof input.value !== 'undefined') input.value = valor ?? '';
            });
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
            mostrarToast('Não foi possível carregar os dados do cliente.', 'erro');
        }
    }

    carregarClienteParaEdicao();

    // funções de formatação usando Regex
    const mascaraCPF = (v) => {
        v = v.replace(/\D/g, ""); 
        if (v.length > 11) v = v.slice(0, 11); 
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    };

    const mascaraCNPJ = (v) => {
        v = v.replace(/\D/g, ""); 
        if (v.length > 14) v = v.slice(0, 14); 
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
        return v;
    };

    const mascaraTelefone = (v) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11); 
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v;
    };

    const mascaraCEP = (v) => {
        v = v.replace(/\D/g, "");
        if (v.length > 8) v = v.slice(0, 8);
        v = v.replace(/(\d{5})(\d)/, "$1-$2");
        return v;
    };

    // capturar os campos no ecrã e aplicar a escuta 
    const inputCpf = document.querySelector('input[name="cpf"]');
    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => e.target.value = mascaraCPF(e.target.value));
    }

    const inputCnpj = document.querySelector('input[name="cnpj"]');
    if (inputCnpj) {
        inputCnpj.addEventListener('input', (e) => e.target.value = mascaraCNPJ(e.target.value));
    }

    const inputsTelefone = document.querySelectorAll('input[name="telefone"]');
    inputsTelefone.forEach(input => {
        input.addEventListener('input', (e) => e.target.value = mascaraTelefone(e.target.value));
    });

    const inputCep = document.querySelector('input[name="cep"]');
    if (inputCep) {
        inputCep.addEventListener('input', (e) => e.target.value = mascaraCEP(e.target.value));
    }

    const inputCepAuto = document.querySelector('input[name="cep"]');
    const inputRua = document.querySelector('input[name="rua"]');
    const inputBairro = document.querySelector('input[name="bairro"]');
    const inputCidade = document.querySelector('input[name="cidade"]');
    const selectEstado = document.querySelector('select[name="estado"]');

    if (inputCepAuto) {
        inputCepAuto.addEventListener('blur', async (event) => {
            const cepLimpo = event.target.value.replace(/\D/g, '');

            if (cepLimpo.length === 8) {
                try {
                    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const dados = await resposta.json();

                    if (!dados.erro) {
                        if (inputRua) inputRua.value = dados.logradouro;
                        if (inputBairro) inputBairro.value = dados.bairro;
                        if (inputCidade) inputCidade.value = dados.localidade;
                        if (selectEstado) selectEstado.value = dados.uf; 
                    } else {
                        mostrarToast('O CEP inserido não foi encontrado.', 'erro');
                    }
                } catch (erro) {
                    console.error('Erro ao consultar o ViaCEP:', erro);
                }
            }
        });
    }
});