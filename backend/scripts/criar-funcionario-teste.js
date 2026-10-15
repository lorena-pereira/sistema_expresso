
import bcrypt from 'bcrypt';
import pool from '../db/db.js';

async function criarFuncionarioTeste() {
    try {
        const login = 'funcionario_teste';
        const senha = 'teste123';
        const idFuncionario = 3; // Lucas Moraes

        // Verifica se o usuário já existe
        const [usuarios] = await pool.query(
            'SELECT id_usuario FROM Usuario WHERE login = ?',
            [login]
        );

        if (usuarios.length > 0) {
            console.log('Usuário de teste já cadastrado.');
            return;
        }

        // Busca o perfil Funcionário
        const [perfis] = await pool.query(
            'SELECT id_perfil FROM Perfil_Acesso WHERE nome = ?',
            ['Funcionario']
        );

        if (perfis.length === 0) {
            throw new Error('Perfil Funcionario não encontrado.');
        }

        // Gera o hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Cadastra o usuário vinculado ao funcionário
        await pool.query(
            `INSERT INTO Usuario
                (login, senha_hash, status, fk_id_perfil, fk_id_funcionario)
             VALUES (?, ?, 'Ativo', ?, ?)`,
            [login, senhaHash, perfis[0].id_perfil, idFuncionario]
        );

        console.log('Usuário de teste criado com sucesso!');
        console.log('Login:', login);
        console.log('Senha:', senha);

    } catch (erro) {
        console.error('Erro ao criar usuário de teste:', erro);
    } finally {
        await pool.end();
    }
}

criarFuncionarioTeste();
