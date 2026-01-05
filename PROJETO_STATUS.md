# Status do Projeto

## 1. Visão Geral
- **Stack**: React + Vite + TypeScript + Tailwind (Frontend) | Node.js + Fastify + Prisma (Backend) | PostgreSQL
- **Arquitetura**: Monorepo com frontend e backend separados
- **Objetivo**: Sistema de Controle de Recebimento e Distribuição de Mercadorias entre Filiais - focado em monitoramento e rastreabilidade

## 2. Estado Atual

### Fase 1 - Fundação ✅
- [x] Estrutura de pastas (backend e frontend)
- [x] Configurações base (tsconfig, package.json, vite.config)
- [x] Prisma + PostgreSQL configurado
- [x] Autenticação JWT
- [x] CRUD de Filiais
- [x] CRUD de Usuários

### Fase 2 - Core do Sistema ✅
- [x] Importação de XML da NF
- [x] Cadastro manual de NF
- [x] Conferência de Volumes
- [x] Conferência de Itens
- [x] Registro de Divergências
- [x] Distribuição para Filiais

### Fase 3 - Frontend Base ✅
- [x] Setup do projeto React + rotas + layout
- [x] Tela de Login
- [x] Dashboard principal
- [x] Lista de NFs com filtros e status
- [x] Detalhes da NF
- [x] Cadastro/Importação de NF (manual + XML)

### Fase 4 - Frontend Conferência ✅
- [x] Tela de Conferência de Volumes
- [x] Tela de Conferência de Itens
- [x] Tela de Divergências
- [x] Tela de Distribuições

### Fase 5 - Melhorias de UX ✅
- [x] Botão "Receber" na lista de NFs para acesso rápido
- [x] Conferência de itens inline na página de detalhes da NF
- [x] Botões "Selecionar Todos" + "Confirmar Todos" para conferência em lote
- [x] Componente Tooltip reutilizável (instantâneo)
- [x] Tooltips informativos em todos os status (explicando cada etapa)
- [x] NF Secundária e Fornecedor Secundário visíveis na lista
- [x] Campos secundários (NF e Fornecedor) no cadastro/importação XML
- [x] Status simplificados com labels curtos

## 3. Última Sessão
- **Data**: 30/12/2024
- **Mudanças**: Melhorias de UX - conferência inline, tooltips, dados secundários
- **Testes**: Lista NFs, Detalhes NF, Conferência de itens, Importação XML

## 4. Próximos Passos (Priorizado)
- [ ] Telas de Admin (Filiais, Usuários)
- [ ] Relatórios e exportações
- [ ] Testes e ajustes finais

## 5. Ponto de Retomada
**Iniciar por**: Telas de administração (CRUD Filiais e Usuários no frontend)

## 6. Contexto Técnico Completo
Sistema StokLink para controle de recebimento de mercadorias entre filiais. Backend 100% funcional com: Autenticação JWT, CRUD Filiais/Usuários, Importação XML NF-e, Cadastro manual NF, Conferência de Volumes/Itens com atualização automática de status, Registro de Divergências, Distribuição entre filiais. Usuários: Admin e Conferente. Status NF: AGUARDANDO_CONFERENCIA, VOLUMES_CONFERIDOS, VOLUMES_DIVERGENTES, BLOQUEADO, EM_CONFERENCIA, CONFERIDO_DIVERGENCIA, CONFERIDO_OK, PENDENTE_TRANSFERENCIA. Credenciais teste: admin@stoklink.com/admin123, conferente@stoklink.com/conferente123. PostgreSQL em 147.93.144.135:4154/stoklink-v2. Backend porta 3333, frontend porta 5173.

## 7. Endpoints da API

### Auth
- POST /auth/login
- GET /auth/me

### Filiais
- GET /filiais
- GET /filiais/ativas
- GET /filiais/:id
- POST /filiais (Admin)
- PUT /filiais/:id (Admin)
- DELETE /filiais/:id (Admin)

### Usuários
- GET /usuarios (Admin)
- GET /usuarios/:id (Admin)
- POST /usuarios (Admin)
- PUT /usuarios/:id (Admin)
- DELETE /usuarios/:id (Admin)

### Notas Fiscais
- GET /notas-fiscais
- GET /notas-fiscais/:id
- POST /notas-fiscais
- PUT /notas-fiscais/:id
- POST /notas-fiscais/importar-xml
- DELETE /notas-fiscais/:id

### Conferência
- POST /notas-fiscais/:id/conferencia-volumes
- GET /notas-fiscais/:id/conferencia-volumes
- POST /notas-fiscais/:id/conferencia-itens
- GET /notas-fiscais/:id/conferencia-itens
- POST /notas-fiscais/:id/conferir-item/:itemId
- POST /notas-fiscais/:id/conferir-todos-itens

### Divergências
- GET /divergencias
- GET /divergencias/resumo
- GET /divergencias/:id
- GET /notas-fiscais/:id/divergencias
- POST /divergencias
- PUT /divergencias/:id/resolver
- DELETE /divergencias/:id

### Distribuições
- GET /distribuicoes
- GET /distribuicoes/resumo
- GET /distribuicoes/:id
- GET /notas-fiscais/:id/distribuicoes
- POST /distribuicoes
- PUT /distribuicoes/:id
- POST /distribuicoes/:id/enviar
- POST /distribuicoes/:id/receber
- POST /distribuicoes/:id/cancelar
- DELETE /distribuicoes/:id
