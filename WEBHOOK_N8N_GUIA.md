# Guia de Integração com Webhooks n8n

## 📋 O que é?

Este guia explica como integrar a aplicação Stoklink v2 com n8n usando webhooks para automatizar processos quando ações específicas acontecem.

---

## 🎯 Como Funciona

```
Ação na Aplicação → Backend envia dados → Webhook n8n → Automação
```

**Exemplo:**
1. Usuário cria uma Nota Fiscal
2. Backend envia dados para webhook n8n
3. n8n recebe e executa workflow (enviar email, notificar Slack, etc.)

---

## 🔧 Configuração

Você pode configurar de **DUAS FORMAS**:

---

### ⭐ **OPÇÃO 1: URL ÚNICA (RECOMENDADO - MAIS SIMPLES)**

**Vantagens:**
- ✅ Apenas 1 webhook no n8n
- ✅ Mais fácil de configurar
- ✅ Mais fácil de gerenciar
- ✅ Todos os eventos vão para o mesmo lugar

#### 1. Criar Webhook no n8n

1. Abra seu n8n
2. Crie um novo workflow
3. Adicione um nó **Webhook**
4. Configure:
   - **Method**: POST
   - **Path**: `/stoklink` (ou qualquer nome)
5. Copie a URL gerada (exemplo: `https://seu-n8n.com/webhook/stoklink`)

#### 2. Configurar Variável de Ambiente

Adicione no arquivo `.env` do backend:

```env
# Webhook n8n - URL ÚNICA para todos os eventos
WEBHOOK_N8N_URL=https://seu-n8n.com/webhook/stoklink
```

#### 3. Workflow n8n com Switch

No n8n, adicione um nó **Switch** após o Webhook para direcionar cada evento:

```
Webhook → Switch (por evento) → Ações específicas
```

**Switch configuração:**
- Modo: Rules
- Regras:
  - `{{$json.evento}}` = `nota_criada` → Rota 1
  - `{{$json.evento}}` = `nota_conferida` → Rota 2
  - `{{$json.evento}}` = `nota_bloqueada` → Rota 3
  - etc.

---

### 🔀 **OPÇÃO 2: URLs SEPARADAS (MAIS ORGANIZADO)**

**Vantagens:**
- ✅ Workflows separados no n8n
- ✅ Mais organizado para automações complexas
- ✅ Fácil de desativar eventos específicos

#### 1. Criar Webhooks no n8n

Crie um webhook para cada evento que você quer monitorar:
- `/nota-criada`
- `/nota-conferida`
- `/nota-bloqueada`
- etc.

#### 2. Configurar Variáveis de Ambiente

Adicione no arquivo `.env` do backend:

```env
# Webhooks n8n - URLs separadas por evento
WEBHOOK_N8N_NOTA_CRIADA=https://seu-n8n.com/webhook/nota-criada
WEBHOOK_N8N_NOTA_CONFERIDA=https://seu-n8n.com/webhook/nota-conferida
WEBHOOK_N8N_NOTA_BLOQUEADA=https://seu-n8n.com/webhook/nota-bloqueada
WEBHOOK_N8N_DIVERGENCIA_DETECTADA=https://seu-n8n.com/webhook/divergencia-detectada
WEBHOOK_N8N_NOTA_EXCLUIDA=https://seu-n8n.com/webhook/nota-excluida
```

**Importante:** Reinicie o backend após adicionar as variáveis.

---

### 🎯 **Qual Escolher?**

| Critério | URL Única | URLs Separadas |
|----------|-----------|----------------|
| **Simplicidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Fácil configurar** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Organização n8n** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Workflows complexos** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recomendação:** Comece com **URL ÚNICA**. Se precisar de workflows muito complexos, migre para URLs separadas depois.

---

## 💻 Como Usar no Código

### Exemplo 1: Enviar webhook ao criar NF

```typescript
// backend/src/routes/nota-fiscal.routes.ts
import { webhookService } from '../services/webhook.service'

// Criar NF manualmente
app.post('/notas-fiscais', { preHandler: [authMiddleware] }, async (request, reply) => {
  try {
    const params = createSchema.parse(request.body)
    
    const notaFiscal = await notaFiscalService.create({
      empresaId: request.user.empresaId,
      ...params,
      usuarioId: request.user.id
    })

    // 🔔 ENVIAR WEBHOOK PARA N8N
    await webhookService.notaFiscalCriada(
      {
        id: notaFiscal.id,
        numero: notaFiscal.numero,
        fornecedor: notaFiscal.fornecedorNome,
        valor: notaFiscal.valorTotal,
        filialDestino: notaFiscal.filialDestino.nome
      },
      {
        id: request.user.id,
        nome: request.user.nome,
        email: request.user.email
      }
    )

    return reply.status(201).send(notaFiscal)
  } catch (error) {
    // ...
  }
})
```

