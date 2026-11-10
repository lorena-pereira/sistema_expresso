-- Executar UMA ÚNICA VEZ no banco carpintaria existente.
-- Esta migração não apaga nem recria o banco de dados.
-- Antes de executar, verifique se existem produtos repetidos usando os
-- mesmos campos de identificação (nome, tipo, madeira e modelo).
-- Se já existir uma restrição com este nome, não execute novamente.

USE carpintaria;

-- Consulta de conferência: deve retornar zero linhas antes do ALTER TABLE.
SELECT
    nome,
    tipo,
    madeira,
    fk_id_modelo,
    COUNT(*) AS quantidade_registros
FROM Produto
GROUP BY nome, tipo, madeira, fk_id_modelo
HAVING COUNT(*) > 1;

ALTER TABLE Produto
    ADD CONSTRAINT uq_produto_cadastro
    UNIQUE (nome, tipo, madeira, fk_id_modelo);
