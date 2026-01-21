# Padrão de Deploy - Stoklink v2

## 📋 Resumo

Este documento descreve o padrão de deploy usado no projeto Stoklink v2 e os problemas enfrentados durante o processo, servindo como guia para evitar erros em futuros projetos.

---

## 🏗️ Arquitetura de Deploy

### Stack Tecnológica
- **Backend**: Node.js + TypeScript + Fastify + Prisma
- **Frontend**: React + TypeScript + Vite
- **Banco de Dados**: PostgreSQL
- **Deploy**: Easypanel (Docker)
- **Timezone**: America/Sao_Paulo (UTC-3)

### Estrutura do Projeto
```
stoklink_v2/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── uploads/          # Arquivos enviados pelos usuários
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── Dockerfile            # Build único para backend + frontend
```

---

## ⚠️ Problemas Encontrados e Soluções

### 1. **Erro de Build TypeScript no Frontend**

**Problema:**
```
Property 'type' does not exist on type 'PerformanceEntry'
```

**Causa:**
- TypeScript strict mode não reconhecia a propriedade `type` em `PerformanceEntry`
- Necessário fazer type cast explícito

**Solução:**
```typescript
// ❌ ERRADO
const isPageReload = performance.getEntriesByType('navigation')[0]?.type === 'reload'

// ✅ CORRETO
const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
const isPageReload = navigationEntry?.type === 'reload'
```

**Lição:** Sempre fazer type cast explícito quando usar APIs do navegador que retornam tipos genéricos.

---

### 2. **Erro de Build TypeScript no Backend**

**Problema:**
```
Type 'AGUARDANDO_CONFERENCIA' is not assignable to type 'StatusNotaFiscal'
```

**Causa:**
- Schema de validação Zod incluía status obsoletos que foram removidos do enum do Prisma
- Dessincronia entre validação e modelo de dados

**Solução:**
```typescript
// ❌ ERRADO - Status obsoletos
const listFiltersSchema = z.object({
  status: z.enum([
    'AGUARDANDO_CONFERENCIA',  // ← Status removido
    'VOLUMES_CONFERIDOS',
    // ...
  ]).optional()
})

// ✅ CORRETO - Status padronizados
const listFiltersSchema = z.object({
  status: z.enum([
    'PENDENTE_TRANSFERENCIA',
    'VOLUMES_CONFERIDOS',
    'VOLUMES_DIVERGENTES',
    'AGUARDANDO_CONFERENCIA_DESTINO',
    'EM_CONFERENCIA',
    'CONFERIDO_OK',
    'CONFERIDO_DIVERGENCIA',
    'BLOQUEADO'
  ]).optional()
})
```

**Lição:** Manter schemas de validação sincronizados com os enums do Prisma. Sempre atualizar ambos ao modificar status/tipos.

---

### 3. **Erro de Plugin Multipart Duplicado**

**Problema:**
```
FastifyError: Content type parser 'multipart/form-data' already present
```

**Causa:**
- Plugin `@fastify/multipart` estava sendo registrado duas vezes:
  1. Globalmente no `server.ts`
  2. Nas rotas de nota fiscal

**Solução:**
```typescript
// ❌ ERRADO - Registro duplicado
// server.ts
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

// nota-fiscal.routes.ts
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

// ✅ CORRETO - Registro único
// server.ts (apenas aqui)
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

// nota-fiscal.routes.ts (remover registro)
// Plugin já disponível globalmente
```

**Lição:** Plugins do Fastify devem ser registrados apenas uma vez, preferencialmente no arquivo principal (`server.ts`).

---

### 4. **Imports Não Utilizados Causando Conflitos**

**Problema:**
- Imports de bibliotecas que não eram usadas causavam erros de compilação
- Variáveis declaradas mas nunca lidas

**Solução:**
```typescript
// ❌ ERRADO
import multipart from '@fastify/multipart'  // Importado mas não usado
import { uploadDanf } from '../config/multer.js'  // Importado mas não usado

// ✅ CORRETO
// Remover imports não utilizados
```

**Lição:** Sempre limpar imports não utilizados antes de fazer commit. Use linter/prettier para detectar automaticamente.

---

## ✅ Checklist de Deploy

### Antes de Fazer Deploy

- [ ] **Build Local Testado**
  ```bash
  # Frontend
  cd frontend
  npm run build
  
  # Backend
  cd backend
  npm run build
  ```

