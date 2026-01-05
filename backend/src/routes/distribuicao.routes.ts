import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { DistribuicaoService } from '../services/distribuicao.service.js'
import { authMiddleware } from '../middlewares/auth.js'

const distribuicaoService = new DistribuicaoService()

const createDistribuicaoSchema = z.object({
  notaFiscalId: z.string().uuid('ID da nota fiscal inválido'),
  filialOrigemId: z.string().uuid('ID da filial de origem inválido'),
  filialDestinoId: z.string().uuid('ID da filial de destino inválido'),
  urgente: z.boolean().optional(),
  observacoes: z.string().optional()
})

const updateDistribuicaoSchema = z.object({
  status: z.string().optional(),
  observacoes: z.string().optional()
})

const cancelarSchema = z.object({
  motivo: z.string().optional()
})

const listFiltersSchema = z.object({
  status: z.string().optional(),
  urgente: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  filialDestinoId: z.string().uuid().optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function distribuicaoRoutes(app: FastifyInstance) {
  // Listar todas distribuições
  app.get('/distribuicoes', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const filters = listFiltersSchema.parse(request.query)
      const distribuicoes = await distribuicaoService.findAll(filters)
      return reply.send(distribuicoes)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar distribuições' })
    }
  })

  // Resumo de distribuições
  app.get('/distribuicoes/resumo', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const resumo = await distribuicaoService.getResumo()
      return reply.send(resumo)
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar resumo de distribuições' })
    }
  })

  // Buscar por ID
  app.get('/distribuicoes/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const distribuicao = await distribuicaoService.findById(id)
      return reply.send(distribuicao)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar distribuição' })
    }
  })

  // Listar distribuições de uma NF
  app.get('/notas-fiscais/:id/distribuicoes', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const distribuicoes = await distribuicaoService.findByNotaFiscal(id)
      return reply.send(distribuicoes)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar distribuições' })
    }
  })

  // Criar distribuição
  app.post('/distribuicoes', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = createDistribuicaoSchema.parse(request.body)
      const distribuicao = await distribuicaoService.create(data)
      return reply.status(201).send(distribuicao)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao criar distribuição' })
    }
  })

  // Atualizar distribuição
  app.put('/distribuicoes/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const data = updateDistribuicaoSchema.parse(request.body)
      const distribuicao = await distribuicaoService.update(id, data)
      return reply.send(distribuicao)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar distribuição' })
    }
  })

  // Confirmar envio
  app.post('/distribuicoes/:id/enviar', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const distribuicao = await distribuicaoService.confirmarEnvio(id)
      return reply.send(distribuicao)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao confirmar envio' })
    }
  })

  // Confirmar recebimento
  app.post('/distribuicoes/:id/receber', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const distribuicao = await distribuicaoService.confirmarRecebimento(id)
      return reply.send(distribuicao)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao confirmar recebimento' })
    }
  })

  // Cancelar distribuição
  app.post('/distribuicoes/:id/cancelar', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const data = cancelarSchema.parse(request.body)
      const distribuicao = await distribuicaoService.cancelar(id, data.motivo)
      return reply.send(distribuicao)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao cancelar distribuição' })
    }
  })

  // Deletar distribuição
  app.delete('/distribuicoes/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      await distribuicaoService.delete(id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao deletar distribuição' })
    }
  })
}
