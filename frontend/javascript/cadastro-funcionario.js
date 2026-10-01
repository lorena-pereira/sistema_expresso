document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastroFuncionario');
    const botaoSalvar = document.getElementById('btn-salvar');
    const toast = document.getElementById('toast-sucess');
    const inputCep = document.querySelector('input[name="cep"]');
    const inputRua = document.querySelector('input[name="rua"]');
    const inputBairro = document.querySelector('input[name="bairro"]');
    const inputCidade = document.querySelector('input[name="cidade"]');
    const selectEstado = document.querySelector('select[name="estado"]');
    let toastTimeout;
    let cepConsultado = '';
    let requisicaoCep = 0;

    if (!form) return;

    function mostrarToast(mensagem, tipo = 'sucesso') {
        if (!toast) return;

        const texto = toast.querySelector('span');
        if (texto) texto.textContent = mensagem;

        toast.style.backgroundColor = tipo === 'erro' ? '#DC2626' : '#16A34A';
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
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

    const mascaraTelefone = (v) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11); 
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v;
    };

    // Máscara de Salário (Moeda BRL)
    const mascaraSalario = (v) => {
        v = v.replace(/\D/g, "");
        if (!v) return "";
        v = (parseInt(v, 10) / 100);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(v);
    };

    // Máscara de Comissão (Porcentagem) limitada a 100%
    const mascaraComissao = (v) => {
        v = v.replace(/\D/g, "");
        if (!v) return "";
        
        let valorInteiro = parseInt(v, 10);
        
        // Limita o valor máximo a 10000 (que equivale a 100,00%)
        if (valorInteiro > 10000) {
            valorInteiro = 10000;
        }

        // Divide por 10000 porque o Intl de porcentagem multiplica o valor por 100 automaticamente
        v = (valorInteiro / 10000);
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(v);
    };

    // capturar os campos no ecrã e aplicar a escuta 
    const inputCpf = document.querySelector('input[name="cpf"]');
    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => e.target.value = mascaraCPF(e.target.value));
    }

    const inputsTelefone = document.querySelectorAll('input[name="telefone"]');
    inputsTelefone.forEach(input => {
        input.addEventListener('input', (e) => e.target.value = mascaraTelefone(e.target.value));
    });

    const inputSalario = document.querySelector('input[name="salario"]');
    if (inputSalario) {
        inputSalario.type = 'text'; // Força o input a ser texto para aceitar R$ e vírgula
        inputSalario.addEventListener('input', (e) => e.target.value = mascaraSalario(e.target.value));
    }

    const inputComissao = document.querySelector('input[name="comissao"]');
    if (inputComissao) {
        inputComissao.type = 'text'; // Força o input a ser texto para aceitar % e vírgula
        inputComissao.addEventListener('input', (e) => e.target.value = mascaraComissao(e.target.value));
    }

    async function preencherEndereco(cep) {
        const requisicaoAtual = ++requisicaoCep;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('Falha ao consultar o CEP.');

            const endereco = await response.json();
            if (requisicaoAtual !== requisicaoCep || inputCep.value.replace(/\D/g, '') !== cep) return;

            if (endereco.erro) {
                mostrarToast('CEP não encontrado.', 'erro');
                return;
            }

            if (inputRua) inputRua.value = endereco.logradouro || '';
            if (inputBairro) inputBairro.value = endereco.bairro || '';
            if (inputCidade) inputCidade.value = endereco.localidade || '';
            if (selectEstado) selectEstado.value = endereco.uf || '';
        } catch (error) {
            console.error('Erro ao consultar o CEP:', error);
            if (requisicaoAtual === requisicaoCep) {
                mostrarToast('Não foi possível consultar o CEP.', 'erro');
            }
        }
    }

    if (inputCep) {
        inputCep.addEventListener('input', () => {
            const cep = inputCep.value.replace(/\D/g, '').slice(0, 8);
            inputCep.value = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

            if (cep.length !== 8) {
                cepConsultado = '';
                return;
            }

            if (cep !== cepConsultado) {
                cepConsultado = cep;
                preencherEndereco(cep);
            }
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const dadosFuncionario = Object.fromEntries(new FormData(form).entries());
        dadosFuncionario.nomeCompleto = dadosFuncionario.nomeCompleto.trim();
        dadosFuncionario.cpf = dadosFuncionario.cpf.trim();

        // Limpeza do salário
        if (dadosFuncionario.salario) {
            const salarioLimpo = dadosFuncionario.salario
                .replace(/[R$\s.]/g, '') 
                .replace(',', '.');      
            dadosFuncionario.salario = parseFloat(salarioLimpo) || 0;
        }

        // Limpeza da comissão
        if (dadosFuncionario.comissao) {
            const comissaoLimpa = dadosFuncionario.comissao
                .replace(/[% \.]/g, '') // Remove símbolo %, pontos de milhar e espaços
                .replace(',', '.');     // Substitui a vírgula decimal por ponto
            dadosFuncionario.comissao = parseFloat(comissaoLimpa) || 0;
        }

        const textoOriginal = botaoSalvar ? botaoSalvar.textContent : '';
        if (botaoSalvar) {
            botaoSalvar.disabled = true;
            botaoSalvar.textContent = 'SALVANDO...';
        }

        try {
            const response = await fetch('/cadastrar-funcionario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosFuncionario)
            });
            const resultado = await response.json();

            if (!response.ok || !resultado.success) {
                mostrarToast(resultado.message || 'Não foi possível salvar o funcionário.', 'erro');
                return;
            }

            mostrarToast(resultado.message, 'sucesso');
            form.reset();
            setTimeout(() => window.location.assign('/html/funcionarios.html'), 1200);
        } catch (error) {
            console.error('Erro ao cadastrar funcionário:', error);
            mostrarToast('Não foi possível conectar ao servidor.', 'erro');
        } finally {
            if (botaoSalvar) {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = textoOriginal;
            }
        }
    });
});