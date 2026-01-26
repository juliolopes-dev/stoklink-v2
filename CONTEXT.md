# CONTEXT.md - StokLink v2

## 1. VISÃO GERAL DO PROJETO

### Nome e Objetivo
**StokLink v2** - Sistema de Controle de Recebimento e Distribuição de Mercadorias entre Filiais

**Objetivo Principal**: Gerenciar o fluxo completo de notas fiscais desde o recebimento até a conferência final, com foco em monitoramento, rastreabilidade e controle de divergências entre filiais.

### Tecnologias Utilizadas

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify 4.x
- **ORM**: Prisma 5.x
- **Banco de Dados**: PostgreSQL 15+
- **Autenticação**: JWT (jsonwebtoken)
- **Validação**: Zod
- **Upload**: Multer
- **Parser XML**: fast-xml-parser
- **Logger**: Winston

#### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Linguagem**: TypeScript 5.x
- **Estilização**: TailwindCSS 3.x
- **Roteamento**: React Router DOM 6.x
- **Ícones**: React Icons (Feather Icons)
- **HTTP Client**: Axios
- **State Management**: React Query (TanStack Query) 5.x
- **Gerenciamento de Estado**: Context API

#### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Deploy**: VPS com Docker
- **Banco de Dados**: PostgreSQL em 147.93.144.135:4154
- **Portas**: Backend 3333, Frontend 5173

### Estrutura de Pastas

```
stoklink_v2/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Schema do banco de dados
│   │   └── migrations/            # Migrações do Prisma
│   ├── scripts/                   # Scripts de migração manual
│   ├── src/
│   │   ├── config/                # Configurações (env, multer)
│   │   ├── lib/                   # Bibliotecas (prisma, logger)
│   │   ├── middlewares/           # Middlewares (auth)
│   │   ├── routes/                # Rotas da API
│   │   ├── services/              # Lógica de negócio
│   │   ├── types/                 # Tipos TypeScript
│   │   ├── utils/                 # Utilitários (txtParser)
│   │   └── server.ts              # Servidor principal
│   ├── uploads/                   # Arquivos temporários
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Componentes reutilizáveis
│   │   ├── contexts/              # Contexts (Auth, Toast, Modal)
│   │   ├── hooks/                 # Custom hooks (useNotasFiscais)
│   │   ├── pages/                 # Páginas da aplicação
│   │   ├── routes/                # Configuração de rotas
│   │   ├── services/              # API client (axios)
│   │   ├── App.tsx                # Componente raiz
│   │   └── main.tsx               # Entry point
│   └── package.json
│
├── migrations/                    # Migrações SQL manuais
├── scripts/                       # Scripts utilitários
├── Dockerfile                     # Build único (backend + frontend)
├── docker-compose.yml             # Orquestração de containers
├── PROJETO_STATUS.md              # Status detalhado do projeto
├── DEPLOY_PADRAO.md               # Guia de deploy
└── WEBHOOK_N8N_GUIA.md            # Documentação de webhooks
```

---

## 2. FUNCIONALIDADES IMPLEMENTADAS

### ✅ Autenticação e Autorização
- [x] Login com JWT
- [x] Middleware de autenticação
- [x] Controle de permissões (Admin, Conferente)
- [x] Refresh token automático
- [x] Logout

### ✅ Gestão de Filiais
- [x] CRUD completo de filiais
- [x] Ativação/desativação de filiais
- [x] Listagem de filiais ativas
- [x] Validação de código único

### ✅ Gestão de Usuários
- [x] CRUD completo de usuários (Admin)
- [x] Associação usuário-filial
- [x] Tipos de usuário (Admin, Conferente)
- [x] Validação de email único

### ✅ Gestão de Fornecedores
- [x] CRUD completo de fornecedores
- [x] Validação e normalização de CNPJ
- [x] Listagem de fornecedores ativos
- [x] Resumo de fornecedores
- [x] Campo codigo (importado de sistema legado)
- [x] Modal de NFs por fornecedor (clicável na lista)
- [x] Contagem de NFs principais + secundárias
- [x] Limpeza de fornecedores duplicados
- [x] Identificação visual de NFs secundárias

