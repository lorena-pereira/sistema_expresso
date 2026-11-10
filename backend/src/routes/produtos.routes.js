import { Router } from 'express';
import { permitirPerfis } from '../middlewares/auth.middleware.js';
import {
    cadastrarProduto,
    listarModelosProduto,
    listarProdutos
} from '../controllers/produtos.controller.js';

const router = Router();
const usuariosAutorizados = permitirPerfis('Administrador', 'Funcionario');

router.get('/api/modelos-produto', usuariosAutorizados, listarModelosProduto);
router.get('/api/produtos', usuariosAutorizados, listarProdutos);
router.post('/api/produtos', usuariosAutorizados, cadastrarProduto);

export default router;
