import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// caminho /login
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
});

app.listen(3000, () => 
    console.log('Servidor iniciado na porta 3000')
);