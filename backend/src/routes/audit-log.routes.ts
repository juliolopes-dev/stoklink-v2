import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { auditLogService } from '../services/audit-log.service.js'
import { authMiddleware } from '../middlewares/auth.js'

export async function auditLogRoutes(app: FastifyInstance) {
  // Listar todos os logs (com filtros)
  app.get('/audit-logs', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const querySchema = z.object({
        entidade: z.string().optional(),
        usuarioId: z.string().uuid().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional()
      })

      const filters = querySchema.parse(request.query)
      
      const logs = await auditLogService.findAll({
        entidade: filters.entidade,
        usuarioId: filters.usuarioId,
        dataInicio: filters.dataInicio ? new Date(filters.dataInicio) : undefined,
        dataFim: filters.dataFim ? new Date(filters.dataFim) : undefined
      })

      return reply.send(logs)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar logs' })
    }
  })

  // Buscar logs de uma entidade específica
  app.get('/audit-logs/:entidade/:entidadeId', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        entidade: z.string(),
        entidadeId: z.string().uuid()
      })

      const { entidade, entidadeId } = paramsSchema.parse(request.params)
      const logs = await auditLogService.findByEntidade(entidade, entidadeId)

      return reply.send(logs)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar logs' })
    }
  })

  // Resumo de atividades
  app.get('/audit-logs/resumo', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const resumo = await auditLogService.getResumo()
      return reply.send(resumo)
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar resumo' })
    }
  })
}
