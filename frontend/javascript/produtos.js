document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('lista-produtos-body');
    const busca = document.getElementById('busca-produto');
    const filtro = document.getElementById('filtro-madeira');
    const contador = document.getElementById('total-produtos');
    const aviso = document.getElementById('mensagem-lista-produtos');
    const modal = document.getElementById('modal-detalhes-produto');
    const confirmarModal = document.getElementById('modal-confirmar-produto');
    const toast = document.getElementById('toast-produtos');

    if (!lista || !busca || !filtro || !modal || !confirmarModal) return;

    const moeda = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    function exibirOuTraco(valor) {
        if (valor === null || valor === undefined) {
            return '—';
        }

        const texto = String(valor).trim();

        return texto === '' ? '—' : texto;
    }

    let selecionado = null;
    let statusPendente = null;
    let versaoBusca = 0;
    let temporizador;
    let temporizadorToast;
    let ultimoFoco = null;

    const texto = (id, valor) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor ?? '—';
    };

    function mostrarToast(mensagem, erro = false, acao = '') {
        if (!toast) return;

        toast.textContent = '';

        const icone = document.createElement('i');

        icone.setAttribute(
            'data-lucide',
            erro
                ? 'alert-circle'
                : acao === 'desativar'
                    ? 'check-circle'
                    : 'check-circle'
        );

        const textoMensagem = document.createElement('span');
        textoMensagem.textContent = mensagem;

        toast.append(icone, textoMensagem);

        // define a cor do toast
        let classe = 'sucesso';

        if (erro || acao === 'desativar') {
            classe = 'erro';
        }

        toast.className = `produto-toast ${classe} show`;

        if (window.lucide) {
            lucide.createIcons();
        }

        clearTimeout(temporizadorToast);

        temporizadorToast = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    function abrirModal(elemento) {
        ultimoFoco = document.activeElement;
        elemento.classList.add('active');
        elemento.setAttribute('aria-hidden', 'false');
        elemento.querySelector('button, a')?.focus();
    }

    function fecharModal(elemento) {
        elemento.classList.remove('active');
        elemento.setAttribute('aria-hidden', 'true');
        ultimoFoco?.focus();
    }

    function criarElemento(tag, classe, conteudo) {
        const elemento = document.createElement(tag);

        if (classe) elemento.className = classe;
        elemento.textContent = conteudo ?? '';
        return elemento;
    }

    // listar, pesquisar e filtrar produtos
    async function carregarProdutos() {
        const versao = ++versaoBusca;

        lista.replaceChildren(
            criarElemento(
                'p',
                'produtos-vazio',
                'Carregando produtos...'
            )
        );

        if (contador) contador.textContent = '';
        if (aviso) aviso.hidden = true;

        const parametros = new URLSearchParams();

        if (busca.value.trim()) {
            parametros.set('busca', busca.value.trim());
        }

        if (filtro.value) {
            parametros.set('madeira', filtro.value);
        }

        try {
            const resposta = await fetch(
                `/api/produtos?${parametros}`,
                {
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );

            const dados = await resposta.json();

            if (versao !== versaoBusca) return;

            if (
                !resposta.ok ||
                !dados.success ||
                !Array.isArray(dados.produtos)
            ) {
                throw new Error(
                    dados.message || 'Erro ao consultar produtos.'
                );
            }

            lista.replaceChildren();

            for (const produto of dados.produtos) {
                const linha = criarElemento(
                    'div',
                    'table-row produtos-tabela-linha'
                );

                linha.tabIndex = 0;
                linha.setAttribute('role', 'button');

                linha.setAttribute(
                    'aria-label',
                    `Visualizar detalhes do produto ${produto.nome}`
                );

                const modelo = criarElemento(
                    'div',
                    'produto-tipo',
                    produto.tipo || '—'
                );

                modelo.append(
                    criarElemento(
                        'span',
                        'produto-modelo',
                        produto.modelo || '—'
                    )
                );

                const status = produto.status;

                const badge = criarElemento(
                    'span',
                    `badge-status ${status === 'Ativo'
                        ? 'ativo'
                        : status === 'Inativo'
                            ? 'inativo'
                            : ''
                    }`
                );

                const bolinha = criarElemento('span', 'badge-dot');

                const nomeStatus = criarElemento(
                    'span',
                    '',
                    status || '—'
                );

                if (status === 'Ativo' || status === 'Inativo') {
                    badge.append(bolinha);
                }

                badge.append(nomeStatus);

                const celulaStatus = criarElemento('div');
                celulaStatus.append(badge);

                linha.append(
                    criarElemento(
                        'div',
                        'produto-nome',
                        produto.nome
                    ),

                    modelo,

                    criarElemento(
                        'div',
                        '',
                        exibirOuTraco(produto.madeira)
                    ),

                    criarElemento(
                        'div',
                        '',
                        moeda.format(Number(produto.precoSugerido))
                    ),

                    criarElemento(
                        'div',
                        '',
                        `${produto.quantidade} ${produto.medida === 'METROS' ? 'm' : 'un.'
                        }`
                    ),

                    celulaStatus,

                    criarElemento(
                        'div',
                        'produto-abrir',
                        '›'
                    )
                );

                // clicar na linha abre os detalhes
                const abrir = () => abrirDetalhes(produto.id);

                linha.addEventListener('click', abrir);

                linha.addEventListener('keydown', evento => {
                    if (
                        evento.key === 'Enter' ||
                        evento.key === ' '
                    ) {
                        evento.preventDefault();
                        abrir();
                    }
                });

                lista.append(linha);
            }

            if (dados.produtos.length === 0) {
                lista.append(
                    criarElemento(
                        'p',
                        'produtos-vazio',
                        'Nenhum produto encontrado.'
                    )
                );
            }

            if (contador) {
                const total = dados.produtos.length;

                contador.textContent =
                    `${total} ${total === 1
                        ? 'produto encontrado'
                        : 'produtos encontrados'
                    }`;
            }

        } catch (erro) {
            if (versao !== versaoBusca) return;

            console.error('Erro ao listar produtos:', erro);

            lista.replaceChildren(
                criarElemento(
                    'p',
                    'produtos-vazio',
                    'Não foi possível carregar os produtos.'
                )
            );

            if (aviso) {
                aviso.textContent = erro.message;
                aviso.className = 'produto-mensagem erro';
                aviso.hidden = false;
            }
        }
    }

    // visualizar detalhes do produto selecionado
    async function abrirDetalhes(id) {
        try {
            const resposta = await fetch(
                `/api/produtos/${encodeURIComponent(id)}`,
                {
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok || !dados.success) {
                throw new Error(
                    dados.message || 'Erro ao consultar produto.'
                );
            }

            selecionado = dados.produto;
            const produto = selecionado;

            texto('detalhe-produto-nome', produto.nome);

            texto(
                'detalhe-produto-subtitulo',
                `${produto.tipo} / ${produto.modelo || 'Sem modelo'}`
            );

            texto('detalhe-tipo', produto.tipo);
            texto('detalhe-modelo', produto.modelo);
            texto('detalhe-madeira', exibirOuTraco(produto.madeira));
            texto('detalhe-medida', produto.medida);

            texto(
                'detalhe-custo',
                moeda.format(Number(produto.custoMedida))
            );

            texto(
                'detalhe-preco',
                moeda.format(Number(produto.precoSugerido))
            );

            texto(
                'detalhe-quantidade',
                String(produto.quantidade)
            );

            texto('detalhe-produto-status', produto.status);

            const badge = document.getElementById(
                'detalhe-produto-badge'
            );

            badge.className = `badge-status ${produto.status === 'Ativo' ? 'ativo' : 'inativo'}`;

            // editar ficará dentro do modal
            document.getElementById('acao-editar-produto').href = `/html/cadastro-produto.html?id=${encodeURIComponent(produto.id)}`;
            // impede selecionar o status atual
            document.getElementById('acao-ativar-produto').disabled = false;
            document.getElementById('acao-desativar-produto').disabled = false;

            abrirModal(modal);

        } catch (erro) {
            mostrarToast(erro.message, true);
        }
    }

    // preparar confirmação de ativação/desativação
    function prepararStatus(novoStatus) {
        if (!selecionado) {
            mostrarToast(
                'Nenhum produto selecionado.',
                true
            );

            return;
        }

        if (novoStatus === 'Ativo' && selecionado.status === 'Ativo') {
            mostrarToast(
                'Ação Inválida: produto já Ativo!',
                true
            );

            return;
        }

        if (novoStatus === 'Inativo' && selecionado.status === 'Inativo') {
            mostrarToast(
                'Ação Inválida: produto já Desativado!',
                true
            );

            return;
        }

        statusPendente = novoStatus;

        const ativar = novoStatus === 'Ativo';

        // preenchimento dos dados do produto
        texto(
            'status-produto-nome',
            exibirOuTraco(selecionado.nome)
        );

        texto(
            'status-produto-tipo',
            exibirOuTraco(selecionado.tipo)
        );

        texto(
            'status-produto-modelo',
            exibirOuTraco(selecionado.modelo)
        );

        texto(
            'status-produto-madeira',
            exibirOuTraco(selecionado.madeira)
        );

        texto(
            'status-produto-medida',
            selecionado.medida === 'METROS'
                ? 'Metros'
                : selecionado.medida === 'UNIDADE'
                    ? 'Unidade'
                    : '—'
        );

        texto(
            'status-produto-preco',
            selecionado.precoSugerido == null
                ? '—'
                : moeda.format(Number(selecionado.precoSugerido))
        );

        texto(
            'status-produto-estoque',
            selecionado.quantidade == null
                ? '—'
                : `${selecionado.quantidade} ${selecionado.medida === 'METROS'
                    ? 'm'
                    : 'un.'
                }`
        );

        // elementos dinâmicos do cabeçalho
        const topo = document.getElementById('status-topo-produto');
        const iconeDesativar = document.getElementById('icone-produto-desativar');
        const iconeAtivar = document.getElementById('icone-produto-ativar');
        const botao = document.getElementById('confirmar-status-produto');

        if (iconeDesativar) {
            iconeDesativar.hidden = ativar;
        }

        if (iconeAtivar) {
            iconeAtivar.hidden = !ativar;
        }

        if (ativar) {
            // modal verde
            topo.className = 'status-header-aviso sucesso';

            texto(
                'status-titulo-topo-produto',
                'REATIVAÇÃO'
            );

            texto(
                'titulo-confirmar-produto',
                'Ativar Produto'
            );

            texto(
                'texto-confirmar-produto',
                'Deseja realmente ativar esse produto?'
            );

            texto(
                'status-descricao-produto',
                'O produto será marcado como ativo novamente, ' +
                'mantendo seus dados e registros anteriores.'
            );

            botao.textContent = 'Ativar';
            botao.className = 'btn-acao-principal ativar';

        } else {
            // modal vermelho
            topo.className = 'status-header-aviso perigo';

            texto(
                'status-titulo-topo-produto',
                'AÇÃO DESTRUTIVA'
            );

            texto(
                'titulo-confirmar-produto',
                'Desativar Produto'
            );

            texto(
                'texto-confirmar-produto',
                'Deseja realmente desativar esse produto?'
            );

            texto(
                'status-descricao-produto',
                'O produto será marcado como inativo, sem ser ' +
                'excluído do cadastro. Seu histórico será preservado.'
            );

            botao.textContent = 'Desativar';
            botao.className = 'btn-acao-principal desativar';

        }

        if (window.lucide) {
            lucide.createIcons();
        }
        // exibe o modal
        abrirModal(confirmarModal);
    }

    // eventos dos modais
    document.getElementById('fechar-detalhes-produto').addEventListener('click', () => fecharModal(modal));
    document.getElementById('cancelar-status-produto').addEventListener('click', () => fecharModal(confirmarModal));
    document.getElementById('acao-ativar-produto').addEventListener('click', () => prepararStatus('Ativo'));
    document.getElementById('acao-desativar-produto').addEventListener('click', () => prepararStatus('Inativo'));

    for (const elemento of [modal, confirmarModal]) {
        elemento.addEventListener('click', evento => {
            if (evento.target === elemento) {
                fecharModal(elemento);
            }
        });
    }

    // fechar modais com ESC
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            if (confirmarModal.classList.contains('active')) {
                fecharModal(confirmarModal);
            } else if (modal.classList.contains('active')) {
                fecharModal(modal);
            }
        }
    });

    // confirmar ativação ou desativação
    document.getElementById('confirmar-status-produto')
        .addEventListener('click', async () => {

            if (!selecionado || !statusPendente) return;

            const botao = document.getElementById(
                'confirmar-status-produto'
            );

            const novoStatus = statusPendente;
            const idProduto = selecionado.id;

            botao.disabled = true;

            try {
                const resposta = await fetch(
                    `/api/produtos/${idProduto}/status`,
                    {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: novoStatus
                        })
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok || !dados.success) {
                    throw new Error(
                        dados.message ||
                        'Não foi possível alterar o status do produto.'
                    );
                }

                // fecha os modais após a confirmação
                fecharModal(confirmarModal);
                fecharModal(modal);

                statusPendente = null;

                await carregarProdutos();

                // exibe o toast de confirmação
                mostrarToast(
                    novoStatus === 'Ativo'
                        ? 'Produto ativado com sucesso!'
                        : 'Produto desativado com sucesso!',
                    false,
                    novoStatus === 'Ativo' ? 'ativar' : 'desativar'
                );
            } catch (erro) {
                console.error(
                    'Erro ao alterar status do produto:',
                    erro
                );

                mostrarToast(
                    erro.message ||
                    'Erro de conexão com o servidor.',
                    true
                );
            } finally {
                botao.disabled = false;
            }
        });

    // busca e filtro continuam funcionando
    busca.addEventListener('input', () => {
        clearTimeout(temporizador);

        temporizador = setTimeout(
            carregarProdutos,
            300
        );
    });

    filtro.addEventListener('change', carregarProdutos);

    carregarProdutos();
});