document.addEventListener('DOMContentLoaded', () => {
    // lógica para alternar entre Pessoa Física e Jurídica
    const form = document.getElementById('formCadastroCliente');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            // cria um objeto com todos os dados preenchidos nos inputs
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // pega o valor do input hidden (PF ou PJ) da página atual
            const tipoPessoaInput = document.querySelector('input[name="tipoPessoa"]');
            if (tipoPessoaInput) {
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
                    window.location.href = 'clientes.html';
                } else {
                    alert('Erro ao cadastrar: ' + result.message);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

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

    // como o Telefone aparece nas duas páginas (PF e PJ), aplicamos a todos os que encontrar
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
                        
                        // seleciona o estado diretamente através da sigla devolvida pela API
                        if (selectEstado) selectEstado.value = dados.uf; 
                    } else {
                        alert('O CEP inserido não foi encontrado.');
                    }
                } catch (erro) {
                    console.error('Erro ao consultar o ViaCEP:', erro);
                }
            }
        });
    }
});