### Exemplo 2: Enviar webhook ao conferir NF

```typescript
// Conferir NF
app.post('/notas-fiscais/:id/conferir', { preHandler: [authMiddleware] }, async (request, reply) => {
  try {
    const { id } = request.params as { id: string }
    
    const notaFiscal = await notaFiscalService.conferir(id, request.user.id)

    // 🔔 ENVIAR WEBHOOK PARA N8N
    await webhookService.notaFiscalConferida(
      {
        id: notaFiscal.id,
        numero: notaFiscal.numero,
        status: notaFiscal.status,
        fornecedor: notaFiscal.fornecedorNome
      },
      {
        id: request.user.id,
        nome: request.user.nome,
        email: request.user.email
      }
    )

    return reply.send(notaFiscal)
  } catch (error) {
    // ...
  }
})
```

### Exemplo 3: Webhook customizado

```typescript
// Para eventos específicos não cobertos pelos métodos padrão
await webhookService.trigger(
  'evento_customizado',
  {
    campo1: 'valor1',
    campo2: 'valor2'
  },
  {
    id: request.user.id,
    nome: request.user.nome,
    email: request.user.email
  }
)
```

---

## 📦 Estrutura dos Dados Enviados

O webhook envia um JSON com a seguinte estrutura:

```json
{
  "evento": "nota_criada",
  "timestamp": "2026-01-21T15:30:00.000Z",
  "dados": {
    "id": "uuid-da-nota",
    "numero": "12345",
    "fornecedor": "Fornecedor XYZ",
    "valor": 1500.00,
    "filialDestino": "Matriz"
  },
  "usuario": {
    "id": "uuid-do-usuario",
    "nome": "João Silva",
    "email": "joao@empresa.com"
  }
}
```

---

## 🎨 Exemplos de Workflows n8n

### 📌 **Workflow com URL ÚNICA + Switch**

```
Webhook (recebe todos) 
  → Switch (identifica evento)
      → Rota 1: nota_criada → Slack
      → Rota 2: nota_conferida → Email
      → Rota 3: nota_bloqueada → WhatsApp
      → Rota 4: divergencia_detectada → Criar Ticket
```

**Configuração do Switch:**
- Campo: `{{$json.evento}}`
- Regras:
  - Se = `nota_criada` → Saída 0
  - Se = `nota_conferida` → Saída 1
  - Se = `nota_bloqueada` → Saída 2
  - Se = `divergencia_detectada` → Saída 3

---

### 1. Notificar no Slack quando NF for criada

```
Webhook → Slack (enviar mensagem)
```

**Mensagem:**
```
🆕 Nova NF Criada!
Número: {{$json.dados.numero}}
Fornecedor: {{$json.dados.fornecedor}}
Valor: R$ {{$json.dados.valor}}
Criado por: {{$json.usuario.nome}}
```

### 2. Enviar email quando NF for bloqueada

```
Webhook → Gmail (enviar email)
```

**Email:**
- **Para:** gerente@empresa.com
- **Assunto:** ⚠️ NF Bloqueada - {{$json.dados.numero}}
- **Corpo:** 
```
A Nota Fiscal {{$json.dados.numero}} foi bloqueada.

Fornecedor: {{$json.dados.fornecedor}}
Bloqueado por: {{$json.usuario.nome}}
Data: {{$json.timestamp}}
```

### 3. Registrar em planilha Google Sheets

```
Webhook → Google Sheets (adicionar linha)
```

**Colunas:**
- Data: `{{$json.timestamp}}`
- Evento: `{{$json.evento}}`
- NF: `{{$json.dados.numero}}`
- Usuário: `{{$json.usuario.nome}}`

### 4. Notificar divergências no WhatsApp

```
Webhook → Twilio (enviar WhatsApp)
```

---

## 🔒 Segurança

### 1. Validar Origem (Opcional)

Adicione um token secreto para validar que a requisição vem da sua aplicação:

