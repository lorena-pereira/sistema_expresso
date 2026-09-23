document.addEventListener('DOMContentLoaded', () => {
    const listaContainer = document.getElementById('lista-clientes-body');
    const inputBusca = document.getElementById('input-busca-cliente');
    const selectStatus = document.getElementById('select-filtro-status');

    let todosClientes = [];

    // 1. Carrega os dados do arquivo JSON
    async function carregarClientes() {
        try {
            const response = await fetch('../../backend/data/clientes.json');
            if (!response.ok) throw new Error('Erro ao carregar lista de clientes');
            
            todosClientes = await response.json();
            renderizarClientes(todosClientes);
        } catch (error) {
            console.error('Erro:', error);
            listaContainer.innerHTML = '<p style="padding: 20px; color: #EF4444; text-align: center;">Erro ao carregar dados dos clientes.</p>';
        }
    }

    // 2. Renderiza as linhas da tabela
    function renderizarClientes(clientes) {
        listaContainer.innerHTML = '';

        if (clientes.length === 0) {
            listaContainer.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748B;">
                    Nenhum cliente encontrado.
                </div>`;
            return;
        }

        clientes.forEach(cliente => {
            // Define o nome principal (Nome Completo para PF ou Razão Social para PJ)
            const nomeExibicao = cliente.nomeCompleto || cliente.razaoSocial || 'Cliente sem nome';
            
            // Identifica se usa CPF ou CNPJ
            const documentoExibicao = cliente.cpf || cliente.cnpj || 'Não informado';

            // Pega a primeira letra para o avatar
            const inicial = nomeExibicao.charAt(0).toUpperCase();

            // Status (se não houver campo 'status' no JSON, define como 'Ativo' por padrão)
            const statusTexto = cliente.status || 'Ativo';
            const statusClass = statusTexto.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';

            const row = document.createElement('div');
            row.className = 'table-row';
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

        // Atualiza os ícones Lucide
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // 3. Aplica a busca por Nome, CPF/CNPJ ou Cidade
    function aplicarFiltros() {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const statusSelecionado = selectStatus.value;

        const clientesFiltrados = todosClientes.filter(cliente => {
            const nome = (cliente.nomeCompleto || cliente.razaoSocial || '').toLowerCase();
            const doc = (cliente.cpf || cliente.cnpj || '').toLowerCase();
            const cidade = (cliente.cidade || '').toLowerCase();

            const bateBusca = nome.includes(termoBusca) || doc.includes(termoBusca) || cidade.includes(termoBusca);
            
            const statusAtual = cliente.status || 'Ativo';
            const bateStatus = statusSelecionado === 'todos' || statusAtual === statusSelecionado;

            return bateBusca && bateStatus;
        });

        renderizarClientes(clientesFiltrados);
    }

    // Escutadores de eventos
    inputBusca.addEventListener('input', aplicarFiltros);
    selectStatus.addEventListener('change', aplicarFiltros);

    // Inicializa a listagem
    carregarClientes();
});

// Adicione este bloco dentro do evento DOMContentLoaded do seu clientes.js:

const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const modalOverlay = document.getElementById('modal-tipo-pessoa');

if (btnAbrirModal && modalOverlay) {
    // Abrir modal
    btnAbrirModal.addEventListener('click', () => {
        modalOverlay.classList.add('active');
    });

    // Fechar modal no botão 'X'
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }

    // Fechar modal ao clicar fora da caixa do modal
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });
}