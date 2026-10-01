document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastroFuncionario');
    const botaoSalvar = document.getElementById('btn-salvar');
    const toast = document.getElementById('toast-sucess');
   
    // elementos de endereço
    const inputCep = document.querySelector('input[name="cep"]');
    const inputRua = document.querySelector('input[name="rua"]');
    const inputBairro = document.querySelector('input[name="bairro"]');
    const inputCidade = document.querySelector('input[name="cidade"]');
    const selectEstado = document.querySelector('select[name="estado"]');
    
    let toastTimeout;

    // identificação de edição
    const funcionarioId = new URLSearchParams(window.location.search).get('id');
    const emEdicao = Boolean(funcionarioId);

    if (emEdicao) {
        const titulo = document.querySelector('.form-card h1');
        const subtitulo = document.querySelector('.form-card .link-azul');
        if (titulo) titulo.textContent = 'Editar Funcionário';
        if (subtitulo) subtitulo.textContent = 'Formulário de edição de funcionário';
        if (botaoSalvar) botaoSalvar.textContent = 'SALVAR ALTERAÇÕES';
    }

    // funções de máscara e formatação de campos
    const mascaraCPF = (v) => {
        v = v.replace(/\D/g, ""); 
        if (v.length > 11) v = v.slice(0, 11); 
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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

    const mascaraSalario = (v) => {
        v = v.replace(/\D/g, ""); 
        if (v === "") return "";
        v = (parseInt(v) / 100).toFixed(2) + ""; 
        v = v.replace(".", ",");
        v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
        v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
        return "R$ " + v;
    };

    const mascaraComissao = (v) => {
        v = v.replace(/\D/g, ""); 
        if (v === "") return "";
        let valorNum = parseInt(v);
        if (valorNum > 10000) valorNum = 10000;
        v = (valorNum / 100).toFixed(2) + "";
        v = v.replace(".", ",");
        return v + "%";
    };

    // aplica as máscaras e bloqueios nos inputs
    const inputNome = document.querySelector('input[name="nomeCompleto"]');
    if (inputNome) {
        inputNome.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
        });
    }

    const inputNumero = document.querySelector('input[name="numero"]');
    if (inputNumero) {
        inputNumero.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9A-Za-z]/g, '');
        });
    }

    const inputCpf = document.querySelector('input[name="cpf"]');
    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => e.target.value = mascaraCPF(e.target.value));
    }

    const inputTel = document.querySelector('input[name="telefone"]');
    if (inputTel) {
        inputTel.addEventListener('input', (e) => e.target.value = mascaraTelefone(e.target.value));
    }

    if (inputCep) {
        inputCep.addEventListener('input', (e) => e.target.value = mascaraCEP(e.target.value));
    }

    const inputSalario = document.querySelector('input[name="salario"]');
    if (inputSalario) {
        inputSalario.type = 'text'; 
        inputSalario.addEventListener('input', (e) => e.target.value = mascaraSalario(e.target.value));
    }

    const inputComissao = document.querySelector('input[name="comissao"]');
    if (inputComissao) {
        inputComissao.type = 'text'; 
        inputComissao.addEventListener('input', (e) => e.target.value = mascaraComissao(e.target.value));
    }

    // funções de toast
    function mostrarToast(mensagem, tipo = 'sucesso') {
        if (!toast) return;

        const texto = toast.querySelector('span');
        const icone = toast.querySelector('i');
        
        if (texto) texto.textContent = mensagem;
        if (icone) {
            icone.setAttribute('data-lucide', tipo === 'erro' ? 'alert-circle' : 'check-circle');
            if (window.lucide) lucide.createIcons();
        }

        toast.style.backgroundColor = tipo === 'erro' ? '#DC2626' : '#16A34A';
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // carregar dados do funcionário para edição
    async function carregarFuncionarioParaEdicao() {
        if (!emEdicao || !form) return;

        try {
            const response = await fetch('/api/funcionarios');
            if (!response.ok) throw new Error('Erro ao buscar dados');

            const funcionarios = await response.json();
            const funcionario = funcionarios.find(item => String(item.id) === funcionarioId);

            if (!funcionario) {
                mostrarToast('Funcionário não encontrado.', 'erro');
                setTimeout(() => window.location.href = './funcionarios.html', 1500);
                return;
            }

            // preenche o formulário com os dados
            Object.entries(funcionario).forEach(([campo, valor]) => {
                const input = form.elements.namedItem(campo);
                if (input && typeof input.value !== 'undefined') input.value = valor ?? '';
            });
        } catch (error) {
            console.error('Erro ao carregar funcionário:', error);
            mostrarToast('Não foi possível carregar os dados.', 'erro');
        }
    }

    carregarFuncionarioParaEdicao();

    // busca automática de CEP
    if (inputCep) {
        inputCep.addEventListener('blur', async (event) => {
            const cepLimpo = event.target.value.replace(/\D/g, '');

            if (cepLimpo.length === 8) {
                try {
                    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                    const dados = await resposta.json();

                    if (!dados.erro) {
                        if (inputRua) inputRua.value = dados.logradouro || '';
                        if (inputBairro) inputBairro.value = dados.bairro || '';
                        if (inputCidade) inputCidade.value = dados.localidade || '';
                        if (selectEstado) selectEstado.value = dados.uf || ''; 
                    } else {
                        mostrarToast('CEP não encontrado.', 'erro');
                    }
                } catch (erro) {
                    console.error('Erro ao consultar o ViaCEP:', erro);
                }
            }
        });
    }

    // envio de formulário (criar e editar)
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const dadosFuncionario = Object.fromEntries(new FormData(form).entries());
            dadosFuncionario.nomeCompleto = dadosFuncionario.nomeCompleto.trim();
            dadosFuncionario.cpf = dadosFuncionario.cpf.trim();

            // Limpeza do salário antes de enviar para o backend
            if (dadosFuncionario.salario) {
                const salarioLimpo = dadosFuncionario.salario
                    .replace(/[R$\s.]/g, '') 
                    .replace(',', '.');      
                dadosFuncionario.salario = parseFloat(salarioLimpo) || 0;
            }

            // Limpeza da comissão antes de enviar para o backend
            if (dadosFuncionario.comissao) {
                const comissaoLimpa = dadosFuncionario.comissao
                    .replace(/[% \.]/g, '') 
                    .replace(',', '.');     
                dadosFuncionario.comissao = parseFloat(comissaoLimpa) || 0;
            }

            const textoOriginal = botaoSalvar ? botaoSalvar.textContent : '';
            if (botaoSalvar) {
                botaoSalvar.disabled = true;
                botaoSalvar.textContent = 'SALVANDO...';
            }

            try {
                // define URL e método dinamicamente com base no estado (criação vs edição)
                const urlReq = emEdicao ? `/funcionarios/${encodeURIComponent(funcionarioId)}` : '/cadastrar-funcionario';
                const metodoReq = emEdicao ? 'PUT' : 'POST';

                const response = await fetch(urlReq, {
                    method: metodoReq,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosFuncionario)
                });
                
                const resultado = await response.json();

                if (!response.ok || !resultado.success) {
                    mostrarToast(resultado.message || 'Não foi possível salvar.', 'erro');
                    return;
                }

                mostrarToast(resultado.message, 'sucesso');
                setTimeout(() => window.location.assign('./funcionarios.html'), 1500);
            } catch (error) {
                console.error('Erro ao salvar funcionário:', error);
                mostrarToast('Não foi possível conectar ao servidor.', 'erro');
            } finally {
                if (botaoSalvar) {
                    botaoSalvar.disabled = false;
                    botaoSalvar.textContent = textoOriginal;
                }
            }
        });
    }
});