### ✅ Gestão de Transportadoras
- [x] CRUD completo de transportadoras
- [x] Validação e normalização de CNPJ
- [x] Dropdown na conferência de volumes
- [x] Substituição de campo texto livre

### ✅ Notas Fiscais - Core
- [x] Importação de XML (NF-e)
- [x] Cadastro manual de NF
- [x] Edição de NF
- [x] Exclusão de NF
- [x] Listagem com filtros avançados
- [x] Detalhes completos da NF
- [x] NF Secundária (número e fornecedor)
- [x] Upload de arquivo TXT para itens secundários
- [x] Parser de TXT (código, descrição, quantidade)
- [x] Toggle entre itens originais/secundários
- [x] Campo entrada_rp (RP-SIM/RP-NÃO)
- [x] Bloqueio/liberação de mercadoria
- [x] Código de Reserva (2 últimos dígitos do fornecedor + número NF)
- [x] Exibição de código de reserva quando status = CONFERIDO_OK

### ✅ Conferência de Volumes
- [x] Conferência de volumes recebidos
- [x] Detecção automática de divergências
- [x] Seleção de transportadora
- [x] Atualização automática de status
- [x] Histórico de conferências
- [x] Admin pode conferir em qualquer filial

### ✅ Conferência de Itens
- [x] Conferência item por item
- [x] Conferência inline na página de detalhes
- [x] Botões "Selecionar Todos" e "Confirmar Todos"
- [x] Detecção de divergências por item
- [x] Atualização automática de status
- [x] Admin pode conferir em qualquer filial

### ✅ Divergências
- [x] Registro automático de divergências
- [x] Listagem de divergências
- [x] Detalhes da divergência
- [x] Resolução de divergências
- [x] Resumo de divergências pendentes
- [x] Associação com NF e itens

### ✅ Distribuições
- [x] Criação de distribuição entre filiais
- [x] Envio de distribuição
- [x] Recebimento de distribuição
- [x] Cancelamento de distribuição
- [x] Resumo de distribuições pendentes/urgentes
- [x] Histórico de distribuições

### ✅ Dashboard
- [x] Resumo de notas fiscais (total, aguardando, conferidas)
- [x] Resumo de divergências (total, pendentes)
- [x] Resumo de distribuições (pendentes, urgentes)
- [x] Cards visuais com ícones e cores

### ✅ Performance e Otimização (Fase 8)
- [x] React Query com cache de 1 minuto
- [x] Paginação no backend (50 itens por página)
- [x] Filtros processados no backend
- [x] Debounce de 400ms na busca
- [x] Hook customizado `useNotasFiscais`
- [x] Revalidação automática ao focar na aba
- [x] Loading states com React Query

### ✅ Webhooks e Integrações
- [x] Sistema de webhooks para n8n
- [x] Webhook ao receber NF
- [x] Webhook ao conferir volumes
- [x] Webhook ao conferir itens
- [x] Webhook ao bloquear/liberar mercadoria
- [x] Payload padronizado com dados completos

### ✅ UX e Interface
- [x] Tooltips informativos em todos os status
- [x] Status badges com cores padronizadas
- [x] Botão "Receber" na lista de NFs
- [x] Interface limpa sem tags redundantes
- [x] Feedback visual de loading
- [x] Mensagens de erro/sucesso (Toast)
- [x] Confirmação de ações críticas (Modal)

### ✅ Auditoria
- [x] Log de todas as ações importantes
- [x] Registro de usuário e timestamp
- [x] Rastreabilidade completa

---

## 3. DECISÕES TÉCNICAS

### Arquitetura

**Monorepo com Backend e Frontend Separados**
- **Por quê**: Facilita desenvolvimento independente, deploy separado se necessário, e organização clara de responsabilidades.

**API RESTful com Fastify**
- **Por quê**: Fastify é extremamente rápido, tem excelente suporte a TypeScript, validação nativa com schemas, e é mais performático que Express.

