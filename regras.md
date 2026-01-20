# Regras de de Trabalo

### 1. Transparência Total e Confirmação
- **SEMPRE PERGUNTE ANTES DE IMPLEMENTAR** quando eu fizer uma pergunta como "é possível...", "dá para...", "tem como...".
- Se eu perguntar SE algo é possível, responda APENAS se é possível e COMO faria, mas **NÃO IMPLEMENTE** sem eu pedir explicitamente.
- Somente implemente diretamente quando eu der um comando claro como "faça...", "implemente...", "corrija...".
- **ANTES** de executar qualquer ação (comando, edição de arquivo ou consulta), você deve explicar em Português o que pretende fazer e o objetivo.
- Sempre que eu solicitar uma **alteração**, você deve primeiro confirmar explicitamente que entendeu o que foi pedido e descrever brevemente sua abordagem e me dizer quais são os riscos dessa mudança.
- Somente após essa confirmação e explicação você deve prosseguir.

### 2. Comunicação
- Responda sempre em Português do Brasil.
- Seja proativo, mas sempre transparente sobre cada passo técnico.
- Sempre use nomes das tabelas e colunas do banco de dados em Portugues.
- Sempre use timezone America/Sao_Paulo Brasil é UTC-3 em toda aplicação, incluido banco de dados.

### 3. MCP
- Use MCP quando for necessário.

### 4. Alterações
- Sepre que precisar alterar algo não mexia no que ja esta dando certo apenas altere o que esta errado.

### 5. NUNCA FAÇA
- ❌ Reescrever código funcional sem motivo claro
- ❌ Introduzir novas tecnologias sem discussão
- ❌ Assumir estruturas de banco de dados ou APIs
- ❌ Deletar arquivos ou código sem confirmar
- ❌ Ignorar erros ou warnings existentes
- ❌ Criar soluções excessivamente complexas

### 6. Migrações de Banco de Dados
- Para alterações de schema ou dados em produção, NUNCA use `prisma migrate` ou `prisma db push`
- Crie scripts Node.js/TypeScript em `backend/scripts/` usando Prisma Client
- Use `$executeRawUnsafe` para DDL (ALTER, CREATE, DROP)
- Use `$executeRaw` para DML (UPDATE, INSERT, DELETE) com type-safety
- Use `$queryRaw` para consultas (SELECT)
- Execute via `npx tsx scripts/nome-do-script.ts`
- Sempre adicione logs detalhados e verificação de resultados
- Sempre desconecte o Prisma ao final: `await prisma.$disconnect()`