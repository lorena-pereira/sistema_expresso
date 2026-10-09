/* Esquema_Logico: */

DROP DATABASE IF EXISTS carpintaria;
CREATE DATABASE carpintaria;

USE carpintaria;

CREATE TABLE Cliente (
    id_cliente INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR (100) NOT NULL,
    tipo ENUM ('Pessoa Física','Pessoa Jurídica') NOT NULL,
    cep CHAR (8),
    numero VARCHAR (10),
    rua VARCHAR (150) NOT NULL,
    bairro VARCHAR (100),
    uf CHAR (2) NOT NULL,
    cidade VARCHAR (100) NOT NULL,
    complemento VARCHAR (100),
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE Funcionario (
    id_funcionario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR (100) NOT NULL,
    salario DECIMAL (7,2) UNSIGNED NOT NULL,
    comissao DECIMAL (5,2) UNSIGNED,
    data_admissao DATE NOT NULL,
    cargo VARCHAR (50),
    cpf CHAR (11) NOT NULL UNIQUE,
    cep CHAR (8),
    numero VARCHAR (10),
    rua VARCHAR (150) NOT NULL,
    bairro VARCHAR (100),
    uf CHAR (2) NOT NULL,
    cidade VARCHAR (100) NOT NULL
);

CREATE TABLE Pedido (
    id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    data_venda DATE NOT NULL,
    data_prevista_entrega DATE,
    valor DECIMAL (7,2) UNSIGNED NOT NULL,
    status ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'),
    fk_id_cliente INT UNSIGNED,
    fk_id_funcionario INT UNSIGNED
);

CREATE TABLE Item_Pedido (
    fk_id_pedido INT UNSIGNED,
    fk_id_produto INT UNSIGNED,
    quantidade INT UNSIGNED NOT NULL,
    preco_medida DECIMAL(7,2) UNSIGNED NOT NULL,
    desconto DECIMAL(7,2) UNSIGNED,
    metragem DECIMAL (5,2),
    PRIMARY KEY (fk_id_pedido, fk_id_produto)
);

CREATE TABLE Produto (
    id_produto INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR (100) NOT NULL,
    tipo ENUM ('PORTA', 'JANELA', 'MESA', 'CADEIRA', 'VENEZIANA', 'MESA DE SINUCA', 'MESA DE PEBOLIM', 'SOFÁ', 'DERIVADOS'),
    custo_medida DECIMAL (7,2) UNSIGNED NOT NULL,
    preco_sugerido DECIMAL (7,2) UNSIGNED NOT NULL,
    madeira ENUM ('ANGELIN', 'CEDRO', 'JEQUITIBÁ', 'VINHÁTICO'),
    quantidade INT UNSIGNED NOT NULL,
    medida ENUM ('METROS', 'UNIDADE') NOT NULL,
    metragem DECIMAL (5,2),
    fk_id_modelo INT UNSIGNED
);

CREATE TABLE Etapa (
    id_etapa INT UNSIGNED auto_increment,
    fk_id_pedido INT UNSIGNED,
    observacao TEXT,
    data_fim DATETIME,
    data_inicio DATETIME,
    nome ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'),
    fk_id_funcionario INT UNSIGNED,
    PRIMARY KEY (id_etapa, fk_id_pedido)
);

CREATE TABLE Parcela (
    id_parcela INT UNSIGNED auto_increment,
    fk_id_pedido INT UNSIGNED,
    data_parcela DATE NOT NULL,
    valor_parcela DECIMAL (7,2) UNSIGNED NOT NULL,
    forma_de_pagamento ENUM ('DINHEIRO', 'PIX', 'CRÉDITO', 'DÉBITO', 'BOLETO'),
    PRIMARY KEY (id_parcela, fk_id_pedido)
);

CREATE TABLE Telefone_Cliente (
    telefone VARCHAR(15) NOT NULL,
    fk_id_cliente INT UNSIGNED,
    PRIMARY KEY (fk_id_cliente, telefone)
);

CREATE TABLE Troca (
    fk_id_pedido INT UNSIGNED,
    fk_id_produto_venda INT UNSIGNED,
    fk_id_produto_troca INT UNSIGNED,
    data DATE NOT NULL,
    valor DECIMAL(7,2) UNSIGNED NOT NULL,
    quantidade INT UNSIGNED NOT NULL,
    preco_unitario DECIMAL(7,2) UNSIGNED,
    tipo_valor ENUM ('RESSARCIDO', 'COMPLEMENTAR', 'NENHUM'),
    PRIMARY KEY (fk_id_produto_troca, fk_id_pedido, fk_id_produto_venda)
);

CREATE TABLE Telefone_Funcionario (
    telefone VARCHAR (15) NOT NULL,
    fk_id_funcionario INT UNSIGNED,
    PRIMARY KEY (fk_id_funcionario, telefone)
);

CREATE TABLE Pessoa_Juridica (
    cnpj CHAR(14) NOT NULL UNIQUE,
    razao_social VARCHAR(50) NOT NULL,
    inscricao_estadual VARCHAR(20),
    fk_id_cliente INT UNSIGNED PRIMARY KEY
);

CREATE TABLE Pessoa_Fisica (
    cpf CHAR(11) NOT NULL UNIQUE,
    sexo ENUM('M', 'F', 'O', 'NB', 'I', 'NE') NOT NULL,
    fk_id_cliente INT UNSIGNED PRIMARY KEY
);

CREATE TABLE Modelo (
    id_modelo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR (30) NOT NULL,
    descricao VARCHAR (100)
);
 
ALTER TABLE Pedido ADD CONSTRAINT FK_Pedido_2
    FOREIGN KEY (fk_id_cliente)
    REFERENCES Cliente (id_cliente);
 
ALTER TABLE Pedido ADD CONSTRAINT FK_Pedido_3
    FOREIGN KEY (fk_id_funcionario)
    REFERENCES Funcionario (id_funcionario);
 
ALTER TABLE Item_Pedido ADD CONSTRAINT FK_Item_Pedido_2
    FOREIGN KEY (fk_id_produto)
    REFERENCES Produto (id_produto);
 
ALTER TABLE Item_Pedido ADD CONSTRAINT FK_Item_Pedido_3
    FOREIGN KEY (fk_id_pedido)
    REFERENCES Pedido (id_pedido);
 
ALTER TABLE Produto ADD CONSTRAINT FK_Produto_2
    FOREIGN KEY (fk_id_modelo)
    REFERENCES Modelo (id_modelo);
 
ALTER TABLE Etapa ADD CONSTRAINT FK_Etapa_2
    FOREIGN KEY (fk_id_pedido)
    REFERENCES Pedido (id_pedido);
 
ALTER TABLE Etapa ADD CONSTRAINT FK_Etapa_3
    FOREIGN KEY (fk_id_funcionario)
    REFERENCES Funcionario (id_funcionario);
 
ALTER TABLE Parcela ADD CONSTRAINT FK_Parcela_2
    FOREIGN KEY (fk_id_pedido)
    REFERENCES Pedido (id_pedido);
 
ALTER TABLE Telefone_Cliente ADD CONSTRAINT FK_Telefone_Cliente_1
    FOREIGN KEY (fk_id_cliente)
    REFERENCES Cliente (id_cliente);
 
ALTER TABLE Troca ADD CONSTRAINT FK_Troca_2
    FOREIGN KEY (fk_id_produto_troca)
    REFERENCES Produto (id_produto);
 
ALTER TABLE Troca ADD CONSTRAINT FK_Troca_3
    FOREIGN KEY (fk_id_pedido, fk_id_produto_venda)
    REFERENCES Item_Pedido (fk_id_pedido, fk_id_produto);
 
ALTER TABLE Telefone_Funcionario ADD CONSTRAINT FK_Telefone_Funcionario_1
    FOREIGN KEY (fk_id_funcionario)
    REFERENCES Funcionario (id_funcionario);
 
ALTER TABLE Pessoa_Juridica ADD CONSTRAINT FK_Pessoa_Juridica_2
    FOREIGN KEY (fk_id_cliente)
    REFERENCES Cliente (id_cliente);
 
ALTER TABLE Pessoa_Fisica ADD CONSTRAINT FK_Pessoa_Fisica_2
    FOREIGN KEY (fk_id_cliente)
    REFERENCES Cliente (id_cliente);
    
-- Tabela Cliente
INSERT INTO Cliente (nome, tipo, cep, numero, rua, bairro, uf, cidade) VALUES
('Ana Clara Costa', 'Pessoa Física', '45000000', '101', 'Rua dos Prates', 'Centro', 'BA', 'Vitória da Conquista'),
('Carlos Daniel Oliveira', 'Pessoa Física', '45028000', '202', 'Av. Frei Benjamim', 'Brasil', 'BA', 'Vitória da Conquista'),
('Higor Santana', 'Pessoa Física', '45028530', '303', 'Av. Olívia Flores', 'Candeias', 'BA', 'Vitória da Conquista'),
('Lorena Pereira', 'Pessoa Física', '45075000', '404', 'Rua Paulino Santos', 'Guarani', 'BA', 'Vitória da Conquista'),
('Raiane Melgaço', 'Pessoa Física', '45010000', '505', 'Av. Bartolomeu de Gusmão', 'Jurema', 'BA', 'Vitória da Conquista'),
('Roberto Almeida', 'Pessoa Física', '45020000', '606', 'Rua Siqueira Campos', 'Recreio', 'BA', 'Vitória da Conquista'),
('Juliana Mendes', 'Pessoa Física', '45050000', '707', 'Av. Itabuna', 'Patagonia', 'BA', 'Vitória da Conquista'),
('Fernando Costa', 'Pessoa Física', '45030000', '808', 'Rua Ascendino Melo', 'Centro', 'BA', 'Vitória da Conquista'),
('Amanda Rocha', 'Pessoa Física', '45065000', '909', 'Rua G', 'Boa Vista', 'BA', 'Vitória da Conquista'),
('Tiago Novaes', 'Pessoa Física', '45000000', '110', 'Praça Barão do Rio Branco', 'Centro', 'BA', 'Vitória da Conquista'),
('Construtora Alfa Ltda', 'Pessoa Jurídica', '45028000', '1000', 'Av. Brumado', 'Ibirapuera', 'BA', 'Vitória da Conquista'),
('Marcos Arquitetura ME', 'Pessoa Jurídica', '45028530', '1100', 'Av. Olívia Flores', 'Candeias', 'BA', 'Vitória da Conquista'),
('Engenharia Sul Bahia', 'Pessoa Jurídica', '45000000', '1200', 'Rua Zeferino Correia', 'Centro', 'BA', 'Vitória da Conquista'),
('Reforma Fácil SA', 'Pessoa Jurídica', '45075000', '1300', 'Rua da Granja', 'Alto Maron', 'BA', 'Vitória da Conquista'),
('Gama Design de Interiores', 'Pessoa Jurídica', '45010000', '1400', 'Av. Filipinas', 'Jurema', 'BA', 'Vitória da Conquista'),
('Imobiliária Conquista', 'Pessoa Jurídica', '45020000', '1500', 'Rua João Pessoa', 'Centro', 'BA', 'Vitória da Conquista'),
('Beta Obras e Projetos', 'Pessoa Jurídica', '45050000', '1600', 'Av. Integração', 'Alegria', 'BA', 'Vitória da Conquista'),
('Marcenaria do Vale', 'Pessoa Jurídica', '45030000', '1700', 'Rua B', 'Vila Serrana', 'BA', 'Vitória da Conquista'),
('Tudo Para Casa Ltda', 'Pessoa Jurídica', '45065000', '1800', 'Av. Juracy Magalhães', 'Felícia', 'BA', 'Vitória da Conquista'),
('Delta Empreiteira', 'Pessoa Jurídica', '45000000', '1900', 'Av. Luis Eduardo Magalhães', 'Candeias', 'BA', 'Vitória da Conquista');

-- Tabela Pessoa_Fisica
INSERT INTO Pessoa_Fisica (fk_id_cliente, cpf, sexo) VALUES
(1, '11111111111', 'F'), 
(2, '22222222222', 'M'), 
(3, '33333333333', 'M'),
(4, '44444444444', 'F'), 
(5, '55555555555', 'F'), 
(6, '66666666666', 'M'),
(7, '77777777777', 'F'), 
(8, '88888888888', 'M'), 
(9, '99999999999', 'F'),
(10, '10101010101', 'M');

-- Tabela Pessoa_Juridica
INSERT INTO Pessoa_Juridica (fk_id_cliente, cnpj, razao_social) VALUES
(11, '11111111000111', 'Construtora Alfa Ltda'), 
(12, '22222222000122', 'Marcos Arquitetura ME'),
(13, '33333333000133', 'Engenharia Sul Bahia'), 
(14, '44444444000144', 'Reforma Fácil SA'),
(15, '55555555000155', 'Gama Design de Interiores'), 
(16, '66666666000166', 'Imobiliária Conquista'),
(17, '77777777000177', 'Beta Obras e Projetos'), 
(18, '88888888000188', 'Marcenaria do Vale'),
(19, '99999999000199', 'Tudo Para Casa Ltda'), 
(20, '00000000000100', 'Delta Empreiteira');

-- Tabela Telefone_Cliente 
INSERT INTO Telefone_Cliente (fk_id_cliente, telefone) VALUES
(1, '77988881111'), 
(2, '77988882222'), 
(3, '77988883333'), 
(4, '77988884444'),
(5, '77988885555'), 
(6, '77988886666'), 
(7, '77988887777'), 
(8, '77988888888'),
(9, '77988889999'), 
(10, '77988881010'), 
(11, '7734221111'), 
(12, '7734222222'),
(13, '7734223333'), 
(14, '7734224444'), 
(15, '7734225555'), 
(16, '7734226666'),
(17, '7734227777'), 
(18, '7734228888'), 
(19, '7734229999'), 
(20, '7734220000');

-- Tabela Funcionario
INSERT INTO Funcionario (nome, salario, comissao, data_admissao, cargo, cpf, cep, numero, rua, bairro, uf, cidade) VALUES
('Carla Pereira Costa', 5000.00, 1.00, '2020-01-10', 'Gerente', '01010101010', '45028000', '616', 'Av. Brumado', 'Ibirapuera', 'BA', 'Vitória da Conquista'),
('Sthefane Costa Pereira', 2500.00, 1.00, '2022-05-15', 'Vendedora', '02020202020', '45028000', '616', 'Av. Brumado', 'Ibirapuera', 'BA', 'Vitória da Conquista'),
('Lucas Moraes', 2500.00, 1.00, '2023-02-20', 'Vendedor', '03030303030', '45000000', '12', 'Rua A', 'Centro', 'BA', 'Vitória da Conquista'),
('Pedro Henrique', 3000.00, 0.00, '2021-11-05', 'Marceneiro', '04040404040', '45028530', '45', 'Av. Olívia Flores', 'Candeias', 'BA', 'Vitória da Conquista'),
('Felipe Mendes', 3000.00, 0.00, '2022-03-10', 'Marceneiro', '05050505050', '45010000', '89', 'Av. Bartolomeu de Gusmão', 'Jurema', 'BA', 'Vitória da Conquista'),
('Marcos Silva', 2800.00, 0.00, '2023-08-01', 'Auxiliar de Produção', '06060606060', '45075000', '34', 'Rua Paulino Santos', 'Guarani', 'BA', 'Vitória da Conquista'),
('Rafaela Nunes', 2500.00, 1.00, '2024-01-10', 'Vendedora', '07070707070', '45050000', '67', 'Av. Itabuna', 'Patagonia', 'BA', 'Vitória da Conquista'),
('Bruno Cardoso', 3500.00, 0.00, '2019-07-22', 'Projetista', '08080808080', '45020000', '90', 'Rua Siqueira Campos', 'Recreio', 'BA', 'Vitória da Conquista'),
('João Paulo', 2200.00, 0.00, '2024-05-18', 'Entregador', '09090909090', '45065000', '110', 'Rua G', 'Boa Vista', 'BA', 'Vitória da Conquista'),
('Camila Rocha', 2800.00, 0.00, '2023-10-12', 'Administrativo', '12121212121', '45030000', '210', 'Rua Ascendino Melo', 'Centro', 'BA', 'Vitória da Conquista');

-- Tabela Telefone_Funcionario
INSERT INTO Telefone_Funcionario (fk_id_funcionario, telefone) VALUES
(1, '77999990001'), 
(2, '77999990002'), 
(3, '77999990003'), 
(4, '77999990004'),
(5, '77999990005'), 
(6, '77999990006'), 
(7, '77999990007'), 
(8, '77999990008'),
(9, '77999990009'), 
(10, '77999990010');

-- Tabela Modelo
INSERT INTO Modelo (nome, descricao) VALUES
('Lisa Padrão', 'Design totalmente liso, sem frisos ou relevos, ideal para ambientes internos.'),
('Duas Aberturas', 'Estrutura com duas folhas (dupla), permitindo abertura central simétrica.'),
('Linhas Altas', 'Design que privilegia frisos ou divisórias verticais ao longo de toda a peça.'),
('Almofadada Clássica', 'Relevos simétricos em formato de almofadas decorativas entalhadas na face principal.'),
('Correr Simples', 'Estrutura projetada para trilhos, com uma folha deslizante e uma folha fixa.'),
('Veneziana Dupla', 'Aletas inclinadas para ventilação em duas folhas horizontais articuladas ou de correr.'),
('Rústico Orgânico', 'Bordas irregulares que acompanham o formato natural do tronco da árvore.'),
('Ergonômico Curvo', 'Design com encosto ou estrutura arredondada para melhor adaptação ao corpo humano.'),
('Moderna Cromada', 'Design minimalista focado em acabamentos em linha reta, utilizado para ferragens.'),
('Profissional Caçapa Oculta', 'Design focado em mesas de jogos, com caçapas niveladas ao tecido e estrutura reforçada.');

-- Tabela Produto
INSERT INTO Produto (nome, tipo, custo_medida, preco_sugerido, madeira, quantidade, medida, metragem, fk_id_modelo) VALUES
('Porta de Quarto Lisa', 'PORTA', 150.00, 300.00, 'ANGELIN', 20, 'UNIDADE', 2.10, 1),
('Porta de Sala Dupla', 'PORTA', 400.00, 850.00, 'JEQUITIBÁ', 10, 'UNIDADE', 2.10, 2),
('Janela de Vidro e Madeira', 'JANELA', 200.00, 450.00, 'CEDRO', 15, 'UNIDADE', 1.20, 3),
('Janela Veneziana', 'VENEZIANA', 350.00, 700.00, 'VINHÁTICO', 12, 'UNIDADE', 1.50, 6),
('Mesa de Jantar 6 Lugares', 'MESA', 600.00, 1200.00, 'ANGELIN', 5, 'UNIDADE', 2.00, 7),
('Cadeira de Jantar', 'CADEIRA', 80.00, 180.00, 'JEQUITIBÁ', 30, 'UNIDADE', 1.00, 8),
('Porta Principal Almofadada', 'PORTA', 450.00, 950.00, 'CEDRO', 8, 'UNIDADE', 2.20, 4),
('Mesa de Sinuca Oficial', 'MESA DE SINUCA', 1500.00, 3200.00, 'VINHÁTICO', 3, 'UNIDADE', 2.80, 10),
('Fechadura Eletrônica Digital', 'DERIVADOS', 300.00, 650.00, NULL, 15, 'UNIDADE', NULL, 9),
('Dobradiça de Aço Inox', 'DERIVADOS', 15.00, 35.00, NULL, 100, 'UNIDADE', NULL, 9),
('Vista/Alizar de Acabamento 5cm', 'DERIVADOS', 8.00, 22.00, 'ANGELIN', 200, 'METROS', 1.00, 1),
('Fechadura Simples Externa', 'DERIVADOS', 45.00, 95.00, NULL, 40, 'UNIDADE', NULL, 9),
('Porta de Banheiro Lisa', 'PORTA', 140.00, 280.00, 'ANGELIN', 25, 'UNIDADE', 2.10, 1),
('Janela Correr Simples', 'JANELA', 180.00, 390.00, 'CEDRO', 18, 'UNIDADE', 1.00, 5),
('Puxador Inox Porta Pivotante', 'DERIVADOS', 90.00, 210.00, NULL, 20, 'UNIDADE', 0.80, 9);

-- Tabela Pedido
INSERT INTO Pedido (data_venda, data_prevista_entrega, valor, status, fk_id_cliente, fk_id_funcionario) VALUES
('2025-01-15', '2025-02-01', 300.00, 'CONCLUIDO', 1, 2),
('2025-02-20', '2025-03-05', 850.00, 'CONCLUIDO', 2, 3),
('2025-08-10', '2025-08-25', 1800.00, 'CONCLUIDO', 11, 2),
('2025-09-15', '2025-09-30', 700.00, 'CONCLUIDO', 3, 7),
('2025-12-10', '2025-12-25', 3200.00, 'CONCLUIDO', 15, 2),
('2025-12-20', '2026-01-05', 950.00, 'EM_ANDAMENTO', 4, 3),
('2026-01-10', '2026-01-25', 650.00, 'CONCLUIDO', 5, 2),
('2026-02-15', '2026-03-02', 1200.00, 'EM_ANDAMENTO', 18, 7),
('2026-04-05', '2026-04-20', 450.00, 'PENDENTE', 6, 2),
('2026-05-10', '2026-05-25', 1500.00, 'PENDENTE', 12, 3),
('2025-07-20', '2025-08-05', 500.00, 'CONCLUIDO', 7, 2),
('2025-08-25', '2025-09-10', 600.00, 'CONCLUIDO', 8, 3),
('2025-09-05', '2025-09-20', 1100.00, 'CONCLUIDO', 9, 2),
('2025-10-10', '2025-10-25', 800.00, 'CONCLUIDO', 10, 7),
('2025-11-15', '2025-11-30', 2100.00, 'CONCLUIDO', 13, 2),
('2025-11-28', '2025-12-10', 1300.00, 'CONCLUIDO', 14, 3);

-- Tabela Item_Pedido
INSERT INTO Item_Pedido (fk_id_pedido, fk_id_produto, quantidade, preco_medida, desconto, metragem) VALUES
(1, 1, 1, 300.00, 0.00, 2.10),
(2, 2, 1, 850.00, 0.00, 2.10),
(3, 5, 1, 1200.00, 0.00, 2.00),
(3, 6, 6, 100.00, 0.00, 1.00),
(4, 4, 1, 700.00, 0.00, 1.50),
(5, 8, 1, 3200.00, 0.00, 2.80),
(6, 7, 1, 950.00, 0.00, 2.20),
(7, 9, 1, 650.00, 0.00, NULL),
(8, 5, 1, 1200.00, 0.00, 2.00),
(9, 3, 1, 450.00, 0.00, 1.20),
(10, 2, 1, 850.00, 0.00, 2.10),
(10, 9, 1, 650.00, 0.00, NULL),
(11, 1, 1, 500.00, 0.00, 2.10),
(12, 5, 1, 600.00, 0.00, 2.00),
(13, 2, 1, 1100.00, 0.00, 2.10),
(14, 2, 1, 800.00, 0.00, 2.10),
(15, 5, 1, 2100.00, 0.00, 2.00),
(16, 8, 1, 1300.00, 0.00, 2.80);

-- Tabela Etapa 
INSERT INTO Etapa (fk_id_pedido, observacao, data_inicio, data_fim, nome, fk_id_funcionario) VALUES
(1, 'Corte da madeira e montagem inicial.', '2025-01-16 08:00:00', '2025-01-18 17:00:00', 'CONCLUIDO', 4),
(2, 'Ajuste de dobradiças para porta dupla.', '2025-02-21 08:00:00', '2025-02-25 17:00:00', 'CONCLUIDO', 5),
(3, 'Tratamento das tábuas da mesa e acabamento.', '2025-08-11 08:00:00', '2025-08-15 17:00:00', 'CONCLUIDO', 4),
(4, 'Montagem das aletas da veneziana.', '2025-09-16 08:00:00', '2025-09-20 17:00:00', 'CONCLUIDO', 6),
(5, 'Nivelamento do campo da mesa de sinuca.', '2025-12-11 08:00:00', '2025-12-15 17:00:00', 'CONCLUIDO', 4),
(6, 'Escultura das almofadas da porta principal.', '2025-12-21 08:00:00', '2025-12-24 17:00:00', 'EM_ANDAMENTO', 5),
(7, 'Configuração da fechadura eletrônica para entrega.', '2026-01-11 08:00:00', '2026-01-15 17:00:00', 'CONCLUIDO', 6),
(8, 'Corte e colagem do tampo da mesa.', '2026-02-16 08:00:00', '2026-02-20 17:00:00', 'EM_ANDAMENTO', 4),
(9, 'Aguardando lote de cedro da madeireira.', '2026-04-06 08:00:00', '2026-04-10 17:00:00', 'PENDENTE', 5),
(10, 'Revisão técnica de projeto de interiores.', '2026-05-11 08:00:00', '2026-05-15 17:00:00', 'PENDENTE', 8);

-- Tabela Parcela
INSERT INTO Parcela (fk_id_pedido, data_parcela, valor_parcela, forma_de_pagamento) VALUES
(1, '2025-01-15', 300.00, 'PIX'),
(2, '2025-02-20', 425.00, 'DÉBITO'),
(2, '2025-03-20', 425.00, 'CRÉDITO'),
(3, '2025-08-10', 900.00, 'PIX'),
(3, '2025-09-10', 900.00, 'BOLETO'),
(4, '2025-09-15', 700.00, 'DINHEIRO'),
(5, '2025-12-10', 1600.00, 'PIX'),
(5, '2026-01-10', 1600.00, 'PIX'),
(6, '2025-12-20', 475.00, 'CRÉDITO'),
(7, '2026-01-10', 650.00, 'PIX');

-- Tabela Troca
INSERT INTO Troca (fk_id_pedido, fk_id_produto_venda, fk_id_produto_troca, data, valor, quantidade, preco_unitario, tipo_valor) VALUES
(1, 1, 13, '2025-01-20', 20.00, 1, 280.00, 'RESSARCIDO'),
(2, 2, 7, '2025-03-10', 100.00, 1, 950.00, 'COMPLEMENTAR'),
(4, 4, 3, '2025-10-02', 250.00, 1, 450.00, 'RESSARCIDO'),
(7, 9, 12, '2026-01-30', 555.00, 1, 95.00, 'RESSARCIDO'),
(9, 3, 14, '2026-04-25', 60.00, 1, 390.00, 'RESSARCIDO'),
(10, 2, 7, '2026-05-26', 100.00, 1, 950.00, 'COMPLEMENTAR'),
(3, 5, 8, '2025-08-26', 2000.00, 1, 3200.00, 'COMPLEMENTAR'),
(6, 7, 2, '2026-01-15', 100.00, 1, 850.00, 'RESSARCIDO'),
(8, 5, 5, '2026-03-28', 0.00, 1, 1200.00, 'NENHUM'),
(10, 9, 9, '2026-05-26', 0.00, 1, 650.00, 'NENHUM');