**Prisma como ORM**
- **Por quê**: Type-safety completo, migrations automáticas, queries otimizadas, excelente DX com autocomplete, e geração automática de tipos.

**React Query para Estado do Servidor**
- **Por quê**: Cache automático, revalidação inteligente, loading/error states, reduz requisições desnecessárias, e melhora drasticamente a performance.

### Padrões de Código

#### Backend
```typescript
// Estrutura de Service
class NotaFiscalService {
  async findAll(filters) { /* lógica */ }
  async findById(id) { /* lógica */ }
  async create(data) { /* lógica */ }
  async update(id, data) { /* lógica */ }
  async delete(id) { /* lógica */ }
}

// Estrutura de Route
app.get('/endpoint', { preHandler: [authMiddleware] }, async (request, reply) => {
  const data = await service.method()
  return reply.send(data)
})
```

**Validação com Zod**
- Todos os inputs são validados antes de chegar ao service
- Schemas reutilizáveis para consistência

**Paginação Padronizada**
```typescript
interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

#### Frontend
```typescript
// Custom Hook com React Query
export function useNotasFiscais(filters) {
  const debouncedSearch = useDebounce(filters.searchTerm, 400)
  
  return useQuery({
    queryKey: ['notas-fiscais', { ...filters, searchTerm: debouncedSearch }],
    queryFn: () => api.get('/notas-fiscais', { params: filters }),
    staleTime: 60000, // 1 minuto
  })
}
```

**Context API para Estado Global**
- AuthContext: autenticação e dados do usuário
- ToastContext: notificações
- ModalContext: confirmações

**Componentes Reutilizáveis**
- StatusBadge: badges de status com cores
- Tooltip: tooltips instantâneos
- Loading: spinner de carregamento

### Bibliotecas Escolhidas

| Biblioteca | Justificativa |
|------------|---------------|
| **Fastify** | Performance superior ao Express, validação nativa |
| **Prisma** | Type-safety, migrations, DX excelente |
| **Zod** | Validação runtime com inferência de tipos |
| **React Query** | Cache inteligente, reduz requisições |
| **TailwindCSS** | Desenvolvimento rápido, consistência visual |
| **React Router** | Roteamento padrão do React |
| **Axios** | Interceptors para auth, melhor que fetch |
| **Winston** | Logging estruturado e configurável |

### Fluxo de Status de NF

**NF Direta** (Filial Recebimento = Filial Destino):
```
PENDENTE_TRANSFERENCIA → VOLUMES_CONFERIDOS → CONFERIDO_OK/CONFERIDO_DIVERGENCIA
```

**NF Indireta** (Filial Recebimento ≠ Filial Destino):
```
PENDENTE_TRANSFERENCIA → AGUARDANDO_CONFERENCIA_DESTINO → VOLUMES_CONFERIDOS → CONFERIDO_OK/CONFERIDO_DIVERGENCIA
```

**Regras**:
- Filial de Recebimento (indireta): confere APENAS volumes
- Filial Destino: confere volumes + itens
- Admin: pode conferir em qualquer filial
- Bloqueio: só pode ser liberado após conferência completa

---

## 4. PROBLEMAS RESOLVIDOS

### Bug: Busca de NF não funcionava corretamente
**Problema**: Busca por número de NF retornava resultados incorretos devido a `toLowerCase()` em campo numérico.
**Solução**: Removido `toLowerCase()` e implementado busca exata por número.

### Bug: Dashboard e Conferências não exibiam dados
**Problema**: Após implementar paginação, API retornava `{ data, pagination }` mas páginas esperavam array direto.
**Solução**: Ajustado acesso aos dados: `response.data.data` ao invés de `response.data`.

### Bug: Admin não conseguia fazer conferência em outras filiais
**Problema**: Validação de filial impedia admin de conferir NFs de outras filiais.
**Solução**: Adicionado bypass para usuários com tipo ADMIN nos services de conferência.

### Desafio: Performance com muitas NFs
**Problema**: Carregar todas as NFs no frontend causava lentidão.
**Solução**: Implementado paginação no backend (50 itens), React Query com cache, e filtros no backend.

### Desafio: Requisições excessivas ao digitar busca
**Problema**: Cada tecla disparava uma requisição.
**Solução**: Implementado debounce de 400ms na busca.

### Desafio: Itens secundários da NF
**Problema**: XML não continha itens corretos, cliente fornecia TXT separado.
**Solução**: Criado parser de TXT, tabela `itens_nf_secundaria`, e toggle para alternar visualização.

### Desafio: Webhook não disparava ao bloquear mercadoria
**Problema**: Faltava integração com webhook service.
**Solução**: Criado método `mercadoriaBloqueadaOuLiberada` no webhook service e integrado na rota.

### Desafio: Transportadora como texto livre
**Problema**: Inconsistência nos nomes de transportadoras.
**Solução**: Criado CRUD de transportadoras e dropdown na conferência de volumes.

---

## 5. CÓDIGO IMPORTANTE

### Arquivos Principais Backend

#### `backend/src/server.ts`
**Responsabilidade**: Configuração e inicialização do servidor Fastify
- Registra todas as rotas
- Configura CORS
- Configura multipart/form-data
- Inicia servidor na porta 3333

#### `backend/src/services/nota-fiscal.service.ts`
**Responsabilidade**: Lógica de negócio de notas fiscais
- **Funções críticas**:
  - `findAll(filters)`: Listagem com filtros e paginação
  - `findById(id)`: Busca com todos os relacionamentos
  - `importarXML(file)`: Parser de XML NF-e
  - `conferirVolumes(id, data)`: Conferência de volumes
  - `conferirItens(id, data)`: Conferência de itens
  - `toggleBloqueioMercadoria(id, bloqueada)`: Bloquear/liberar

#### `backend/src/services/webhook.service.ts`
**Responsabilidade**: Integração com n8n via webhooks
- **Funções críticas**:
  - `trigger(evento, dados)`: Dispara webhook
  - `notaFiscalRecebida(nfId)`: Webhook ao receber NF
  - `volumesConferidos(nfId)`: Webhook ao conferir volumes
  - `mercadoriaBloqueadaOuLiberada(nfId, bloqueada)`: Webhook bloqueio

#### `backend/src/services/conferencia.service.ts`
**Responsabilidade**: Lógica de conferência de volumes e itens
- Validação de permissões (com bypass para admin)
- Detecção automática de divergências
- Atualização de status da NF

#### `backend/src/utils/txtParser.ts`
**Responsabilidade**: Parser de arquivo TXT de itens secundários
```typescript
export function parseTxtItens(content: string): ItemNfSecundaria[] {
  // Formato esperado: CODIGO|DESCRICAO|QUANTIDADE
  const lines = content.split('\n')
  return lines.map(line => {
    const [codigo, descricao, quantidade] = line.split('|')
    return { codigo, descricao, quantidade: parseFloat(quantidade) }
  })
}
```

#### `backend/src/middlewares/auth.ts`
**Responsabilidade**: Autenticação JWT
- Valida token no header Authorization
- Injeta dados do usuário no request
- Retorna 401 se token inválido

### Arquivos Principais Frontend

#### `frontend/src/App.tsx`
**Responsabilidade**: Componente raiz
- Configura React Query (QueryClientProvider)
- Configura Contexts (Auth, Toast, Modal)
- Renderiza rotas

#### `frontend/src/hooks/useNotasFiscais.ts`
**Responsabilidade**: Hook customizado para notas fiscais
```typescript
export function useNotasFiscais(filters: NotasFiscaisFilters) {
  const debouncedSearch = useDebounce(filters.searchTerm, 400)
  
  return useQuery({
    queryKey: ['notas-fiscais', { ...filters, searchTerm: debouncedSearch }],
    queryFn: async () => {
      const response = await api.get('/notas-fiscais', { params: filters })
      return response.data
    },
    staleTime: 60000, // Cache de 1 minuto
    refetchOnWindowFocus: true,
  })
}
```

#### `frontend/src/pages/NotasFiscais/index.tsx`
**Responsabilidade**: Listagem de notas fiscais
- Usa `useNotasFiscais` hook
- Filtros: status, data, filial, RP, bloqueada, busca
- Paginação com botões anterior/próximo
- Botão "Receber" inline

#### `frontend/src/pages/NotasFiscais/NotaFiscalDetalhes.tsx`
**Responsabilidade**: Detalhes e conferência de NF
- Exibe dados completos da NF
- Conferência de itens inline
- Toggle itens originais/secundários
- Botão bloquear/liberar mercadoria

#### `frontend/src/contexts/AuthContext.tsx`
**Responsabilidade**: Gerenciamento de autenticação
- Login/logout
- Armazenamento de token no localStorage
- Interceptor do axios para adicionar token
- Refresh automático de dados do usuário

#### `frontend/src/components/StatusBadge.tsx`
**Responsabilidade**: Badge visual de status
```typescript
const statusConfig = {
  PENDENTE_TRANSFERENCIA: { label: 'Em Trânsito', color: 'blue' },
  VOLUMES_CONFERIDOS: { label: 'Volumes Conferidos', color: 'cyan' },
  CONFERIDO_OK: { label: 'Conferido', color: 'green' },
  // ...
}
```

### Integrações

#### PostgreSQL
```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

