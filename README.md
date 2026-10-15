# Sistema Expresso

Sistema web para gerenciamento de uma carpintaria, desenvolvido para facilitar o cadastro e a administração de informações relacionadas às atividades da empresa.

## Tecnologias utilizadas

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- MySQL
- mysql2
- bcrypt
- express-session

**Banco de dados**
- MySQL

## Pré-requisitos

Antes de executar o projeto, instale:

- [Node.js](https://nodejs.org/)
- [MySQL](https://dev.mysql.com/downloads/)
- [Git](https://git-scm.com/)

Também é recomendado utilizar o Visual Studio Code para editar o projeto.

## Instalação e configuração

### 1. Clonar o repositório

Abra o terminal e execute:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd NOME_DA_PASTA
```

Substitua `URL_DO_REPOSITORIO` pelo endereço do repositório no GitHub e `NOME_DA_PASTA` pelo nome da pasta criada.

### 2. Configurar o banco de dados

Inicie o servidor MySQL e crie o banco de dados do projeto.

O nome utilizado pelo sistema é:

```sql
CREATE DATABASE IF NOT EXISTS carpintaria;
```

Depois, selecione o banco:

```sql
USE carpintaria;
```

Execute o script SQL de criação das tabelas do projeto antes de iniciar o backend.

**Importante:** o banco precisa conter as tabelas utilizadas pelo sistema, incluindo `Funcionario`, `Telefone_Funcionario`, `Usuario` e `Perfil_Acesso`.

### 3. Instalar as dependências

No terminal, entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Esse comando instalará automaticamente as bibliotecas necessárias com base no `package.json`.

### 4. Configurar as variáveis de ambiente

Dentro da pasta `backend`, crie um arquivo chamado `.env`.

Você pode utilizar o arquivo `.env.example` como referência.

Preencha:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=SUA_SENHA_MYSQL
DB_NAME=carpintaria

SESSION_SECRET=COLOQUE_UMA_CHAVE_SECRETA_FORTE_AQUI
```

Substitua os valores de exemplo pelas configurações do seu MySQL.

A variável `SESSION_SECRET` deve conter uma chave longa e aleatória, utilizada para proteger as sessões de autenticação.

**Atenção:** o arquivo `.env` contém informações sensíveis e não deve ser enviado ao GitHub.

### 5. Criar os usuários administradores iniciais

Após configurar o banco de dados e o `.env`, execute:

```bash
node --env-file=.env scripts/criar-admin.js
```

Esse script cria as contas administrativas iniciais para o ambiente de desenvolvimento.

### 6. Criar um usuário funcionário para testes (opcional)

Para criar uma conta de funcionário destinada aos testes de permissões, execute:

```bash
node --env-file=.env scripts/criar-funcionario-teste.js
```

Esse script utiliza um funcionário previamente cadastrado no banco de dados. Portanto, o registro correspondente precisa existir antes de sua execução.

A criação manual de usuários por scripts não é necessária para o funcionamento normal do cadastro: o sistema já permite criar uma conta de acesso junto com o cadastro de um novo funcionário.

### 7. Iniciar o servidor

Ainda dentro da pasta `backend`, execute:

```bash
node --watch --env-file=.env src/server.js
```

A opção `--watch` reinicia automaticamente o servidor quando arquivos monitorados são alterados.

Depois que o servidor iniciar, abra no navegador o endereço local configurado pelo projeto.

Por exemplo, se estiver utilizando a porta 3000:

```text
http://localhost:3000
```

## Autenticação e controle de acesso

O sistema utiliza autenticação baseada em sessões.

As senhas são armazenadas no banco de dados utilizando hash gerado com `bcrypt`, evitando o armazenamento de senhas em texto puro.

Existem dois perfis de acesso:

| Perfil | Permissões |
|---|---|
| Administrador | Acesso às operações administrativas, incluindo gerenciamento de funcionários e clientes |
| Funcionário | Acesso às operações de clientes autorizadas pelo backend |

As permissões são verificadas pelo servidor antes da execução das operações protegidas.

## Cadastro de funcionários

O cadastro de funcionários permite:

- Registrar informações pessoais e profissionais.
- Registrar telefone e endereço.
- Definir salário, comissão e data de admissão.
- Criar opcionalmente uma conta de acesso ao sistema.
- Definir login e senha durante a criação da conta.
- Editar informações cadastrais de funcionários existentes.

Ao selecionar **Criar usuário de acesso ao sistema**, o formulário solicita login e senha.

Caso a opção seja desmarcada, o funcionário será cadastrado normalmente, mas sem uma conta para acessar o sistema.

O backend utiliza transações MySQL para garantir a consistência dos registros envolvidos no cadastro.

## Estrutura principal do projeto

```text
Sistema-Expresso/
├── backend/
│   ├── db/
│   │   └── db.js
│   ├── scripts/
│   │   ├── criar-admin.js
│   │   └── criar-funcionario-teste.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── public/
│   ├── css/
│   ├── html/
│   └── javascript/
├── .gitignore
└── README.md
```

## Observações importantes

- Não envie arquivos `.env` ao repositório.
- Não envie a pasta `node_modules`.
- Mantenha `package.json` e `package-lock.json` versionados.
- Execute `npm install` após clonar o projeto.
- Configure o banco de dados antes de iniciar o servidor.
- Os scripts de criação de usuários iniciais são destinados ao ambiente de desenvolvimento.
- Em produção, utilize HTTPS, credenciais seguras e uma configuração apropriada para armazenamento de sessões.

## Status do projeto

**Em desenvolvimento.**

Funcionalidades já implementadas incluem cadastro e gerenciamento de clientes e funcionários, autenticação por sessões, controle de permissões nas APIs e criação opcional de contas de acesso para funcionários.