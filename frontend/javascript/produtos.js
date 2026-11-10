document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('lista-produtos-body');
    const campoBusca = document.getElementById('busca-produto');
    const filtroMadeira = document.getElementById('filtro-madeira');
    const totalProdutos = document.getElementById('total-produtos');
    const aviso = document.getElementById('mensagem-lista-produtos');

    // apenas a lista é indispensável para carregar os produtos
    if (!lista) {
        console.error(
            'Elemento #lista-produtos-body não encontrado no HTML.'
        );
        return;
    }

    const moeda = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    let temporizadorBusca;
    let requisicaoAtual = 0;

    function criarElemento(tag, classe, texto) {
        const elemento = document.createElement(tag);

        if (classe) {
            elemento.className = classe;
        }

        elemento.textContent = texto ?? '';

        return elemento;
    }

    function mostrarAviso(mensagem) {
        if (!aviso) return;

        aviso.textContent = mensagem;
        aviso.className = 'produto-mensagem erro';
        aviso.hidden = false;

    }

    function limparAviso() {
        if (!aviso) return;

        aviso.textContent = '';
        aviso.className = 'produto-mensagem';
        aviso.hidden = true;

    }

    async function carregarProdutos() {
        const identificadorRequisicao = ++requisicaoAtual;

        limparAviso();

        lista.replaceChildren(
            criarElemento(
                'p',
                'produtos-vazio',
                'Carregando produtos...'
            )
        );

        if (totalProdutos) {
            totalProdutos.textContent = '';
        }

        // parâmetros de busca e filtro
        const parametros = new URLSearchParams();
        const busca = campoBusca?.value.trim() || '';
        const madeira = filtroMadeira?.value || '';

        if (busca) {
            parametros.set('busca', busca);
        }

        if (madeira) {
            parametros.set('madeira', madeira);
        }

        const queryString = parametros.toString();

        const url = queryString
            ? `/api/produtos?${queryString}`
            : '/api/produtos';

        try {
            const resposta = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json'
                }
            });

            let dados;

            try {
                dados = await resposta.json();
            } catch {
                throw new Error(
                    'O servidor retornou uma resposta inválida. Verifique se a API está em execução.'
                );
            }

            // ignora respostas de pesquisas anteriores
            if (identificadorRequisicao !== requisicaoAtual) {
                return;
            }

            if (
                !resposta.ok ||
                !dados?.success ||
                !Array.isArray(dados.produtos)
            ) {
                throw new Error(
                    dados?.message ||
                    `Não foi possível carregar os produtos (HTTP ${resposta.status}).`
                );
            }

            lista.replaceChildren();

            // nenhum resultado
            if (dados.produtos.length === 0) {
                lista.append(
                    criarElemento(
                        'p',
                        'produtos-vazio',
                        busca || madeira
                            ? 'Nenhum produto encontrado com os filtros informados.'
                            : 'Nenhum produto cadastrado.'
                    )
                );
            }

            // exibição dos produtos
            for (const produto of dados.produtos) {
                const linha = criarElemento(
                    'div',
                    'table-row produtos-tabela-linha'
                );

                // nome
                linha.append(
                    criarElemento(
                        'div',
                        'produto-nome',
                        produto.nome || '—'
                    )
                );

                // tipo e modelo
                const tipoModelo = criarElemento(
                    'div',
                    'produto-tipo',
                    produto.tipo || '—'
                );

                tipoModelo.append(
                    criarElemento(
                        'span',
                        'produto-modelo',
                        produto.modelo || 'Sem modelo'
                    )
                );

                linha.append(tipoModelo);

                // madeira
                linha.append(
                    criarElemento(
                        'div',
                        '',
                        produto.madeira || '—'
                    )
                );

                // preço
                const preco = Number(produto.precoSugerido);

                linha.append(
                    criarElemento(
                        'div',
                        '',
                        Number.isFinite(preco)
                            ? moeda.format(preco)
                            : '—'
                    )
                );

                // quantidade
                const quantidade = produto.quantidade ?? '—';

                const unidade = produto.medida === 'METROS'
                    ? 'm'
                    : 'un.';

                linha.append(
                    criarElemento(
                        'div',
                        '',
                        `${quantidade} ${unidade}`
                    )
                );

                lista.append(linha);
            }

            // contador de produtos
            if (totalProdutos) {
                const total = Number(
                    dados.total ?? dados.produtos.length
                );

                totalProdutos.textContent =
                    `${total} ${
                        total === 1
                            ? 'produto encontrado'
                            : 'produtos encontrados'
                    }`;
            }

        } catch (erro) {
            if (identificadorRequisicao !== requisicaoAtual) {
                return;
            }

            console.error(
                'Erro ao carregar produtos:',
                erro
            );

            lista.replaceChildren(
                criarElemento(
                    'p',
                    'produtos-vazio',
                    'Não foi possível carregar os produtos.'
                )
            );

            mostrarAviso(
                erro.message ||
                'Erro inesperado ao carregar os produtos. Tente novamente.'
            );
        }
    }

    // busca automática 
    if (campoBusca) {
        campoBusca.addEventListener('input', () => {
            clearTimeout(temporizadorBusca);

            temporizadorBusca = setTimeout(
                carregarProdutos,
                300
            );
        });
    }

    // filtro por madeira
    if (filtroMadeira) {
        filtroMadeira.addEventListener(
            'change',
            carregarProdutos
        );
    }

    // carregamento
    carregarProdutos();

});