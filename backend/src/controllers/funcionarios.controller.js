import pool from '../../db/db.js';
import bcrypt from 'bcrypt';

export const listarFuncionarios = async (req, res) => {
    try {
        const [funcionarios] = await pool.execute(`
            SELECT
                f.id_funcionario,
                f.nome,
                f.cpf,
                f.salario,
                f.comissao,
                DATE_FORMAT(f.data_admissao, '%Y-%m-%d') AS data_admissao,
                DATE_FORMAT(f.data_nascimento, '%Y-%m-%d') AS data_nascimento,
                f.cargo,
                f.sexo,
                f.cep,
                f.numero,
                f.rua,
                f.bairro,
                f.uf,
                f.cidade,
                f.status,
                tf.telefone
            FROM Funcionario f
            LEFT JOIN (
                SELECT
                    fk_id_funcionario,
                    MIN(telefone) AS telefone
                FROM Telefone_Funcionario
                GROUP BY fk_id_funcionario
            ) tf ON tf.fk_id_funcionario = f.id_funcionario
            ORDER BY f.id_funcionario DESC
        `);

        const resultado = funcionarios.map(funcionario => ({
            ...funcionario,

            // Identificador utilizado pelo frontend
            id: funcionario.id_funcionario,

            // Campos esperados pelo formulário
            nomeCompleto: funcionario.nome,
            dataAdmissao: funcionario.data_admissao || '',
            dataNascimento: funcionario.data_nascimento || '',
            estado: funcionario.uf,
            telefone: funcionario.telefone || '',

            // Campos adicionais
            cpf: funcionario.cpf,
            salario: funcionario.salario,
            comissao: funcionario.comissao,
            cargo: funcionario.cargo || '',
            sexo: funcionario.sexo || '',
            cep: funcionario.cep || '',
            numero: funcionario.numero || '',
            rua: funcionario.rua || '',
            bairro: funcionario.bairro || '',
            cidade: funcionario.cidade || '',
            status: funcionario.status || 'Ativo'
        }));

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);

        return res.status(500).json({
            message: 'Erro no servidor ao buscar funcionários.'
        });
    }
};

