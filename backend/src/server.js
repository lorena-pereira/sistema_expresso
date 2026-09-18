import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();

app.use(cors());
app.use(express.json());

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

app.listen(3000, () => 
    console.log('Servidor iniciado na porta 3000')
);