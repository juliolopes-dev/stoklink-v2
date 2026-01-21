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

### Fase 6 - Cadastros e Controles Adicionais ✅
- [x] Campo entrada_rp (RP-SIM/RP-NÃO) para NFs
- [x] CRUD completo de Transportadoras
- [x] Dropdown de transportadoras na conferência de volumes (substituiu campo texto livre)
- [x] Menu administrativo com Transportadoras
- [x] Página de listagem e cadastro de transportadoras
- [x] Validações e normalização de CNPJ

## 3. Última Sessão
- **Data**: 08/01/2026 (tarde)
- **Mudanças**: 
  - Implementado sistema completo de cadastro de transportadoras
  - Adicionado campo `entrada_rp` (booleano) para controle RP-SIM/RP-NÃO
  - Conferência de volumes agora usa dropdown de transportadoras cadastradas
  - Corrigido campo `contato` inexistente no modelo Fornecedor
- **Deploy**: Build Docker validado e implantado com sucesso
- **Migrations SQL**: Pendentes de execução no banco de produção (147.93.144.135:4154)

## 4. Próximos Passos (Priorizado)
- [ ] Telas de Admin (Filiais, Usuários)
- [ ] Relatórios e exportações
- [ ] Testes e ajustes finais

## 5. Ponto de Retomada
**Iniciar por**: Telas de administração (CRUD Filiais e Usuários no frontend)

## 6. Fluxo de Status Padronizado - NF Direta vs Indireta

### Status Disponíveis (Padronizados):
1. `PENDENTE_TRANSFERENCIA` - Em trânsito
2. `VOLUMES_CONFERIDOS` - Volumes conferidos, aguardando conferência de itens
3. `VOLUMES_DIVERGENTES` - Divergência em volumes
4. `AGUARDANDO_CONFERENCIA_DESTINO` - Aguardando conferência na filial destino (apenas indireto)
5. `EM_CONFERENCIA` - Conferência de itens em andamento
6. `CONFERIDO_OK` - Conferência concluída sem divergências
7. `CONFERIDO_DIVERGENCIA` - Conferência concluída com divergências
8. `BLOQUEADO` - NF bloqueada para movimentação

### A) NF DIRETA (Filial Recebimento = Filial Destino)
**Mercadoria vai direto para filial destino**

1. **Em Trânsito**
   - Status: `PENDENTE_TRANSFERENCIA`
   - filialRecebimento: null
   - Badge: "Em Trânsito" (azul)
   - Botão: "Receber"

2. **Volumes Conferidos**
   - Status: `VOLUMES_CONFERIDOS`
   - filialRecebimento: definida (= destino)
   - Badge: "Volumes Conferidos" (azul claro)
   - Botão: "Conferir" (laranja)

3. **Conferência Concluída**
   - Status: `CONFERIDO_OK` ou `CONFERIDO_DIVERGENCIA`
   - Badge: "Conferido" ou "Conferido c/ Divergência" (verde/vermelho)

### B) NF INDIRETA (Filial Recebimento ≠ Filial Destino)
**Passa por 2 filiais: Filial de Recebimento → Filial Destino**

1. **Em Trânsito para Recebimento**
   - Status: `PENDENTE_TRANSFERENCIA`
   - filialRecebimento: null
   - Badge: "Em Trânsito" (azul)
   - Botão: "Receber"

2. **Aguardando no Destino**
   - Status: `AGUARDANDO_CONFERENCIA_DESTINO`
   - filialRecebimento: definida (≠ destino)
   - Badge: "Aguard. Destino" (roxo)
   - Botão: "Conferir" (roxo)

3. **Volumes Conferidos no Destino**
   - Status: `VOLUMES_CONFERIDOS`
   - Badge: "Volumes Conferidos" (azul claro)
   - Botão: "Conferir" (laranja)

4. **Conferência Concluída**
   - Status: `CONFERIDO_OK` ou `CONFERIDO_DIVERGENCIA`
   - Badge: "Conferido" ou "Conferido c/ Divergência" (verde/vermelho)

### Regras Importantes:
- **Interface Limpa**: Removidas tags complementares redundantes, mantendo apenas badge principal e botões de ação
- **Fluxo Unificado**: Ambos os tipos começam com `PENDENTE_TRANSFERENCIA` (em trânsito)
- **Filial Recebimento (NF Indireta)**: Confere APENAS volumes, não itens
- **Filial Destino**: Confere volumes + itens (ambos os tipos de NF)
- **Bloqueio de Mercadoria**: Só pode ser desbloqueada após status `CONFERIDO_OK` ou `CONFERIDO_DIVERGENCIA`

## 7. Contexto Técnico Completo
Sistema StokLink para controle de recebimento de mercadorias entre filiais. Backend 100% funcional com: Autenticação JWT, CRUD Filiais/Usuários, Importação XML NF-e, Cadastro manual NF, Conferência de Volumes/Itens com atualização automática de status, Registro de Divergências, Distribuição entre filiais. Usuários: Admin e Conferente. Status NF (Padronizados): PENDENTE_TRANSFERENCIA, VOLUMES_CONFERIDOS, VOLUMES_DIVERGENTES, AGUARDANDO_CONFERENCIA_DESTINO, EM_CONFERENCIA, CONFERIDO_OK, CONFERIDO_DIVERGENCIA, BLOQUEADO. Credenciais teste: admin@stoklink.com/admin123, conferente@stoklink.com/conferente123. PostgreSQL em 147.93.144.135:4154/stoklink-v2. Backend porta 3333, frontend porta 5173.

## 8. Endpoints da API

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

### Fornecedores
- GET /fornecedores
- GET /fornecedores/ativos
- GET /fornecedores/resumo
- GET /fornecedores/:id
- POST /fornecedores (Admin)
- PUT /fornecedores/:id (Admin)
- DELETE /fornecedores/:id (Admin)

### Transportadoras
- GET /transportadoras
- GET /transportadoras/ativos
- GET /transportadoras/:id
- POST /transportadoras (Admin)
- PUT /transportadoras/:id (Admin)
- DELETE /transportadoras/:id (Admin)

### Empresas
- GET /empresas (Admin)
- GET /empresas/:id (Admin)
