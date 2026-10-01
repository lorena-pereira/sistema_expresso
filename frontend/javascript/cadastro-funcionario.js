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
            setTimeout(() => window.location.assign('./funcionarios.html'), 1200);
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
