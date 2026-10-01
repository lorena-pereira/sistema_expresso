import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/html/login.html'));
});

// caminho /login
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    // procura o arquivo JSON
    const usersFilePath = new URL('../data/users.json', import.meta.url);

    // leitura do arquivo JSON
    try {
        const rawData = fs.readFileSync(usersFilePath, 'utf-8');
        const users = JSON.parse(rawData);

        const user = users.find(u => u.user === usuario && u.password === senha);

        if (user) {
            return res.status(200).json({ 
                success: true, 
                message: "Login validado", 
                profile: user.profile 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: "Usuário ou senha inválidos." 
            });
        }
    } catch (error) {
        console.error("Erro interno:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erro no servidor." 
        });
    }
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/html/index.html'));
});

// caminho /cadastrar-cliente
app.post('/cadastrar-cliente', (req, res) => {
    // req.body contém os dados que enviamos pelo fetch no front-end
    const novoCliente = req.body; 

    // procura o arquivo JSON de clientes
    const clientesFilePath = new URL('../data/clientes.json', import.meta.url);

    try {
        let clientes = [];
        
        // verifica se o arquivo já existe para ler os dados antigos
        if (fs.existsSync(clientesFilePath)) {
            const rawData = fs.readFileSync(clientesFilePath, 'utf-8');
            // se o arquivo estiver vazio, previne erros no parse
            if (rawData) {
                clientes = JSON.parse(rawData);
            }
        }

        // adiciona um ID único simples e salva o novo cliente na lista
        novoCliente.id = Date.now(); 
        clientes.push(novoCliente);

        // grava a lista atualizada de volta no arquivo
        fs.writeFileSync(clientesFilePath, JSON.stringify(clientes, null, 2));

        return res.status(201).json({ 
            success: true, 
            message: "Cliente cadastrado com sucesso!" 
        });

    } catch (error) {
        console.error("Erro interno ao cadastrar:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erro no servidor ao salvar o cliente." 
        });
    }
});

app.get('/api/clientes', (req, res) => {
    // Usamos o __dirname para acessar a pasta backend de forma segura pelo servidor
    res.sendFile(path.join(__dirname, '../../backend/data/clientes.json'));
});

// caminho /clientes/:id
app.put('/clientes/:id', (req, res) => {
    const clientesFilePath = new URL('../data/clientes.json', import.meta.url);

    try {
        const rawData = fs.readFileSync(clientesFilePath, 'utf-8');
        const clientes = rawData ? JSON.parse(rawData) : [];
        const clienteIndex = clientes.findIndex(cliente => String(cliente.id) === req.params.id);

        if (clienteIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado.'
            });
        }

        clientes[clienteIndex] = {
            ...clientes[clienteIndex],
            ...req.body,
            id: clientes[clienteIndex].id
        };

        fs.writeFileSync(clientesFilePath, JSON.stringify(clientes, null, 2));

        return res.status(200).json({
            success: true,
            message: 'Cliente atualizado com sucesso!'
        });
    } catch (error) {
        console.error('Erro interno ao atualizar:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao atualizar o cliente.'
        });
    }
});

// caminho /atualizar-status
app.post('/atualizar-status', (req, res) => {
    const { id, status } = req.body;

    const clientesFilePath = new URL('../data/clientes.json', import.meta.url);

    try {
        if (!fs.existsSync(clientesFilePath)) {
            return res.status(404).json({ 
                success: false, 
                message: "Arquivo de clientes não encontrado." 
            });
        }

        const rawData = fs.readFileSync(clientesFilePath, 'utf-8');
        let clientes = JSON.parse(rawData);

        // Procura o cliente pelo ID
        const clienteIndex = clientes.findIndex(c => c.id === id);

        if (clienteIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: "Cliente não encontrado." 
            });
        }

        // Atualiza o status do cliente encontrado
        clientes[clienteIndex].status = status;

        // Salva a lista modificada de volta no arquivo JSON
        fs.writeFileSync(clientesFilePath, JSON.stringify(clientes, null, 2));

        return res.status(200).json({ 
            success: true, 
            message: "Status atualizado com sucesso!" 
        });

    } catch (error) {
        console.error("Erro interno ao atualizar status:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erro no servidor ao atualizar o status." 
        });
    }
});

app.get('/api/funcionarios', (req, res) => {
    const funcionariosFilePath = new URL('../data/funcionarios.json', import.meta.url);

    try {
        if (!fs.existsSync(funcionariosFilePath)) {
            return res.status(200).json([]);
        }

        const rawData = fs.readFileSync(funcionariosFilePath, 'utf-8');
        const funcionarios = rawData ? JSON.parse(rawData) : [];

        if (!Array.isArray(funcionarios)) {
            return res.status(500).json({ message: 'Dados de funcionários inválidos.' });
        }

        return res.status(200).json(funcionarios);
    } catch (error) {
        console.error('Erro interno ao buscar funcionários:', error);
        return res.status(500).json({ message: 'Erro no servidor ao buscar funcionários.' });
    }
});

