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

  constructor() {
    // Configurar URLs de webhook do n8n via variáveis de ambiente
    // Exemplo: WEBHOOK_N8N_NOTA_CRIADA=https://seu-n8n.com/webhook/nota-criada
    this.loadWebhookUrls()
  }

  private loadWebhookUrls() {
    // Carregar URLs de webhooks das variáveis de ambiente
    const webhookKeys = Object.keys(process.env).filter(key => key.startsWith('WEBHOOK_N8N_'))
    
    webhookKeys.forEach(key => {
      const eventName = key.replace('WEBHOOK_N8N_', '').toLowerCase()
      const url = process.env[key]
      if (url) {
        this.webhookUrls.set(eventName, url)
      }
    })
  }

  async trigger(evento: string, dados: Record<string, unknown>, usuario?: { id: string; nome: string; email: string }) {
    const webhookUrl = this.webhookUrls.get(evento.toLowerCase())
    
    if (!webhookUrl) {
      console.log(`Webhook não configurado para evento: ${evento}`)
      return
    }

    const payload: WebhookPayload = {
      evento,
      timestamp: new Date().toISOString(),
      dados,
      usuario
    }

    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 segundos timeout
      })
      console.log(`Webhook enviado com sucesso: ${evento}`)
    } catch (error) {
      // Não bloquear a aplicação se webhook falhar
      console.error(`Erro ao enviar webhook ${evento}:`, error instanceof Error ? error.message : error)
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
