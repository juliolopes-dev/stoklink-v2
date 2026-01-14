import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { transportadoraService } from '../services/transportadora.service.js'
import { authMiddleware, adminOrComprasMiddleware } from '../middlewares/auth.js'

export async function transportadoraRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/transportadoras', async (request, reply) => {
    const { empresaId } = request.user
    const { ativos } = request.query as { ativos?: string }
    const apenasAtivos = ativos === 'true'
    
    const transportadoras = await transportadoraService.findAll(empresaId, apenasAtivos)
    return reply.send(transportadoras)
  })

  app.get('/transportadoras/ativos', async (request, reply) => {
    const { empresaId } = request.user
    const transportadoras = await transportadoraService.findAll(empresaId, true)
    return reply.send(transportadoras)
  })

  app.get('/transportadoras/:id', async (request, reply) => {
    const { empresaId } = request.user
    const { id } = request.params as { id: string }
    
    const transportadora = await transportadoraService.findById(id, empresaId)
    if (!transportadora) {
      return reply.status(404).send({ error: 'Transportadora não encontrada' })
    }
    
    return reply.send(transportadora)
  })

  app.post('/transportadoras', { preHandler: adminOrComprasMiddleware }, async (request, reply) => {
    const bodySchema = z.object({
      nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      cnpj: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().email('Email inválido').optional().or(z.literal(''))
    })

    try {
      const { empresaId } = request.user
      const data = bodySchema.parse(request.body)
      
      if (data.email === '') data.email = undefined
      
      const transportadora = await transportadoraService.create({ ...data, empresaId })
      return reply.status(201).send(transportadora)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })

  app.put('/transportadoras/:id', { preHandler: adminOrComprasMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const bodySchema = z.object({
      nome: z.string().min(2).optional(),
      cnpj: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().email('Email inválido').optional().or(z.literal('')),
      ativo: z.boolean().optional()
    })

    try {
      const { empresaId } = request.user
      const data = bodySchema.parse(request.body)
      
      if (data.email === '') data.email = undefined
      
      const transportadora = await transportadoraService.update(id, empresaId, data)
      return reply.send(transportadora)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })

  app.delete('/transportadoras/:id', { preHandler: adminOrComprasMiddleware }, async (request, reply) => {
    const { empresaId } = request.user
    const { id } = request.params as { id: string }

    try {
      await transportadoraService.delete(id, empresaId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })
}
