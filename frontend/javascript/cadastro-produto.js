document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastroProduto');
    const seletorModelos = document.getElementById('modeloId');
    const botao = document.getElementById('btn-cadastrar-produto');
    const toast = document.getElementById('toast-sucess');

    if (!form || !seletorModelos || !botao || !toast) {
        return;
    }

    let toastTimeout;

    // toast
    function mostrarToast(mensagem, tipo = 'sucesso') {
        const texto = toast.querySelector('span');

        if (texto) {
            texto.textContent = mensagem;
        }

        const iconeAtual = toast.querySelector('i, svg');

        if (iconeAtual) {
            const novoIcone = document.createElement('i');

            novoIcone.setAttribute(
                'data-lucide',
                tipo === 'erro'
                    ? 'alert-circle'
                    : 'check-circle'
            );

            iconeAtual.replaceWith(novoIcone);

            if (window.lucide) {
                lucide.createIcons();
            }
        }

        toast.style.backgroundColor =
            tipo === 'erro' ? '#DC2626' : '#16A34A';

        toast.classList.add('show');

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // carregar modelos do banco de dados
    async function carregarModelos() {
        seletorModelos.disabled = true;

        try {
            const resposta = await fetch('/api/modelos-produto', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store'
            });

            const dados = await resposta.json();

            if (
                !resposta.ok ||
                !dados.success ||
                !Array.isArray(dados.modelos)
            ) {
                throw new Error(
                    dados.message || 'Não foi possível carregar os modelos.'
                );
            }

            seletorModelos.replaceChildren();

            const opcaoInicial = document.createElement('option');

            opcaoInicial.value = '';
            opcaoInicial.textContent = 'Selecione o modelo';

            seletorModelos.append(opcaoInicial);

            for (const modelo of dados.modelos) {
                const opcao = document.createElement('option');

                opcao.value = String(modelo.id);
                opcao.textContent = modelo.nome;

                seletorModelos.append(opcao);

            }

            if (dados.modelos.length === 0) {
                opcaoInicial.textContent = 'Nenhum modelo cadastrado';

                mostrarToast(
                    'Não há modelos cadastrados. Cadastre um modelo antes de cadastrar produtos.',
                    'erro'
                );

                return;
            }

            seletorModelos.disabled = false;

        } catch (erro) {
            console.error('Erro ao carregar modelos:', erro);

            seletorModelos.replaceChildren();

            const opcaoErro = document.createElement('option');

            opcaoErro.value = '';
            opcaoErro.textContent = 'Erro ao carregar modelos';

            seletorModelos.append(opcaoErro);

            mostrarToast(
                erro.message || 'Não foi possível carregar os modelos.',
                'erro'
            );

        }

    }

    // validação de moeda
    function moedaValida(valor, limite = 99999.99) {
        const texto = String(valor).trim();

        const formatoBrasilComMilhar =
            /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto);

        const formatoBrasil =
            /^\d+(?:,\d{1,2})?$/.test(texto);

        const formatoDecimal =
            /^\d+(?:\.\d{1,2})?$/.test(texto);

        if (
            !formatoBrasilComMilhar &&
            !formatoBrasil &&
            !formatoDecimal
        ) {
            return false;
        }

        const normalizado =
            formatoBrasilComMilhar || formatoBrasil
                ? texto.replace(/\./g, '').replace(',', '.')
                : texto;

        const numero = Number(normalizado);

        return Number.isFinite(numero) &&
            numero >= 0 &&
            numero <= limite;

    }

    // cadastro do produto
    form.addEventListener('submit', async evento => {
        evento.preventDefault();

        const dados = Object.fromEntries(
            new FormData(form)
        );

        dados.nome = String(dados.nome || '')
            .trim()
            .replace(/\s+/g, ' ');

        const camposObrigatorios = [
            'nome',
            'tipo',
            'modeloId',
            'madeira',
            'custoMedida',
            'precoSugerido',
            'quantidade',
            'medida'
        ];

        if (
            camposObrigatorios.some(
                campo => String(dados[campo] ?? '').trim() === ''
            )
        ) {
            mostrarToast(
                'Preencha todos os campos obrigatórios!',
                'erro'
            );

            return;
        }

        if (dados.nome.length > 100) {
            mostrarToast(
                'Nome do produto inválido (máximo de 100 caracteres).',
                'erro'
            );
            return;
        }

        if (
            !/^\d+$/.test(dados.quantidade) ||
            Number(dados.quantidade) > 4294967295
        ) {
            mostrarToast(
                'Quantidade em estoque inválida.',
                'erro'
            );

            return;
        }

        if (
            !moedaValida(dados.custoMedida) ||
            !moedaValida(dados.precoSugerido)
        ) {
            mostrarToast(
                'Preço inválido!',
                'erro'
            );

            return;
        }

        botao.disabled = true;
        botao.textContent = 'CADASTRANDO...';

        try {
            const resposta = await fetch('/api/produtos', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.success) {
                mostrarToast(
                    resultado.message ||
                    'Não foi possível cadastrar o produto.',
                    'erro'
                );

                return;
            }

            form.reset();

            mostrarToast(
                resultado.message ||
                'Operação realizada com sucesso!',
                'sucesso'
            );

            form.elements.namedItem('nome').focus();

        } catch (erro) {
            console.error('Erro ao cadastrar produto:', erro);

            mostrarToast(
                'Erro de conexão com o servidor. Tente novamente.',
                'erro'
            );

        } finally {
            botao.disabled = false;
            botao.textContent = 'CADASTRAR PRODUTO';
        }

    });

    carregarModelos();
});