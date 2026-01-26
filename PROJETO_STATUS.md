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

### Fase 7 - NF Secundária com TXT ✅
- [x] Parser para arquivo TXT de itens secundários (código, descrição, quantidade)
- [x] Tabela `itens_nf_secundaria` no banco de dados
- [x] Coluna `txt_secundario` na tabela `notas_fiscais`
- [x] Upload de arquivo TXT na importação de NF (junto com XML)
- [x] Validação e processamento do arquivo TXT
- [x] Toggle na página de detalhes para alternar entre itens originais/secundários
- [x] Tabela de itens secundários com visual diferenciado (azul)

### Fase 8 - Performance e Permissões ✅
- [x] React Query (TanStack Query) para gerenciamento de estado e cache
- [x] Paginação no backend (50 itens por página)
- [x] Todos os filtros processados no backend (não mais no frontend)
- [x] Debounce de 400ms na busca por NF
- [x] Admin com permissões completas (pode conferir em qualquer filial)
- [x] Webhook para mercadoria bloqueada/liberada
- [x] Hook customizado `useNotasFiscais` com cache e revalidação

### Fase 9 - Códigos de Fornecedores e Validação de CNPJ ✅
- [x] Adicionada coluna `codigo` na tabela `fornecedores`
- [x] Criado índice `idx_fornecedores_codigo` para busca rápida
- [x] Migração de 845 códigos do sistema antigo (CSV)
- [x] Script de comparação e mapeamento de fornecedores (CNPJ + Nome)
- [x] Cadastro automático de 6 fornecedores faltantes do CSV
- [x] 849 de 853 fornecedores com código (99,5%)
- [x] Validação obrigatória de CNPJ na importação de XML
- [x] Bloqueio de criação automática de fornecedores
- [x] `findOrCreate` modificado para exigir fornecedor cadastrado previamente

## 3. Última Sessão
- **Data**: 26/01/2026 (madrugada)
- **Mudanças**: 
  - **Código de Reserva**: Implementado cálculo automático (2 últimos dígitos do fornecedor + número NF)
  - **Modal de NFs por Fornecedor**: Clique no número de NFs abre modal com detalhes completos
  - **Identificação de NFs Secundárias**: Badge roxo "Secundária" para fácil identificação
  - **Limpeza de Duplicados**: Removidos 9 fornecedores duplicados sem NFs
  - **Mesclagem de Fornecedor**: MHT IND. COM. mesclado (2 cadastros → 1 com 5 NFs)
  - **Coluna Código de Reserva**: Adicionada na lista de NFs (exibe quando status = CONFERIDO_OK)
  - **Contagem de NFs**: Agora inclui NFs secundárias na lista de fornecedores
  - **Campo fornecedor**: Incluído no backend da lista de NFs para exibir código

- **Arquivos modificados**:
  - `backend/src/services/fornecedor.service.ts` - Adicionado `numeroSecundario` no select, incluído `notasFiscaisSecundario` no findById
  - `backend/src/services/nota-fiscal.service.ts` - Adicionado campo `fornecedor` no findAll
  - `frontend/src/pages/Fornecedores/index.tsx` - Modal de NFs, cálculo de código de reserva, badge secundária
  - `frontend/src/pages/NotasFiscais/index.tsx` - Coluna código de reserva, exibição condicional
  - `frontend/src/hooks/useNotasFiscais.ts` - Interface NotaFiscal com campo fornecedor
  - `backend/scripts/limpar-fornecedores-duplicados.ts` - Script de limpeza de duplicados
  - `backend/scripts/mesclar-fornecedor-duplicado.ts` - Script de mesclagem do MHT
  - `backend/scripts/listar-fornecedores-sem-cnpj-com-nfs.ts` - Script de análise
  - `ATUALIZACAO_26-01-2026.md` - Documentação das melhorias

- **Impacto**: 
  - ✅ Rastreabilidade facilitada com código de reserva
  - ✅ Banco de dados limpo (853 → 841 fornecedores)
  - ✅ Informações completas sobre NFs de cada fornecedor
  - ✅ Identificação visual de NFs secundárias
  - ✅ Acesso rápido aos detalhes das NFs

- **Deploy**: ✅ Concluído - commit ffa8cb8 + fix 03ad9e1

## 4. Próximos Passos (Priorizado)
- [ ] Telas de Admin (Filiais, Usuários)
- [ ] Relatórios e exportações
- [ ] Testes e ajustes finais

## 5. Ponto de Retomada
**Iniciar por**: Deploy das melhorias de performance e permissões do admin

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
