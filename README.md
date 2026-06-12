# Sistema de Chamados

Sistema web para abertura, acompanhamento e gerenciamento de chamados internos de suporte tecnico.

O projeto foi desenvolvido com React, TypeScript, Vite, Tailwind CSS e Firebase, usando Authentication para login/cadastro, Firestore para armazenar usuarios/chamados/comentarios e Storage para anexos.

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
- Status do chamado: `Aberto`, `Em andamento` e `Fechado`
- Painel tecnico/admin para visualizar todos os chamados
- Filtros por status, categoria e prioridade
- Atualizacao de status em tempo real via Firestore
- Fechamento de chamado pelo tecnico/admin
- Registro de data e responsavel pelo fechamento
- Comentarios/respostas dentro do chamado
- Upload de print/anexo em imagem ou PDF
- Criacao de contas de tecnico/admin pelo painel administrativo
- Resumo com indicadores de chamados
- Regras de seguranca do Firestore e Storage
- Configuracao para deploy no Firebase Hosting
- Testes automatizados com Vitest
- Layout responsivo com Tailwind CSS

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- React Router DOM
- Vitest
- Testing Library
- ESLint

## Prints

Sugestao de prints para adicionar ao README depois de configurar o Firebase real:

- Tela de login
- Tela de cadastro
- Portal do colaborador com chamados
- Painel tecnico/admin com filtros
- Modal de detalhes com comentarios e anexo

Coloque as imagens em:

```text
docs/screenshots/
```

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
  "updatedAt": "timestamp",
  "closedAt": null,
  "closedBy": null
}
```

### tickets/{ticketId}/comments

Exemplo de documento:

```json
{
  "message": "Chamado recebido. Vamos verificar o equipamento.",
  "authorId": "firebase-user-id",
  "authorName": "Tecnico T.I",
  "authorRole": "tecnico",
  "createdAt": "timestamp",
  "attachmentName": "print-erro.png",
  "attachmentUrl": "https://...",
  "attachmentPath": "ticket-attachments/ticket-id/print-erro.png",
  "attachmentType": "image/png"
}
```

## Tipos de conta

O sistema trabalha com dois niveis principais de acesso:

- Cliente/colaborador: abre chamados e acompanha apenas os proprios chamados.
- Tecnico/admin: visualiza todos os chamados, muda o andamento e fecha o atendimento.

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

No painel tecnico, o responsavel de T.I pode alterar o status para `Em andamento` ou clicar em `Fechar chamado`. Quando o chamado e fechado, o sistema registra `closedAt` e `closedBy`.

Usuarios com `role: "admin"` tambem podem criar novas contas de tecnico/admin diretamente pelo painel. O primeiro admin precisa ser definido manualmente no Firestore, alterando o documento do usuario em `users` para:

```json
{
  "role": "admin"
}
```

Depois de entrar novamente com essa conta, o bloco `Criar conta de T.I/admin` aparece no painel tecnico.

## Regras de seguranca

O projeto inclui:

- `firestore.rules`
- `storage.rules`

Essas regras limitam:

- colaborador le apenas os proprios chamados;
- tecnico/admin le todos os chamados;
- tecnico/admin pode atualizar status e fechar atendimento;
- apenas admin pode criar usuarios tecnicos/admin;
- anexos ficam restritos aos envolvidos no chamado;
- anexos aceitam imagens ou PDF com limite de 5MB.

Para publicar as regras:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

## Deploy

O projeto esta preparado para Firebase Hosting com `firebase.json`.

Crie uma copia de `.firebaserc.example`:

```bash
cp .firebaserc.example .firebaserc
```

Troque `seu-projeto-firebase` pelo ID do seu projeto Firebase e rode:

```bash
npm run deploy:firebase
```

## Scripts disponiveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Gera build de producao
npm run lint     # Executa o ESLint
npm run test     # Executa os testes automatizados
npm run preview  # Abre a build localmente
npm run deploy:firebase # Build + deploy no Firebase Hosting
```

## Melhorias futuras

- Notificacoes por e-mail
- Dashboard com graficos
- Historico de SLA/tempo medio de atendimento

## Autor

Desenvolvido por Lucas Souza.

- GitHub: [llucass1998](https://github.com/llucass1998)
- LinkedIn: [Lucas Souza](https://www.linkedin.com/in/lucas-souza-52422b160/)
