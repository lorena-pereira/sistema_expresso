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

app.listen(3000, () => 
    console.log('Servidor iniciado na porta 3000')
);