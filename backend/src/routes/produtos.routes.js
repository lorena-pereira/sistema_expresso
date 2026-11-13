import { Router } from 'express';
import { permitirPerfis } from '../middlewares/auth.middleware.js';
import {
    cadastrarProduto,
    listarModelosProduto,
    listarProdutos,
    obterProduto,
    editarProduto,
    alterarStatusProduto
} from '../controllers/produtos.controller.js';

const router = Router();

const autorizados = permitirPerfis(
    'Administrador',
    'Funcionario'
);

router.get(
    '/api/modelos-produto',
    autorizados,
    listarModelosProduto
);

router.get(
    '/api/produtos',
    autorizados,
    listarProdutos
);

router.post(
    '/api/produtos',
    autorizados,
    cadastrarProduto
);

router.get(
    '/api/produtos/:id',
    autorizados,
    obterProduto
);

router.put(
    '/api/produtos/:id',
    autorizados,
    editarProduto
);

router.patch(
    '/api/produtos/:id/status',
    autorizados,
    alterarStatusProduto
);

export default router;