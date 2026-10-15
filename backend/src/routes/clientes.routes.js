import { Router } from 'express';
import { permitirPerfis } from '../middlewares/auth.middleware.js';

import {
    cadastrarCliente,
    listarClientes,
    editarCliente,
    atualizarStatusCliente
} from '../controllers/clientes.controller.js';

const router = Router();

router.post('/cadastrar-cliente', permitirPerfis('Administrador', 'Funcionario'), cadastrarCliente);

router.get('/api/clientes', permitirPerfis('Administrador', 'Funcionario'), listarClientes);

router.put('/clientes/:id', permitirPerfis('Administrador', 'Funcionario'), editarCliente);

router.post('/atualizar-status', permitirPerfis('Administrador'), atualizarStatusCliente);

export default router;