import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ConferenciaService } from '../services/conferencia.service.js'
import { authMiddleware } from '../middlewares/auth.js'

const conferenciaService = new ConferenciaService()

const conferenciaVolumeSchema = z.object({
  volumesRecebidos: z.coerce.number().int().min(0, 'Quantidade de volumes deve ser maior ou igual a 0'),
  filialRecebimentoId: z.string().uuid('ID da filial inválido').optional(),
  tipo: z.enum(['RECEBIMENTO', 'DESTINO']).optional(),
  transportadora: z.string().optional(),
  observacoes: z.string().optional()
})

const conferenciaItemSchema = z.object({
  itensConferidos: z.array(z.object({
    itemId: z.string().uuid('ID do item inválido'),
    quantidadeConferida: z.coerce.number().min(0, 'Quantidade deve ser maior ou igual a 0')
  })),
  finalizada: z.boolean(),
  observacoes: z.string().optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function conferenciaRoutes(app: FastifyInstance) {
  // ==================== CONFERÊNCIA DE VOLUMES ====================

  // Registrar conferência de volumes
  app.post('/notas-fiscais/:id/conferencia-volumes', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const data = conferenciaVolumeSchema.parse(request.body)

      const resultado = await conferenciaService.conferirVolumes({
        notaFiscalId: id,
        usuarioId: request.user.id,
        volumesRecebidos: data.volumesRecebidos,
        filialRecebimentoId: data.filialRecebimentoId,
        tipo: data.tipo,
        transportadora: data.transportadora,
        observacoes: data.observacoes
      })

      return reply.status(201).send(resultado)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao registrar conferência de volumes' })
    }
  })

  // Listar conferências de volumes de uma NF
  app.get('/notas-fiscais/:id/conferencia-volumes', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const conferencias = await conferenciaService.listarConferenciasVolumes(id)
      return reply.send(conferencias)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar conferências de volumes' })
    }
  })

  // Listar transportadoras já usadas
  app.get('/transportadoras/usadas', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const transportadoras = await conferenciaService.listarTransportadorasUsadas(request.user.empresaId)
      return reply.send(transportadoras)
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar transportadoras' })
    }
  })

  // ==================== CONFERÊNCIA DE ITENS ====================

  // Registrar conferência de itens
  app.post('/notas-fiscais/:id/conferencia-itens', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const data = conferenciaItemSchema.parse(request.body)

      const resultado = await conferenciaService.conferirItens({
        notaFiscalId: id,
        usuarioId: request.user.id,
        itensConferidos: data.itensConferidos,
        finalizada: data.finalizada,
        observacoes: data.observacoes
      })

      return reply.status(201).send(resultado)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao registrar conferência de itens' })
    }
  })

  // Listar conferências de itens de uma NF
  app.get('/notas-fiscais/:id/conferencia-itens', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const conferencias = await conferenciaService.listarConferenciasItens(id)
      return reply.send(conferencias)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar conferências de itens' })
    }
  })
}