**Conexão**: 
- Host: 147.93.144.135
- Porta: 4154
- Database: stoklink-v2
- Timezone: America/Sao_Paulo (UTC-3)

#### Webhooks n8n
**Endpoint**: Configurável via variável de ambiente `WEBHOOK_URL`
**Eventos**:
- `nota_fiscal_recebida`
- `volumes_conferidos`
- `itens_conferidos`
- `mercadoria_bloqueada`
- `mercadoria_liberada`

**Payload padrão**:
```json
{
  "evento": "nome_do_evento",
  "timestamp": "2026-01-25T21:00:00.000Z",
  "usuario": { "id": "...", "nome": "...", "email": "..." },
  "notaFiscal": { /* dados completos */ }
}
```

---

## 6. PRÓXIMOS PASSOS

### Pendente - Alta Prioridade
- [ ] Deploy das melhorias de performance (Fase 8)
- [ ] Telas de Admin no frontend (Filiais, Usuários)
- [ ] Índices no banco de dados para performance

### Pendente - Média Prioridade
- [ ] Relatórios e exportações (Excel, PDF)
- [ ] Gráficos no Dashboard
- [ ] Filtros avançados salvos por usuário
- [ ] Notificações em tempo real

### Pendente - Baixa Prioridade
- [ ] Virtualização de tabelas grandes
- [ ] Lazy loading de itens da NF
- [ ] Compressão gzip nas respostas
- [ ] Testes automatizados (unit + e2e)

