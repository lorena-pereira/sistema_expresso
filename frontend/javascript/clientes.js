document.addEventListener('DOMContentLoaded', () => {
    // --- FUNÇÃO DE TOAST NOTIFICATION ---
    function mostrarToast(mensagem, tipo = 'sucesso') {
        const toastAntigo = document.querySelector('.toast-notification');
        if (toastAntigo) toastAntigo.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification ${tipo}`;
        
        toast.innerHTML = `
            <i data-lucide="${tipo === 'sucesso' ? 'check-circle' : 'alert-circle'}" style="width: 20px; height: 20px;"></i>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.style.right = '20px';
        }, 100);

        setTimeout(() => {
            toast.style.right = '-400px';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    const listaContainer = document.getElementById('lista-clientes-body');
    const inputBusca = document.getElementById('input-busca-cliente');
    const selectStatus = document.getElementById('select-filtro-status');

    // 1. Elementos do Modal de Cadastrar (Tipo de Pessoa)
    const btnAbrirCadastrar = document.getElementById('btn-abrir-modal');
    const btnFecharCadastrar = document.getElementById('btn-fechar-modal');
    const modalCadastrar = document.getElementById('modal-tipo-pessoa');

    // 2. Elementos do Modal de Detalhes
    const modalDetalhes = document.getElementById('modal-detalhes-cliente');
    const btnFecharDetalhes = document.getElementById('btn-fechar-detalhes');
    const btnAcaoEditar = document.getElementById('btn-acao-editar');
    
    // 3. Elementos do Modal de Status (Ativar / Desativar)
    const modalConfirmarStatus = document.getElementById('modal-confirmar-status');
    const btnCancelarAcao = document.getElementById('btn-cancelar-acao');
    const btnExecutarAcao = document.getElementById('btn-executar-acao');
    
    let todosClientes = [];
    let clienteSelecionadoParaAcao = null;
    let acaoDesejada = null;

    // --- LÓGICA DO MODAL DE CADASTRAR ---
    if (btnAbrirCadastrar && modalCadastrar) {
        btnAbrirCadastrar.addEventListener('click', () => {
            modalCadastrar.classList.add('active');
        });

        if (btnFecharCadastrar) {
            btnFecharCadastrar.addEventListener('click', () => {
                modalCadastrar.classList.remove('active');
            });
        }

        modalCadastrar.addEventListener('click', (e) => {
            if (e.target === modalCadastrar) {
                modalCadastrar.classList.remove('active');
            }
        });
    }

    // --- CARREGAMENTO DE DADOS E TABELA ---
    async function carregarClientes() {
        try {
            const response = await fetch('../../backend/data/clientes.json');
            if (!response.ok) throw new Error('Erro ao buscar dados');
            todosClientes = await response.json();
            
            aplicarFiltros(); 
        } catch (error) {
            console.error(error);
        }
    }

    function renderizarClientes(clientes) {
        if (!listaContainer) return;
        listaContainer.innerHTML = '';

        if (clientes.length === 0) {
            listaContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: #64748B;">Nenhum cliente encontrado.</div>`;
            return;
        }

        clientes.forEach(cliente => {
            const nomeExibicao = String(cliente.nomeCompleto || cliente.razaoSocial || 'Cliente sem nome');
            const documentoExibicao = String(cliente.cpf || cliente.cnpj || 'Não informado');
            const inicial = nomeExibicao.charAt(0).toUpperCase();
            const statusTexto = String(cliente.status || 'Ativo');
            const statusClass = statusTexto.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';

            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.cursor = 'pointer';

            row.addEventListener('click', () => abrirModalDetalhes(cliente));

            row.innerHTML = `
                <div class="col-nome">
                    <div class="avatar-circle">${inicial}</div>
                    <span>${nomeExibicao}</span>
                </div>
                <div class="col-cpf">${documentoExibicao}</div>
                <div class="col-status">
                    <span class="badge-status ${statusClass}">
                        <span class="badge-dot"></span> ${statusTexto}
                    </span>
                </div>
                <div class="col-acoes">
                    <i data-lucide="chevron-right"></i>
                </div>
            `;
            listaContainer.appendChild(row);
        });

        if (window.lucide) lucide.createIcons();
    }

    // --- FUNÇÃO DE BUSCA E FILTRO ---
    function aplicarFiltros() {
        const termoBusca = inputBusca ? inputBusca.value.toLowerCase().trim() : '';
        const statusSelecionado = selectStatus ? selectStatus.value.toLowerCase() : 'todos';

        const clientesFiltrados = todosClientes.filter(cliente => {
            const nome = String(cliente.nomeCompleto || cliente.razaoSocial || '').toLowerCase();
            const doc = String(cliente.cpf || cliente.cnpj || '').toLowerCase();
            const cidade = String(cliente.cidade || '').toLowerCase();

            const bateBusca = nome.includes(termoBusca) || doc.includes(termoBusca) || cidade.includes(termoBusca);
            
            const statusAtual = String(cliente.status || 'Ativo').toLowerCase();
            const bateStatus = statusSelecionado === 'todos' || statusAtual === statusSelecionado;

            return bateBusca && bateStatus;
        });

        renderizarClientes(clientesFiltrados);
    }

    if (inputBusca) inputBusca.addEventListener('input', aplicarFiltros);
    if (selectStatus) selectStatus.addEventListener('change', aplicarFiltros);

    // --- MODAL DE DETALHES ---
    function abrirModalDetalhes(cliente) {
        const nome = cliente.nomeCompleto || cliente.razaoSocial || 'Cliente sem nome';
        const docLabel = cliente.cpf ? 'CPF' : 'CNPJ';
        const docValue = cliente.cpf || cliente.cnpj || 'Não informado';
        const extraLabel = cliente.tipo === 'PF' ? 'SEXO' : 'INSC. ESTADUAL';
        const extraValue = cliente.tipo === 'PF' ? (cliente.sexo || 'Não informado') : (cliente.inscricaoEstadual || 'Não informado');
        const statusVal = cliente.status || 'Ativo';
        const statusClass = statusVal.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';
        
        const btnAcaoDesativar = document.getElementById('btn-acao-desativar');
        const btnAcaoAtivar = document.getElementById('btn-acao-ativar');

        if (btnAcaoDesativar) {
            btnAcaoDesativar.onclick = () => abrirModalStatus(cliente, 'Inativo');
        }

        if (btnAcaoAtivar) {
            btnAcaoAtivar.onclick = () => abrirModalStatus(cliente, 'Ativo');
        }

        document.getElementById('detalhe-avatar').textContent = nome.charAt(0).toUpperCase();
        document.getElementById('detalhe-nome').textContent = nome;
        document.getElementById('detalhe-doc-label').textContent = docLabel;
        document.getElementById('detalhe-doc-val').textContent = docValue;
        document.getElementById('detalhe-extra-label').textContent = extraLabel;
        document.getElementById('detalhe-sexo-val').textContent = extraValue;
        document.getElementById('detalhe-status-val').textContent = statusVal;
        document.getElementById('detalhe-badge-texto').textContent = statusVal;
        
        const badge = document.getElementById('detalhe-badge-status');
        if (badge) badge.className = `badge-status ${statusClass}`;

        document.getElementById('detalhe-telefone-val').textContent = cliente.telefone || 'Não informado';

        const end = [cliente.rua, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
            .filter(Boolean).join(', ');
        document.getElementById('detalhe-obs-val').textContent = end || 'Sem endereço cadastrado';

        if (btnAcaoEditar && cliente.id) {
            const paginaEdicao = cliente.tipo === 'PJ' ? 'cadastro-cliente-pj.html' : 'cadastro-cliente-pf.html';
            btnAcaoEditar.href = `${paginaEdicao}?id=${encodeURIComponent(cliente.id)}`;
        }

        if (modalDetalhes) modalDetalhes.classList.add('active');
    }

    if (btnFecharDetalhes && modalDetalhes) {
        btnFecharDetalhes.addEventListener('click', () => modalDetalhes.classList.remove('active'));
        modalDetalhes.addEventListener('click', (e) => {
            if (e.target === modalDetalhes) modalDetalhes.classList.remove('active');
        });
    }

    // --- LÓGICA DO MODAL DE ATIVAR / DESATIVAR STATUS ---
    function abrirModalStatus(cliente, acao) {
        clienteSelecionadoParaAcao = cliente;
        acaoDesejada = acao; 

        const isAtivar = acao === 'Ativo';

        const topoAviso = document.getElementById('status-topo-aviso');
        const iconeTopo = document.getElementById('status-icone-topo');
        const tituloTopo = document.getElementById('status-titulo-topo');
        const tituloPrincipal = document.getElementById('status-titulo-principal');
        const pergunta = document.getElementById('status-pergunta');
        const descricao = document.getElementById('status-descricao');

        const nomeEl = document.getElementById('status-val-nome');
        const labelDoc = document.getElementById('status-label-doc');
        const docEl = document.getElementById('status-val-doc');
        const telEl = document.getElementById('status-val-telefone');
        const cidadeEl = document.getElementById('status-val-cidade');
        
        const camposPf = document.querySelectorAll('.campos-pf-exclusivos');
        const nascEl = document.getElementById('status-val-nascimento');
        const sexoEl = document.getElementById('status-val-sexo');

        nomeEl.textContent = cliente.nomeCompleto || cliente.razaoSocial || 'Cliente sem nome';
        telEl.textContent = cliente.telefone || 'Não informado';
        cidadeEl.textContent = `${cliente.cidade || 'Cidade não informada'} - ${cliente.estado || 'UF'}`;

        if (cliente.tipo === 'PJ' || cliente.cnpj) {
            labelDoc.textContent = 'CNPJ';
            docEl.textContent = cliente.cnpj || 'Não informado';
            camposPf.forEach(el => el.style.display = 'none');
        } else {
            labelDoc.textContent = 'CPF';
            docEl.textContent = cliente.cpf || 'Não informado';
            nascEl.textContent = cliente.dataNascimento || 'Não informada';
            sexoEl.textContent = cliente.Sexo || cliente.sexo || 'Não informado';
            camposPf.forEach(el => el.style.display = 'block');
        }

        if (isAtivar) {
            topoAviso.className = 'status-header-aviso sucesso';
            if (iconeTopo) iconeTopo.setAttribute('data-lucide', 'shield-check');
            tituloTopo.textContent = 'REATIVAÇÃO';
            tituloPrincipal.textContent = 'Ativar Cliente';
            pergunta.textContent = 'Deseja realmente ativar esse cliente?';
            descricao.textContent = 'Ao ativar o cliente, todos os serviços e históricos de faturamento vinculados serão reestabelecidos imediatamente.';
            
            btnExecutarAcao.textContent = 'Ativar';
            btnExecutarAcao.className = 'btn-acao-principal ativar';
        } else {
            topoAviso.className = 'status-header-aviso perigo';
            if (iconeTopo) iconeTopo.setAttribute('data-lucide', 'alert-triangle');
            tituloTopo.textContent = 'AÇÃO DESTRUTIVA';
            tituloPrincipal.textContent = 'Desativar Cliente';
            pergunta.textContent = 'Deseja realmente desativar esse cliente?';
            descricao.textContent = 'Ao desativar o cliente, ele perderá acesso temporário aos sistemas de atendimento e faturamento ativos.';
            
            btnExecutarAcao.textContent = 'Desativar';
            btnExecutarAcao.className = 'btn-acao-principal desativar';
        }

        if (window.lucide) lucide.createIcons();
        if (modalConfirmarStatus) modalConfirmarStatus.classList.add('active');
    }

    if (btnCancelarAcao && modalConfirmarStatus) {
        btnCancelarAcao.addEventListener('click', () => {
            modalConfirmarStatus.classList.remove('active');
        });
        modalConfirmarStatus.addEventListener('click', (e) => {
            if (e.target === modalConfirmarStatus) {
                modalConfirmarStatus.classList.remove('active');
            }
        });
    }

    if (btnExecutarAcao) {
        btnExecutarAcao.addEventListener('click', async () => {
            if (!clienteSelecionadoParaAcao) return;

            try {
                const response = await fetch('http://localhost:3000/atualizar-status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: clienteSelecionadoParaAcao.id,
                        status: acaoDesejada 
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    clienteSelecionadoParaAcao.status = acaoDesejada;
                    
                    // Alerta substituído pelo toast de sucesso
                    mostrarToast(`Cliente ${acaoDesejada === 'Ativo' ? 'ativado' : 'desativado'} com sucesso!`, 'sucesso');
                    
                    modalConfirmarStatus.classList.remove('active');
                    
                    const modalDetalhes = document.getElementById('modal-detalhes-cliente');
                    if (modalDetalhes) modalDetalhes.classList.remove('active');

                    aplicarFiltros(); 
                } else {
                    // Alerta substituído pelo toast de erro
                    mostrarToast('Erro ao atualizar status no servidor: ' + (result.message || 'Erro desconhecido'), 'erro');
                }

            } catch (error) {
                console.error('Erro na requisição:', error);
                // Alerta substituído pelo toast de erro
                mostrarToast('Não foi possível conectar ao servidor para alterar o status.', 'erro');
            }
        });
    }

    carregarClientes();
});