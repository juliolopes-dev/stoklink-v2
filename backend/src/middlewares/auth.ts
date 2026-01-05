import { FastifyRequest, FastifyReply } from 'fastify'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    
    if (request.user.perfil !== 'ADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito a administradores' })
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}
