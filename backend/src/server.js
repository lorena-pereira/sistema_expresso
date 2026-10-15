import express from 'express';
import cors from 'cors';
import fs from 'fs';
import session from 'express-session';
import crypto from 'node:crypto';
import pool from '../db/db.js';
import { login } from './controllers/auth.controller.js';
import clientesRoutes from './routes/clientes.routes.js';
import funcionariosRoutes from './routes/funcionarios.routes.js';

const app = express();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres.');
}

app.use(session({
    name: 'sistema_expresso.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));


app.get('/api/auth/sessao', (req, res) => {
    if (!req.session?.usuario) {
        return res.status(401).json({
            success: false,
            autenticado: false,
            message: 'Usuário não autenticado.'
        });
    }

    return res.status(200).json({
        success: true,
        autenticado: true,
        usuario: {
            id: req.session.usuario.id,
            login: req.session.usuario.login,
            perfil: req.session.usuario.perfil
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    if (!req.session) {
        return res.status(500).json({
            success: false,
            message: 'Sessão indisponível.'
        });
    }

    req.session.destroy((erro) => {
        if (erro) {
            console.error('Erro ao encerrar sessão:', erro);

            return res.status(500).json({
                success: false,
                message: 'Não foi possível encerrar a sessão.'
            });
        }

        res.clearCookie('sistema_expresso.sid', {
            path: '/'
        });

        return res.status(200).json({
            success: true,
            message: 'Logout realizado com sucesso.'
        });
    });
});


app.use(clientesRoutes);
app.use(funcionariosRoutes);

app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/html/login.html'));
});

// caminho /login
// Autenticação pelo MySQL
app.post('/login', login);

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/html/index.html'));
});

app.listen(3000, () => 
    console.log('Servidor iniciado na porta 3000')
);