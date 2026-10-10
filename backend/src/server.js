import express from 'express';
import cors from 'cors';
import fs from 'fs';
import pool from '../db/db.js';

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


app.post('/cadastrar-cliente', async (req, res) => {
    const dados = req.body;
    console.log('Data recebida no POST:', req.body.dataNascimento);

    const conexao = await pool.getConnection();

    try {
        const tipo = {
            PF: 'Pessoa Física',
            PJ: 'Pessoa Jurídica',
            'Pessoa Física': 'Pessoa Física',
            'Pessoa Jurídica': 'Pessoa Jurídica'
        }[dados.tipo];

        if (!tipo) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de cliente inválido.'
            });
        }

        const nome = (
            tipo === 'Pessoa Física'
                ? dados.nomeCompleto
                : dados.nomeFantasia
        )?.trim();

        const rua = dados.rua?.trim();
        const uf = dados.estado?.trim().toUpperCase();
        const cidade = dados.cidade?.trim();
        const bairro = dados.bairro?.trim();
        const numero = dados.numero?.trim();

        if (!nome || !rua || !uf || !cidade || !bairro || !numero) {
            return res.status(400).json({
                success: false,
                message: 'Preencha todos os campos obrigatórios.'
            });
        }

        if (nome.length > 100 || rua.length > 150 ||
            bairro.length > 100 || cidade.length > 100 ||
            numero.length > 10 || uf.length !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Um ou mais campos possuem tamanho inválido.'
            });
        }

        const cpf = dados.cpf?.replace(/\D/g, '');
        const cnpj = dados.cnpj?.replace(/\D/g, '');
        const telefone = dados.telefone?.trim();
        const cep = dados.cep?.replace(/\D/g, '');

        if (tipo === 'Pessoa Física') {
            if (!cpf || cpf.length !== 11) {
                return res.status(400).json({
                    success: false,
                    message: 'O CPF deve conter 11 dígitos.'
                });
            }

            const sexosPermitidos = ['M', 'F', 'O', 'NB', 'I', 'NE'];

            if (!sexosPermitidos.includes(dados.sexo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Selecione um sexo válido.'
                });
            }

            const dataNascimento = dados.dataNascimento;

            if (
                typeof dataNascimento !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Informe uma data de nascimento válida.'
                });
            }

            const [ano, mes, dia] = dataNascimento.split('-').map(Number);
            const data = new Date(Date.UTC(ano, mes - 1, dia));

            const dataValida =
                data.getUTCFullYear() === ano &&
                data.getUTCMonth() === mes - 1 &&
                data.getUTCDate() === dia;

            const hoje = new Date();
            const hojeUTC = Date.UTC(
                hoje.getFullYear(),
                hoje.getMonth(),
                hoje.getDate()
            );

            if (
                !dataValida ||
                ano < 1900 ||
                data.getTime() > hojeUTC
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'A data de nascimento é inválida ou está no futuro.'
                });
            }
        } else {
            if (!cnpj || cnpj.length !== 14) {
                return res.status(400).json({
                    success: false,
                    message: 'O CNPJ deve conter 14 dígitos.'
                });
            }

            if (!dados.razaoSocial?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Informe a razão social.'
                });
            }

            if (dados.razaoSocial.trim().length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'A razão social deve ter até 50 caracteres.'
                });
            }
        }

        if (!telefone || telefone.length > 15) {
            return res.status(400).json({
                success: false,
                message: 'Informe um telefone válido.'
            });
        }

        if (cep && cep.length !== 8) {
            return res.status(400).json({
                success: false,
                message: 'O CEP deve conter 8 dígitos.'
            });
        }

        await conexao.beginTransaction();

        const [resultado] = await conexao.execute(
            `INSERT INTO Cliente
                (nome, tipo, cep, numero, rua, bairro, uf,
                 cidade, complemento, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                tipo,
                cep || null,
                numero,
                rua,
                bairro,
                uf,
                cidade,
                dados.complemento?.trim() || null,
                dados.status === 'Inativo' ? 'Inativo' : 'Ativo'
            ]
        );

        const idCliente = resultado.insertId;

        if (tipo === 'Pessoa Física') {
            console.log('Dados antes do INSERT:', {
                cpf,
                sexo: dados.sexo,
                dataNascimento: dados.dataNascimento,
                idCliente
            });

            await conexao.execute(
                `INSERT INTO Pessoa_Fisica
                    (cpf, sexo, data_nascimento, fk_id_cliente)
                VALUES (?, ?, ?, ?)`,
                [
                    cpf,
                    dados.sexo,
                    dados.dataNascimento,
                    idCliente
                ]
            );

            // Verifica o registro dentro da própria transação
            const [verificacao] = await conexao.execute(
                `SELECT
                    fk_id_cliente,
                    cpf,
                    sexo,
                    DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento
                FROM Pessoa_Fisica
                WHERE fk_id_cliente = ?`,
                [idCliente]
            );

            console.log('Dados gravados no MySQL:', verificacao);
        } else {
            await conexao.execute(
                `INSERT INTO Pessoa_Juridica
                    (cnpj, razao_social, inscricao_estadual,
                     fk_id_cliente)
                 VALUES (?, ?, ?, ?)`,
                [
                    cnpj,
                    dados.razaoSocial.trim(),
                    dados.inscricaoEstadual?.trim() || null,
                    idCliente
                ]
            );
        }

        await conexao.execute(
            `INSERT INTO Telefone_Cliente
                (telefone, fk_id_cliente)
             VALUES (?, ?)`,
            [telefone, idCliente]
        );

        await conexao.commit();

        return res.status(201).json({
            success: true,
            id: idCliente,
            message: 'Cliente cadastrado com sucesso!'
        });

    } catch (error) {
        try {
            await conexao.rollback();
        } catch (erroRollback) {
            console.error('Erro ao desfazer transação:', erroRollback);
        }

        console.error('Erro ao cadastrar cliente:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'CPF ou CNPJ já cadastrado.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Não foi possível cadastrar o cliente.'
        });

    } finally {
        conexao.release();
    }
});

app.get('/api/clientes', async (req, res) => {
    try {
        const query = `
            SELECT
                c.*,
                pf.cpf,
                pf.sexo,
                DATE_FORMAT(pf.data_nascimento, '%Y-%m-%d') AS data_nascimento,
                pj.cnpj,
                pj.razao_social,
                pj.inscricao_estadual,
                tc.telefone
            FROM Cliente c
            LEFT JOIN Pessoa_Fisica pf
                ON c.id_cliente = pf.fk_id_cliente
            LEFT JOIN Pessoa_Juridica pj
                ON c.id_cliente = pj.fk_id_cliente
            LEFT JOIN Telefone_Cliente tc
                ON c.id_cliente = tc.fk_id_cliente
        `;

        const [rows] = await pool.query(query);

        const clientesFormatados = rows.map(cliente => {
            const pessoaFisica = cliente.tipo === 'Pessoa Física';

            return {
                ...cliente,
                id: cliente.id_cliente,

                nomeCompleto: pessoaFisica ? cliente.nome : '',
                nomeFantasia: pessoaFisica ? '' : cliente.nome,

                cpf: cliente.cpf || '',
                sexo: cliente.sexo || '',
                dataNascimento: cliente.data_nascimento || '',

                cnpj: cliente.cnpj || '',
                razaoSocial: cliente.razao_social || '',
                inscricaoEstadual: cliente.inscricao_estadual || '',

                cpfCnpj: pessoaFisica
                    ? (cliente.cpf || '')
                    : (cliente.cnpj || ''),

                telefone: cliente.telefone || '',
                cep: cliente.cep || '',
                estado: cliente.uf || '',
                complemento: cliente.complemento || '',
                status: cliente.status || 'Ativo'
            };
        });

        res.status(200).json(clientesFormatados);

    } catch (error) {
        console.error('Erro ao buscar clientes no MySQL:', error);

        res.status(500).json({
            message: 'Erro no servidor ao buscar clientes.'
        });
    }
});

// caminho /clientes/:id
app.put('/clientes/:id', async (req, res) => {
    const conexao = await pool.getConnection();

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente inválido.'
            });
        }

        const dados = req.body;

        await conexao.beginTransaction();

        const [clientes] = await conexao.execute(
            `SELECT id_cliente, tipo
             FROM Cliente
             WHERE id_cliente = ?
             FOR UPDATE`,
            [id]
        );

        if (clientes.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado.'
            });
        }

        const clienteExistente = clientes[0];

        const pessoaFisica =
            clienteExistente.tipo === 'Pessoa Física';

        // O formulário envia PF/PJ, mas o banco usa nomes completos.
        const tipoEnviado = dados.tipo === 'PF'
            ? 'Pessoa Física'
            : dados.tipo === 'PJ'
                ? 'Pessoa Jurídica'
                : dados.tipo;

        if (tipoEnviado !== clienteExistente.tipo) {
            await conexao.rollback();

            return res.status(400).json({
                success: false,
                message: 'Não é permitido alterar o tipo do cliente durante a edição.'
            });
        }

        const nome = pessoaFisica
            ? dados.nomeCompleto
            : dados.nomeFantasia;

        if (!nome || !nome.trim()) {
            await conexao.rollback();

            return res.status(400).json({
                success: false,
                message: 'O nome do cliente é obrigatório.'
            });
        }

        const cep = String(dados.cep || '').replace(/\D/g, '');

        if (cep && cep.length !== 8) {
            await conexao.rollback();

            return res.status(400).json({
                success: false,
                message: 'O CEP deve conter 8 dígitos.'
            });
        }

        const telefone = String(dados.telefone || '').trim();

        if (!telefone || telefone.length > 15) {
            await conexao.rollback();

            return res.status(400).json({
                success: false,
                message: 'Informe um telefone válido.'
            });
        }

        await conexao.execute(
            `UPDATE Cliente
             SET nome = ?,
                 cep = ?,
                 numero = ?,
                 rua = ?,
                 bairro = ?,
                 uf = ?,
                 cidade = ?,
                 complemento = ?
             WHERE id_cliente = ?`,
            [
                nome.trim(),
                cep || null,
                dados.numero || null,
                dados.rua,
                dados.bairro || null,
                dados.estado,
                dados.cidade,
                dados.complemento || null,
                id
            ]
        );

        if (pessoaFisica) {
            const cpf = String(dados.cpf || '').replace(/\D/g, '');

            if (cpf.length !== 11) {
                await conexao.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'O CPF deve conter 11 dígitos.'
                });
            }

            if (!['M', 'F', 'O', 'NB', 'I', 'NE'].includes(dados.sexo)) {
                await conexao.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Selecione uma opção válida para sexo.'
                });
            }

            const dataNascimento = dados.dataNascimento;

            if (
                typeof dataNascimento !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)
            ) {
                await conexao.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Informe uma data de nascimento válida.'
                });
            }

            const [ano, mes, dia] = dataNascimento.split('-').map(Number);
            const data = new Date(Date.UTC(ano, mes - 1, dia));

            const dataValida =
                data.getUTCFullYear() === ano &&
                data.getUTCMonth() === mes - 1 &&
                data.getUTCDate() === dia;

            const hoje = new Date();
            const hojeUTC = Date.UTC(
                hoje.getFullYear(),
                hoje.getMonth(),
                hoje.getDate()
            );

            if (!dataValida || ano < 1900 || data.getTime() > hojeUTC) {
                await conexao.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'A data de nascimento é inválida ou está no futuro.'
                });
            }

            await conexao.execute(
                `UPDATE Pessoa_Fisica
                SET cpf = ?,
                    sexo = ?,
                    data_nascimento = ?
                WHERE fk_id_cliente = ?`,
                [
                    cpf,
                    dados.sexo,
                    dados.dataNascimento,
                    id
                ]
            );
        } else {
            const cnpj = String(dados.cnpj || '').replace(/\D/g, '');

            if (cnpj.length !== 14) {
                await conexao.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'O CNPJ deve conter 14 dígitos.'
                });
            }

            await conexao.execute(
                `UPDATE Pessoa_Juridica
                 SET cnpj = ?,
                     razao_social = ?,
                     inscricao_estadual = ?
                 WHERE fk_id_cliente = ?`,
                [
                    cnpj,
                    dados.razaoSocial,
                    dados.inscricaoEstadual || null,
                    id
                ]
            );
        }

        // O formulário trabalha com um telefone por cliente.
        await conexao.execute(
            'DELETE FROM Telefone_Cliente WHERE fk_id_cliente = ?',
            [id]
        );

        await conexao.execute(
            `INSERT INTO Telefone_Cliente (telefone, fk_id_cliente)
             VALUES (?, ?)`,
            [telefone, id]
        );

        await conexao.commit();

        return res.status(200).json({
            success: true,
            message: 'Cliente atualizado com sucesso!'
        });

    } catch (error) {
        await conexao.rollback();

        console.error('Erro ao atualizar cliente:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'O CPF ou CNPJ informado já está cadastrado.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erro interno ao atualizar o cliente.'
        });

    } finally {
        conexao.release();
    }
});

// Atualizar status de um cliente no MySQL
app.post('/atualizar-status', async (req, res) => {
    try {
        const { id, status } = req.body;

        // Valida o ID recebido
        const idCliente = Number(id);

        if (!Number.isInteger(idCliente) || idCliente <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente inválido.'
            });
        }

        // Valida os valores permitidos pelo banco
        if (!['Ativo', 'Inativo'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido. Utilize Ativo ou Inativo.'
            });
        }

        // Verifica se o cliente existe
        const [clientes] = await pool.execute(
            `SELECT id_cliente
             FROM Cliente
             WHERE id_cliente = ?`,
            [idCliente]
        );

        if (clientes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado.'
            });
        }

        // Atualiza o status diretamente no MySQL
        await pool.execute(
            `UPDATE Cliente
             SET status = ?
             WHERE id_cliente = ?`,
            [status, idCliente]
        );

        return res.status(200).json({
            success: true,
            message: 'Status atualizado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao atualizar o status.'
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