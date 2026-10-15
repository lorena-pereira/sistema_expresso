
import bcrypt from 'bcrypt';
import pool from '../db/db.js';

// Contas exclusivamente para desenvolvimento
const usuarios = [
    { login: 'lorena', senha: 'lorena123' },
    { login: 'anaclara', senha: 'anaclara123' },
    { login: 'daniel', senha: 'daniel123' },
    { login: 'higor', senha: 'higor123' },
    { login: 'crijina', senha: 'crijina123' }
];

async function criarAdministradores() {
    try {
        const [perfis] = await pool.execute(
            'SELECT id_perfil FROM Perfil_Acesso WHERE nome = ?',
            ['Administrador']
        );

        if (!perfis.length) {
            throw new Error('Perfil Administrador não encontrado.');
        }

        const idPerfil = perfis[0].id_perfil;

        for (const usuario of usuarios) {
            const [existentes] = await pool.execute(
                'SELECT id_usuario FROM Usuario WHERE login = ?',
                [usuario.login]
            );

            if (existentes.length) {
                console.log(`Usuário ${usuario.login} já existe.`);
                continue;
            }

            const senhaHash = await bcrypt.hash(usuario.senha, 12);

            await pool.execute(
                `INSERT INTO Usuario
                    (login, senha_hash, status, fk_id_perfil, fk_id_funcionario)
                 VALUES (?, ?, 'Ativo', ?, NULL)`,
                [usuario.login, senhaHash, idPerfil]
            );

            console.log(`Usuário ${usuario.login} criado!`);
        }

        console.log('Inicialização dos usuários concluída.');
    } catch (error) {
        console.error('Erro:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

criarAdministradores();
