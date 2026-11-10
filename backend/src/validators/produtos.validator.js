// Opções compatíveis com os ENUMs definidos na tabela Produto.
export const TIPOS_PRODUTO = Object.freeze([
    'PORTA',
    'JANELA',
    'MESA',
    'CADEIRA',
    'VENEZIANA',
    'MESA DE SINUCA',
    'MESA DE PEBOLIM',
    'SOFÁ',
    'DERIVADOS'
]);

export const MADEIRAS_PRODUTO = Object.freeze([
    'ANGELIN',
    'CEDRO',
    'JEQUITIBÁ',
    'VINHÁTICO'
]);

export const MEDIDAS_PRODUTO = Object.freeze(['UNIDADE', 'METROS']);

const vazio = valor => valor === undefined || valor === null ||
    (typeof valor === 'string' && valor.trim() === '');

/**
 * Converte valores monetários em formato brasileiro (1.234,56) ou decimal
 * simples (1234.56) para uma string DECIMAL(7,2) segura para o MySQL.
 */
export function decimalMonetario(valor, maximo = 99999.99) {
    if (typeof valor !== 'string' && typeof valor !== 'number') return null;
    if (typeof valor === 'number' && !Number.isFinite(valor)) return null;

    const texto = String(valor).trim();
    const formatoBrasilComMilhar = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto);
    const formatoBrasil = /^\d+(?:,\d{1,2})?$/.test(texto);
    const formatoDecimal = /^\d+(?:\.\d{1,2})?$/.test(texto);

    if (!formatoBrasilComMilhar && !formatoBrasil && !formatoDecimal) {
        return null;
    }

    const normalizado = formatoBrasilComMilhar || formatoBrasil
        ? texto.replace(/\./g, '').replace(',', '.')
        : texto;
    const numero = Number(normalizado);

    if (!Number.isFinite(numero) || numero < 0 || numero > maximo) {
        return null;
    }

    return numero.toFixed(2);
}

export function validarProduto(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { erro: 'Preencha todos os campos obrigatórios!' };
    }

    // Nome e medida também são necessários porque a tabela Produto atual
    // define essas duas colunas como NOT NULL, embora não constem no RF021.
    const camposObrigatorios = [
        'nome',
        'tipo',
        'modeloId',
        'madeira',
        'custoMedida',
        'precoSugerido',
        'quantidade',
        'medida'
    ];

    if (camposObrigatorios.some(campo => vazio(payload[campo]))) {
        return { erro: 'Preencha todos os campos obrigatórios!' };
    }

    const nome = typeof payload.nome === 'string'
        ? payload.nome.trim().replace(/\s+/g, ' ')
        : '';
    const tipo = typeof payload.tipo === 'string' ? payload.tipo.trim() : '';
    const madeira = typeof payload.madeira === 'string' ? payload.madeira.trim() : '';
    const medida = typeof payload.medida === 'string' ? payload.medida.trim() : '';
    const modeloId = Number(payload.modeloId);

    if (!nome || nome.length > 100) {
        return { erro: 'Nome do produto inválido (máximo de 100 caracteres).' };
    }

    if (!TIPOS_PRODUTO.includes(tipo)) {
        return { erro: 'Tipo de produto inválido.' };
    }

    if (!MADEIRAS_PRODUTO.includes(madeira)) {
        return { erro: 'Madeira inválida.' };
    }

    if (!MEDIDAS_PRODUTO.includes(medida)) {
        return { erro: 'Unidade de medida inválida.' };
    }

    if (
        !/^\d+$/.test(String(payload.modeloId)) ||
        !Number.isSafeInteger(modeloId) ||
        modeloId < 1 ||
        modeloId > 4294967295
    ) {
        return { erro: 'Selecione um modelo válido.' };
    }

    const custo = decimalMonetario(payload.custoMedida);
    const preco = decimalMonetario(payload.precoSugerido);

    if (custo === null || preco === null) {
        return { erro: 'Preço inválido!' };
    }

    if (!/^\d+$/.test(String(payload.quantidade))) {
        return { erro: 'Quantidade em estoque inválida.' };
    }

    const quantidade = Number(payload.quantidade);
    if (
        !Number.isSafeInteger(quantidade) ||
        quantidade < 0 ||
        quantidade > 4294967295
    ) {
        return { erro: 'Quantidade em estoque inválida.' };
    }

    return {
        dados: {
            nome,
            tipo,
            modeloId,
            madeira,
            custo,
            preco,
            quantidade,
            medida
        }
    };
}
