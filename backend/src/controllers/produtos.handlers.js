import {
    MADEIRAS_PRODUTO,
    validarProduto
} from '../validators/produtos.validator.js';

export function criarHandlersProdutos(pool) {
    async function listarModelosProduto(req, res) {
        try {
            const [modelos] = await pool.execute(
                `SELECT id_modelo AS id, nome
                 FROM Modelo
                 ORDER BY nome ASC, id_modelo ASC`
            );

            return res.status(200).json({ success: true, modelos });
        } catch (erro) {
            console.error('Erro ao buscar modelos de produto:', erro);
            return res.status(500).json({
                success: false,
                message: 'Não foi possível carregar os modelos.'
            });
        }
    }

    async function cadastrarProduto(req, res) {
        const validacao = validarProduto(req.body);

        if (validacao.erro) {
            return res.status(400).json({
                success: false,
                message: validacao.erro
            });
        }

        const produto = validacao.dados;

        try {
            const [modelos] = await pool.execute(
                'SELECT id_modelo FROM Modelo WHERE id_modelo = ? LIMIT 1',
                [produto.modeloId]
            );

            if (modelos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Modelo não encontrado. Selecione um modelo válido.'
                });
            }

            const [existentes] = await pool.execute(
                `SELECT id_produto
                 FROM Produto
                 WHERE LOWER(TRIM(nome)) = LOWER(?)
                   AND tipo = ?
                   AND madeira = ?
                   AND fk_id_modelo = ?
                 LIMIT 1`,
                [
                    produto.nome,
                    produto.tipo,
                    produto.madeira,
                    produto.modeloId
                ]
            );

            if (existentes.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Este produto já está cadastrado!'
                });
            }

            const [insercao] = await pool.execute(
                `INSERT INTO Produto (
                    nome,
                    tipo,
                    custo_medida,
                    preco_sugerido,
                    madeira,
                    quantidade,
                    medida,
                    metragem,
                    fk_id_modelo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
                [
                    produto.nome,
                    produto.tipo,
                    produto.custo,
                    produto.preco,
                    produto.madeira,
                    produto.quantidade,
                    produto.medida,
                    produto.modeloId
                ]
            );

            return res.status(201).json({
                success: true,
                idProduto: insercao.insertId,
                message: 'Operação realizada com sucesso!'
            });
        } catch (erro) {
            console.error('Erro ao cadastrar produto:', erro);

            if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Modelo não encontrado. Selecione um modelo válido.'
                });
            }

            if (erro.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Este produto já está cadastrado!'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Não foi possível cadastrar o produto. Tente novamente.'
            });
        }
    }

    // Busca por nome, tipo ou modelo e filtro por madeira.
    // Todos os produtos são retornados sem paginação.
    async function listarProdutos(req, res) {
        const busca = typeof req.query?.busca === 'string'
            ? req.query.busca.trim()
            : '';

        const madeira = typeof req.query?.madeira === 'string'
            ? req.query.madeira.trim()
            : '';

        if (busca.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'A busca deve conter no máximo 100 caracteres.'
            });
        }

        if (madeira && !MADEIRAS_PRODUTO.includes(madeira)) {
            return res.status(400).json({
                success: false,
                message: 'Filtro de madeira inválido.'
            });
        }

        const condicoes = [];
        const parametros = [];

        // Pesquisa simultaneamente por nome, tipo e modelo.
        if (busca) {
            const termo = `%${busca}%`;

            condicoes.push(`(
                LOWER(p.nome) LIKE LOWER(?)
                OR LOWER(CAST(p.tipo AS CHAR)) LIKE LOWER(?)
                OR LOWER(COALESCE(m.nome, '')) LIKE LOWER(?)
            )`);

            parametros.push(termo, termo, termo);
        }

        // Aplica o filtro de madeira quando selecionado.
        if (madeira) {
            condicoes.push('p.madeira = ?');
            parametros.push(madeira);
        }

        const where = condicoes.length
            ? `WHERE ${condicoes.join(' AND ')}`
            : '';

        try {
            const [produtos] = await pool.execute(
                `SELECT
                    p.id_produto AS id,
                    p.nome,
                    p.tipo,
                    p.madeira,
                    p.custo_medida AS custoMedida,
                    p.preco_sugerido AS precoSugerido,
                    p.quantidade,
                    p.medida,
                    m.nome AS modelo
                 FROM Produto p
                 LEFT JOIN Modelo m
                    ON m.id_modelo = p.fk_id_modelo
                 ${where}
                 ORDER BY p.id_produto DESC`,
                parametros
            );

            return res.status(200).json({
                success: true,
                produtos,
                total: produtos.length
            });

        } catch (erro) {
            console.error('Erro ao listar produtos:', erro);

            return res.status(500).json({
                success: false,
                message: 'Não foi possível carregar os produtos.'
            });
        }
    }

    return {
        listarModelosProduto,
        cadastrarProduto,
        listarProdutos
    };
}