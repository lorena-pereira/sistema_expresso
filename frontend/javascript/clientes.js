document.addEventListener('DOMContentLoaded', () => {
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
    
    let todosClientes = [];

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
            renderizarClientes(todosClientes);
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
            const nomeExibicao = cliente.nomeCompleto || cliente.razaoSocial || 'Cliente sem nome';
            const documentoExibicao = cliente.cpf || cliente.cnpj || 'Não informado';
            const inicial = nomeExibicao.charAt(0).toUpperCase();
            const statusTexto = cliente.status || 'Ativo';
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
        const statusSelecionado = selectStatus ? selectStatus.value : 'todos';

        const clientesFiltrados = todosClientes.filter(cliente => {
            const nome = (cliente.nomeCompleto || cliente.razaoSocial || '').toLowerCase();
            const doc = (cliente.cpf || cliente.cnpj || '').toLowerCase();
            const cidade = (cliente.cidade || '').toLowerCase();

            // Verifica se busca combina com Nome, CPF/CNPJ ou Cidade
            const bateBusca = nome.includes(termoBusca) || doc.includes(termoBusca) || cidade.includes(termoBusca);
            
            // Verifica o status selecionado
            const statusAtual = cliente.status || 'Ativo';
            const bateStatus = statusSelecionado === 'todos' || statusAtual.toLowerCase() === statusSelecionado.toLowerCase();

            return bateBusca && bateStatus;
        });

        renderizarClientes(clientesFiltrados);
    }

    // --- ESCUTADORES DE EVENTOS PARA BUSCA ---
    if (inputBusca) inputBusca.addEventListener('input', aplicarFiltros);
    if (selectStatus) selectStatus.addEventListener('change', aplicarFiltros);

    // --- MODAL DE DETALHES ---
    function abrirModalDetalhes(cliente) {
        const nome = cliente.nomeCompleto || cliente.razaoSocial || 'Cliente sem nome';
        const docLabel = cliente.cpf ? 'CPF' : 'CNPJ';
        const docValue = cliente.cpf || cliente.cnpj || 'Não informado';
        const statusVal = cliente.status || 'Ativo';
        const statusClass = statusVal.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';

        document.getElementById('detalhe-avatar').textContent = nome.charAt(0).toUpperCase();
        document.getElementById('detalhe-nome').textContent = nome;
        document.getElementById('detalhe-doc-label').textContent = docLabel;
        document.getElementById('detalhe-doc-val').textContent = docValue;
        document.getElementById('detalhe-status-val').textContent = statusVal;
        document.getElementById('detalhe-badge-texto').textContent = statusVal;
        
        const badge = document.getElementById('detalhe-badge-status');
        if (badge) badge.className = `badge-status ${statusClass}`;

        document.getElementById('detalhe-email-val').textContent = cliente.email || 'Não informado';
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

    carregarClientes();
});