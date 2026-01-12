import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { UsuarioService } from '../services/usuario.service.js'
import { adminMiddleware } from '../middlewares/auth.js'

const usuarioService = new UsuarioService()

const createUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  perfil: z.enum(['ADMIN', 'GERENTE', 'CONFERENTE', 'COMPRAS', 'FINANCEIRO']).optional(),
  filialId: z.string().uuid('ID da filial inválido').optional()
})

const updateUsuarioSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  perfil: z.enum(['ADMIN', 'GERENTE', 'CONFERENTE', 'COMPRAS', 'FINANCEIRO']).optional(),
  filialId: z.string().uuid().optional().nullable(),
  ativo: z.boolean().optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function usuarioRoutes(app: FastifyInstance) {
  // Listar todos (apenas admin)
  app.get('/usuarios', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const usuarios = await usuarioService.findAll(empresaId)
      return reply.send(usuarios)
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar usuários' })
    }
  })

  // Buscar por ID (apenas admin)
  app.get('/usuarios/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const { id } = idParamSchema.parse(request.params)
      const usuario = await usuarioService.findById(id, empresaId)
      return reply.send(usuario)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar usuário' })
    }
  })

  // Criar (apenas admin)
  app.post('/usuarios', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const data = createUsuarioSchema.parse(request.body)
      const usuario = await usuarioService.create({ ...data, empresaId })
      return reply.status(201).send(usuario)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao criar usuário' })
    }
  })

  // Atualizar (apenas admin)
  app.put('/usuarios/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const { id } = idParamSchema.parse(request.params)
      const data = updateUsuarioSchema.parse(request.body)
      const usuario = await usuarioService.update(id, empresaId, data)
      return reply.send(usuario)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar usuário' })
    }
  })

  // Deletar/Desativar (apenas admin)
  app.delete('/usuarios/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const { id } = idParamSchema.parse(request.params)
      await usuarioService.delete(id, empresaId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao deletar usuário' })
    }
  })
}