app.post('/cadastrar-funcionario', (req, res) => {
    const novoFuncionario = req.body || {};
    const funcionariosFilePath = new URL('../data/funcionarios.json', import.meta.url);
    const camposObrigatorios = [
        'nomeCompleto', 'cpf', 'telefone', 'salario', 'comissao',
        'dataAdmissao', 'dataNascimento', 'cargo', 'sexo', 'bairro',
        'rua', 'numero', 'cidade', 'estado'
    ];

    const camposAusentes = camposObrigatorios.filter(campo =>
        String(novoFuncionario[campo] ?? '').trim() === ''
    );

    if (camposAusentes.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Preencha todos os campos obrigatórios.'
        });
    }

    const cpfNormalizado = String(novoFuncionario.cpf).replace(/\D/g, '');
    if (cpfNormalizado.length !== 11) {
        return res.status(400).json({
            success: false,
            message: 'O CPF deve conter 11 dígitos.'
        });
    }

    try {
        let funcionarios = [];
        if (fs.existsSync(funcionariosFilePath)) {
            const rawData = fs.readFileSync(funcionariosFilePath, 'utf-8');
            funcionarios = rawData ? JSON.parse(rawData) : [];
        }

        if (!Array.isArray(funcionarios)) {
            return res.status(500).json({
                success: false,
                message: 'Dados de funcionários inválidos.'
            });
        }

        const cpfJaCadastrado = funcionarios.some(funcionario =>
            String(funcionario.cpf || '').replace(/\D/g, '') === cpfNormalizado
        );

        if (cpfJaCadastrado) {
            return res.status(409).json({
                success: false,
                message: 'Já existe um funcionário cadastrado com este CPF.'
            });
        }

        novoFuncionario.id = Date.now();
        novoFuncionario.status = 'Ativo';
        funcionarios.push(novoFuncionario);
        fs.writeFileSync(funcionariosFilePath, JSON.stringify(funcionarios, null, 2));

        return res.status(201).json({
            success: true,
            message: 'Funcionário cadastrado com sucesso!',
            id: novoFuncionario.id
        });
    } catch (error) {
        console.error('Erro interno ao cadastrar funcionário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao salvar o funcionário.'
        });
    }
});

// caminho /funcionarios/:id (editar Funcionário)
app.put('/funcionarios/:id', (req, res) => {
    const funcionariosFilePath = new URL('../data/funcionarios.json', import.meta.url);

    try {
        const rawData = fs.readFileSync(funcionariosFilePath, 'utf-8');
        const funcionarios = rawData ? JSON.parse(rawData) : [];
        
        const funcionarioIndex = funcionarios.findIndex(f => String(f.id) === req.params.id);

        if (funcionarioIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Funcionário não encontrado.'
            });
        }

        // atualiza os dados mantendo o ID e o status original
        funcionarios[funcionarioIndex] = {
            ...funcionarios[funcionarioIndex],
            ...req.body,
            id: funcionarios[funcionarioIndex].id,
            status: funcionarios[funcionarioIndex].status 
        };

        fs.writeFileSync(funcionariosFilePath, JSON.stringify(funcionarios, null, 2));

        return res.status(200).json({
            success: true,
            message: 'Funcionário atualizado com sucesso!'
        });
    } catch (error) {
        console.error('Erro interno ao atualizar funcionário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao atualizar o funcionário.'
        });
    }
});

// caminho /atualizar-status-funcionario
app.post('/atualizar-status-funcionario', (req, res) => {
    const { id, status } = req.body;
    const funcionariosFilePath = new URL('../data/funcionarios.json', import.meta.url);

    try {
        if (id === undefined || !['Ativo', 'Inativo'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Informe um funcionário e um status válido.'
            });
        }

        if (!fs.existsSync(funcionariosFilePath)) {
            return res.status(404).json({ 
                success: false, 
                message: "Arquivo de funcionários não encontrado." 
            });
        }

        const rawData = fs.readFileSync(funcionariosFilePath, 'utf-8');
        let funcionarios = JSON.parse(rawData);

        const funcionarioIndex = funcionarios.findIndex(f => String(f.id) === String(id));

        if (funcionarioIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: "Funcionário não encontrado." 
            });
        }

        funcionarios[funcionarioIndex].status = status;
        fs.writeFileSync(funcionariosFilePath, JSON.stringify(funcionarios, null, 2));

        return res.status(200).json({ 
            success: true, 
            message: "Status atualizado com sucesso!" 
        });

    } catch (error) {
        console.error("Erro interno ao atualizar status do funcionário:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erro no servidor ao atualizar o status." 
        });
    }
});

app.listen(3000, () => 
    console.log('Servidor iniciado na porta 3000')
);