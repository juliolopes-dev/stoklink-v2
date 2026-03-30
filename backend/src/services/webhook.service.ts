import axios from 'axios'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'

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
    try {
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
        logger.success(`Webhook n8n configurado com ${this.webhookUrlsUnicas.length} URL(s) única(s)`)
        this.webhookUrlsUnicas.forEach((url, index) => {
          logger.info(`   ${index + 1}. ${url}`)
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
        logger.success(`Webhook n8n configurado com ${this.webhookUrls.size} URLs individuais`)
      }
    } catch (error) {
      logger.error('Erro ao inicializar URLs do webhook:', error)
    }
  }

  private async buscarUsuario(usuarioId: string): Promise<{ id: string; nome: string; email: string } | undefined> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, nome: true, email: true }
      })
      return usuario || undefined
    } catch (error) {
      logger.error('Erro ao buscar usuário para webhook:', error)
      return undefined
    }
  }

  private async buscarDadosNotaFiscal(notaFiscalId: string) {
    try {
      const nf = await prisma.notaFiscal.findUnique({
        where: { id: notaFiscalId },
        select: {
          id: true,
          numero: true,
          numeroSecundario: true,
          chaveAcesso: true,
          fornecedorNome: true,
          fornecedorCnpj: true,
          dataEmissao: true,
          valorTotal: true,
          quantidadeVolumes: true,
          tipoMovimentacao: true,
          status: true,
          observacoes: true,
          fornecedorSecundario: {
            select: {
              id: true,
              nome: true,
              cnpj: true
            }
          },
          filialDestino: {
            select: {
              id: true,
              nome: true,
              codigo: true
            }
          },
          filialRecebimento: {
            select: {
              id: true,
              nome: true,
              codigo: true
            }
          }
        }
      })
      return nf
    } catch (error) {
      logger.error('Erro ao buscar dados da nota fiscal para webhook:', error)
      return null
    }
  }

  // Método auxiliar para montar objeto padrão da NF (sempre completo)
  private montarDadosNotaFiscalPadrao(nf: NonNullable<Awaited<ReturnType<typeof this.buscarDadosNotaFiscal>>>) {
    return {
      id: nf.id,
      numero: nf.numero,
      numeroSecundario: nf.numeroSecundario,
      chaveAcesso: nf.chaveAcesso,
      fornecedor: {
        nome: nf.fornecedorNome,
        cnpj: nf.fornecedorCnpj
      },
      fornecedorSecundario: nf.fornecedorSecundario ? {
        id: nf.fornecedorSecundario.id,
        nome: nf.fornecedorSecundario.nome,
        cnpj: nf.fornecedorSecundario.cnpj
      } : null,
      filialDestino: nf.filialDestino ? {
        id: nf.filialDestino.id,
        nome: nf.filialDestino.nome,
        codigo: nf.filialDestino.codigo
      } : null,
      filialRecebimento: nf.filialRecebimento ? {
        id: nf.filialRecebimento.id,
        nome: nf.filialRecebimento.nome,
        codigo: nf.filialRecebimento.codigo
      } : null,
      dataEmissao: nf.dataEmissao,
      valorTotal: nf.valorTotal,
      quantidadeVolumes: nf.quantidadeVolumes,
      tipoMovimentacao: nf.tipoMovimentacao,
      status: nf.status,
      observacoes: nf.observacoes
    }
  }

  async trigger(evento: string, dados: Record<string, unknown>, usuarioId?: string, usuario?: { id: string; nome: string; email: string }) {
    // Se foi passado apenas o ID, buscar dados completos do usuário
    let usuarioCompleto = usuario
    if (usuarioId && !usuario) {
      usuarioCompleto = await this.buscarUsuario(usuarioId)
    }

    const payload: WebhookPayload = {
      evento,
      timestamp: new Date().toISOString(),
      dados,
      usuario: usuarioCompleto
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
          logger.success(`Webhook ${index + 1} enviado com sucesso: ${evento}`)
        } catch (error) {
          // Não bloquear a aplicação se webhook falhar
          logger.error(`Erro ao enviar webhook ${index + 1} para ${evento}:`, error)
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
  async notaFiscalCriada(notaFiscalId: string, dadosAdicionais: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('nota_criada', {
      ...dadosAdicionais,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async notaFiscalAlterada(notaFiscalId: string, dadosAdicionais: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('nota_alterada', {
      ...dadosAdicionais,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async notaFiscalExcluida(notaFiscalId: string, dadosAdicionais: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('nota_excluida', {
      ...dadosAdicionais,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async conferenciaVolumesRealizada(notaFiscalId: string, dadosConferencia: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('conferencia_volumes', {
      ...dadosConferencia,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async conferenciaItensRealizada(notaFiscalId: string, dadosConferencia: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('conferencia_itens', {
      ...dadosConferencia,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async notaFiscalBloqueada(notaFiscalId: string, dadosAdicionais: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('nota_bloqueada', {
      ...dadosAdicionais,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async divergenciaDetectada(notaFiscalId: string, dadosDivergencia: Record<string, unknown>, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('divergencia_detectada', {
      ...dadosDivergencia,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async mercadoriaBloqueadaOuLiberada(notaFiscalId: string, bloqueada: boolean, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    const evento = bloqueada ? 'mercadoria_bloqueada' : 'mercadoria_liberada'
    await this.trigger(evento, {
      acao: bloqueada ? 'BLOQUEIO' : 'LIBERACAO',
      mercadoriaBloqueada: bloqueada,
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async auditoriaRealizada(notaFiscalId: string, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('auditoria_realizada', {
      acao: 'AUDITORIA_CONFIRMADA',
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }

  async auditoriaMurilloRealizada(notaFiscalId: string, usuarioId?: string) {
    const nf = await this.buscarDadosNotaFiscal(notaFiscalId)
    if (!nf) return

    await this.trigger('auditoria_murillo_realizada', {
      acao: 'AUDITORIA_MURILLO_CONFIRMADA',
      notaFiscal: this.montarDadosNotaFiscalPadrao(nf)
    }, usuarioId)
  }
}

export const webhookService = new WebhookService()
