import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { EmpresaService } from '../services/empresa.service'
import { authMiddleware } from '../middlewares/auth'

const empresaService = new EmpresaService()

const registrarEmpresaSchema = z.object({
  razaoSocial: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  nomeAdmin: z.string().min(3, 'Nome do administrador deve ter no mínimo 3 caracteres'),
  emailAdmin: z.string().email('Email do administrador inválido'),
  senhaAdmin: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
})

const atualizarEmpresaSchema = z.object({
  razaoSocial: z.string().optional(),
  nomeFantasia: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  logo: z.string().optional(),
  ativo: z.boolean().optional()
})

export async function empresaRoutes(app: FastifyInstance) {
  // Rota pública - Registrar nova empresa
  app.post('/empresas/registrar', async (request, reply) => {
    try {
      const data = registrarEmpresaSchema.parse(request.body)
      const empresa = await empresaService.criar(data)
      return reply.status(201).send(empresa)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  // Rotas protegidas
  app.get('/empresas/minha', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { empresaId } = request.user
      const empresa = await empresaService.findById(empresaId)
      if (!empresa) {
        return reply.status(404).send({ error: 'Empresa não encontrada' })
      }
      return empresa
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar empresa' })
    }
  })

  app.put('/empresas/minha', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { empresaId, perfil } = request.user
      
      if (perfil !== 'ADMIN') {
        return reply.status(403).send({ error: 'Apenas administradores podem editar a empresa' })
      }

      const data = atualizarEmpresaSchema.parse(request.body)
      const empresa = await empresaService.atualizar(empresaId, data)
      return empresa
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar empresa' })
    }
  })
}