### Melhorias Futuras
- [ ] App mobile (React Native)
- [ ] Impressão de etiquetas
- [ ] Integração com ERP
- [ ] Backup automático
- [ ] Logs centralizados

---

## 7. NOTAS IMPORTANTES

### Configurações Específicas

#### Variáveis de Ambiente Backend (.env)
```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@147.93.144.135:4154/stoklink-v2"

# JWT
JWT_SECRET="sua-chave-secreta-aqui"

# Servidor
PORT=3333
NODE_ENV=production

# Webhook
WEBHOOK_URL="https://seu-n8n.com/webhook/stoklink"

# Timezone
TZ=America/Sao_Paulo
```

#### Variáveis de Ambiente Frontend (.env)
```env
VITE_API_URL=http://localhost:3333
```

### Comandos Úteis

#### Backend
```bash
# Desenvolvimento
cd backend
npm install
npm run dev

# Build
npm run build

# Migrations
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Scripts manuais
npx tsx scripts/nome-do-script.ts
```

#### Frontend
```bash
# Desenvolvimento
cd frontend
npm install
npm run dev

# Build
npm run build

# Preview
npm run preview
```

#### Docker
```bash
# Build e start
docker-compose up -d --build

# Logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild completo
docker-compose down -v
docker-compose up -d --build
```

