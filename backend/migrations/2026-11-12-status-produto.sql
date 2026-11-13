-- Executar uma única vez no banco carpintaria
-- Não executar novamente o schema.sql

ALTER TABLE Produto
    ADD COLUMN status ENUM('Ativo', 'Inativo')
    NOT NULL DEFAULT 'Ativo';