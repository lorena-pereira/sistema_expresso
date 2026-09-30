document.addEventListener('DOMContentLoaded', () => {
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

        setTimeout(() => { toast.style.right = '20px'; }, 100);
        setTimeout(() => {
            toast.style.right = '-400px';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    const listaContainer = document.getElementById('lista-funcionarios-body');
    const inputBusca = document.getElementById('input-busca-funcionario');
    const selectStatus = document.getElementById('select-filtro-status');

    const modalDetalhes = document.getElementById('modal-detalhes-funcionario');
    const btnFecharDetalhes = document.getElementById('btn-fechar-detalhes');
    const btnAcaoEditar = document.getElementById('btn-acao-editar');
    
    const modalConfirmarStatus = document.getElementById('modal-confirmar-status');
    const btnCancelarAcao = document.getElementById('btn-cancelar-acao');
    const btnExecutarAcao = document.getElementById('btn-executar-acao');
    
    let todosFuncionarios = [];
    let funcionarioSelecionadoParaAcao = null;
    let acaoDesejada = null;

    async function carregarFuncionarios() {
        try {
            const response = await fetch('/api/funcionarios');
            if (!response.ok) throw new Error('Erro ao buscar dados');
            todosFuncionarios = await response.json();
            
            aplicarFiltros(); 
        } catch (error) {
            console.error(error);
        }
    }

    function renderizarFuncionarios(funcionarios) {
        if (!listaContainer) return;
        listaContainer.innerHTML = '';

        if (funcionarios.length === 0) {
            listaContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: #64748B;">Nenhum funcionário encontrado.</div>`;
            return;
        }

        funcionarios.forEach(funcionario => {
            const nomeExibicao = String(funcionario.nomeCompleto || 'Funcionário sem nome');
            const documentoExibicao = String(funcionario.cpf || 'Não informado');
            const inicial = nomeExibicao.charAt(0).toUpperCase();
            const statusTexto = String(funcionario.status || 'Ativo');
            const statusClass = statusTexto.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';

            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.cursor = 'pointer';

            row.addEventListener('click', () => abrirModalDetalhes(funcionario));

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

    function aplicarFiltros() {
        const termoBusca = inputBusca ? inputBusca.value.toLowerCase().trim() : '';
        const statusSelecionado = selectStatus ? selectStatus.value.toLowerCase() : 'todos';

        const funcionariosFiltrados = todosFuncionarios.filter(funcionario => {
            const nome = String(funcionario.nomeCompleto || '').toLowerCase();
            const cpf = String(funcionario.cpf || '').toLowerCase();
            const bateBusca = nome.includes(termoBusca) || cpf.includes(termoBusca);
            
            const statusAtual = String(funcionario.status || 'Ativo').toLowerCase();
            const bateStatus = statusSelecionado === 'todos' || statusAtual === statusSelecionado;

            return bateBusca && bateStatus;
        });

        renderizarFuncionarios(funcionariosFiltrados);
    }

    if (inputBusca) inputBusca.addEventListener('input', aplicarFiltros);
    if (selectStatus) selectStatus.addEventListener('change', aplicarFiltros);

    function abrirModalDetalhes(funcionario) {
        const nome = funcionario.nomeCompleto || 'Funcionário sem nome';
        const statusVal = funcionario.status || 'Ativo';
        const statusClass = statusVal.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';
        
        const btnAcaoDesativar = document.getElementById('btn-acao-desativar');
        const btnAcaoAtivar = document.getElementById('btn-acao-ativar');

        if (btnAcaoDesativar) btnAcaoDesativar.onclick = () => abrirModalStatus(funcionario, 'Inativo');
        if (btnAcaoAtivar) btnAcaoAtivar.onclick = () => abrirModalStatus(funcionario, 'Ativo');

        document.getElementById('detalhe-avatar').textContent = nome.charAt(0).toUpperCase();
        document.getElementById('detalhe-nome').textContent = nome;
        document.getElementById('detalhe-subtitulo').textContent = funcionario.cargo || 'Cargo não informado';
        document.getElementById('detalhe-cpf-val').textContent = funcionario.cpf || 'Não informado';
        document.getElementById('detalhe-sexo-val').textContent = funcionario.sexo || 'Não informado';
        document.getElementById('detalhe-status-val').textContent = statusVal;
        document.getElementById('detalhe-badge-texto').textContent = statusVal;
        
        const badge = document.getElementById('detalhe-badge-status');
        if (badge) badge.className = `badge-status ${statusClass}`;

        document.getElementById('detalhe-telefone-val').textContent = funcionario.telefone || 'Não informado';

        const end = [funcionario.rua, funcionario.numero, funcionario.bairro, funcionario.cidade, funcionario.estado].filter(Boolean).join(', ');
        document.getElementById('detalhe-obs-val').textContent = end || 'Sem endereço cadastrado';

        if (btnAcaoEditar && funcionario.id) {
            btnAcaoEditar.href = `cadastro-funcionario.html?id=${encodeURIComponent(funcionario.id)}`;
        }

        if (modalDetalhes) modalDetalhes.classList.add('active');
    }

    if (btnFecharDetalhes && modalDetalhes) {
        btnFecharDetalhes.addEventListener('click', () => modalDetalhes.classList.remove('active'));
        modalDetalhes.addEventListener('click', (e) => {
            if (e.target === modalDetalhes) modalDetalhes.classList.remove('active');
        });
    }

    function abrirModalStatus(funcionario, acao) {
        funcionarioSelecionadoParaAcao = funcionario;
        acaoDesejada = acao; 

        const isAtivar = acao === 'Ativo';

        const topoAviso = document.getElementById('status-topo-aviso');
        const iconeTopo = document.getElementById('status-icone-topo');
        const tituloTopo = document.getElementById('status-titulo-topo');
        const tituloPrincipal = document.getElementById('status-titulo-principal');
        const pergunta = document.getElementById('status-pergunta');
        const descricao = document.getElementById('status-descricao');

        document.getElementById('status-val-nome').textContent = funcionario.nomeCompleto || 'Funcionário sem nome';
        document.getElementById('status-val-doc').textContent = funcionario.cpf || 'Não informado';
        document.getElementById('status-val-telefone').textContent = funcionario.telefone || 'Não informado';
        document.getElementById('status-val-nascimento').textContent = funcionario.dataNascimento || 'Não informada';
        document.getElementById('status-val-sexo').textContent = funcionario.sexo || 'Não informado';
        document.getElementById('status-val-cidade').textContent = `${funcionario.cidade || 'Cidade não informada'} - ${funcionario.estado || 'UF'}`;

        if (isAtivar) {
            topoAviso.className = 'status-header-aviso sucesso';
            if (iconeTopo) iconeTopo.setAttribute('data-lucide', 'shield-check');
            tituloTopo.textContent = 'REATIVAÇÃO';
            tituloPrincipal.textContent = 'Ativar Funcionário';
            pergunta.textContent = 'Deseja realmente ativar esse funcionário?';
            descricao.textContent = 'Ao ativar, o funcionário recuperará o acesso imediato aos sistemas da empresa.';
            
            btnExecutarAcao.textContent = 'Ativar';
            btnExecutarAcao.className = 'btn-acao-principal ativar';
        } else {
            topoAviso.className = 'status-header-aviso perigo';
            if (iconeTopo) iconeTopo.setAttribute('data-lucide', 'alert-triangle');
            tituloTopo.textContent = 'AÇÃO DESTRUTIVA';
            tituloPrincipal.textContent = 'Desativar Funcionário';
            pergunta.textContent = 'Deseja realmente desativar esse funcionário?';
            descricao.textContent = 'Ao desativar, ele perderá o acesso aos sistemas internos.';
            
            btnExecutarAcao.textContent = 'Desativar';
            btnExecutarAcao.className = 'btn-acao-principal desativar';
        }

        if (window.lucide) lucide.createIcons();
        if (modalConfirmarStatus) modalConfirmarStatus.classList.add('active');
    }

    if (btnCancelarAcao && modalConfirmarStatus) {
        btnCancelarAcao.addEventListener('click', () => modalConfirmarStatus.classList.remove('active'));
        modalConfirmarStatus.addEventListener('click', (e) => {
            if (e.target === modalConfirmarStatus) modalConfirmarStatus.classList.remove('active');
        });
    }

    if (btnExecutarAcao) {
        btnExecutarAcao.addEventListener('click', async () => {
            if (!funcionarioSelecionadoParaAcao) return;

            try {
                const response = await fetch('http://localhost:3000/atualizar-status-funcionario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: funcionarioSelecionadoParaAcao.id,
                        status: acaoDesejada 
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    funcionarioSelecionadoParaAcao.status = acaoDesejada;
                    mostrarToast(`Funcionário ${acaoDesejada === 'Ativo' ? 'ativado' : 'desativado'} com sucesso!`, 'sucesso');
                    modalConfirmarStatus.classList.remove('active');
                    if (modalDetalhes) modalDetalhes.classList.remove('active');
                    aplicarFiltros(); 
                } else {
                    mostrarToast('Erro ao atualizar status no servidor.', 'erro');
                }

            } catch (error) {
                console.error('Erro na requisição:', error);
                mostrarToast('Não foi possível conectar ao servidor.', 'erro');
            }
        });
    }

    carregarFuncionarios();
});