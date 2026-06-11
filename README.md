# Sistema de Chamados

Sistema web para abertura, acompanhamento e gerenciamento de chamados internos de suporte tecnico.

O projeto foi desenvolvido com React, TypeScript, Vite, Tailwind CSS e Firebase, usando Authentication para login/cadastro e Firestore para armazenar usuarios e chamados.

## Sobre o projeto

A ideia do sistema e simular um Service Desk simples para empresas: colaboradores conseguem abrir chamados, acompanhar o status do atendimento e consultar o historico das suas solicitacoes. Usuarios com perfil de tecnico ou administrador acessam um painel separado para visualizar a fila geral e atualizar o andamento dos chamados.

Este projeto conversa diretamente com uma rotina real de suporte tecnico, por isso e uma boa peca de portfolio para vagas junior em frontend, full stack ou suporte com foco em desenvolvimento.

## Funcionalidades

- Cadastro de colaboradores
- Login com Firebase Authentication
- Rota protegida para usuarios autenticados
- Abertura de chamados
- Listagem dos chamados do usuario logado
- Categoria do chamado
- Prioridade do chamado
- Status do chamado: `Aberto`, `Em andamento` e `Resolvido`
- Painel tecnico/admin para visualizar todos os chamados
- Atualizacao de status em tempo real via Firestore
- Resumo com indicadores de chamados
- Layout responsivo com Tailwind CSS

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- React Router DOM
- ESLint

## Estrutura do projeto

```text
src/
  components/         # Componentes reutilizaveis
  context/            # Contexto de autenticacao
  pages/              # Login, cadastro, dashboard e admin
  utils/              # Funcoes auxiliares dos chamados
  firebaseConfig.ts   # Configuracao do Firebase
  types.ts            # Tipos do projeto
```

## Como rodar localmente

Clone o repositorio:

```bash
git clone https://github.com/llucass1998/sistema-chamados.git
cd sistema-chamados
```

Instale as dependencias:

```bash
npm install
```

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Configure suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY="sua-api-key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="000000000000"
VITE_FIREBASE_APP_ID="1:000000000000:web:0000000000000000000000"
```

Inicie o projeto:

```bash
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## Colecoes do Firestore

### users

Exemplo de documento:

```json
{
  "login": "Lucas Souza",
  "email": "email@empresa.com",
  "cpf": "000.000.000-00",
  "birthdate": "1998-01-01",
  "companyId": "EMP-2026",
  "role": "colaborador",
  "createdAt": "timestamp"
}
```

### tickets

Exemplo de documento:

```json
{
  "motivo": "Impressora sem conexao",
  "descricao": "A impressora do setor financeiro nao aparece na rede.",
  "categoria": "Hardware",
  "prioridade": "Media",
  "status": "Aberto",
  "userId": "firebase-user-id",
  "userEmail": "email@empresa.com",
  "userName": "Lucas Souza",
  "companyId": "EMP-2026",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Como acessar o painel tecnico/admin

Por padrao, todo usuario cadastrado recebe:

```json
{
  "role": "colaborador"
}
```

Para liberar acesso ao painel tecnico, altere o campo `role` do usuario no Firestore para:

```json
{
  "role": "tecnico"
}
```

Ou para acesso administrativo:

```json
{
  "role": "admin"
}
```

Depois disso, o usuario passa a visualizar o botao `Painel tecnico` no dashboard.

## Scripts disponiveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Gera build de producao
npm run lint     # Executa o ESLint
npm run preview  # Abre a build localmente
```

## Melhorias futuras

- Comentarios/respostas dentro do chamado
- Upload de anexos
- Filtro por categoria e prioridade
- Regras de seguranca mais detalhadas no Firebase
- Notificacoes por e-mail
- Dashboard com graficos

## Autor

Desenvolvido por Lucas Souza.

- GitHub: [llucass1998](https://github.com/llucass1998)
- LinkedIn: [Lucas Souza](https://www.linkedin.com/in/lucas-souza-52422b160/)
