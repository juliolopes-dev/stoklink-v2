import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../services/auth.service.js'
import { authMiddleware } from '../middlewares/auth.js'

const authService = new AuthService()

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória')
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    try {
      const { email, senha } = loginSchema.parse(request.body)
      
      const usuario = await authService.login({ email, senha })
      
      const token = app.jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          perfil: usuario.perfil,
          empresaId: usuario.empresaId,
          filialId: usuario.filialId
        },
        { expiresIn: '7d' }
      )

      return reply.send({
        token,
        usuario
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      
      if (error instanceof Error) {
        return reply.status(401).send({ error: error.message })
      }
      
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  app.get('/auth/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const usuario = await authService.getProfile(request.user.id)
      return reply.send(usuario)
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })
}