**Backend (.env):**
```env
WEBHOOK_SECRET_TOKEN=seu-token-super-secreto
```

**Código:**
```typescript
await axios.post(webhookUrl, payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Token': process.env.WEBHOOK_SECRET_TOKEN
  }
})
```

**n8n (Webhook node):**
- Adicionar validação de header `X-Webhook-Token`

### 2. HTTPS Obrigatório

Sempre use HTTPS nas URLs de webhook para segurança.

---

## 📊 Eventos Disponíveis

| Evento | Quando dispara | Método |
|--------|----------------|--------|
| `nota_criada` | NF criada (manual ou XML) | `webhookService.notaFiscalCriada()` |
| `nota_conferida` | NF conferida | `webhookService.notaFiscalConferida()` |
| `nota_bloqueada` | NF bloqueada | `webhookService.notaFiscalBloqueada()` |
| `divergencia_detectada` | Divergência encontrada | `webhookService.divergenciaDetectada()` |
| `nota_excluida` | NF excluída | `webhookService.notaFiscalExcluida()` |
| `evento_customizado` | Qualquer evento | `webhookService.trigger()` |

---

## ⚙️ Configuração Avançada

### Adicionar Novos Eventos

1. **Adicionar variável de ambiente:**
```env
WEBHOOK_N8N_MEU_EVENTO=https://seu-n8n.com/webhook/meu-evento
```

2. **Criar método no service (opcional):**
```typescript
// backend/src/services/webhook.service.ts
async meuEvento(dados: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
  await this.trigger('meu_evento', dados, usuario)
}
```

3. **Usar no código:**
```typescript
await webhookService.meuEvento({ campo: 'valor' }, usuario)
```

---

## 🐛 Troubleshooting

### Webhook não está sendo enviado

1. **Verificar variável de ambiente:**
   ```bash
   # Ver se a variável está configurada
   echo $WEBHOOK_N8N_NOTA_CRIADA
   ```

2. **Verificar logs do backend:**
   - Deve aparecer: `Webhook enviado com sucesso: nota_criada`
   - Ou: `Webhook não configurado para evento: nota_criada`

3. **Testar URL manualmente:**
   ```bash
   curl -X POST https://seu-n8n.com/webhook/nota-criada \
     -H "Content-Type: application/json" \
     -d '{"teste": "dados"}'
   ```

### Webhook demora muito

- O timeout padrão é 5 segundos
- Se n8n estiver lento, o webhook pode falhar
- Isso não afeta a aplicação (falha silenciosa)

### n8n não recebe dados

1. Verificar se webhook está ativo no n8n
2. Verificar URL está correta
3. Verificar se workflow está salvo e ativado
4. Testar com dados de exemplo no n8n

---

## 📝 Exemplo Completo

### Cenário: Notificar equipe quando NF for conferida com divergência

**1. Criar workflow n8n:**
```
Webhook → IF (tem divergência?) → Slack (notificar equipe)
```

**2. Configurar .env:**
```env
WEBHOOK_N8N_NOTA_CONFERIDA=https://seu-n8n.com/webhook/nota-conferida
```

**3. Adicionar no código:**
```typescript
// Após conferir NF
const temDivergencia = notaFiscal._count.divergencias > 0

await webhookService.notaFiscalConferida(
  {
    id: notaFiscal.id,
    numero: notaFiscal.numero,
    status: notaFiscal.status,
    temDivergencia,
    quantidadeDivergencias: notaFiscal._count.divergencias
  },
  {
    id: request.user.id,
    nome: request.user.nome,
    email: request.user.email
  }
)
```

**4. Configurar IF no n8n:**
```
{{$json.dados.temDivergencia}} === true
```

**5. Configurar Slack:**
```
⚠️ NF Conferida com Divergência!

NF: {{$json.dados.numero}}
Divergências: {{$json.dados.quantidadeDivergencias}}
Conferido por: {{$json.usuario.nome}}
```

---

## 🚀 Próximos Passos

1. **Criar webhooks no n8n** para os eventos que você precisa
2. **Configurar variáveis de ambiente** no backend
3. **Adicionar chamadas de webhook** nos endpoints relevantes
4. **Testar** criando/conferindo NFs
5. **Monitorar logs** para verificar envio

---

## 📚 Recursos

- [Documentação n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Webhook Service Code](./backend/src/services/webhook.service.ts)

---

**Última atualização:** 21/01/2026
**Versão:** 1.0
