import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { FilialService } from '../services/filial.service.js'
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js'

const filialService = new FilialService()

const createFilialSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  ehCD: z.boolean().optional()
})

const updateFilialSchema = z.object({
  nome: z.string().min(1).optional(),
  codigo: z.string().min(1).optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  ehCD: z.boolean().optional(),
  ativo: z.boolean().optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function filialRoutes(app: FastifyInstance) {
  // Listar todas (autenticado)
  app.get('/filiais', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const filiais = await filialService.findAll(empresaId)
      return reply.send(filiais)
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar filiais' })
    }
  })

  // Listar apenas ativas (autenticado)
  app.get('/filiais/ativas', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const filiais = await filialService.findAllAtivas(empresaId)
      return reply.send(filiais)
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar filiais' })
    }
  })

  // Buscar por ID (autenticado)
  app.get('/filiais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const { id } = idParamSchema.parse(request.params)
      const filial = await filialService.findById(id, empresaId)
      return reply.send(filial)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar filial' })
    }
  })

  // Criar (apenas admin)
  app.post('/filiais', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const data = createFilialSchema.parse(request.body)
      const filial = await filialService.create({ ...data, empresaId })
      return reply.status(201).send(filial)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao criar filial' })
    }
  })

  // Atualizar (apenas admin)
  app.put('/filiais/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const { id } = idParamSchema.parse(request.params)
      const data = updateFilialSchema.parse(request.body)
      const filial = await filialService.update(id, empresaId, data)
      return reply.send(filial)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar filial' })
    }
  })

  // Deletar/Desativar (apenas admin)
  app.delete('/filiais/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const { id } = idParamSchema.parse(request.params)
      await filialService.delete(id, empresaId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao deletar filial' })
    }
  })
}
