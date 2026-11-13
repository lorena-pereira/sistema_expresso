document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastroProduto');
    const modelos = document.getElementById('modeloId');
    const botao = document.getElementById('btn-cadastrar-produto');
    const toast = document.getElementById('toast-sucess');

    if (!form || !modelos || !botao || !toast) return;

    const parametroId = new URLSearchParams(
        location.search
    ).get('id');

    const editando = parametroId !== null;

    const idValido =
        /^[1-9]\d*$/.test(parametroId ?? '') &&
        Number.isSafeInteger(Number(parametroId)) &&
        Number(parametroId) <= 4294967295;

    const textoBotao = editando
        ? 'SALVAR ALTERAÇÕES'
        : 'CADASTRAR PRODUTO';

    let temporizador;

    // adaptar a interface ao modo edição
    if (editando) {
        document.title = 'Editar Produto | Sistema Expresso';

        const titulo = document.querySelector('.form-card h1');
        const subtitulo = document.querySelector('.subtitle-info');

        if (titulo) {
            titulo.textContent = 'Editar Produto';
        }

        if (subtitulo) {
            subtitulo.textContent = 'Edição de produtos';
        }
    }

    // toast igual ao de Cliente e Funcionário
    function mostrarToast(mensagem, erro = false) {
        toast.querySelector('span').textContent = mensagem;

        const antigo = toast.querySelector('i, svg');

        if (antigo) {
            const novo = document.createElement('i');

            novo.dataset.lucide = erro
                ? 'alert-circle'
                : 'check-circle';

            antigo.replaceWith(novo);

            if (window.lucide) {
                lucide.createIcons();
            }
        }

        toast.style.backgroundColor = erro
            ? '#DC2626'
            : '#16A34A';

        toast.classList.add('show');

        clearTimeout(temporizador);

        temporizador = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // carregar modelos
    async function carregarModelos() {
        modelos.disabled = true;

        const resposta = await fetch('/api/modelos-produto', {
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
                dados.message ||
                'Não foi possível carregar os modelos.'
            );
        }

        modelos.replaceChildren(
            new Option('Selecione o modelo', '')
        );

        for (const modelo of dados.modelos) {
            modelos.add(
                new Option(
                    modelo.nome,
                    String(modelo.id)
                )
            );
        }

        if (!dados.modelos.length) {
            throw new Error('Nenhum modelo cadastrado.');
        }

        modelos.disabled = false;
    }

    // recuperar dados do produto selecionado
    async function carregarProduto(id) {
        const resposta = await fetch(
            `/api/produtos/${id}`,
            {
                credentials: 'same-origin',
                cache: 'no-store'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.success) {
            throw new Error(
                dados.message || 'Produto não encontrado.'
            );
        }

        const p = dados.produto;

        const campos = {
            nome: p.nome,
            tipo: p.tipo,
            modeloId: p.modeloId,
            madeira: p.madeira,
            medida: p.medida,
            custoMedida: p.custoMedida,
            precoSugerido: p.precoSugerido,
            quantidade: p.quantidade
        };

        // preencher formulário
        for (const [nome, valor] of Object.entries(campos)) {
            const campo = form.elements.namedItem(nome);

            if (campo) {
                campo.value = String(valor ?? '');
            }
        }

        if (!modelos.value) {
            throw new Error(
                'O modelo cadastrado não está disponível.'
            );
        }
    }

    // validação monetária
    function moedaValida(valor) {
        const texto = String(valor).trim();

        const milharBR =
            /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto);

        const decimalBR =
            /^\d+(?:,\d{1,2})?$/.test(texto);

        const decimalPonto =
            /^\d+(?:\.\d{1,2})?$/.test(texto);

        if (!milharBR && !decimalBR && !decimalPonto) {
            return false;
        }

        const convertido = milharBR || decimalBR
            ? texto.replace(/\./g, '').replace(',', '.')
            : texto;

        const numero = Number(convertido);

        return Number.isFinite(numero) &&
            numero >= 0 &&
            numero <= 99999.99;
    }

    // cadastrar ou editar
    form.addEventListener('submit', async evento => {
        evento.preventDefault();

        if (botao.disabled) return;

        const dados = Object.fromEntries(
            new FormData(form)
        );

        dados.nome = String(dados.nome || '')
            .trim()
            .replace(/\s+/g, ' ');

        const obrigatorios = [
            'nome',
            'tipo',
            'modeloId',
            'madeira',
            'custoMedida',
            'precoSugerido',
            'quantidade',
            'medida'
        ];

        if (obrigatorios.some(campo => String(dados[campo] ?? '').trim() === '')) {
            return mostrarToast(
                'Preencha todos os campos obrigatórios!',
                true
            );
        }

        if (!dados.nome || dados.nome.length > 100) {
            return mostrarToast(
                'Nome do produto inválido.',
                true
            );
        }

        if (!moedaValida(dados.custoMedida) || !moedaValida(dados.precoSugerido)) {
            return mostrarToast('Preço inválido!', true);
        }

        if (!/^\d+$/.test(dados.quantidade) || Number(dados.quantidade) > 4294967295) {
            return mostrarToast(
                'Quantidade em estoque inválida.',
                true
            );
        }

        botao.disabled = true;

        botao.textContent = editando
            ? 'SALVANDO...'
            : 'CADASTRANDO...';

        let redirecionando = false;

        try {
            // modo cadastro: POST
            // modo edição: PUT
            const resposta = await fetch(
                editando
                    ? `/api/produtos/${parametroId}`
                    : '/api/produtos',
                {
                    method: editando ? 'PUT' : 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dados)
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.success) {
                throw new Error(
                    resultado.message ||
                    'Não foi possível salvar.'
                );
            }

            mostrarToast(
                editando
                    ? 'Produto atualizado com sucesso!'
                    : 'Produto cadastrado com sucesso!'
            );

            botao.disabled = true;
            botao.textContent = 'REDIRECIONANDO...';

            redirecionando = true;

            setTimeout(() => {
                window.location.href = '/html/produtos.html';
            }, 1200);
        } catch (erro) {
            console.error('Erro ao salvar produto:', erro);

            mostrarToast(
                erro.message || 'Falha de conexão.',
                true
            );
        } finally {
            if (!redirecionando) {
                botao.disabled = false;
                botao.textContent = textoBotao;
            }
        }
    });

    // inicializar formulário
    (async () => {
        botao.disabled = true;
        botao.textContent = 'CARREGANDO...';

        try {
            if (editando && !idValido) {
                throw new Error('ID do produto inválido.');
            }

            await carregarModelos();

            if (editando) {
                await carregarProduto(parametroId);
            }

            botao.disabled = false;
            botao.textContent = textoBotao;
        } catch (erro) {
            console.error(
                'Falha ao inicializar formulário:',
                erro
            );

            mostrarToast(erro.message, true);
            botao.textContent = 'INDISPONÍVEL';
        }
    })();
});