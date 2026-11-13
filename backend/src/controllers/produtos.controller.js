import pool from '../../db/db.js';
import { criarHandlersProdutos } from './produtos.handlers.js';

export const {
    listarModelosProduto,
    cadastrarProduto,
    listarProdutos,
    obterProduto,
    editarProduto,
    alterarStatusProduto
} = criarHandlersProdutos(pool);