export const cadastrarFuncionario = async (req, res) => {
    const dados = req.body || {};

    const criarAcesso = dados.criarAcesso === true ||
                    dados.criarAcesso === 'true';

    const camposObrigatorios = [
        'nomeCompleto', 'cpf', 'telefone', 'salario', 'comissao',
        'dataAdmissao', 'dataNascimento', 'cargo', 'sexo', 'bairro',
        'rua', 'numero', 'cidade', 'estado'
    ];

    if (criarAcesso) {
        camposObrigatorios.push('login', 'senha');
    }

    if (criarAcesso &&
        (typeof dados.senha !== 'string' || dados.senha.length < 8)) {
        return res.status(400).json({
            success: false,
            message: 'A senha deve conter pelo menos 8 caracteres.'
        });
    }

    const login = String(dados.login ?? '').trim();

    const camposAusentes = camposObrigatorios.filter(campo =>
        String(dados[campo] ?? '').trim() === ''
    );

    if (camposAusentes.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Preencha todos os campos obrigatórios.'
        });
    }

    const cpf = String(dados.cpf).replace(/\D/g, '');
    const telefone = String(dados.telefone).replace(/\D/g, '');
    const cep = String(dados.cep || '').replace(/\D/g, '');

    if (cpf.length !== 11) {
        return res.status(400).json({
            success: false,
            message: 'O CPF deve conter 11 dígitos.'
        });
    }

    if (!['M', 'F', 'O', 'NB', 'I', 'NE'].includes(dados.sexo)) {
        return res.status(400).json({
            success: false,
            message: 'Sexo inválido.'
        });
    }

    let conexao;

    try {
        conexao = await pool.getConnection();

        await conexao.beginTransaction();

        // Verifica se o CPF já está cadastrado
        const [existentes] = await conexao.execute(
            'SELECT id_funcionario FROM Funcionario WHERE cpf = ?',
            [cpf]
        );

        if (existentes.length > 0) {
            await conexao.rollback();

            return res.status(409).json({
                success: false,
                message: 'Já existe um funcionário cadastrado com este CPF.'
            });
        }

        // Insere os dados do funcionário
        const [resultado] = await conexao.execute(
            `INSERT INTO Funcionario (
                nome, salario, comissao, data_admissao,
                cargo, cpf, cep, numero, rua, bairro,
                uf, cidade, data_nascimento, sexo, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dados.nomeCompleto,
                dados.salario,
                dados.comissao,
                dados.dataAdmissao,
                dados.cargo,
                cpf,
                cep || null,
                dados.numero,
                dados.rua,
                dados.bairro,
                dados.estado,
                dados.cidade,
                dados.dataNascimento,
                dados.sexo,
                'Ativo'
            ]
        );

        const idFuncionario = resultado.insertId;

        // Insere o telefone na tabela relacionada
        await conexao.execute(
            `INSERT INTO Telefone_Funcionario (
                telefone, fk_id_funcionario
            ) VALUES (?, ?)`,
            [telefone, idFuncionario]
        );

        if (criarAcesso) {
            
            // Gera o hash da senha
            const senhaHash = await bcrypt.hash(dados.senha, 12);

            // Busca o perfil de funcionário
            const [perfis] = await conexao.execute(
                'SELECT id_perfil FROM Perfil_Acesso WHERE nome = ?',
                ['Funcionario']
            );

            if (perfis.length === 0) {
                throw new Error('Perfil de funcionário não encontrado.');
            }

            // Cria a conta de acesso vinculada ao funcionário
            await conexao.execute(
                `INSERT INTO Usuario (
                    login,
                    senha_hash,
                    status,
                    fk_id_perfil,
                    fk_id_funcionario
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    login,
                    senhaHash,
                    'Ativo',
                    perfis[0].id_perfil,
                    idFuncionario
                ]
            );
        }

        

        // Confirma o cadastro do funcionário, telefone e usuário
        await conexao.commit();

        return res.status(201).json({
            success: true,
            message: 'Funcionário cadastrado com sucesso!',
            id: idFuncionario
        });

    } catch (error) {
        if (conexao) {
            await conexao.rollback();
        }

        console.error('Erro ao cadastrar funcionário:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'CPF ou nome de usuário já cadastrado.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao salvar o funcionário.'
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
};

// caminho /funcionarios/:id (editar Funcionário)
export const editarFuncionario = async (req, res) => {
    const id = Number(req.params.id);
    const dados = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID de funcionário inválido.'
        });
    }

    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const [funcionarios] = await conexao.execute(
            'SELECT id_funcionario FROM Funcionario WHERE id_funcionario = ?',
            [id]
        );

        if (funcionarios.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                success: false,
                message: 'Funcionário não encontrado.'
            });
        }

        const cpf = String(dados.cpf || '').replace(/\D/g, '');
        const telefone = String(dados.telefone || '').replace(/\D/g, '');
        const cep = String(dados.cep || '').replace(/\D/g, '');

        function converterValorMonetario(valor) {
            const texto = String(valor ?? '').trim();

            if (texto.includes(',')) {
                return Number(
                    texto.replace(/[^\d,.-]/g, '')
                        .replace(/\./g, '')
                        .replace(',', '.')
                );
            }

            return Number(texto.replace(/[^\d.-]/g, ''));
        }

        const salario = converterValorMonetario(dados.salario);
        const comissao = converterValorMonetario(dados.comissao);

        await conexao.execute(
            `UPDATE Funcionario
             SET nome = ?,
                 cpf = ?,
                 salario = ?,
                 comissao = ?,
                 data_admissao = ?,
                 data_nascimento = ?,
                 cargo = ?,
                 sexo = ?,
                 cep = ?,
                 numero = ?,
                 rua = ?,
                 bairro = ?,
                 uf = ?,
                 cidade = ?
             WHERE id_funcionario = ?`,
            [
                dados.nomeCompleto,
                cpf,
                salario,
                comissao,
                dados.dataAdmissao,
                dados.dataNascimento,
                dados.cargo,
                dados.sexo,
                cep || null,
                dados.numero,
                dados.rua,
                dados.bairro,
                dados.estado,
                dados.cidade,
                id
            ]
        );

        await conexao.execute(
            'DELETE FROM Telefone_Funcionario WHERE fk_id_funcionario = ?',
            [id]
        );

        await conexao.execute(
            `INSERT INTO Telefone_Funcionario
             (telefone, fk_id_funcionario)
             VALUES (?, ?)`,
            [telefone, id]
        );

        await conexao.commit();

        return res.status(200).json({
            success: true,
            message: 'Funcionário atualizado com sucesso!'
        });

    } catch (error) {
        if (conexao) await conexao.rollback();

        console.error('Erro ao atualizar funcionário:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'CPF já cadastrado para outro funcionário.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao atualizar o funcionário.'
        });

    } finally {
        if (conexao) conexao.release();
    }
};

// caminho /atualizar-status-funcionario
export const atualizarStatusFuncionario = async (req, res) => {
    const { id, status } = req.body || {};
    const idFuncionario = Number(id);

    if (
        !Number.isInteger(idFuncionario) ||
        idFuncionario <= 0 ||
        !['Ativo', 'Inativo'].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Informe um funcionário e um status válido.'
        });
    }

    try {
        const [resultado] = await pool.execute(
            `UPDATE Funcionario
             SET status = ?
             WHERE id_funcionario = ?`,
            [status, idFuncionario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Funcionário não encontrado.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Status atualizado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao atualizar status do funcionário:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao atualizar o status.'
        });
    }
};