- [ ] **TypeScript sem Erros**
  - Verificar todos os arquivos `.ts` e `.tsx`
  - Resolver warnings de tipos
  - Fazer type casts explícitos quando necessário

- [ ] **Schemas Sincronizados**
  - Validações Zod alinhadas com Prisma
  - Enums consistentes em todo o código
  - Status padronizados documentados

- [ ] **Plugins Registrados Corretamente**
  - Plugins globais apenas no `server.ts`
  - Sem registros duplicados
  - Configurações consistentes

- [ ] **Imports Limpos**
  - Sem imports não utilizados
  - Sem variáveis declaradas mas não lidas
  - Executar linter antes do commit

- [ ] **Migrações de Banco**
  - Scripts SQL criados para alterações de schema
  - `prisma generate` executado após mudanças
  - Testes de migração em desenvolvimento

---

## 🔧 Configurações Importantes

### 1. **Fastify Multipart**

```typescript
// server.ts
import multipart from '@fastify/multipart'

app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})
```

**Importante:**
- Registrar apenas uma vez
- Definir limite de tamanho adequado
- Usar `request.parts()` para múltiplos arquivos
- Usar `request.file()` para arquivo único

### 2. **Prisma Client**

```typescript
// Sempre regenerar após mudanças no schema
npx prisma generate
```

**Importante:**
- Executar após qualquer alteração em `schema.prisma`
- Necessário antes do build em produção
- Incluir no Dockerfile se aplicável

### 3. **TypeScript Strict Mode**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Importante:**
- Manter strict mode ativado
- Fazer type casts explícitos quando necessário
- Usar `unknown` em vez de `any` para erros

---

## 📝 Padrão de Commits

### Estrutura
```
<tipo>: <descrição curta>

<descrição detalhada opcional>
```

### Tipos Usados
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `refactor:` - Refatoração de código
- `chore:` - Tarefas de manutenção
- `docs:` - Documentação

### Exemplos
```bash
feat: adicionar upload de DANF secundario na importacao de XML

fix: corrigir erro TypeScript no AuthContext para permitir build em producao

fix: remover registro duplicado do plugin multipart nas rotas
```

---

## 🚀 Processo de Deploy

### 1. Desenvolvimento Local
```bash
# Testar build
npm run build

# Verificar erros TypeScript
tsc --noEmit

# Executar testes (se houver)
npm test
```

### 2. Commit e Push
```bash
git add .
git commit -m "tipo: descrição"
git push
```

### 3. Deploy Automático (Easypanel)
- Easypanel detecta push no repositório
- Executa build do Dockerfile
- Aplica mudanças automaticamente

### 4. Verificação Pós-Deploy
- Verificar logs de build
- Testar funcionalidades críticas
- Monitorar erros em produção

---

## 🎯 Boas Práticas

### Código
1. **Sempre testar build localmente antes de push**
2. **Manter schemas sincronizados** (Zod + Prisma)
3. **Limpar imports não utilizados**
4. **Fazer type casts explícitos** quando necessário
5. **Documentar mudanças importantes**

### Deploy
1. **Fazer commits pequenos e frequentes**
2. **Testar em desenvolvimento antes de produção**
3. **Monitorar logs após deploy**
4. **Ter rollback plan** (git revert)
5. **Documentar problemas encontrados**

### Banco de Dados
1. **Usar scripts SQL** para migrações em produção
2. **Nunca usar** `prisma migrate` ou `prisma db push` em produção
3. **Sempre executar** `prisma generate` após mudanças
4. **Testar scripts** em ambiente de desenvolvimento primeiro

---

## 📚 Referências

### Documentação
- [Fastify Multipart](https://github.com/fastify/fastify-multipart)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Validation](https://zod.dev/)

### Ferramentas
- **Easypanel**: Plataforma de deploy
- **Docker**: Containerização
- **Git**: Controle de versão

---

## 🔍 Troubleshooting

### Build Falhando
1. Verificar logs de erro completos
2. Testar build localmente
3. Verificar versões de dependências
4. Limpar node_modules e reinstalar

### Erros TypeScript
1. Executar `tsc --noEmit` para ver todos os erros
2. Verificar type casts necessários
3. Atualizar tipos se necessário
4. Usar `skipLibCheck` se for problema de biblioteca

### Erros de Plugin
1. Verificar se plugin está registrado apenas uma vez
2. Conferir ordem de registro de plugins
3. Verificar compatibilidade de versões

---

**Última atualização:** 21/01/2026
**Versão:** 1.0
