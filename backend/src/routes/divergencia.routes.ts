import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { DivergenciaService } from '../services/divergencia.service.js'
import { authMiddleware } from '../middlewares/auth.js'

const divergenciaService = new DivergenciaService()

const createDivergenciaSchema = z.object({
  notaFiscalId: z.string().uuid('ID da nota fiscal inválido'),
  itemNotaFiscalId: z.string().uuid('ID do item inválido').optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  quantidadeEsperada: z.coerce.number().optional(),
  quantidadeRecebida: z.coerce.number().optional()
})

const resolverDivergenciaSchema = z.object({
  observacoesResolucao: z.string().optional()
})

const listFiltersSchema = z.object({
  resolvida: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  notaFiscalId: z.string().uuid().optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function divergenciaRoutes(app: FastifyInstance) {
  // Listar todas divergências
  app.get('/divergencias', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const filters = listFiltersSchema.parse(request.query)
      const divergencias = await divergenciaService.findAll(filters)
      return reply.send(divergencias)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar divergências' })
    }
  })

  // Resumo de divergências
  app.get('/divergencias/resumo', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const resumo = await divergenciaService.getResumo()
      return reply.send(resumo)
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar resumo de divergências' })
    }
  })

  // Buscar por ID
  app.get('/divergencias/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const divergencia = await divergenciaService.findById(id)
      return reply.send(divergencia)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar divergência' })
    }
  })

  // Listar divergências de uma NF
  app.get('/notas-fiscais/:id/divergencias', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const divergencias = await divergenciaService.findByNotaFiscal(id)
      return reply.send(divergencias)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar divergências' })
    }
  })

  // Criar divergência manual
  app.post('/divergencias', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = createDivergenciaSchema.parse(request.body)
      const divergencia = await divergenciaService.create(data)
      return reply.status(201).send(divergencia)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao criar divergência' })
    }
  })

  // Resolver divergência
  app.put('/divergencias/:id/resolver', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const data = resolverDivergenciaSchema.parse(request.body)
      
      const divergencia = await divergenciaService.resolver({
        id,
        observacoesResolucao: data.observacoesResolucao
      })
      
      return reply.send(divergencia)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao resolver divergência' })
    }
  })

  // Deletar divergência
  app.delete('/divergencias/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      await divergenciaService.delete(id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao deletar divergência' })
    }
  })
}
