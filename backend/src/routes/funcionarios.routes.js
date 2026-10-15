import { Router } from 'express';
import { permitirPerfis } from '../middlewares/auth.middleware.js';

import {
    listarFuncionarios,
    cadastrarFuncionario,
    editarFuncionario,
    atualizarStatusFuncionario
} from '../controllers/funcionarios.controller.js';

const router = Router();

router.post(
    '/cadastrar-funcionario',
    permitirPerfis('Administrador'),
    cadastrarFuncionario
);

router.get(
    '/api/funcionarios',
    permitirPerfis('Administrador'),
    listarFuncionarios
);

router.put(
    '/funcionarios/:id',
    permitirPerfis('Administrador'),
    editarFuncionario
);

router.post(
    '/atualizar-status-funcionario',
    permitirPerfis('Administrador'),
    atualizarStatusFuncionario
);

export default router;