import bcrypt from 'bcrypt';
import pool from '../../db/db.js';

export const cadastrarUsuario = async (req, res) => {
    const {
        login,
        senha,
        idPerfil,
        idFuncionario
    } = req.body || {};

    if (
        !login?.trim() ||
        typeof senha !== 'string' ||
        senha.length < 8 ||
        !Number.isInteger(Number(idPerfil)) ||
        Number(idPerfil) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Informe login, senha de pelo menos 8 caracteres e perfil válido.'
        });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 12);

        const [resultado] = await pool.execute(
            `INSERT INTO Usuario
                (login, senha_hash, fk_id_perfil, fk_id_funcionario)
             VALUES (?, ?, ?, ?)`,
            [
                login.trim(),
                senhaHash,
                Number(idPerfil),
                idFuncionario ? Number(idFuncionario) : null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            id: resultado.insertId
        });

    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Login ou funcionário já associado a outra conta.'
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Perfil ou funcionário informado não existe.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erro no servidor ao cadastrar usuário.'
        });
    }
};

export const login = async (req, res) => {
    const { usuario, senha } = req.body || {};

    if (
        typeof usuario !== 'string' ||
        !usuario.trim() ||
        typeof senha !== 'string' ||
        !senha
    ) {
        return res.status(400).json({
            success: false,
            message: 'Informe usuário e senha.'
        });
    }

    try {
        const [usuarios] = await pool.execute(
            `SELECT
                u.id_usuario,
                u.login,
                u.senha_hash,
                u.status,
                u.fk_id_funcionario,
                p.nome AS perfil
             FROM Usuario u
             INNER JOIN Perfil_Acesso p
                ON p.id_perfil = u.fk_id_perfil
             WHERE u.login = ?`,
            [usuario.trim()]
        );

        const usuarioEncontrado = usuarios[0];

        if (!usuarioEncontrado) {
            return res.status(401).json({
                success: false,
                message: 'Usuário ou senha inválidos.'
            });
        }

        const senhaValida = await bcrypt.compare(
            senha,
            usuarioEncontrado.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Usuário ou senha inválidos.'
            });
        }

        if (usuarioEncontrado.status !== 'Ativo') {
            return res.status(403).json({
                success: false,
                message: 'Usuário inativo.'
            });
        }

        req.session.regenerate((erro) => {
            if (erro) {
                console.error('Erro ao criar sessão:', erro);
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao iniciar sessão.'
                });
            }

            req.session.usuario = {
                id: usuarioEncontrado.id_usuario,
                login: usuarioEncontrado.login,
                perfil: usuarioEncontrado.perfil,
                idFuncionario: usuarioEncontrado.fk_id_funcionario
            };

            req.session.save((erro) => {
                if (erro) {
                    console.error('Erro ao salvar sessão:', erro);
                    return res.status(500).json({
                        success: false,
                        message: 'Erro ao salvar sessão.'
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Login realizado com sucesso!',
                    profile: usuarioEncontrado.perfil
                });
            });
        });

    } catch (error) {
        console.error('Erro ao realizar login:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro no servidor.'
        });
    }
};