#### Deploy
```bash
# Na VPS
cd /root/stoklink-v2
git pull
docker-compose down
docker-compose up -d --build

# Verificar logs
docker-compose logs -f backend
```

### Credenciais de Teste
```
Admin:
- Email: admin@stoklink.com
- Senha: admin123

Conferente:
- Email: conferente@stoklink.com
- Senha: conferente123
```

### Portas
- **Backend**: 3333
- **Frontend Dev**: 5173
- **PostgreSQL**: 4154
- **Prisma Studio**: 5555

### Timezone
**IMPORTANTE**: Todo o sistema usa `America/Sao_Paulo` (UTC-3)
- Configurado no backend via `TZ=America/Sao_Paulo`
- Datas sempre armazenadas com timezone correto

### Estrutura do Dockerfile
```dockerfile
# Build backend + frontend em um único container
# Backend serve arquivos estáticos do frontend buildado
# Porta exposta: 3333
```

### Regras de Negócio Críticas

1. **NF Direta vs Indireta**:
   - Direta: filialRecebimento = filialDestino
   - Indireta: filialRecebimento ≠ filialDestino

2. **Conferência**:
   - Volumes sempre primeiro
   - Itens só após volumes conferidos
   - Admin pode conferir em qualquer filial
   - Conferente só na sua filial

3. **Bloqueio de Mercadoria**:
   - Só pode bloquear após conferência completa
   - Webhook dispara ao bloquear/liberar

4. **Status**:
   - Atualização automática baseada em conferências
   - Não pode pular etapas

5. **Divergências**:
   - Criadas automaticamente ao detectar diferença
   - Associadas ao item específico

### Performance

**Otimizações Implementadas**:
- ✅ Paginação (50 itens/página)
- ✅ React Query com cache de 1 minuto
- ✅ Debounce de 400ms na busca
- ✅ Filtros no backend
- ✅ Lazy loading de relacionamentos no Prisma

**Próximas Otimizações**:
- ⏳ Índices no banco (status, dataEmissao, filialDestinoId)
- ⏳ Compressão gzip
- ⏳ Virtualização de tabelas

### Documentação Adicional
- `PROJETO_STATUS.md`: Status detalhado e histórico de fases
- `DEPLOY_PADRAO.md`: Guia completo de deploy
- `WEBHOOK_N8N_GUIA.md`: Documentação de webhooks e integração n8n
- `regras.md`: Regras de trabalho e padrões

---

## 8. HISTÓRICO DE DESENVOLVIMENTO

### Fase 1 - Fundação (Completa)
Setup inicial do projeto, configuração de banco, autenticação JWT, CRUD básico de filiais e usuários.

### Fase 2 - Core do Sistema (Completa)
Implementação do core: importação XML, cadastro manual, conferência de volumes/itens, divergências, distribuições.

### Fase 3 - Frontend Base (Completa)
Setup React, rotas, layout, telas de login, dashboard, lista e detalhes de NFs.

### Fase 4 - Frontend Conferência (Completa)
Telas de conferência de volumes, itens, divergências e distribuições.

### Fase 5 - Melhorias de UX (Completa)
Tooltips, status badges, conferência inline, botões de ação rápida, campos secundários.

### Fase 6 - Cadastros Adicionais (Completa)
Campo entrada_rp, CRUD de transportadoras, dropdown de transportadoras, validações.

### Fase 7 - NF Secundária com TXT (Completa)
Parser de TXT, tabela de itens secundários, upload de arquivo, toggle de visualização.

### Fase 8 - Performance e Permissões (Completa)
React Query, paginação, filtros no backend, debounce, permissões admin, webhooks de bloqueio.

### Fase 9 - Códigos de Fornecedores e Código de Reserva (Completa)
Campo codigo nos fornecedores, código de reserva nas NFs, modal de NFs por fornecedor, limpeza de duplicados, identificação de NFs secundárias.

---

**Última Atualização**: 26/01/2026
**Versão**: 2.1
**Status**: Em produção
