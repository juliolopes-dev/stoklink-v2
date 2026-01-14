import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { fornecedorService } from '../services/fornecedor.service.js'
import { authMiddleware, adminMiddleware, adminOrComprasMiddleware } from '../middlewares/auth.js'

export async function fornecedorRoutes(app: FastifyInstance) {
  // Todas as rotas requerem autenticação
  app.addHook('onRequest', authMiddleware)

  // GET /fornecedores - Lista todos os fornecedores
  app.get('/fornecedores', async (request, reply) => {
    const { empresaId } = request.user
    const { ativos } = request.query as { ativos?: string }
    const apenasAtivos = ativos === 'true'
    
    const fornecedores = await fornecedorService.findAll(empresaId, apenasAtivos)
    return reply.send(fornecedores)
  })

  // GET /fornecedores/ativos - Lista apenas fornecedores ativos (para selects)
  app.get('/fornecedores/ativos', async (request, reply) => {
    const { empresaId } = request.user
    const fornecedores = await fornecedorService.findAll(empresaId, true)
    return reply.send(fornecedores)
  })

  // GET /fornecedores/resumo - Resumo dos fornecedores
  app.get('/fornecedores/resumo', async (request, reply) => {
    const { empresaId } = request.user
    const resumo = await fornecedorService.getResumo(empresaId)
    return reply.send(resumo)
  })

  // GET /fornecedores/:id - Busca fornecedor por ID
  app.get('/fornecedores/:id', async (request, reply) => {
    const { empresaId } = request.user
    const { id } = request.params as { id: string }
    
    const fornecedor = await fornecedorService.findById(id, empresaId)
    if (!fornecedor) {
      return reply.status(404).send({ error: 'Fornecedor não encontrado' })
    }
    
    return reply.send(fornecedor)
  })

  // POST /fornecedores - Cria novo fornecedor (admin ou compras)
  app.post('/fornecedores', { preHandler: adminOrComprasMiddleware }, async (request, reply) => {
    const bodySchema = z.object({
      nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      cnpj: z.string().optional(),
      email: z.string().email('Email inválido').optional().or(z.literal('')),
      telefone: z.string().optional(),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      uf: z.string().max(2).optional()
    })

    try {
      const { empresaId } = request.user
      const data = bodySchema.parse(request.body)
      
      // Limpa email vazio
      if (data.email === '') data.email = undefined
      
      const fornecedor = await fornecedorService.create({ ...data, empresaId })
      return reply.status(201).send(fornecedor)
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

  // PUT /fornecedores/:id - Atualiza fornecedor (admin ou compras)
  app.put('/fornecedores/:id', { preHandler: adminOrComprasMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const bodySchema = z.object({
      nome: z.string().min(2).optional(),
      cnpj: z.string().optional(),
      email: z.string().email('Email inválido').optional().or(z.literal('')),
      telefone: z.string().optional(),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      uf: z.string().max(2).optional(),
      ativo: z.boolean().optional()
    })

    try {
      const { empresaId } = request.user
      const data = bodySchema.parse(request.body)
      
      // Limpa email vazio
      if (data.email === '') data.email = undefined
      
      const fornecedor = await fornecedorService.update(id, empresaId, data)
      return reply.send(fornecedor)
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

  // DELETE /fornecedores/:id - Exclui fornecedor (admin ou compras)
  app.delete('/fornecedores/:id', { preHandler: adminOrComprasMiddleware }, async (request, reply) => {
    const { empresaId } = request.user
    const { id } = request.params as { id: string }

    try {
      await fornecedorService.delete(id, empresaId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })
}
