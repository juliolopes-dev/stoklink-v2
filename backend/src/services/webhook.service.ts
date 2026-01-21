import axios from 'axios'

interface WebhookPayload {
  evento: string
  timestamp: string
  dados: Record<string, unknown>
  usuario?: {
    id: string
    nome: string
    email: string
  }
}

class WebhookService {
  private webhookUrls: Map<string, string> = new Map()
  private webhookUrlsUnicas: string[] = []

  constructor() {
    // Configurar URLs de webhook do n8n via variáveis de ambiente
    // Opção 1: URLs únicas para todos os eventos - WEBHOOK_N8N_URL, WEBHOOK_N8N_URL_TESTE, WEBHOOK_N8N_URL_PRODUCAO
    // Opção 2: URLs separadas por evento - WEBHOOK_N8N_NOTA_CRIADA, etc.
    this.loadWebhookUrls()
  }

  private loadWebhookUrls() {
    // Verificar se existem URLs únicas (prioridade)
    // Suporta múltiplas URLs únicas: WEBHOOK_N8N_URL, WEBHOOK_N8N_URL_TESTE, WEBHOOK_N8N_URL_PRODUCAO
    const urlUnicaKeys = ['WEBHOOK_N8N_URL', 'WEBHOOK_N8N_URL_TESTE', 'WEBHOOK_N8N_URL_PRODUCAO']
    
    urlUnicaKeys.forEach(key => {
      const url = process.env[key]
      if (url) {
        this.webhookUrlsUnicas.push(url)
      }
    })
    
    if (this.webhookUrlsUnicas.length > 0) {
      console.log(`✅ Webhook n8n configurado com ${this.webhookUrlsUnicas.length} URL(s) única(s)`)
      this.webhookUrlsUnicas.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`)
      })
      return
    }

    // Carregar URLs individuais de webhooks das variáveis de ambiente
    const webhookKeys = Object.keys(process.env).filter(key => 
      key.startsWith('WEBHOOK_N8N_') && 
      !urlUnicaKeys.includes(key)
    )
    
    webhookKeys.forEach(key => {
      const eventName = key.replace('WEBHOOK_N8N_', '').toLowerCase()
      const url = process.env[key]
      if (url) {
        this.webhookUrls.set(eventName, url)
      }
    })

    if (this.webhookUrls.size > 0) {
      console.log(`✅ Webhook n8n configurado com ${this.webhookUrls.size} URLs individuais`)
    }
  }

  async trigger(evento: string, dados: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    const payload: WebhookPayload = {
      evento,
      timestamp: new Date().toISOString(),
      dados,
      usuario
    }

    // Se houver URLs únicas, enviar para todas elas
    if (this.webhookUrlsUnicas.length > 0) {
      const promises = this.webhookUrlsUnicas.map(async (webhookUrl, index) => {
        try {
          await axios.post(webhookUrl, payload, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 segundos timeout
          })
          console.log(`✅ Webhook ${index + 1} enviado com sucesso: ${evento}`)
        } catch (error) {
          // Não bloquear a aplicação se webhook falhar
          console.error(`❌ Erro ao enviar webhook ${index + 1} para ${evento}:`, error instanceof Error ? error.message : error)
        }
      })

      // Enviar para todas as URLs em paralelo
      await Promise.allSettled(promises)
      return
    }

    // Senão, buscar URL específica do evento
    const webhookUrl = this.webhookUrls.get(evento.toLowerCase())
    
    if (!webhookUrl) {
      console.log(`⚠️ Webhook não configurado para evento: ${evento}`)
      return
    }

    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 segundos timeout
      })
      console.log(`✅ Webhook enviado com sucesso: ${evento}`)
    } catch (error) {
      // Não bloquear a aplicação se webhook falhar
      console.error(`❌ Erro ao enviar webhook ${evento}:`, error instanceof Error ? error.message : error)
    }
  }

  // Métodos específicos para eventos comuns
  async notaFiscalCriada(notaFiscal: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    await this.trigger('nota_criada', notaFiscal, usuario)
  }

  async notaFiscalConferida(notaFiscal: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    await this.trigger('nota_conferida', notaFiscal, usuario)
  }

  async notaFiscalBloqueada(notaFiscal: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    await this.trigger('nota_bloqueada', notaFiscal, usuario)
  }

  async divergenciaDetectada(divergencia: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    await this.trigger('divergencia_detectada', divergencia, usuario)
  }

  async notaFiscalExcluida(notaFiscal: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    await this.trigger('nota_excluida', notaFiscal, usuario)
  }
}

export const webhookService = new WebhookService()
