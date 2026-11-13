import {
    MADEIRAS_PRODUTO,
    validarProduto
} from '../validators/produtos.validator.js';

const validarId = valor => {
    const texto = String(valor ?? '');

    if (!/^[1-9]\d*$/.test(texto)) return null;

    const numero = Number(texto);

    return Number.isSafeInteger(numero) && numero <= 4294967295
        ? numero
        : null;
};

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

    // busca por nome, tipo ou modelo e filtro por madeira
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

        // pesquisa simultaneamente por nome, tipo e modelo
        if (busca) {
            const termo = `%${busca}%`;

            condicoes.push(`(
                LOWER(p.nome) LIKE LOWER(?)
                OR LOWER(CAST(p.tipo AS CHAR)) LIKE LOWER(?)
                OR LOWER(COALESCE(m.nome, '')) LIKE LOWER(?)
            )`);

            parametros.push(termo, termo, termo);
        }

        // aplica o filtro de madeira quando selecionado
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
                    p.status,
                    m.nome AS modelo
                 FROM Produto p
                 LEFT JOIN Modelo m
                    ON m.id_modelo = p.fk_id_modelo
                 ${where}
                 ORDER BY p.nome ASC, p.id_produto ASC`,
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

    async function obterProduto(req, res) {
        const id = validarId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID do produto inválido.'
            });
        }

        try {
            const [linhas] = await pool.execute(
                `SELECT
                p.id_produto AS id,
                p.nome,
                p.tipo,
                p.madeira,
                p.custo_medida AS custoMedida,
                p.preco_sugerido AS precoSugerido,
                p.quantidade,
                p.medida,
                p.status,
                p.fk_id_modelo AS modeloId,
                m.nome AS modelo
             FROM Produto p
             LEFT JOIN Modelo m
                ON m.id_modelo = p.fk_id_modelo
             WHERE p.id_produto = ?
             LIMIT 1`,
                [id]
            );

            if (!linhas.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado.'
                });
            }

            return res.json({
                success: true,
                produto: linhas[0]
            });

        } catch (erro) {
            console.error('Erro ao obter produto:', erro);

            return res.status(500).json({
                success: false,
                message: 'Não foi possível carregar o produto.'
            });
        }
    }

    // atualiza os dados de um produto existente.
    async function editarProduto(req, res) {
        const id = validarId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID do produto inválido.'
            });
        }

        const validacao = validarProduto(req.body);

        if (validacao.erro) {
            return res.status(400).json({
                success: false,
                message: validacao.erro
            });
        }

        const p = validacao.dados;

        try {
            // Verificar se o produto existe.
            const [atuais] = await pool.execute(
                'SELECT id_produto FROM Produto WHERE id_produto = ? LIMIT 1',
                [id]
            );

            if (!atuais.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado.'
                });
            }

            // Verificar modelo.
            const [modelos] = await pool.execute(
                'SELECT id_modelo FROM Modelo WHERE id_modelo = ? LIMIT 1',
                [p.modeloId]
            );

            if (!modelos.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Selecione um modelo válido.'
                });
            }

            // Ignorar o próprio produto ao verificar duplicidade.
            const [repetidos] = await pool.execute(
                `SELECT id_produto
             FROM Produto
             WHERE LOWER(TRIM(nome)) = LOWER(?)
               AND tipo = ?
               AND madeira = ?
               AND fk_id_modelo = ?
               AND id_produto <> ?
             LIMIT 1`,
                [
                    p.nome,
                    p.tipo,
                    p.madeira,
                    p.modeloId,
                    id
                ]
            );

            if (repetidos.length) {
                return res.status(409).json({
                    success: false,
                    message: 'Já existe outro produto com esses dados!'
                });
            }

            // Salvar alterações.
            const [resultado] = await pool.execute(
                `UPDATE Produto
             SET
                nome = ?,
                tipo = ?,
                custo_medida = ?,
                preco_sugerido = ?,
                madeira = ?,
                quantidade = ?,
                medida = ?,
                fk_id_modelo = ?
             WHERE id_produto = ?`,
                [
                    p.nome,
                    p.tipo,
                    p.custo,
                    p.preco,
                    p.madeira,
                    p.quantidade,
                    p.medida,
                    p.modeloId,
                    id
                ]
            );

            if (!resultado.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado.'
                });
            }

            return res.json({
                success: true,
                message: 'Produto atualizado com sucesso!'
            });

        } catch (erro) {
            console.error('Erro ao editar produto:', erro);

            if (erro.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Já existe outro produto com esses dados!'
                });
            }

            if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Modelo inexistente.'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Não foi possível atualizar o produto.'
            });
        }
    }

    async function alterarStatusProduto(req, res) {
        const id = validarId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID do produto inválido.'
            });
        }

        const status = req.body?.status;

        if (!['Ativo', 'Inativo'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido.'
            });
        }

        try {
            const [resultado] = await pool.execute(
                `UPDATE Produto
             SET status = ?
             WHERE id_produto = ?
               AND status <> ?`,
                [status, id, status]
            );

            if (!resultado.affectedRows) {
                const [linhas] = await pool.execute(
                    `SELECT status
                 FROM Produto
                 WHERE id_produto = ?
                 LIMIT 1`,
                    [id]
                );

                if (!linhas.length) {
                    return res.status(404).json({
                        success: false,
                        message: 'Produto não encontrado.'
                    });
                }

                return res.status(409).json({
                    success: false,
                    message: status === 'Ativo'
                        ? 'Produto já ativo!'
                        : 'Produto já desativado!'
                });
            }

            return res.json({
                success: true,
                message: status === 'Ativo'
                    ? 'Produto ativado com sucesso!'
                    : 'Produto desativado com sucesso!'
            });

        } catch (erro) {
            console.error('Erro ao mudar status do produto:', erro);

            return res.status(500).json({
                success: false,
                message: 'Não foi possível alterar o status do produto.'
            });
        }
    }

    return {
        listarModelosProduto,
        cadastrarProduto,
        listarProdutos,
        obterProduto,
        editarProduto,
        alterarStatusProduto
    };
};